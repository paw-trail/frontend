import { useEffect, useRef } from 'react';
import { loadKakaoMaps, type KakaoMap, type KakaoMaps } from '@/lib/kakao';
import { MARKER_COLOR, type MapPoint } from './types';

// 카카오 지도 위 표시는 문서 요소로 만든다 (클래스가 아니라 인라인 스타일)
function markerElement(p: MapPoint): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;transform:translateY(4px);font-family:inherit';
  const dot = document.createElement('div');
  const color = MARKER_COLOR[p.kind === 'stop' ? 'stop' : p.kind];
  const size = p.kind === 'stop' ? 30 : p.kind === 'target' ? 26 : 16;
  dot.style.cssText = `width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgb(0 0 0/.25);color:#fff;font-weight:800;font-size:14px;display:grid;place-items:center;opacity:${p.dim ? 0.55 : 1}`;
  if (p.kind === 'stop' && p.order) dot.textContent = String(p.order);
  const label = document.createElement('div');
  const text = p.kind === 'target' ? `도착: ${p.label ?? ''}` : p.kind === 'me' ? '출발: 내 위치' : (p.label ?? '');
  const filled = p.kind === 'target' || p.kind === 'me';
  label.textContent = text;
  label.style.cssText = `padding:4px 10px;border-radius:9999px;font-size:13px;font-weight:700;white-space:nowrap;background:${
    filled ? (p.kind === 'target' ? MARKER_COLOR.target : MARKER_COLOR.stop) : '#fff'
  };color:${filled ? '#fff' : '#232a25'};border:1px solid ${filled ? 'transparent' : '#e5e0d5'}`;
  if (text) wrap.append(label);
  wrap.append(dot);
  return wrap;
}

/** 카카오 JS 키가 있을 때의 지도 — 마커 · 방문 순서대로 이은 직선 · 모든 점이 보이게 맞춤 */
export function KakaoRouteMap({ points, route, showRoute, onFail }: { points: MapPoint[]; route: MapPoint[]; showRoute: boolean; onFail: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const state = useRef<{ maps: KakaoMaps; map: KakaoMap; line: { setMap(m: KakaoMap | null): void } | null } | null>(null);
  const key = JSON.stringify([points, route]);

  useEffect(() => {
    let cancelled = false;
    const overlays: { setMap(m: KakaoMap | null): void }[] = [];
    loadKakaoMaps()
      .then((maps) => {
        if (cancelled || !box.current) return;
        const all = [...points, ...route];
        if (all.length === 0) return;
        const map = state.current?.map ?? new maps.Map(box.current, { center: new maps.LatLng(all[0].lat, all[0].lon), level: 5 });
        const bounds = new maps.LatLngBounds();
        all.forEach((p) => bounds.extend(new maps.LatLng(p.lat, p.lon)));
        map.setBounds(bounds, 80, 80, 80, 80);
        for (const p of points) {
          overlays.push(new maps.CustomOverlay({ position: new maps.LatLng(p.lat, p.lon), content: markerElement(p), yAnchor: 1, map }));
        }
        const line =
          route.length > 1
            ? new maps.Polyline({
                path: route.map((p) => new maps.LatLng(p.lat, p.lon)),
                strokeWeight: 5,
                strokeColor: MARKER_COLOR.route,
                strokeOpacity: 0.95,
                strokeStyle: 'shortdot',
              })
            : null;
        state.current = { maps, map, line };
        if (line && showRoute) line.setMap(map);
      })
      .catch(() => {
        if (!cancelled) onFail();
      });
    return () => {
      cancelled = true;
      overlays.forEach((o) => o.setMap(null));
      state.current?.line?.setMap(null);
    };
    // 점이 바뀔 때만 다시 그린다
  }, [key]);

  useEffect(() => {
    const s = state.current;
    if (s?.line) s.line.setMap(showRoute ? s.map : null);
  }, [showRoute]);

  return <div ref={box} className="size-full" />;
}
