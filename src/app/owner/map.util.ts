import * as L from 'leaflet';
import { SHOP } from './owner.config';

// ตัวช่วย Leaflet — ใช้ divIcon/วงกลม จึงไม่ต้องพึ่งรูป marker ของ Leaflet

export function createMap(el: HTMLElement, zoom = 14): L.Map {
  const map = L.map(el).setView([SHOP.lat, SHOP.lng], zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
  return map;
}

export function pin(lat: number, lng: number, color: string, text = '', size = 26): L.Marker {
  const icon = L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};color:#fff;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font:700 12px system-ui">${text}</div>`,
  });
  return L.marker([lat, lng], { icon });
}

export function shopPin(): L.Marker {
  return pin(SHOP.lat, SHOP.lng, '#0f172a', '🏠', 32).bindTooltip('ร้านข้าวกล่อง');
}
