import { useQueries, useQuery } from '@tanstack/react-query';
import { Footprints, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { itinerariesApi } from '@/api/itineraries';
import { placesApi } from '@/api/places';
import { searchApi } from '@/api/search';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useLocationState } from '@/features/location/LocationProvider';
import { useWatchedCoords } from '@/features/location/useWatchedCoords';
import { RouteMap } from '@/features/map/RouteMap';
import type { MapPoint } from '@/features/map/types';
import { todayIso } from '@/lib/format';
import { distanceM, formatMeters, walkMinutes } from '@/lib/geo';
import { byOrder } from './ItineraryPage';

/**
 * 명세서 11장 안내 시작 — 서버는 일정 목록만 부르고, 거리 · 도보 시간 · 경로선은 좌표로 그린다.
 * 동물병원 마커는 도착지 반경 1km 검색에서 가까운 5곳의 좌표를 상세로 받아 찍는다 (검색 카드에 좌표가 없음).
 */
export function GuidePage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const date = sp.get('date') ?? todayIso();
  const { state } = useLocationState();
  const me = useWatchedCoords(state.status === 'granted' ? state.coords : null, state.status === 'granted');
  const [index, setIndex] = useState(0);
  const [routeOn, setRouteOn] = useState(true);

  const list = useQuery({ queryKey: ['itinerary', date], queryFn: () => itinerariesApi.list(date), staleTime: 15_000 });
  const stops = [...(list.data ?? [])].sort(byOrder).filter((s) => !s.visited && s.lat !== null && s.lon !== null);
  const current = Math.min(index, Math.max(stops.length - 1, 0));
  const target = stops[current];
  const dist = me && target ? distanceM(me, { lat: target.lat!, lon: target.lon! }) : null;

  const vets = useQuery({
    queryKey: ['nearVets', target?.placeId],
    queryFn: () =>
      searchApi.search({ lat: target!.lat!, lon: target!.lon!, radius: 1000, placeType: ['VET'], sort: 'distance', size: 5 }),
    enabled: Boolean(target),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const vetPlaces = useQueries({
    queries: (vets.data?.content ?? []).map((c) => ({
      queryKey: ['place', c.placeId],
      queryFn: () => placesApi.detail(c.placeId),
      staleTime: 5 * 60_000,
    })),
  });

  const [, m, d] = date.split('-').map(Number);
  const points: MapPoint[] = [];
  stops.forEach((s, i) => {
    if (i === current) return;
    points.push({ id: s.stopId, lat: s.lat!, lon: s.lon!, kind: s.supplyPoint ? 'supply' : 'stop', label: s.name, order: i + 1, dim: i < current });
  });
  for (const q of vetPlaces) {
    const v = q.data;
    if (v && v.lat !== null && v.lon !== null) points.push({ id: `vet-${v.placeId}`, lat: v.lat, lon: v.lon, kind: 'vet', label: v.name });
  }
  if (target) points.push({ id: target.stopId, lat: target.lat!, lon: target.lon!, kind: 'target', label: target.name });
  if (me) points.push({ id: 'me', lat: me.lat, lon: me.lon, kind: 'me' });
  const route: MapPoint[] = me && target ? points.filter((p) => p.kind === 'me' || p.kind === 'target').reverse() : [];

  return (
    <main className="grid h-[calc(100vh-4.75rem)] grid-cols-[33.5rem_minmax(0,1fr)]">
      <section className="flex min-h-0 flex-col overflow-y-auto px-8 pb-6 pt-8">
        <p className="flex items-center gap-2.5 text-[1.0625rem] text-ink">
          <span className="size-3 rounded-full bg-brand" aria-hidden />
          <b className="font-bold">출발지:</b>
          {me ? '현재 내 위치' : '위치를 알 수 없음'}
        </p>
        <p className="mt-2 flex items-center gap-2.5 text-[1.0625rem] text-ink">
          <span className="size-3 rounded-full bg-[#e0533d]" aria-hidden />
          <b className="font-bold">도착지:</b>
          {target?.name ?? '-'}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-line pt-6">
          <h1 className="flex items-center gap-2 text-[1.3125rem] font-bold text-ink">
            <Footprints className="size-5 text-brand-strong" aria-hidden />
            경로 안내
          </h1>
          <Switch checked={routeOn} onChange={setRouteOn} label="경로선 보기" />
        </div>

        <div className="mt-4 flex items-center gap-4 rounded-xl bg-[#e9efe9] px-5 py-4">
          <User className="size-6 shrink-0 text-brand-strong" aria-hidden />
          {dist !== null ? (
            <p className="text-[1.375rem] font-bold text-brand-strong">
              도보 {walkMinutes(dist)}분 (약 {formatMeters(dist)})
            </p>
          ) : (
            <p className="text-[0.9375rem] text-sub">위치 권한을 허용하면 걸어서 몇 분인지 알려 드립니다</p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-[0.9375rem] font-semibold text-ink">{date === todayIso() ? '오늘 남은 일정' : `${m}월 ${d}일 남은 일정`}</span>
          {stops.length > 0 && (
            <span className="text-[0.8125rem] text-faint">
              {current + 1} / {stops.length}
            </span>
          )}
        </div>

        {list.isPending ? (
          <div className="mt-2 h-24 animate-pulse rounded-xl bg-[#efe9dd]" />
        ) : stops.length === 0 ? (
          <div className="mt-2 rounded-xl border border-dashed border-line bg-white/60 px-5 py-6 text-center text-[0.9375rem] text-sub">
            남은 일정이 없습니다.
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {stops.slice(current).map((s, i) => (
              <li key={s.stopId} className={`rounded-xl px-4 py-3 ${i === 0 ? 'bg-[#e9efe9]' : 'border border-line bg-white'}`}>
                <p className="text-[0.75rem] text-faint">{i === 0 ? '지금 이동 중' : i === 1 ? '다음' : `${i + 1}번째`}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[0.9375rem] font-semibold text-ink">
                  <span className={`size-2.5 shrink-0 rounded-full ${i === 0 ? 'bg-brand-strong' : 'bg-[#cfd4cf]'}`} aria-hidden />
                  {s.name}
                </p>
                <p className="ml-[1.125rem] text-[0.8125rem] text-sub">{s.visitAt.slice(11, 16)}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[0.75rem] text-faint">길 안내 문장 대신 경로선과 거리로 안내합니다.</p>

        <div className="mt-auto grid grid-cols-[1fr_1.23fr] gap-3 pt-6">
          <Button variant="line" size="xl" disabled={current >= stops.length - 1} onClick={() => setIndex(current + 1)}>
            다음 장소
          </Button>
          <Button size="xl" onClick={() => navigate(`/itinerary?date=${date}`)}>
            종료하기
          </Button>
        </div>
      </section>

      <RouteMap points={points} route={route} showRoute={routeOn} focus={points.filter((p) => p.kind === 'me' || p.kind === 'target' || p.kind === 'vet')} />
    </main>
  );
}
