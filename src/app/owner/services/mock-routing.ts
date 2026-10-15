import { RULES, SHOP } from '../owner.config';
import { RiderRoute, RoutePlan } from '../models';

// ตรรกะจัดเส้นทางจำลองฝั่งหน้าบ้าน (ใช้ตอน USE_MOCK = true เท่านั้น)
// ของจริงให้ API คำนวณ — ตรงนี้เขียนให้ผลลัพธ์รูปแบบเดียวกับ RoutePlan

export interface Item {
  order_id: number;
  customer: string;
  phone: string;
  boxes: number;
  lat: number;
  lng: number;
}

const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};

function km(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pathKm(seq: Item[]): number {
  let d = 0, la = SHOP.lat, ln = SHOP.lng;
  for (const s of seq) { d += km(la, ln, s.lat, s.lng); la = s.lat; ln = s.lng; }
  return d;
}

function permutations<T>(a: T[]): T[][] {
  if (a.length <= 1) return [a];
  return a.flatMap((x, i) => permutations([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
}

function bestOrder(group: Item[]): Item[] {
  if (group.length <= 7) {
    let best = group, bd = Infinity;
    for (const p of permutations(group)) { const d = pathKm(p); if (d < bd) { bd = d; best = p; } }
    return best;
  }
  const left = [...group], out: Item[] = [];
  let la = SHOP.lat, ln = SHOP.lng;
  while (left.length) {
    left.sort((a, b) => km(la, ln, a.lat, a.lng) - km(la, ln, b.lat, b.lng));
    const n = left.shift()!;
    out.push(n); la = n.lat; ln = n.lng;
  }
  return out;
}

const riderCost = (boxes: number, dist: number) => RULES.riderFeePerTrip + RULES.feePerKmPerBox * boxes * dist;
const arriveMin = (dist: number) => (dist / RULES.speedKmh) * 60;

function evaluate(groups: Item[][]) {
  let obj = 0;
  const ordered = groups.map((g) => {
    const o = bestOrder(g);
    const d = pathKm(o);
    obj += riderCost(o.reduce((a, s) => a + s.boxes, 0), d) + (arriveMin(d) > RULES.deadlineMin ? 1000 : 0);
    return o;
  });
  return { ordered, obj };
}

function sweepStart(items: Item[], rand: () => number): Item[][] {
  const sorted = [...items].sort(
    (a, b) => Math.atan2(a.lat - SHOP.lat, a.lng - SHOP.lng) - Math.atan2(b.lat - SHOP.lat, b.lng - SHOP.lng),
  );
  const shift = Math.floor(rand() * sorted.length);
  const ring = [...sorted.slice(shift), ...sorted.slice(0, shift)];
  const minK = Math.ceil(ring.length / RULES.maxOrdersPerRider);
  const k = Math.min(ring.length, minK + (rand() < 0.3 ? 1 : 0));
  const groups: Item[][] = Array.from({ length: k }, () => []);
  const base = Math.floor(ring.length / k);
  const extra = ring.length % k;
  const extraAt = new Set<number>();
  while (extraAt.size < extra) extraAt.add(Math.floor(rand() * k));
  let p = 0;
  groups.forEach((g, i) => {
    const size = base + (extraAt.has(i) ? 1 : 0);
    g.push(...ring.slice(p, p + size));
    p += size;
  });
  return groups.filter((g) => g.length);
}

function improve(groups: Item[][], rand: () => number): Item[][] {
  let cur = groups.map((g) => [...g]);
  let curObj = evaluate(cur).obj;
  for (let it = 0; it < 200 && cur.length > 1; it++) {
    const a = Math.floor(rand() * cur.length);
    let b = Math.floor(rand() * cur.length);
    if (a === b) b = (b + 1) % cur.length;
    const next = cur.map((g) => [...g]);
    const i = Math.floor(rand() * next[a].length);
    if (next[b].length < RULES.maxOrdersPerRider && rand() < 0.5) {
      next[b].push(next[a].splice(i, 1)[0]);
    } else {
      const j = Math.floor(rand() * next[b].length);
      [next[a][i], next[b][j]] = [next[b][j], next[a][i]];
    }
    const cleaned = next.filter((g) => g.length);
    const o = evaluate(cleaned).obj;
    if (o < curObj) { cur = cleaned; curObj = o; }
  }
  return cur;
}

const signature = (ordered: Item[][]) =>
  ordered.map((g) => g.map((s) => s.order_id).join('>')).sort().join('|');

const seen = new Set<string>();

function newCode(used: Set<string>): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let c = '';
  do { c = 'J' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); } while (used.has(c));
  used.add(c);
  return c;
}

export function buildMockPlan(items: Item[], planNo: number): RoutePlan {
  if (planNo === 1) seen.clear();
  const rand = rng(planNo * 7919 + items.length);

  const cands = Array.from({ length: 25 }, () => {
    const g = improve(sweepStart(items, rand), rand);
    return evaluate(g);
  }).sort((a, b) => a.obj - b.obj);
  const pick = cands.find((c) => !seen.has(signature(c.ordered))) ?? cands[0];
  seen.add(signature(pick.ordered));

  const used = new Set<string>();
  const routes: RiderRoute[] = pick.ordered.map((g, idx) => {
    let d = 0, la = SHOP.lat, ln = SHOP.lng;
    const stops = g.map((s, i) => {
      d += km(la, ln, s.lat, s.lng); la = s.lat; ln = s.lng;
      const t = Math.round(arriveMin(d));
      return { sequence: i + 1, ...s, arrive_min: t, late: t > RULES.deadlineMin };
    });
    const boxes = g.reduce((a, s) => a + s.boxes, 0);
    return {
      rider: `ไรเดอร์ ${idx + 1}`,
      job_code: newCode(used),
      total_boxes: boxes,
      total_distance_km: +d.toFixed(2),
      total_time_min: Math.round(arriveMin(d)),
      cost: +riderCost(boxes, d).toFixed(2),
      stops,
    };
  });

  const totalBoxes = routes.reduce((a, r) => a + r.total_boxes, 0);
  const revenue = totalBoxes * RULES.pricePerBox;
  const foodCost = totalBoxes * RULES.costPerBox;
  const riderTotal = routes.reduce((a, r) => a + r.cost, 0);
  return {
    plan_no: planNo,
    total_orders: items.length,
    total_boxes: totalBoxes,
    revenue,
    food_cost: foodCost,
    rider_cost: +riderTotal.toFixed(2),
    profit: +(revenue - foodCost - riderTotal).toFixed(2),
    total_distance_km: +routes.reduce((a, r) => a + r.total_distance_km, 0).toFixed(2),
    total_time_min: Math.max(...routes.map((r) => r.total_time_min)),
    late_count: routes.reduce((a, r) => a + r.stops.filter((s) => s.late).length, 0),
    routes,
  };
}
