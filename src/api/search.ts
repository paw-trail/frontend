import { api, type Query } from './client';
import type { FacilityCode, PageResponse, PlaceType, Region, SearchCard, SearchSummary, Suggestion, Verdict } from './types';

export type SearchSort = 'distance' | 'rating' | 'popular';

/** GET /api/v1/search 파라미터 — 400 이 나는 조합은 대조표 2/4 2-2 */
export type SearchParams = {
  q?: string;
  sidoCode?: string;
  sigunguName?: string;
  lat?: number;
  lon?: number;
  /** 미터 · 좌표를 보낼 때 기본 20000 */
  radius?: number;
  placeType?: readonly PlaceType[];
  facility?: readonly FacilityCode[];
  verdict?: readonly Verdict[];
  petIds?: readonly string[];
  sort?: SearchSort;
  page?: number;
  size?: number;
};

export const searchApi = {
  search: (p: SearchParams) => api<PageResponse<SearchCard>>('/search', { query: p as Query }),
  /** petIds 가 없으면 400 — 부르는 쪽이 막는다 */
  summary: (p: Omit<SearchParams, 'sort' | 'page' | 'size' | 'verdict'>) =>
    api<SearchSummary>('/search/summary', { query: p as Query }),
  suggest: (q: string) => api<Suggestion[]>('/search/suggest', { query: { q } }),
  /** size 1~50 · distanceM 은 늘 null */
  trending: (p: { sidoCode?: string; size?: number; petIds?: readonly string[] }) =>
    api<SearchCard[]>('/search/trending', { query: p as Query }),
  /** 8장을 열 때 — 204 */
  recordView: (placeId: string) => api<void>('/search/trending/views', { method: 'POST', body: { placeId } }),
  regions: () => api<Region[]>('/search/regions'),
};
