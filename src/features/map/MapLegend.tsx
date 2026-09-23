import { MARKER_COLOR, type MapPoint } from './types';

/** 그림의 「지도 마커 안내」 — 지도에 실제로 찍힌 종류만 적는다 */
export function MapLegend({ points }: { points: MapPoint[] }) {
  const kinds = new Set(points.map((p) => p.kind));
  const rows: [string, string][] = (
    [
      [MARKER_COLOR.stop, '동반 가능 도보 경로', 'stop'],
      [MARKER_COLOR.vet, '동물병원 / 응급실', 'vet'],
      [MARKER_COLOR.supply, '반려견 간식 / 용품점', 'supply'],
    ] as [string, string, string][]
  )
    .filter(([, , kind]) => kinds.has(kind as MapPoint['kind']))
    .map(([color, label]) => [color, label] as [string, string]);

  if (rows.length === 0) return null;
  return (
    <div className="absolute left-5 top-5 z-10 rounded-xl bg-white/95 px-4 py-3 shadow-card backdrop-blur-sm">
      <p className="text-[0.875rem] font-bold text-ink">지도 마커 안내</p>
      <ul className="mt-1.5 space-y-1">
        {rows.map(([color, label]) => (
          <li key={label} className="flex items-center gap-2 text-[0.8125rem] text-sub">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
