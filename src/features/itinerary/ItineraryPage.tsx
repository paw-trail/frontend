import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ChevronDown, Footprints } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { commonMessage } from '@/api/client';
import { qk } from '@/api/keys';
import { itinerariesApi } from '@/api/itineraries';
import { visitsApi } from '@/api/visits';
import type { ItineraryCard } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useLocationState } from '@/features/location/LocationProvider';
import { RouteMap } from '@/features/map/RouteMap';
import type { MapPoint } from '@/features/map/types';
import { todayIso } from '@/lib/format';
import { kakaoRouteUrl, type RoutePoint } from '@/lib/kakao';
import { nowLocalIso } from '@/lib/geo';
import { StopCard } from './StopCard';

const shiftDays = (date: string, days: number) => {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(y, m - 1, d + days);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
};

export const byOrder = (a: ItineraryCard, b: ItineraryCard) =>
  (a.visitOrder ?? 999) - (b.visitOrder ?? 999) || a.visitAt.localeCompare(b.visitAt);

/** 명세서 10장 일정 확인 */
export function ItineraryPage() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const date = sp.get('date') ?? todayIso();
  const { state: location } = useLocationState();
  const [routing, setRouting] = useState(false);
  const [deleting, setDeleting] = useState<ItineraryCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = useQuery({ queryKey: ['itinerary', date], queryFn: () => itinerariesApi.list(date), staleTime: 15_000 });
  const from = shiftDays(date, -30);
  const to = shiftDays(date, 30);
  const dates = useQuery({ queryKey: ['itineraryDates', from, to], queryFn: () => itinerariesApi.dates(from, to), staleTime: 60_000 });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['itinerary'] });
    void queryClient.invalidateQueries({ queryKey: ['itineraryDates'] });
  };
  const remove = useMutation({
    mutationFn: (stopId: string) => itinerariesApi.remove(stopId),
    onSuccess: () => {
      setDeleting(null);
      refresh();
    },
    onError: (e) => setError(commonMessage(e)),
  });
  const visit = useMutation({
    mutationFn: (stopId: string) => visitsApi.recordStop(stopId),
    onSuccess: () => {
      refresh();
      void queryClient.invalidateQueries({ queryKey: ['visits'] });
      void queryClient.invalidateQueries({ queryKey: qk.profile });
    },
    onError: (e) => setError(commonMessage(e)),
  });

  const stops = [...(list.data ?? [])].sort(byOrder);
  const now = nowLocalIso();
  const [, m, d] = date.split('-').map(Number);
  const title = date === todayIso() ? '오늘의 여정' : `${m}월 ${d}일의 여정`;

  const points: MapPoint[] = stops
    .filter((s) => s.lat !== null && s.lon !== null)
    .map((s, i) => ({
      id: s.stopId,
      lat: s.lat!,
      lon: s.lon!,
      kind: s.placeType === 'VET' ? 'vet' : s.supplyPoint ? 'supply' : 'stop',
      label: s.name,
      order: i + 1,
      dim: s.visited,
    }));
  if (location.status === 'granted') points.push({ id: 'me', lat: location.coords.lat, lon: location.coords.lon, kind: 'me' });

  /*
   * 길 안내는 카카오맵에서 한다. 카카오 길찾기 주소는 경유지를 받지 못하므로
   * 「내 위치 → 첫 장소」 · 「첫 장소 → 둘째 장소」 처럼 구간으로 쪼개 하나씩 연다.
   */
  const placed: RoutePoint[] = stops.filter((s) => s.lat !== null && s.lon !== null).map((s) => ({ name: s.name, lat: s.lat!, lon: s.lon! }));
  const legs: { from: RoutePoint | null; to: RoutePoint }[] = [];
  if (placed.length > 0) {
    const me = location.status === 'granted' ? { name: '내 위치', lat: location.coords.lat, lon: location.coords.lon } : null;
    legs.push({ from: me, to: placed[0] });
    for (let i = 1; i < placed.length; i += 1) legs.push({ from: placed[i - 1], to: placed[i] });
  }

  return (
    <main className="grid min-h-0 flex-1 grid-cols-[31rem_minmax(0,1fr)] gap-7 px-8 py-7">
      <section className="flex min-h-0 flex-col overflow-y-auto pr-1">
        <h1 className="text-[2.125rem] font-extrabold tracking-[-0.02em] text-ink">{title}</h1>
        <p className="mt-1 text-[1rem] text-sub">내 일정에 추가된 장소입니다.</p>

        <div className="mt-6 flex items-center justify-between border-t border-line pt-6">
          <h2 className="flex items-center gap-2 text-[1.3125rem] font-bold text-ink">
            <Footprints className="size-5 text-brand-strong" aria-hidden />
            추가된 장소
          </h2>
          <label className="relative flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-[0.9375rem] font-semibold text-ink">
            <CalendarDays className="size-4 text-sub" aria-hidden />
            {date.replace(/-/g, '.')}
            <ChevronDown className="size-4 text-sub" aria-hidden />
            <input
              type="date"
              aria-label="날짜"
              value={date}
              onChange={(e) => e.target.value && setSp({ date: e.target.value })}
              onClick={(e) => e.currentTarget.showPicker?.()}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>

        {(dates.data?.length ?? 0) > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[0.75rem] text-faint">일정 있는 날</span>
            {dates.data!.map((dd) => (
              <button
                key={dd}
                type="button"
                aria-pressed={dd === date}
                onClick={() => setSp({ date: dd })}
                className={`h-7 rounded-full px-3 text-[0.75rem] font-semibold ${
                  dd === date ? 'bg-brand-strong text-white' : 'border border-line bg-white text-sub hover:text-ink'
                }`}
              >
                {dd.slice(5).replace('-', '.')}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-[0.625rem] bg-alert-soft px-3.5 py-2.5 text-[0.8125rem] text-alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex-1 space-y-5">
          {list.isPending ? (
            [0, 1].map((i) => <div key={i} className="h-[19rem] animate-pulse rounded-2xl bg-[#efe9dd]" />)
          ) : list.isError ? (
            <div className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-8 text-center">
              <p className="text-[0.9375rem] text-sub">일정을 불러오지 못했습니다.</p>
              <Button variant="outline" className="mt-3" onClick={() => void list.refetch()}>
                다시 불러오기
              </Button>
            </div>
          ) : stops.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
              <p className="text-[1rem] font-semibold text-ink">이 날 담아 둔 장소가 없습니다.</p>
              <p className="mt-1.5 text-[0.875rem] text-sub">장소 상세의 [내 일정에 추가하기] 로 담을 수 있어요.</p>
              <Button variant="line" className="mt-4" onClick={() => navigate('/')}>
                장소 찾아보기
              </Button>
            </div>
          ) : (
            stops.map((s, i) => (
              <StopCard
                key={s.stopId}
                stop={s}
                order={i + 1}
                rating={s.ratingAvg ?? undefined}
                past={s.visitAt <= now}
                visiting={visit.isPending && visit.variables === s.stopId}
                onDelete={() => setDeleting(s)}
                onVisited={() => visit.mutate(s.stopId)}
              />
            ))
          )}
        </div>

        <Button size="xl" className="mt-6 w-full shrink-0" disabled={legs.length === 0} onClick={() => setRouting(true)}>
          안내 시작하기
        </Button>
      </section>

      <div className="min-h-0">
        <RouteMap points={points} route={points.filter((p) => p.kind !== 'me')} focus={points.filter((p) => p.kind !== 'me')} />
      </div>

      {routing && (
        <Modal
          title="어느 구간을 안내할까요?"
          onClose={() => setRouting(false)}
          actions={
            <Button variant="outline" onClick={() => setRouting(false)}>
              닫기
            </Button>
          }
        >
          <p className="text-[0.8125rem] text-sub">
            카카오맵은 한 번에 한 구간(출발 → 도착)만 안내합니다. 구간을 고르면 카카오맵이 새 창에서 열립니다.
          </p>
          <ul className="mt-3 space-y-2">
            {legs.map((leg, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => window.open(kakaoRouteUrl(leg.from, leg.to), '_blank', 'noopener,noreferrer')}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-left transition-colors hover:border-brand/60 hover:bg-field"
                >
                  <span className="min-w-0 truncate text-[0.9375rem] text-ink">
                    <b className="font-semibold">{leg.from ? leg.from.name : '출발지 고르기'}</b>
                    <span className="mx-2 text-faint">→</span>
                    <b className="font-semibold">{leg.to.name}</b>
                  </span>
                  <span className="shrink-0 text-[0.8125rem] font-semibold text-brand-strong">카카오맵에서 열기</span>
                </button>
              </li>
            ))}
          </ul>
          {location.status !== 'granted' && (
            <p className="mt-3 text-[0.75rem] text-faint">위치 권한을 허용하면 첫 구간의 출발지가 내 위치로 채워집니다.</p>
          )}
        </Modal>
      )}

      {deleting && (
        <Modal
          title="일정에서 뺄까요?"
          onClose={() => setDeleting(null)}
          actions={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)}>
                취소
              </Button>
              <Button variant="strong" disabled={remove.isPending} onClick={() => remove.mutate(deleting.stopId)}>
                빼기
              </Button>
            </>
          }
        >
          {deleting.name}({deleting.visitAt.slice(11, 16)}) — 이 날 일정에서 뺍니다.
        </Modal>
      )}
    </main>
  );
}
