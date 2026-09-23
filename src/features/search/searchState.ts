import type { SearchSort } from '@/api/search';
import type { PlaceType, Verdict } from '@/api/types';
import { PLACE_CATEGORIES } from '@/lib/labels';

/** 종류를 안 골랐을 때 — 동물병원을 뺀 8종 (안 빼면 병원 6,656곳이 목록을 덮는다 · 대조표 2/4 안 11) */
export const ALL_BUT_VET: readonly PlaceType[] = ['CAFE', 'RESTAURANT', 'PARK', 'STAY', 'CAMPING', 'LEISURE', 'CULTURE', 'ETC'];

const VERDICTS: readonly Verdict[] = ['ALLOWED', 'CONDITIONAL', 'NOT_ALLOWED', 'UNKNOWN'];

/** 7장의 조건 — 주소창 쿼리가 원본이라 새로 고쳐도 · 링크로 보내도 같은 화면이 나온다 */
export type SearchState = {
  q: string;
  sidoCode?: string;
  sigunguName?: string;
  category?: string;
  sort?: SearchSort;
  parking: boolean;
  verdict?: Verdict;
  /** 1부터 세는 쪽 번호 — 주소창에 남아 새로 고쳐도 같은 쪽이 나온다 */
  page?: number;
};

export function readState(sp: URLSearchParams): SearchState {
  const sort = sp.get('sort');
  const verdict = sp.get('verdict') as Verdict | null;
  return {
    q: sp.get('q') ?? '',
    sidoCode: sp.get('sidoCode') ?? undefined,
    sigunguName: sp.get('sigunguName') ?? undefined,
    category: sp.get('category') ?? undefined,
    sort: sort === 'distance' || sort === 'rating' || sort === 'popular' ? sort : undefined,
    parking: sp.getAll('facility').includes('PARKING'),
    verdict: verdict && VERDICTS.includes(verdict) ? verdict : undefined,
    page: Math.max(1, Number(sp.get('page')) || 1),
  };
}

export function writeState(s: SearchState): URLSearchParams {
  const sp = new URLSearchParams();
  if (s.q) sp.set('q', s.q);
  if (s.sidoCode) sp.set('sidoCode', s.sidoCode);
  if (s.sigunguName) sp.set('sigunguName', s.sigunguName);
  if (s.page && s.page > 1) sp.set('page', String(s.page));
  if (s.category) sp.set('category', s.category);
  if (s.sort) sp.set('sort', s.sort);
  if (s.parking) sp.append('facility', 'PARKING');
  if (s.verdict) sp.set('verdict', s.verdict);
  return sp;
}

export function placeTypesOf(category: string | undefined): readonly PlaceType[] {
  return PLACE_CATEGORIES.find((c) => c.key === category)?.types ?? ALL_BUT_VET;
}

export function categoryLabel(category: string | undefined): string | null {
  return PLACE_CATEGORIES.find((c) => c.key === category)?.label ?? null;
}
