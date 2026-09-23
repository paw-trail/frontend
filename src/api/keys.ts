import type { WeatherQuery } from './weather';

// TanStack Query 열쇠. 세션 셋은 로그인 · 로그아웃 때 한꺼번에 지운다.
export const qk = {
  session: ['session'] as const,
  authMe: ['session', 'authMe'] as const,
  profile: ['session', 'profile'] as const,
  pets: ['session', 'pets'] as const,
  breeds: ['breeds'] as const,
  unreadCount: ['notifications', 'unreadCount'] as const,
  favorites: ['favorites'] as const,
  recent: (size: number) => ['recentPlaces', size] as const,
  recentAll: ['recentPlaces'] as const,
  trending: (sidoCode: string | undefined, petIds: readonly string[], size: number) =>
    ['trending', sidoCode ?? '', petIds.join(','), size] as const,
  regions: ['regions'] as const,
  suggest: (q: string) => ['suggest', q] as const,
  weather: (q: WeatherQuery | null) => ['weather', q] as const,
  placeReviews: (placeId: string, sort: string, photoOnly: boolean, page: number) =>
    ['placeReviews', placeId, sort, photoOnly, page] as const,
  /** 그 장소의 후기 열쇠 전부 — 쓰거나 지운 뒤 무효화에 쓴다 */
  placeReviewsAll: (placeId: string) => ['placeReviews', placeId] as const,
  myReviews: (sort: string, page: number) => ['myReviews', sort, page] as const,
  myReviewsAll: ['myReviews'] as const,
  reviewTags: ['reviewTags'] as const,
};
