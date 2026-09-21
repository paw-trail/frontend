import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { searchApi, type SearchParams, type SearchSort } from '@/api/search';
import type { SearchCard } from '@/api/types';
import { fromSearchCard, withLocalDistance } from '@/components/place/cardModels';
import { PlaceCard, PlaceCardSkeleton } from '@/components/place/PlaceCard';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { BasisBar } from '@/features/basis/BasisBar';
import { useBasis } from '@/features/basis/BasisProvider';
import { useFavorites } from '@/features/favorites/useFavorites';
import { useLocationState } from '@/features/location/LocationProvider';
import { RegionPicker } from '@/features/main/RegionPicker';
import { useRegion } from '@/features/region/RegionProvider';
import { PLACE_CATEGORIES } from '@/lib/labels';
import { readSession, writeSession } from '@/lib/storage';
import { categoryLabel, placeTypesOf, readState, writeState, type SearchState } from './searchState';
import { VerdictCounts } from './VerdictCounts';

const PAGE_SIZE = 20;
/** 거리순일 때 한 번에 받는 쪽 크기 — 서버 상한 100 */
const FETCH_SIZE = 100;
/** 거리순으로 한꺼번에 받을 최대 건수 — 넘으면 평점순으로 보여 주고 좁혀 달라고 안내 */
const DISTANCE_MAX_ITEMS = 1000;

/** 카드에 좌표가 실려 오는지 — 받은 카드로 알아채 이 세션 동안 기억한다 */
function cardsHaveCoords(cards: SearchCard[] | undefined): boolean | undefined {
  if (!cards || cards.length === 0) return undefined;
  return cards.some((c) => typeof c.lat === 'number' && typeof c.lon === 'number');
}

/**
 * 명세서 7장 검색 결과.
 * 내 위치는 서버로 보내지 않는다 — 공모전 안내상 개인위치정보를 사업자 서버로 보내면 위치기반서비스 신고 대상이다.
 * 거리순은 조건이 같은 결과를 끝까지 받아 브라우저에서 거리를 재고 정렬 · 쪽 나눔을 한다.
 */
export function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const state = readState(sp);
  const { region, setRegion } = useRegion();
  const { state: location } = useLocationState();
  const basis = useBasis();
  const favorites = useFavorites();
  const [input, setInput] = useState(state.q);

  const update = (patch: Partial<SearchState>, push = false) => {
    // 조건을 바꾸면 첫 쪽으로 돌아간다 — 쪽 번호만 바꿀 때는 그대로 둔다
    const next = { ...state, ...patch, page: patch.page ?? 1 };
    setSp(writeState(next), { replace: !push });
    if (patch.page) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 주소창의 지역이 원본 — 처음 한 번 드롭다운을 맞추고, 이후 드롭다운을 바꾸면 주소창에 쓴다
  const lastRegion = useRef(region);
  useEffect(() => {
    if (state.sidoCode && (state.sidoCode !== region.sidoCode || state.sigunguName !== region.sigunguName)) {
      setRegion({ sidoCode: state.sidoCode, sigunguName: state.sigunguName });
    }
  }, []);
  useEffect(() => {
    if (lastRegion.current === region) return;
    lastRegion.current = region;
    if (region.sidoCode !== state.sidoCode || region.sigunguName !== state.sigunguName) {
      update({ sidoCode: region.sidoCode, sigunguName: region.sigunguName, verdict: undefined });
    }
  }, [region]);

  useEffect(() => setInput(state.q), [state.q]);

  const sidoCode = state.sidoCode ?? region.sidoCode;
  const sigunguName = state.sidoCode ? state.sigunguName : region.sigunguName;

  /*
   * 거리순은 ① 위치를 허용했고 ② 시군구를 골랐고 ③ 카드에 좌표가 실려 올 때만 쓴다.
   * 시도 전체는 결과가 많아 끝까지 받기에 무겁다 · 좌표는 search 가 카드에 싣기 전까지 오지 않는다.
   */
  const hasLocation = location.status === 'granted';
  const here = hasLocation ? location.coords : null;
  const [coordsSupported, setCoordsSupported] = useState<boolean | null>(() => readSession<boolean>('pawtrail.search.cardCoords'));
  const distanceReady = hasLocation && Boolean(sigunguName) && coordsSupported === true;
  const sort: SearchSort =
    state.sort === 'distance' ? (distanceReady ? 'distance' : 'rating') : state.sort === 'popular' ? 'popular' : 'rating';
  const distanceHint = !hasLocation
    ? '위치 권한을 허용하면 거리순으로 볼 수 있습니다'
    : !sigunguName
      ? '시군구를 고르면 거리순으로 볼 수 있어요'
      : coordsSupported === false
        ? '지금은 거리순을 쓸 수 없어요'
        : undefined;

  const base: Omit<SearchParams, 'sort' | 'page' | 'size' | 'verdict'> = {
    q: state.q || undefined,
    sidoCode,
    sigunguName,
    placeType: placeTypesOf(state.category),
    facility: state.parking ? ['PARKING'] : undefined,
    petIds: basis.petIds.length ? basis.petIds : undefined,
  };
  const verdictFilter = state.verdict && basis.petIds.length ? [state.verdict] : undefined;

  const page = state.page ?? 1;
  const distanceMode = sort === 'distance';

  // 거리순 — 조건이 같은 결과를 끝까지 받는다 (첫 쪽으로 쪽 수를 알고 나머지는 한꺼번에)
  const all = useQuery({
    queryKey: ['searchAll', base, verdictFilter],
    enabled: distanceMode,
    staleTime: 30_000,
    queryFn: async () => {
      const first = await searchApi.search({ ...base, sort: 'rating', verdict: verdictFilter, page: 0, size: FETCH_SIZE });
      const total = first.page.totalElements;
      if (total > DISTANCE_MAX_ITEMS) return { cards: [] as SearchCard[], total, tooMany: true };
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, first.page.totalPages - 1) }, (_, i) =>
          searchApi.search({ ...base, sort: 'rating', verdict: verdictFilter, page: i + 1, size: FETCH_SIZE }).then((r) => r.content),
        ),
      );
      return { cards: [...first.content, ...rest.flat()], total, tooMany: false };
    },
  });
  const tooMany = distanceMode && all.data?.tooMany === true;
  const serverPaging = !distanceMode || tooMany;

  const list = useQuery({
    queryKey: ['search', base, distanceMode ? 'rating' : sort, verdictFilter, page],
    queryFn: () =>
      searchApi.search({ ...base, sort: distanceMode ? 'rating' : sort, verdict: verdictFilter, page: page - 1, size: PAGE_SIZE }),
    enabled: serverPaging,
    staleTime: 30_000,
    // 쪽을 옮기는 동안 앞 쪽을 그대로 두어 목록이 깜빡이지 않게
    placeholderData: keepPreviousData,
  });

  // 카드에 좌표가 실려 오는지 알아채 기억 — 실려 오면 거리순 칩이 켜진다
  useEffect(() => {
    const seen = cardsHaveCoords(list.data?.content) ?? cardsHaveCoords(all.data?.cards);
    if (seen !== undefined && seen !== coordsSupported) {
      setCoordsSupported(seen);
      writeSession('pawtrail.search.cardCoords', seen);
    }
  }, [list.data, all.data]);
  // 반려동물이 없으면 판정이 없어 셀 것이 없다 — 서버가 400 을 내므로 부르지 않는다
  const summary = useQuery({
    queryKey: ['searchSummary', base],
    queryFn: () => searchApi.summary(base),
    enabled: basis.petIds.length > 0,
    staleTime: 30_000,
  });

  let shown: SearchCard[];
  let totalPages: number;
  let listStatus: 'pending' | 'error' | 'success';
  if (serverPaging) {
    shown = list.data?.content ?? [];
    totalPages = list.data?.page.totalPages ?? 1;
    listStatus = distanceMode && all.status !== 'success' ? all.status : list.status;
  } else {
    const sorted = (all.data?.cards ?? [])
      .map((c) => withLocalDistance(c, here))
      .sort((a, b) => (a.distanceM ?? Number.POSITIVE_INFINITY) - (b.distanceM ?? Number.POSITIVE_INFINITY));
    totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    shown = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    listStatus = all.status;
  }
  // 정렬과 상관없이 좌표가 있으면 브라우저가 잰 거리를 보여 준다
  const cards = shown.map((c) => fromSearchCard(withLocalDistance(c, here)));
  const who = basis.together ? '우리 아이들의 ' : basis.selected[0] ? `${basis.selected[0].name}의 ` : '';
  const what = state.q || categoryLabel(state.category) || '동반 장소';

  return (
    <main className="px-20 pb-2 pt-8">
      <div className="mx-auto w-[58.3rem]">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: input.trim(), verdict: undefined }, true);
          }}
          className="flex h-[3.625rem] items-center gap-3 rounded-xl bg-white pl-5 pr-2 shadow-card"
        >
          <Search className="size-5 shrink-0 text-sub" aria-hidden />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="장소, 카테고리, 또는 지역명을 입력하세요"
            aria-label="검색어"
            className="h-full min-w-0 flex-1 bg-transparent text-[1rem] text-ink outline-none placeholder:text-faint focus-visible:outline-none"
          />
          <RegionPicker />
          <Button type="submit" className="shrink-0 px-5">
            찾아보기
          </Button>
        </form>

        {/* 종류 칩 — 이 화면에서 바로 다른 종류로 옮겨 갈 수 있게 (메인으로 돌아가지 않아도 되도록) */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip on={!state.category} onClick={() => update({ category: undefined }, true)}>
            전체
          </Chip>
          {PLACE_CATEGORIES.map((c) => (
            <Chip key={c.key} on={state.category === c.key} onClick={() => update({ category: c.key }, true)}>
              {c.label}
            </Chip>
          ))}
        </div>

        <div className="mt-2 flex gap-2">
          <Chip on={sort === 'distance'} disabled={!distanceReady} title={distanceHint} onClick={() => update({ sort: 'distance' })}>
            거리순
          </Chip>
          <Chip on={sort === 'rating'} onClick={() => update({ sort: 'rating' })}>
            평점순
          </Chip>
          {state.sort === 'popular' && <Chip on>인기순</Chip>}
          <Chip on={state.parking} onClick={() => update({ parking: !state.parking })}>
            주차 가능
          </Chip>
          {hasLocation && distanceHint && <span className="self-center pl-1 text-[0.8125rem] text-faint">{distanceHint}</span>}
        </div>
      </div>

      <h1 className="mt-8 text-[1.5rem] font-bold tracking-[-0.01em] text-ink">
        {who}맞춤 "{what}" 탐색 현황
      </h1>

      {basis.petIds.length > 0 ? (
        <VerdictCounts
          summary={summary.data}
          status={summary.status}
          selected={state.verdict}
          onSelect={(verdict) => update({ verdict })}
        />
      ) : (
        <p className="mt-4 rounded-2xl bg-white px-6 py-5 text-[0.9375rem] text-sub shadow-card">
          반려동물을 등록하면 동반 가능 여부를 함께 보여 드립니다.
        </p>
      )}

      <div className="mt-7">
        {tooMany && (
          <p className="mb-4 rounded-xl border border-dashed border-line bg-white/70 px-4 py-3 text-[0.875rem] text-sub">
            결과가 {all.data?.total.toLocaleString()}곳이라 거리순으로 한꺼번에 정렬하지 않고 평점순으로 보여 드려요. 종류나 판정을 골라 좁히면 거리순으로 볼 수
            있어요.
          </p>
        )}
        {listStatus === 'pending' ? (
          <div className="grid grid-cols-4 gap-[1.375rem]">
            {Array.from({ length: 8 }, (_, i) => (
              <PlaceCardSkeleton key={i} />
            ))}
          </div>
        ) : listStatus === 'error' ? (
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-white/60 px-6 py-8">
            <p className="text-[0.9375rem] text-sub">검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
            <Button variant="outline" onClick={() => void (serverPaging ? list.refetch() : all.refetch())}>
              다시 불러오기
            </Button>
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
            <p className="text-[1rem] font-semibold text-ink">조건에 맞는 장소가 없습니다.</p>
            <p className="mt-2 text-[0.875rem] text-sub">
              {state.verdict || state.parking ? '고른 판정이나 주차 조건을 풀어 보세요.' : '지역이나 검색어를 바꿔 보세요.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-[1.375rem]">
              {cards.map((card) => {
                const fav = favorites.ids.has(card.placeId);
                return (
                  <PlaceCard key={card.placeId} card={card} favorite={fav} onToggleFavorite={() => favorites.toggle(card.placeId, fav)} />
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={(next) => update({ page: next }, true)} />
          </>
        )}
      </div>

      <BasisBar inset="mx-0" />
    </main>
  );
}

function Chip({ on, children, ...rest }: { on: boolean; children: ReactNode; disabled?: boolean; title?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={`h-10 rounded-xl border px-4 text-[0.875rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
        on ? 'border-brand-strong bg-brand-strong text-white' : 'border-line bg-white text-ink hover:bg-field'
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}
