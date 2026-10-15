import { SHOP } from '../owner.config';
import { Customer, CustomerBody, Order, OrderBody } from '../models';

// ---------- ข้อมูลจำลองในหน่วยความจำ (หายเมื่อรีเฟรช) ----------
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const FIRST = ['สมชาย', 'มาลี', 'วิชัย', 'สุดา', 'ธนา', 'กนก', 'อนุชา', 'พิมพ์', 'ประยุทธ', 'นภา',
  'สมศักดิ์', 'จันทร์', 'ปรีชา', 'ศิริพร', 'อดิศักดิ์', 'วรรณา', 'ชาติชาย', 'รัตนา', 'ณัฐพล', 'ขวัญ',
  'บุญเรือน', 'อารีย์', 'สุรชัย', 'เพ็ญศรี', 'ธีระ', 'กัญญา', 'พิชัย', 'ลดา', 'อนันต์', 'ฟ้า'];
const LAST = ['ใจดี', 'รักเรียน', 'สุขสันต์', 'แสงทอง', 'มั่นคง', 'บุญมา', 'ศรีสุข', 'จันทร์เพ็ง', 'วงศ์ใหญ่', 'พรมมา'];

const r = rng(2026);
const customers: Customer[] = Array.from({ length: 30 }, (_, i) => {
  const angle = r() * Math.PI * 2;
  const km = Math.sqrt(r()) * 3; // กระจายในรัศมี 3 กม.
  return {
    id: i + 1,
    name: `${FIRST[i]} ${LAST[Math.floor(r() * LAST.length)]}`,
    phone: '08' + String(Math.floor(r() * 1e8)).padStart(8, '0'),
    lat: +(SHOP.lat + (km * Math.sin(angle)) / 111).toFixed(6),
    lng: +(SHOP.lng + (km * Math.cos(angle)) / (111 * Math.cos((SHOP.lat * Math.PI) / 180))).toFixed(6),
  };
});
let orders: Order[] = customers.slice(0, 10).map((c, i) => ({
  id: i + 1,
  customer_id: c.id,
  customer_name: c.name,
  boxes: 1 + Math.floor(r() * 3),
}));
let nextCustomerId = 31;
let nextOrderId = 11;

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const wait = () => new Promise((res) => setTimeout(res, 150));

export const mockDb = {
  async listCustomers(): Promise<Customer[]> { await wait(); return clone(customers); },
  async createCustomer(b: CustomerBody): Promise<Customer> {
    await wait();
    const c = { id: nextCustomerId++, ...b };
    customers.push(c);
    return clone(c);
  },
  async updateCustomer(id: number, b: CustomerBody): Promise<Customer> {
    await wait();
    const c = customers.find((x) => x.id === id);
    if (!c) throw new Error('ไม่พบลูกค้า');
    Object.assign(c, b);
    orders.filter((o) => o.customer_id === id).forEach((o) => (o.customer_name = c.name));
    return clone(c);
  },
  async removeCustomer(id: number): Promise<void> {
    await wait();
    const i = customers.findIndex((x) => x.id === id);
    if (i < 0) throw new Error('ไม่พบลูกค้า');
    customers.splice(i, 1);
    orders = orders.filter((o) => o.customer_id !== id);
  },

  async listOrders(): Promise<Order[]> { await wait(); return clone(orders); },
  async createOrder(b: OrderBody): Promise<Order> {
    await wait();
    const c = customers.find((x) => x.id === b.customer_id);
    if (!c) throw new Error('ไม่พบลูกค้า');
    const o: Order = { id: nextOrderId++, customer_id: c.id, customer_name: c.name, boxes: b.boxes };
    orders.push(o);
    return clone(o);
  },
  async updateOrder(id: number, b: OrderBody): Promise<Order> {
    await wait();
    const o = orders.find((x) => x.id === id);
    const c = customers.find((x) => x.id === b.customer_id);
    if (!o || !c) throw new Error('ไม่พบข้อมูล');
    Object.assign(o, { customer_id: c.id, customer_name: c.name, boxes: b.boxes });
    return clone(o);
  },
  async removeOrder(id: number): Promise<void> {
    await wait();
    orders = orders.filter((o) => o.id !== id);
  },

  // ใช้ภายในโดย mock routing เท่านั้น
  snapshotForRouting() {
    return orders.map((o) => {
      const c = customers.find((x) => x.id === o.customer_id)!;
      return { order_id: o.id, customer: c.name, phone: c.phone, boxes: o.boxes, lat: c.lat, lng: c.lng };
    });
  },
};
