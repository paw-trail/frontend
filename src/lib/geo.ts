export type LatLon = { lat: number; lon: number };

/** 두 좌표 사이의 직선 거리(m) — 하버사인 */
export function distanceM(a: LatLon, b: LatLon): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 걷는 속도 분당 80m (명세서 11장 ②) */
export function walkMinutes(meters: number): number {
  return Math.max(1, Math.ceil(meters / 80));
}

/** 450m · 1.2km */
export function formatMeters(meters: number): string {
  return meters < 1000 ? `${Math.max(10, Math.round(meters / 10) * 10)}m` : `${(meters / 1000).toFixed(1)}km`;
}

/** 시간대 없는 지금 시각 2026-09-20T15:04:00 — 일정 시각과 견준다 */
export function nowLocalIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
