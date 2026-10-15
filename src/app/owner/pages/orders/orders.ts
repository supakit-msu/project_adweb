import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Customer, Order } from '../../models';
import { CustomersService } from '../../services/customers';
import { OrdersService } from '../../services/orders';
import { RULES } from '../../owner.config';

@Component({
  selector: 'app-orders',
  imports: [FormsModule, RouterLink],
  templateUrl: './orders.html',
})
export class Orders {
  private ordersApi = inject(OrdersService);
  private customersApi = inject(CustomersService);

  readonly orders = signal<Order[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');

  readonly editingId = signal<number | null>(null);
  readonly customerId = signal<number | null>(null);
  readonly boxes = signal(1);
  readonly simCount = signal(25);

  readonly totalBoxes = computed(() => this.orders().reduce((a, o) => a + o.boxes, 0));
  readonly boxOptions = [1, 2, 3];

  constructor() { this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const [o, c] = await Promise.all([this.ordersApi.list(), this.customersApi.list()]);
      const customerMap = new Map(c.map((item) => [item.id, item.name]));
      const mappedOrders = o.map((item) => ({
        ...item,
        customer_name: customerMap.get(item.customer_id) || item.customer_name,
      }));
      this.orders.set(mappedOrders);
      this.customers.set(c);
    } catch { this.error.set('โหลดข้อมูลไม่สำเร็จ (ตรวจสอบ API)'); }
    this.loading.set(false);
  }

  edit(o: Order) {
    this.editingId.set(o.id);
    this.customerId.set(o.customer_id);
    this.boxes.set(o.boxes);
    this.error.set('');
  }

  reset() { this.editingId.set(null); this.customerId.set(null); this.boxes.set(1); this.error.set(''); }

  async save() {
    const cid = this.customerId();
    if (cid === null) return this.error.set('เลือกลูกค้าก่อน');
    const body = { customer_id: Number(cid), boxes: Number(this.boxes()) };
    this.error.set('');
    try {
      const id = this.editingId();
      if (id === null) await this.ordersApi.create(body);
      else await this.ordersApi.update(id, body);
      this.reset();
      await this.load();
    } catch (err: unknown) {
      console.error('Save order error:', err);
      let msg = '';
      if (err && typeof err === 'object') {
        const anyErr = err as { error?: { message?: unknown }; message?: unknown };
        if (typeof anyErr.error?.message === 'string') msg = anyErr.error.message;
        else if (typeof anyErr.message === 'string') msg = anyErr.message;
      }
      this.error.set(msg || 'บันทึกไม่สำเร็จ (ตรวจสอบ API)');
    }
  }

  async remove(o: Order) {
    if (!confirm(`ลบออเดอร์ #${o.id} ของคุณ "${o.customer_name}" ?`)) return;
    try {
      await this.ordersApi.remove(o.id);
      if (this.editingId() === o.id) this.reset();
      await this.load();
    } catch {
      this.error.set('ลบออเดอร์ไม่สำเร็จ');
    }
  }

  /** ล้างออเดอร์เดิมแล้วสุ่มออเดอร์ใหม่ 20-30 รายการผ่าน API /api/orders/seed */
  async simulate() {
    if (this.orders().length && !confirm(`ออเดอร์เดิมมีอยู่ จะจำลองสร้างออเดอร์ใหม่ ดำเนินการต่อ?`)) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.ordersApi.seed();
      localStorage.removeItem('active_route_plan'); // ล้างแผนเส้นทางเก่า
      this.reset();
      await this.load();
    } catch { this.error.set('จำลองออเดอร์ไม่สำเร็จ'); }
    this.busy.set(false);
  }

  async clearAll() {
    if (!confirm('ลบออเดอร์ทั้งหมด?')) return;
    this.busy.set(true);
    try {
      await this.ordersApi.clear();
      localStorage.removeItem('active_route_plan'); // ล้างแผนเส้นทางเก่า
      await this.load();
    } catch { this.error.set('ลบไม่สำเร็จ'); }
    this.busy.set(false);
  }
}
