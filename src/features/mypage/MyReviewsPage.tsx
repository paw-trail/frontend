import { PenLine, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuthMe } from '@/features/auth/session';
import { reviewStore, useStoredReviews, type StoredReview } from '@/features/reviews/reviewStore';
import { formatDateKo } from '@/lib/format';
import { BREED_SIZE_LABEL } from '@/lib/labels';
import { SortChips, type SortKey } from './SortChips';

/**
 * 명세서 16장 작성한 후기 — review 서버가 없어 브라우저 저장소에서 내 계정의 후기를 읽는다.
 * 좋아요 수는 보이기만 하고 누를 수 없다.
 */
export function MyReviewsPage() {
  const me = useAuthMe();
  const navigate = useNavigate();
  const all = useStoredReviews();
  const [sort, setSort] = useState<SortKey>('all');
  const [deleting, setDeleting] = useState<StoredReview | null>(null);

  const mine = useMemo(() => {
    const list = all.filter((r) => r.accountId === me.data?.accountId);
    return [...list].sort(
      sort === 'oldest' ? (a, b) => a.createdAt.localeCompare(b.createdAt)
      : sort === 'high' ? (a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt)
      : sort === 'low' ? (a, b) => a.rating - b.rating || b.createdAt.localeCompare(a.createdAt)
      : (a, b) => b.createdAt.localeCompare(a.createdAt),
    );
  }, [all, me.data?.accountId, sort]);

  return (
    <section>
      <h1 className="text-[1.875rem] font-bold tracking-[-0.01em] text-ink">작성한 후기</h1>
      <p className="mt-1 text-[0.9375rem] text-sub">내가 남긴 후기예요.</p>
      <div className="mt-5">
        <SortChips value={sort} onChange={setSort} />
      </div>

      <div className="mt-5 space-y-4">
        {mine.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center shadow-card">
            <span className="grid size-16 place-items-center rounded-full bg-[#eef1ec]">
              <PenLine className="size-7 text-brand-strong" aria-hidden />
            </span>
            <p className="mt-4 text-[1.0625rem] font-bold text-ink">아직 남긴 후기가 없어요</p>
            <p className="mt-1 text-[0.875rem] text-sub">다녀온 장소의 상세에서 [후기 작성하기] 를 눌러 첫 후기를 남겨 보세요.</p>
          </div>
        ) : (
          mine.map((r) => (
            <article key={r.reviewId} className="rounded-2xl bg-white px-7 py-6 shadow-card">
              <header className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link to={`/places/${r.placeId}`} className="truncate text-[1.125rem] font-bold text-ink hover:underline">
                    {r.placeName}
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
                    onClick={() => navigate(`/places/${r.placeId}/review?edit=${r.reviewId}`)}
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
                <div className="flex flex-wrap gap-2">
                  {r.petSummary && (
                    <span className="rounded-md bg-brand-soft px-2.5 py-1 text-[0.8125rem] font-semibold text-brand-strong">
                      {r.petSummary.breedName}
                      {r.petSummary.breedSize ? ` · ${BREED_SIZE_LABEL[r.petSummary.breedSize]}` : ''}
                    </span>
                  )}
                  {r.tags.map((t) => (
                    <span key={t} className="rounded-md bg-[#f1efe9] px-2.5 py-1 text-[0.8125rem] font-semibold text-sub">
                      {t}
                    </span>
                  ))}
                </div>
                <span className="shrink-0 text-[0.875rem] text-sub">좋아요 {r.likedBy.length}</span>
              </footer>
            </article>
          ))
        )}
      </div>

      {deleting && (
        <Modal
          title="후기를 지울까요?"
          onClose={() => setDeleting(null)}
          actions={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)}>
                취소
              </Button>
              <Button
                variant="strong"
                onClick={() => {
                  reviewStore.remove(deleting.reviewId);
                  setDeleting(null);
                }}
              >
                지우기
              </Button>
            </>
          }
        >
          {deleting.placeName} · {formatDateKo(deleting.visitedAt)} 방문 — 지운 후기는 되돌릴 수 없습니다.
        </Modal>
      )}
    </section>
  );
}
