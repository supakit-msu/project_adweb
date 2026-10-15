import { Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, signal, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { RoutePlan } from '../../models';
import { RoutesService } from '../../services/routes';
import { RULES, SHOP } from '../../owner.config';
import { createMap, pin, shopPin } from '../../map.util';

export const ROUTE_COLORS = [
  { hex: '#dc2626', name: 'แดง' },
  { hex: '#16a34a', name: 'เขียว' },
  { hex: '#2563eb', name: 'น้ำเงิน' },
  { hex: '#ea580c', name: 'ส้ม' },
  { hex: '#9333ea', name: 'ม่วง' },
  { hex: '#0891b2', name: 'ฟ้า' },
  { hex: '#ca8a04', name: 'เหลืองเข้ม' },
  { hex: '#db2777', name: 'ชมพู' },
  { hex: '#4b5563', name: 'เทา' },
];

@Component({
  selector: 'app-routes',
  templateUrl: './routes.html',
})
export class RoutesPage {
  private api = inject(RoutesService);
  private mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');
  private map?: L.Map;
  private layer = L.layerGroup();

  readonly plan = signal<RoutePlan | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly copied = signal('');

  readonly isLoss = computed(() => (this.plan()?.profit ?? 0) < 0);
  readonly overTime = computed(() => (this.plan()?.total_time_min ?? 0) > RULES.deadlineMin);

  constructor() {
    try {
      const saved = localStorage.getItem('active_route_plan');
      if (saved) this.plan.set(JSON.parse(saved));
    } catch { /* ignore */ }

    if (!this.plan()) {
      this.run(true);
    }

    afterNextRender(() => {
      this.map = createMap(this.mapEl().nativeElement, 13);
      this.layer.addTo(this.map);
      this.draw();
    });
    effect(() => { this.plan(); this.draw(); });
    inject(DestroyRef).onDestroy(() => this.map?.remove());
  }

  color(i: number) { return ROUTE_COLORS[i % ROUTE_COLORS.length]; }

  /** เวลาถึงจริง = 11:30 + นาที */
  clock(min: number): string {
    const t = RULES.departHour * 60 + RULES.departMin + min;
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  }

  async run(fresh: boolean) {
    this.loading.set(true);
    this.error.set('');
    try { this.plan.set(await this.api.plan(fresh)); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'จัดเส้นทางไม่สำเร็จ'); }
    this.loading.set(false);
  }

  async copy(code: string) {
    try { await navigator.clipboard.writeText(code); this.copied.set(code); setTimeout(() => this.copied.set(''), 1500); } catch { /* ignore */ }
  }

  private draw() {
    if (!this.map) return;
    this.layer.clearLayers();
    shopPin().addTo(this.layer);
    const p = this.plan();
    if (!p) { this.map.setView([SHOP.lat, SHOP.lng], 13); return; }

    const all: L.LatLngExpression[] = [[SHOP.lat, SHOP.lng]];
    p.routes.forEach((r, i) => {
      const c = this.color(i).hex;
      const pts: L.LatLngExpression[] = [[SHOP.lat, SHOP.lng], ...r.stops.map((s) => [s.lat, s.lng] as L.LatLngExpression)];
      L.polyline(pts, { color: c, weight: 5, opacity: 0.85 }).addTo(this.layer);
      for (const s of r.stops) {
        pin(s.lat, s.lng, c, String(s.sequence))
          .bindTooltip(`${r.rider} · จุด ${s.sequence}: ${s.customer} (${s.boxes} กล่อง) ถึง ${this.clock(s.arrive_min)}`)
          .addTo(this.layer);
        all.push([s.lat, s.lng]);
      }
    });
    this.map.fitBounds(L.latLngBounds(all), { padding: [30, 30] });
  }
}
