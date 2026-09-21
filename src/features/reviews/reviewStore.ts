import { useSyncExternalStore } from 'react';
import type { Account, BreedSize } from '@/api/types';

/**
 * 후기 — review 서버가 없어 브라우저 저장소에 둔다 (대조표 2/4 2-4).
 * 화면에 내주는 모양은 명세서 8장 ⑩ GET /places/{placeId}/reviews 응답 그대로다.
 * 서버가 생기면 VITE_REVIEW_MODE=remote 로 같은 모양을 서버에서 받는다.
 */
export type StoredReview = {
  reviewId: string;
  placeId: string;
  placeName: string;
  placeType: string;
  accountId: string;
  rating: number;
  facilityScore: number;
  ruleScore: number;
  moodScore: number;
  content: string;
  photos: string[];
  tags: string[];
  likedBy: string[];
  visitedAt: string;
  createdAt: string;
  petId: string | null;
  author: { nickname: string; profileImageUrl: string | null };
  petSummary: { breedName: string; weightKg: number; breedSize: BreedSize | null } | null;
};

/** 명세서 응답 한 건 */
export type ReviewView = Omit<StoredReview, 'likedBy' | 'accountId'> & {
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
  canDelete: boolean;
};

const KEY = 'pawtrail.reviews.v1';
const EMPTY: StoredReview[] = [];
let cache: StoredReview[] | null = null;
const listeners = new Set<() => void>();

function load(): StoredReview[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as StoredReview[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function save(next: StoredReview[]): boolean {
  let ok = true;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    ok = false; // 저장소가 가득 참 — 사진 크기를 줄여 막는다 (9장)
  }
  if (ok) {
    cache = next;
    listeners.forEach((l) => l());
  }
  return ok;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

export const reviewStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: load,
  add: (review: StoredReview) => save([review, ...load()]),
  update: (reviewId: string, patch: Partial<StoredReview>) =>
    save(load().map((r) => (r.reviewId === reviewId ? { ...r, ...patch } : r))),
  remove: (reviewId: string) => save(load().filter((r) => r.reviewId !== reviewId)),
  /** 탈퇴하면 서버가 지울 수 없는 브라우저 저장소의 내 후기를 화면이 지운다 */
  removeByAccount: (accountId: string) => save(load().filter((r) => r.accountId !== accountId)),
  toggleLike: (reviewId: string, accountId: string) =>
    save(
      load().map((r) =>
        r.reviewId === reviewId
          ? { ...r, likedBy: r.likedBy.includes(accountId) ? r.likedBy.filter((a) => a !== accountId) : [...r.likedBy, accountId] }
          : r,
      ),
    ),
};

export function useStoredReviews(): StoredReview[] {
  return useSyncExternalStore(reviewStore.subscribe, reviewStore.getSnapshot, () => EMPTY);
}

export function toView(r: StoredReview, viewer: Account | undefined): ReviewView {
  const { likedBy, accountId, ...rest } = r;
  const isMine = Boolean(viewer && viewer.accountId === accountId);
  return {
    ...rest,
    likeCount: likedBy.length,
    likedByMe: Boolean(viewer && likedBy.includes(viewer.accountId)),
    isMine,
    canDelete: isMine || viewer?.role === 'ADMIN',
  };
}

export type ReviewSummary = { count: number; rating: number; facility: number; rule: number; mood: number };

export function summarize(list: readonly StoredReview[]): ReviewSummary {
  const n = list.length;
  const avg = (pick: (r: StoredReview) => number) => (n ? Math.round((list.reduce((s, r) => s + pick(r), 0) / n) * 10) / 10 : 0);
  return { count: n, rating: avg((r) => r.rating), facility: avg((r) => r.facilityScore), rule: avg((r) => r.ruleScore), mood: avg((r) => r.moodScore) };
}

/** 장소별 후기 평균 — 카드의 평점 자리 (review 서버가 없어 ratingAvg 가 늘 null · 대조표 3/4 안 4) */
export function useRatingAverages(): Map<string, number> {
  const all = useStoredReviews();
  const [cacheKey, cacheValue] = averagesCache;
  if (cacheKey === all) return cacheValue;
  const sums = new Map<string, { s: number; n: number }>();
  for (const r of all) {
    const cur = sums.get(r.placeId) ?? { s: 0, n: 0 };
    sums.set(r.placeId, { s: cur.s + r.rating, n: cur.n + 1 });
  }
  const result = new Map([...sums].map(([id, { s, n }]) => [id, Math.round((s / n) * 10) / 10]));
  averagesCache = [all, result];
  return result;
}
let averagesCache: [StoredReview[] | null, Map<string, number>] = [null, new Map()];
