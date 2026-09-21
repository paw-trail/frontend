import { Camera } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuthMe } from '@/features/auth/session';
import { ReviewItem } from './ReviewItem';
import { reviewStore, summarize, toView, useStoredReviews, type ReviewView } from './reviewStore';
import { Stars } from './Stars';

type Sort = 'latest' | 'high' | 'low' | 'photo';
const SORTS: [Sort, string][] = [
  ['latest', '최신순'],
  ['high', '평점 높은순'],
  ['low', '평점 낮은순'],
  ['photo', '사진 후기만 보기'],
];
const PAGE = 10;

/** 8장 「전체 후기」 — 브라우저 저장소의 후기를 명세서 응답 모양으로 그린다 (대조표 2/4 2-4) */
export function ReviewSection({ placeId, onReport }: { placeId: string; onReport: (review: { reviewId: string; author: string }) => void }) {
  const navigate = useNavigate();
  const me = useAuthMe();
  const all = useStoredReviews();
  const [sort, setSort] = useState<Sort>('latest');
  const [shown, setShown] = useState(PAGE);
  const [deleting, setDeleting] = useState<ReviewView | null>(null);

  const reviews = useMemo(() => all.filter((r) => r.placeId === placeId), [all, placeId]);
  const summary = summarize(reviews);
  const sorted = useMemo(() => {
    const list = sort === 'photo' ? reviews.filter((r) => r.photos.length > 0) : [...reviews];
    return list.sort((a, b) =>
      sort === 'high' ? b.rating - a.rating || b.createdAt.localeCompare(a.createdAt)
      : sort === 'low' ? a.rating - b.rating || b.createdAt.localeCompare(a.createdAt)
      : b.createdAt.localeCompare(a.createdAt),
    );
  }, [reviews, sort]);
  const views = sorted.slice(0, shown).map((r) => toView(r, me.data));

  const details: [string, number][] = [
    ['시설이 작성된 것과 같았나요', summary.facility],
    ['규정이 같았나요', summary.rule],
    ['분위기가 생각과 같았나요', summary.mood],
  ];

  return (
    <section id="reviews" className="scroll-mt-24 mt-12">
      <h2 className="text-[1.375rem] font-bold text-ink">전체 후기</h2>

      <div className="mt-4 grid grid-cols-[14rem_minmax(0,1fr)] items-center rounded-2xl bg-white px-8 py-7 shadow-card">
        <div className="border-r border-line pr-8 text-center">
          <p className="text-[0.9375rem] font-semibold text-sub">전체 평점</p>
          <p className="mt-1.5 text-[3.25rem] font-extrabold leading-none tracking-[-0.02em] text-brand-strong">
            {summary.count ? summary.rating.toFixed(1) : '-'}
          </p>
          <div className="mt-2.5 flex justify-center">
            <Stars value={summary.rating} />
          </div>
          <p className="mt-2 text-[0.8125rem] text-faint">
            {summary.count ? `총 ${summary.count}개의 솔직한 평가` : '아직 평가가 없습니다'}
          </p>
        </div>
        <div className="pl-8">
          <p className="text-[0.875rem] font-bold text-ink">반려동물 동반 만족도 상세</p>
          {details.map(([label, value]) => (
            <div key={label} className="mt-3.5 grid grid-cols-[minmax(0,1fr)_11rem_3.5rem] items-center gap-4 text-[0.8125rem]">
              <span className="truncate text-sub">{label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-[#ece7dd]">
                <span className="block h-full rounded-full bg-brand" style={{ width: `${(value / 5) * 100}%` }} />
              </span>
              <span className="text-right text-sub">{summary.count ? `${value.toFixed(1)} / 5` : '- / 5'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {SORTS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={sort === key}
              onClick={() => {
                setSort(key);
                setShown(PAGE);
              }}
              className={`h-9 rounded-full border px-4 text-[0.8125rem] font-semibold transition-colors ${
                sort === key ? 'border-brand-strong bg-brand-strong text-white' : 'border-line bg-white text-ink hover:bg-field'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Button onClick={() => navigate(`/places/${placeId}/review`)}>
          <Camera className="size-[1.1rem]" aria-hidden />
          후기 작성하기
        </Button>
      </div>

      <div className="mt-4 space-y-4">
        {views.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center text-[0.9375rem] text-sub">
            {sort === 'photo' && reviews.length > 0 ? '사진이 있는 후기가 아직 없습니다.' : '아직 후기가 없습니다. 다녀오셨다면 첫 후기를 남겨 주세요.'}
          </p>
        ) : (
          views.map((v) => (
            <ReviewItem
              key={v.reviewId}
              review={v}
              onLike={() => me.data && reviewStore.toggleLike(v.reviewId, me.data.accountId)}
              onReport={() => onReport({ reviewId: v.reviewId, author: v.author.nickname })}
              onDelete={() => setDeleting(v)}
            />
          ))
        )}
      </div>
      {sorted.length > shown && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" className="px-8" onClick={() => setShown((n) => n + PAGE)}>
            후기 더 보기
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
          지운 후기는 되돌릴 수 없습니다.
        </Modal>
      )}
    </section>
  );
}
