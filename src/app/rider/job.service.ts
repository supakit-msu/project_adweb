import { Injectable } from '@angular/core';
import { JobSheet, JobStop } from './job.model';

const SHOP = { lat: 16.2465, lng: 103.2535 }; // ร้าน (แถว ม.มหาสารคาม)
const SPEED_KMH = 30;

interface RawStop { customer: string; phone: string; boxes: number; lat: number; lng: number; }
interface RawJob { code: string; rider: string; stops: RawStop[]; }

// ---------- ข้อมูลจำลองสำหรับ demo (ลำดับจุดคือลำดับที่ระบบจัดให้แล้ว) ----------
const RAW_JOBS: RawJob[] = [
  {
    code: 'J1A2B', rider: 'ไรเดอร์ 1',
    stops: [
      { customer: 'สมชาย ใจดี', phone: '0812345678', boxes: 2, lat: 16.2509, lng: 103.2562 },
      { customer: 'มาลี รักเรียน', phone: '0823456789', boxes: 1, lat: 16.2561, lng: 103.2618 },
      { customer: 'วิชัย สุขสันต์', phone: '0834567890', boxes: 3, lat: 16.2603, lng: 103.2671 },
    ],
  },
  {
    code: 'J3C4D', rider: 'ไรเดอร์ 2',
    stops: [
      { customer: 'สุดา แสงทอง', phone: '0845678901', boxes: 3, lat: 16.2412, lng: 103.2489 },
      { customer: 'ธนา มั่นคง', phone: '0856789012', boxes: 2, lat: 16.2358, lng: 103.2441 },
    ],
  },
  {
    code: 'J5E6F', rider: 'ไรเดอร์ 3',
    stops: [
      { customer: 'กนก บุญมา', phone: '0867890123', boxes: 1, lat: 16.2447, lng: 103.2619 },
      { customer: 'อนุชา ศรีสุข', phone: '0878901234', boxes: 2, lat: 16.2411, lng: 103.2688 },
      { customer: 'พิมพ์ จันทร์เพ็ง', phone: '0889012345', boxes: 2, lat: 16.2378, lng: 103.2742 },
    ],
  },
];

function km(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const navUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=two-wheeler`;

function build(raw: RawJob): JobSheet {
  let dist = 0, la = SHOP.lat, ln = SHOP.lng;
  const stops: JobStop[] = raw.stops.map((s, i) => {
    dist += km(la, ln, s.lat, s.lng);
    la = s.lat; ln = s.lng;
    return { sequence: i + 1, ...s, mapUrl: navUrl(s.lat, s.lng) };
  });
  const last = stops[stops.length - 1];
  const waypoints = stops.slice(0, -1).map((s) => `${s.lat},${s.lng}`).join('|');
  return {
    job_code: raw.code,
    rider: raw.rider,
    total_boxes: stops.reduce((a, s) => a + s.boxes, 0),
    total_distance_km: +dist.toFixed(2),
    total_time_min: Math.round((dist / SPEED_KMH) * 60),
    stops,
    fullRouteUrl:
      `https://www.google.com/maps/dir/?api=1&origin=${SHOP.lat},${SHOP.lng}` +
      `&destination=${last.lat},${last.lng}` + (waypoints ? `&waypoints=${waypoints}` : '') +
      `&travelmode=two-wheeler`,
  };
}

@Injectable({ providedIn: 'root' })
export class JobService {
  /** คืนรายการใบงานทั้งหมดที่มีในร้าน (จากแผนการจัดเส้นทางล่าสุด) */
  getAvailableJobs(): { code: string; rider: string; boxes: number; stopsCount: number }[] {
    try {
      const saved = localStorage.getItem('active_route_plan');
      if (saved) {
        const plan = JSON.parse(saved);
        if (plan && Array.isArray(plan.routes) && plan.routes.length > 0) {
          return plan.routes.map((r: any) => ({
            code: r.job_code,
            rider: r.rider,
            boxes: r.total_boxes,
            stopsCount: r.stops?.length || 0,
          }));
        }
      }
    } catch { /* ignore */ }

    return [];
  }

  async getJob(code: string): Promise<JobSheet | null> {
    const searchCode = code.trim().toUpperCase();
    await new Promise((r) => setTimeout(r, 150));

    // 1. ตรวจสอบจากแผนที่ร้านจัดไว้ล่าสุด
    try {
      const saved = localStorage.getItem('active_route_plan');
      if (saved) {
        const plan = JSON.parse(saved);
        const route = plan.routes?.find((r: any) => r.job_code === searchCode);
        if (route) {
          const rawStops: RawStop[] = route.stops.map((s: any) => ({
            customer: s.customer,
            phone: s.phone,
            boxes: s.boxes,
            lat: s.lat,
            lng: s.lng,
          }));
          return build({ code: route.job_code, rider: route.rider, stops: rawStops });
        }
      }
    } catch { /* ignore */ }

    return null;
  }
}
