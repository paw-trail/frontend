import { useEffect, useRef, useState } from 'react';
import { formatMeters } from '@/lib/geo';
import { MARKER_COLOR, type MapPoint } from './types';

const NICE = [50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000, 20000, 50000];

/**
 * 카카오 JS 키가 없을 때의 지도 — 실제 좌표를 비율대로 펼친 약도.
 * 도로 · 강은 그리지 않고 격자 · 축척 막대 · 북쪽 표시만 둔다 (없는 길을 그리면 오해를 산다).
 */
export function SchematicMap({ points, route, showRoute, focus }: { points: MapPoint[]; route: MapPoint[]; showRoute: boolean; focus?: MapPoint[] }) {
  // 칸 크기를 재서 그 비율 그대로 그린다 — 고정 비율을 잘라 쓰면 가장자리 이름표가 잘린다
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ W: 1000, H: 760, u: 1 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const u = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1;
      if (width > 0 && height > 0) setSize({ W: width / u, H: height / u, u });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { W, H } = size;
  const all = focus && focus.length > 0 ? focus : [...points, ...route];
  if (all.length === 0) {
    return (
      <div ref={box} className="grid size-full place-items-center bg-[#f3eee3] text-[0.9375rem] text-sub">
        지도에 찍을 장소가 없습니다
      </div>
    );
  }
  const lats = all.map((p) => p.lat);
  const lons = all.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const midLat = (minLat + maxLat) / 2;
  const cos = Math.cos((midLat * Math.PI) / 180);
  const spanX = Math.max((maxLon - minLon) * cos, 0.004) * 1.6;
  const spanY = Math.max(maxLat - minLat, 0.004) * 1.6;
  const k = Math.min(W / spanX, H / spanY);
  const cx = (minLon + maxLon) / 2;
  const cy = midLat;
  const at = (p: { lat: number; lon: number }) => ({ x: W / 2 + (p.lon - cx) * cos * k, y: H / 2 - (p.lat - cy) * k });

  // 축척 — 1도 위도는 약 111.32km
  const pxPerM = k / 111_320;
  const scaleM = NICE.find((m) => m * pxPerM >= 90) ?? NICE[NICE.length - 1];
  const routePts = route.map(at);

  // 내 위치와 도착지가 가까우면 내 위치 이름표를 아래로 내린다
  const target = points.find((p) => p.kind === 'target');
  const meLabelBelow = (x: number, y: number) => {
    if (!target) return false;
    const t = at(target);
    return Math.abs(t.x - x) < 170 && t.y < y + 20 && y - t.y < 150;
  };

  return (
    <div ref={box} className="size-full">
    <svg viewBox={`0 0 ${W} ${H}`} className="size-full" role="img" aria-label="일정 장소 약도">
      <rect width={W} height={H} fill="#f3eee3" />
      {Array.from({ length: Math.ceil(W / 50) }, (_, i) => (
        <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={H} stroke="#e9e2d4" strokeWidth={1} />
      ))}
      {Array.from({ length: Math.ceil(H / 50) }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 50} x2={W} y2={i * 50} stroke="#e9e2d4" strokeWidth={1} />
      ))}

      {showRoute && routePts.length > 1 && (
        <>
          <polyline points={routePts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#fff" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
          <polyline
            points={routePts.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={MARKER_COLOR.route}
            strokeWidth={5}
            strokeDasharray="1 11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}

      {points.map((p) => {
        const { x, y } = at(p);
        return <Marker key={p.id} point={p} x={x} y={y} below={p.kind === 'me' && meLabelBelow(x, y)} />;
      })}

      <g transform={`translate(${W - 58} 40)`}>
        <circle r={20} fill="#fff" stroke="#e5e0d5" />
        <path d="M0 -12 L6 4 L0 0 L-6 4 Z" fill={MARKER_COLOR.stop} />
        <text y={16} textAnchor="middle" fontSize={11} fontWeight={700} fill="#5f655f">
          N
        </text>
      </g>
      <g transform={`translate(28 ${H - 36})`}>
        <rect x={-10} y={-22} width={scaleM * pxPerM + 20} height={36} rx={8} fill="#fff" opacity={0.9} />
        <line x1={0} y1={0} x2={scaleM * pxPerM} y2={0} stroke="#232a25" strokeWidth={3} />
        <line x1={0} y1={-6} x2={0} y2={6} stroke="#232a25" strokeWidth={2} />
        <line x1={scaleM * pxPerM} y1={-6} x2={scaleM * pxPerM} y2={6} stroke="#232a25" strokeWidth={2} />
        <text x={scaleM * pxPerM / 2} y={-8} textAnchor="middle" fontSize={12} fontWeight={700} fill="#232a25">
          {formatMeters(scaleM)}
        </text>
      </g>
    </svg>
    </div>
  );
}

function Label({ x, y, text, fill = '#fff', color = '#232a25' }: { x: number; y: number; text: string; fill?: string; color?: string }) {
  const w = Math.min(260, 16 + text.length * 14);
  return (
    <g transform={`translate(${x - w / 2} ${y})`}>
      <rect width={w} height={28} rx={14} fill={fill} stroke={fill === '#fff' ? '#e5e0d5' : 'none'} />
      <text x={w / 2} y={19} textAnchor="middle" fontSize={14} fontWeight={700} fill={color}>
        {text.length > 17 ? `${text.slice(0, 16)}…` : text}
      </text>
    </g>
  );
}

function Marker({ point: p, x, y, below = false }: { point: MapPoint; x: number; y: number; below?: boolean }) {
  if (p.kind === 'me') {
    return (
      <g>
        <circle cx={x} cy={y} r={24} fill={MARKER_COLOR.me} opacity={0.15} />
        <circle cx={x} cy={y} r={9} fill={MARKER_COLOR.me} stroke="#fff" strokeWidth={3} />
        <Label x={x} y={below ? y + 16 : y - 48} text={p.label ?? '출발: 내 위치'} fill={MARKER_COLOR.stop} color="#fff" />
      </g>
    );
  }
  if (p.kind === 'target') {
    return (
      <g>
        <path d={`M${x} ${y} c-14 -18 -20 -26 -20 -36 a20 20 0 0 1 40 0 c0 10 -6 18 -20 36z`} fill={MARKER_COLOR.target} stroke="#fff" strokeWidth={3} />
        <circle cx={x} cy={y - 36} r={7} fill="#fff" />
        <Label x={x} y={y - 92} text={`도착: ${p.label ?? ''}`} fill={MARKER_COLOR.target} color="#fff" />
      </g>
    );
  }
  if (p.kind === 'vet' || p.kind === 'supply') {
    return (
      <g opacity={p.dim ? 0.55 : 1}>
        <circle cx={x} cy={y} r={9} fill={MARKER_COLOR[p.kind]} stroke="#fff" strokeWidth={3} />
        {p.label && <Label x={x} y={y + 14} text={p.label} />}
      </g>
    );
  }
  return (
    <g opacity={p.dim ? 0.5 : 1}>
      <circle cx={x} cy={y} r={17} fill={MARKER_COLOR.stop} stroke="#fff" strokeWidth={3} />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff">
        {p.order ?? ''}
      </text>
      {p.label && <Label x={x} y={y + 22} text={p.label} />}
    </g>
  );
}
