import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { API_ENDPOINT, SHOP } from '../owner.config';
import { ApiOrder, ApiRes, Order, OrderBody } from '../models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private url = `${API_ENDPOINT}/api/orders`;

  private toOrder(api: ApiOrder): Order {
    return {
      id: api.order_id,
      customer_id: api.customer_id,
      customer_name: api.name || `ลูกค้า #${api.customer_id}`,
      boxes: api.quantity,
      status: api.status,
      distance_km: api.distance_km != null ? Number(api.distance_km) : undefined,
    };
  }

  async list(lat: number = SHOP.lat, lng: number = SHOP.lng): Promise<Order[]> {
    try {
      // เรียก nearby-2km จากพิกัดร้าน เพื่อดึงออเดอร์ทั้งหมดในรัศมี
      const res = await lastValueFrom(
        this.http.get<ApiRes<ApiOrder[]>>(`${this.url}/nearby-2km?lat=${lat}&lng=${lng}`)
      );
      return (res.data || []).map((o) => this.toOrder(o));
    } catch {
      // fallback หาก backend มี GET /api/orders
      const res = await lastValueFrom(this.http.get<ApiRes<ApiOrder[]>>(this.url));
      return (res.data || []).map((o) => this.toOrder(o));
    }
  }

  async nearby2km(lat: number, lng: number): Promise<Order[]> {
    const res = await lastValueFrom(
      this.http.get<ApiRes<ApiOrder[]>>(`${this.url}/nearby-2km?lat=${lat}&lng=${lng}`)
    );
    return (res.data || []).map((o) => this.toOrder(o));
  }

  async create(body: OrderBody): Promise<Order> {
    const payload = { customer_id: body.customer_id, quantity: body.boxes };
    const res = await lastValueFrom(this.http.post<ApiRes<ApiOrder>>(this.url, payload));
    return this.toOrder(res.data);
  }

  async seed(): Promise<Order[]> {
    const res = await lastValueFrom(this.http.post<ApiRes<ApiOrder[]>>(`${this.url}/seed`, {}));
    return (res.data || []).map((o) => this.toOrder(o));
  }

  async update(id: number, body: OrderBody | { quantity: number }): Promise<Order> {
    const quantity = 'quantity' in body ? body.quantity : body.boxes;
    const res = await lastValueFrom(
      this.http.put<ApiRes<ApiOrder>>(`${this.url}/${id}`, { quantity })
    );
    return this.toOrder(res.data);
  }

  async clear(): Promise<void> {
    await lastValueFrom(this.http.delete<ApiRes<unknown>>(`${this.url}/clear`));
  }

  async remove(id: number): Promise<void> {
    await lastValueFrom(this.http.delete<ApiRes<unknown>>(`${this.url}/${id}`));
  }
}
