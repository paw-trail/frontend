import { useState } from 'react';
import { hasKakaoKey } from '@/lib/kakao';
import { KakaoRouteMap } from './KakaoRouteMap';
import { MapLegend } from './MapLegend';
import { SchematicMap } from './SchematicMap';
import type { MapPoint } from './types';

/** 10 · 11장 오른쪽 지도 — 카카오 키가 있으면 카카오 지도, 없거나 못 불러오면 약도 */
export function RouteMap({ points, route, showRoute = true, focus }: { points: MapPoint[]; route: MapPoint[]; showRoute?: boolean; focus?: MapPoint[] }) {
  const [failed, setFailed] = useState(false);
  const useKakao = hasKakaoKey() && !failed;
  return (
    <div className="relative size-full overflow-hidden rounded-2xl border border-line bg-[#f3eee3] shadow-card">
      {useKakao ? (
        <KakaoRouteMap points={points} route={route} showRoute={showRoute} onFail={() => setFailed(true)} />
      ) : (
        <SchematicMap points={points} route={route} showRoute={showRoute} focus={focus} />
      )}
      <MapLegend points={points} />
    </div>
  );
}
