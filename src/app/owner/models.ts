export interface ApiRes<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiCustomer {
  customer_id: number;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
}

export interface ApiOrder {
  order_id: number;
  customer_id: number;
  quantity: number;
  status: string;
  order_date?: string;
  name?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  lat: number;
  lng: number;
  distance_km?: number;
}
export type CustomerBody = Omit<Customer, 'id' | 'distance_km'>;

export interface Order {
  id: number;
  customer_id: number;
  customer_name: string;
  boxes: number;
  status?: string;
  distance_km?: number;
}
export interface OrderBody {
  customer_id: number;
  boxes: number;
}

export interface PlanStop {
  sequence: number;
  order_id: number;
  customer: string;
  phone: string;
  boxes: number;
  lat: number;
  lng: number;
  arrive_min: number; // นาทีนับจากออกจากร้าน
  late: boolean;
}

export interface RiderRoute {
  rider: string;
  job_code: string;
  total_boxes: number;
  total_distance_km: number;
  total_time_min: number;
  cost: number; // ค่าไรเดอร์ (ค่าเรียก + ค่าระยะทาง)
  stops: PlanStop[];
}

export interface RoutePlan {
  plan_no: number;
  total_orders: number;
  total_boxes: number;
  revenue: number;
  food_cost: number;
  rider_cost: number;
  profit: number;
  total_distance_km: number;
  total_time_min: number; // เวลาของไรเดอร์ที่นานที่สุด
  late_count: number;
  routes: RiderRoute[];
}
