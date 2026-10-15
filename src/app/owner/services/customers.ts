import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { API_ENDPOINT } from '../owner.config';
import { ApiCustomer, ApiRes, Customer, CustomerBody } from '../models';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private http = inject(HttpClient);
  private url = `${API_ENDPOINT}/api/customers`;

  private toCustomer(api: ApiCustomer): Customer {
    return {
      id: api.customer_id,
      name: api.name,
      phone: api.phone,
      lat: Number(api.latitude),
      lng: Number(api.longitude),
      distance_km: api.distance_km != null ? Number(api.distance_km) : undefined,
    };
  }

  async list(): Promise<Customer[]> {
    const res = await lastValueFrom(this.http.get<ApiRes<ApiCustomer[]>>(this.url));
    return (res.data || []).map((c) => this.toCustomer(c));
  }

  async create(body: CustomerBody): Promise<Customer> {
    const payload = {
      name: body.name,
      phone: body.phone,
      latitude: body.lat,
      longitude: body.lng,
    };
    const res = await lastValueFrom(this.http.post<ApiRes<ApiCustomer>>(this.url, payload));
    return this.toCustomer(res.data);
  }

  async search(keyword: string): Promise<Customer[]> {
    const res = await lastValueFrom(
      this.http.get<ApiRes<ApiCustomer[]>>(`${this.url}/search?keyword=${encodeURIComponent(keyword)}`)
    );
    return (res.data || []).map((c) => this.toCustomer(c));
  }

  async nearby1km(lat: number, lng: number): Promise<Customer[]> {
    const res = await lastValueFrom(
      this.http.get<ApiRes<ApiCustomer[]>>(`${this.url}/nearby-1km?lat=${lat}&lng=${lng}`)
    );
    return (res.data || []).map((c) => this.toCustomer(c));
  }

  async update(id: number, body: CustomerBody): Promise<Customer> {
    const payload = {
      name: body.name,
      phone: body.phone,
      latitude: body.lat,
      longitude: body.lng,
    };
    const res = await lastValueFrom(this.http.put<ApiRes<ApiCustomer>>(`${this.url}/${id}`, payload));
    return this.toCustomer(res.data);
  }

  async remove(id: number): Promise<void> {
    await lastValueFrom(this.http.delete<ApiRes<unknown>>(`${this.url}/${id}`));
  }
}
