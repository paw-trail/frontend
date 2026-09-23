import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { commonMessage } from '@/api/client';
import { qk } from '@/api/keys';
import { reviewsApi, type ReviewSort } from '@/api/reviews';
import type { PlaceReview, PlaceReviewList } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuthMe } from '@/features/auth/session';
import { ReviewItem } from './ReviewItem';
import { Stars } from './Stars';

/** 정렬 칩 — 「사진 있는 후기만」은 정렬이 아니라 거르기라 따로 둔다 (서버도 sort 와 photoOnly 를 따로 받는다) */
const SORTS: [ReviewSort, string][] = [
  ['recent', '최신순'],
  ['rating_desc', '평점 높은순'],
  ['rating_asc', '평점 낮은순'],
];
const PAGE_SIZE = 10;
/** 17장에서 넘어온 후기를 찾을 때 더 받아 볼 쪽 수 */
const FOCUS_PAGES = 3;

type Props = {
  placeId: string;
  onReport: (review: { reviewId: string; author: string }) => void;
  /** 탭 이름의 「방문 후기(N개)」 — 요약의 후기 수를 위로 올린다 */
  onCount?: (count: number) => void;
};

/** 8장 「전체 후기」 — review 서버의 목록을 그린다 */
export function ReviewSection({ placeId, onReport, onCount }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useAuthMe();
  const [params] = useSearchParams();
  const focusId = params.get('review');
  const [sort, setSort] = useState<ReviewSort>('recent');
  const [photoOnly, setPhotoOnly] = useState(false);
  const [deleting, setDeleting] = useState<PlaceReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusMissing, setFocusMissing] = useState(false);

  const listKey = [...qk.placeReviewsAll(placeId), sort, photoOnly] as const;
  const list = useInfiniteQuery({
    queryKey: listKey,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => reviewsApi.byPlace(placeId, { sort, photoOnly, page: pageParam, size: PAGE_SIZE }),
    getNextPageParam: (last) => (last.page.number + 1 < last.page.totalPages ? last.page.number + 1 : undefined),
    staleTime: 30_000,
  });

  const pages = list.data?.pages ?? [];
  const reviews = pages.flatMap((p) => p.content);
  // 요약은 거르기 · 쪽과 무관한 장소 전체 값이라 첫 쪽의 것을 쓴다
  const summary = pages[0]?.summary ?? null;

  useEffect(() => {
    if (summary) onCount?.(summary.reviewCount);
  }, [summary, onCount]);

  /*
   * 17장 「후기 보러 가기」로 왔을 때 — 그 후기가 있는 쪽까지 받아 열고 자리로 옮긴다.
   *
   * 한 번 처리하면 끝낸 것으로 표시한다. 목록이 바뀔 때마다 다시 돌면
   * 좋아요를 누르거나 정렬을 바꿀 때 화면이 그 자리로 되돌아가고,
   * 다른 조건의 목록에 그 후기가 없다고 「지워졌을 수 있습니다」가 잘못 뜬다.
   */
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = list;
  const handledFocus = useRef<string | null>(null);
  useEffect(() => {
    if (!focusId || !data) return;
    if (handledFocus.current === focusId) return;
    if (data.pages.some((p) => p.content.some((r) => r.reviewId === focusId))) {
      handledFocus.current = focusId;
      document.getElementById(`review-${focusId}`)?.scrollIntoView({ block: 'center' });
      return;
    }
    if (data.pages.length < FOCUS_PAGES && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
      return;
    }
    handledFocus.current = focusId;
    setFocusMissing(true);
  }, [data, fetchNextPage, focusId, hasNextPage, isFetchingNextPage]);

  const toggleLike = useMutation({
    mutationFn: ({ reviewId, liked }: { reviewId: string; liked: boolean }) => (liked ? reviewsApi.unlike(reviewId) : reviewsApi.like(reviewId)),
    // 두 번 눌러도 서버 결과가 같아서(멱등) 먼저 화면부터 바꾼다
    onMutate: async ({ reviewId, liked }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const prev = queryClient.getQueryData<InfiniteData<PlaceReviewList>>(listKey);
      queryClient.setQueryData<InfiniteData<PlaceReviewList>>(listKey, (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((p) => ({
                ...p,
                content: p.content.map((r) =>
                  r.reviewId === reviewId ? { ...r, likedByMe: !liked, likeCount: Math.max(0, r.likeCount + (liked ? -1 : 1)) } : r,
                ),
              })),
            }
          : old,
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(listKey, ctx.prev);
      setError(commonMessage(e));
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: qk.placeReviewsAll(placeId) }),
  });

  const remove = useMutation({
    // 관리자가 남의 후기를 내릴 때만 관리자 경로로 간다 (지우는 동작은 같고 지운 사람만 다르게 남는다)
    mutationFn: (review: PlaceReview) => (review.isMine ? reviewsApi.remove(review.reviewId) : reviewsApi.removeAsAdmin(review.reviewId)),
    onSuccess: () => {
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: qk.placeReviewsAll(placeId) });
      void queryClient.invalidateQueries({ queryKey: qk.myReviewsAll });
      void queryClient.invalidateQueries({ queryKey: qk.profile });
    },
    onError: (e) => {
      setDeleting(null);
      setError(commonMessage(e));
    },
  });

  const details: [string, number][] = [
    ['시설이 작성된 것과 같았나요', summary?.facilityAvg ?? 0],
    ['규정이 같았나요', summary?.ruleAvg ?? 0],
    ['분위기가 생각과 같았나요', summary?.moodAvg ?? 0],
  ];
  const hasReviews = (summary?.reviewCount ?? 0) > 0;

  return (
    <section id="reviews" className="mt-12 scroll-mt-24">
      <h2 className="text-[1.375rem] font-bold text-ink">전체 후기</h2>

      <div className="mt-4 grid grid-cols-[14rem_minmax(0,1fr)] items-center rounded-2xl bg-white px-8 py-7 shadow-card">
        <div className="border-r border-line pr-8 text-center">
          <p className="text-[0.9375rem] font-semibold text-sub">전체 평점</p>
          <p className="mt-1.5 text-[3.25rem] font-extrabold leading-none tracking-[-0.02em] text-brand-strong">
            {hasReviews ? summary?.ratingAvg.toFixed(1) : '-'}
          </p>
          <div className="mt-2.5 flex justify-center">
            <Stars value={summary?.ratingAvg ?? 0} />
          </div>
          <p className="mt-2 text-[0.8125rem] text-faint">{hasReviews ? `총 ${summary?.reviewCount}개의 솔직한 평가` : '아직 평가가 없습니다'}</p>
        </div>
        <div className="pl-8">
          <p className="text-[0.875rem] font-bold text-ink">반려동물 동반 만족도 상세</p>
          {details.map(([label, value]) => (
            <div key={label} className="mt-3.5 grid grid-cols-[minmax(0,1fr)_11rem_3.5rem] items-center gap-4 text-[0.8125rem]">
              <span className="truncate text-sub">{label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-[#ece7dd]">
                <span className="block h-full rounded-full bg-brand" style={{ width: `${(value / 5) * 100}%` }} />
              </span>
              <span className="text-right text-sub">{hasReviews ? `${value.toFixed(1)} / 5` : '- / 5'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {SORTS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={sort === key}
              onClick={() => setSort(key)}
              className={`h-9 rounded-full border px-4 text-[0.8125rem] font-semibold transition-colors ${
                sort === key ? 'border-brand-strong bg-brand-strong text-white' : 'border-line bg-white text-ink hover:bg-field'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={photoOnly}
            onClick={() => setPhotoOnly((v) => !v)}
            className={`ml-1 h-9 rounded-full border px-4 text-[0.8125rem] font-semibold transition-colors ${
              photoOnly ? 'border-brand-strong bg-brand-strong text-white' : 'border-line bg-white text-ink hover:bg-field'
            }`}
          >
            사진 있는 후기만
          </button>
        </div>
        <Button onClick={() => navigate(`/places/${placeId}/review`)}>
          <Camera className="size-[1.1rem]" aria-hidden />
          후기 작성하기
        </Button>
      </div>

      {focusMissing && (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-white/70 px-4 py-3 text-[0.875rem] text-sub">
          찾으시는 후기가 목록에 없습니다. 이미 지워졌을 수 있습니다.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-[0.625rem] bg-alert-soft px-4 py-3 text-[0.875rem] text-alert">
          {error}
        </p>
      )}

      <div className="mt-4 space-y-4">
        {list.isPending ? (
          <div className="h-40 animate-pulse rounded-2xl bg-white/70" />
        ) : list.isError ? (
          <div className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
            <p className="text-[0.9375rem] text-sub">{commonMessage(list.error)}</p>
            <Button variant="outline" className="mt-4" onClick={() => void list.refetch()}>
              다시 시도
            </Button>
          </div>
        ) : reviews.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center text-[0.9375rem] text-sub">
            {photoOnly ? '사진이 있는 후기가 아직 없습니다.' : '아직 후기가 없습니다. 다녀오셨다면 첫 후기를 남겨 주세요.'}
          </p>
        ) : (
          reviews.map((r) => (
            <ReviewItem
              key={r.reviewId}
              review={r}
              focused={r.reviewId === focusId}
              onLike={() => me.data && toggleLike.mutate({ reviewId: r.reviewId, liked: r.likedByMe })}
              onReport={() => onReport({ reviewId: r.reviewId, author: r.author.nickname ?? '알 수 없음' })}
              onEdit={() => navigate(`/places/${placeId}/review?edit=${r.reviewId}`, { state: { review: r } })}
              onDelete={() => setDeleting(r)}
            />
          ))
        )}
      </div>

      {list.hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" className="px-8" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
            {list.isFetchingNextPage ? '불러오는 중' : '후기 더 보기'}
          </Button>
        </div>
      )}

      {deleting && (
        <Modal
          title="후기를 지울까요?"
          onClose={() => setDeleting(null)}
          actions={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)}>
                취소
              </Button>
              <Button variant="strong" disabled={remove.isPending} onClick={() => remove.mutate(deleting)}>
                지우기
              </Button>
            </>
          }
        >
          {deleting.isMine ? '지운 후기는 되돌릴 수 없습니다.' : `${deleting.author.nickname ?? '알 수 없음'} 님의 후기를 관리자 권한으로 내립니다. 되돌릴 수 없습니다.`}
        </Modal>
      )}
    </section>
  );
}
