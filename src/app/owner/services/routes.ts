import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { API_ENDPOINT } from '../owner.config';
import { ApiRes, RoutePlan } from '../models';
import { buildMockPlan, Item } from './mock-routing';
import { OrdersService } from './orders';
import { CustomersService } from './customers';

@Injectable({ providedIn: 'root' })
export class RoutesService {
  private http = inject(HttpClient);
  private ordersApi = inject(OrdersService);
  private customersApi = inject(CustomersService);
  private attempt = 0;

  async plan(fresh: boolean): Promise<RoutePlan> {
    this.attempt = fresh ? 1 : this.attempt + 1;

    try {
      // ลองเรียก API ฝั่ง Backend หากมี endpoint POST /api/routes/plan
      const res = await lastValueFrom(
        this.http.post<ApiRes<RoutePlan>>(`${API_ENDPOINT}/api/routes/plan`, { attempt: this.attempt })
      );
      return res.data;
    } catch {
      // หาก Backend ยังไม่ได้ทำ endpoint จัดเส้นทาง ให้ดึงรายการ Order และ Customer จริงมาคำนวณเส้นทาง
      const [orders, customers] = await Promise.all([
        this.ordersApi.list(),
        this.customersApi.list(),
      ]);
      const customerMap = new Map(customers.map((c) => [c.id, c]));
      const items: Item[] = [];

      for (const o of orders) {
        const c = customerMap.get(o.customer_id);
        if (c) {
          items.push({
            order_id: o.id,
            customer: c.name,
            phone: c.phone,
            boxes: o.boxes,
            lat: c.lat,
            lng: c.lng,
          });
        }
      }

      if (!items.length) throw new Error('ยังไม่มีออเดอร์ให้จัดเส้นทาง (กรุณาสร้างหรือจำลองออเดอร์ก่อน)');
      await new Promise((r) => setTimeout(r, 400));
      const plan = buildMockPlan(items, this.attempt);
      try {
        localStorage.setItem('active_route_plan', JSON.stringify(plan));
      } catch { /* ignore */ }
      return plan;
    }
  }
}
