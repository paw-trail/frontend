import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { PenLine, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { commonMessage } from '@/api/client';
import { qk } from '@/api/keys';
import { reviewsApi, type ReviewSort } from '@/api/reviews';
import type { MyReview } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { PetBadges } from '@/features/reviews/PetBadges';
import { formatDateKo } from '@/lib/format';
import { SortChips, type SortKey } from './SortChips';

const PAGE_SIZE = 10;

/** 12 · 16장 칩은 「전체 · 오래된 순 · 높은 평점순 · 낮은 평점순」 — 서버 정렬 값으로 옮긴다 */
const SORT_PARAM: Record<SortKey, ReviewSort> = {
  all: 'recent',
  oldest: 'oldest',
  high: 'rating_desc',
  low: 'rating_asc',
};

/** 명세서 16장 작성한 후기 — review 서버에서 내 후기를 받는다. 좋아요 수는 보이기만 한다. */
export function MyReviewsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<SortKey>('all');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<MyReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = useQuery({
    queryKey: qk.myReviews(SORT_PARAM[sort], page),
    queryFn: () => reviewsApi.mine({ sort: SORT_PARAM[sort], page: page - 1, size: PAGE_SIZE }),
    staleTime: 30_000,
    // 쪽을 옮기는 동안 앞 쪽을 그대로 두어 목록이 깜빡이지 않게
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (review: MyReview) => reviewsApi.remove(review.reviewId),
    onSuccess: (_d, review) => {
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: qk.myReviewsAll });
      void queryClient.invalidateQueries({ queryKey: qk.placeReviewsAll(review.placeId) });
      void queryClient.invalidateQueries({ queryKey: qk.profile });
    },
    onError: (e) => {
      setDeleting(null);
      setError(commonMessage(e));
    },
  });

  const reviews = list.data?.content ?? [];
  const totalPages = list.data?.page.totalPages ?? 1;

  // 마지막 쪽의 마지막 후기를 지우면 그 쪽이 사라진다 — 빈 쪽에 갇히지 않게 뒤로 당긴다
  useEffect(() => {
    if (list.data && page > totalPages) setPage(Math.max(1, totalPages));
  }, [list.data, page, totalPages]);

  return (
    <section>
      <h1 className="text-[1.875rem] font-bold tracking-[-0.01em] text-ink">작성한 후기</h1>
      <p className="mt-1 text-[0.9375rem] text-sub">내가 남긴 후기예요.</p>
      <div className="mt-5">
        <SortChips
          value={sort}
          onChange={(v) => {
            setSort(v);
            setPage(1);
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-[0.625rem] bg-alert-soft px-4 py-3 text-[0.875rem] text-alert">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-4">
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
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center shadow-card">
            <span className="grid size-16 place-items-center rounded-full bg-[#eef1ec]">
              <PenLine className="size-7 text-brand-strong" aria-hidden />
            </span>
            <p className="mt-4 text-[1.0625rem] font-bold text-ink">아직 남긴 후기가 없어요</p>
            <p className="mt-1 text-[0.875rem] text-sub">다녀온 장소의 상세에서 [후기 작성하기] 를 눌러 첫 후기를 남겨 보세요.</p>
          </div>
        ) : (
          reviews.map((r) => (
            <article key={r.reviewId} className="rounded-2xl bg-white px-7 py-6 shadow-card">
              <header className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link to={`/places/${r.placeId}`} className="truncate text-[1.125rem] font-bold text-ink hover:underline">
                    {r.placeName ?? '이름을 불러오지 못했습니다'}
                  </Link>
                  <p className="mt-0.5 text-[0.8125rem] text-faint">{formatDateKo(r.visitedAt)} 방문</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="mr-1 flex items-center gap-1 text-[1.0625rem] font-bold text-ink" aria-label={`평점 ${r.rating}점`}>
                    <Star className="size-4 fill-[#e2b33c] text-[#e2b33c]" aria-hidden />
                    {r.rating}
                  </span>
                  <button
                    type="button"
                    // 목록이 가진 값을 들고 가면 수정 화면이 기다리지 않고 채워진다 (문항 점수만 그 장소 목록에서 찾는다)
                    onClick={() => navigate(`/places/${r.placeId}/review?edit=${r.reviewId}`, { state: { review: r } })}
                    className="h-7 rounded-full border border-line px-2.5 text-[0.75rem] font-semibold text-sub hover:text-ink"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(r)}
                    className="h-7 rounded-full border border-[#f0d6d3] px-2.5 text-[0.75rem] font-semibold text-alert hover:bg-alert-soft"
                  >
                    삭제
                  </button>
                </div>
              </header>

              <p className="mt-4 whitespace-pre-line text-[0.9375rem] leading-[1.7] text-ink">{r.content}</p>

              {r.photos.length > 0 && (
                <div className="mt-4 flex gap-2.5">
                  {r.photos.map((src, i) => (
                    <img key={i} src={src} alt={`후기 사진 ${i + 1}`} className="h-[7.5rem] w-[9.75rem] rounded-lg object-cover" />
                  ))}
                </div>
              )}

              <footer className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <PetBadges pets={r.pets} className="px-2.5 py-1 text-[0.8125rem]" />
                  {r.tags.map((t) => (
                    <span key={t} className="rounded-md bg-[#f1efe9] px-2.5 py-1 text-[0.8125rem] font-semibold text-sub">
                      {t}
                    </span>
                  ))}
                </div>
                <span className="shrink-0 text-[0.875rem] text-sub">좋아요 {r.likeCount}</span>
              </footer>
            </article>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-7">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
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
          {deleting.placeName ?? '장소'} · {formatDateKo(deleting.visitedAt)} 방문 — 지운 후기는 되돌릴 수 없습니다.
        </Modal>
      )}
    </section>
  );
}
