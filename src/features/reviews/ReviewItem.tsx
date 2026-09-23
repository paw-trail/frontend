import { Star, ThumbsUp } from 'lucide-react';
import type { PlaceReview } from '@/api/types';
import { formatDateKo } from '@/lib/format';
import { PetBadges } from './PetBadges';

type Props = {
  review: PlaceReview;
  /** 17장 신고 처리에서 「후기 보러 가기」로 왔을 때 그 후기 */
  focused?: boolean;
  onLike: () => void;
  onReport: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/** 8장 후기 한 건 — 작성자 · 반려동물 스냅샷 · 방문일 · 평점 · 본문 · 사진 · 태그 · 좋아요 */
export function ReviewItem({ review: r, focused = false, onLike, onReport, onEdit, onDelete }: Props) {
  const nickname = r.author.nickname ?? '알 수 없음';
  return (
    <article
      id={`review-${r.reviewId}`}
      className={`scroll-mt-28 rounded-2xl bg-white px-7 py-6 shadow-card ${focused ? 'ring-2 ring-brand-strong' : ''}`}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {r.author.profileImageUrl ? (
            <img src={r.author.profileImageUrl} alt="" className="size-11 rounded-full object-cover" />
          ) : (
            <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-[1rem] font-bold text-brand-strong" aria-hidden>
              {nickname.slice(0, 1)}
            </span>
          )}
          <div>
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-[1rem] font-bold text-ink">{nickname}</span>
              <PetBadges pets={r.pets} />
            </p>
            <p className="mt-0.5 text-[0.8125rem] text-faint">{formatDateKo(r.visitedAt)} 방문</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          {!r.isMine && (
            <button type="button" onClick={onReport} className="h-7 rounded-full border border-line px-2.5 text-[0.75rem] text-sub hover:text-ink">
              신고
            </button>
          )}
          {r.isMine && (
            <button type="button" onClick={onEdit} className="h-7 rounded-full border border-line px-2.5 text-[0.75rem] text-sub hover:text-ink">
              수정
            </button>
          )}
          {r.canDelete && (
            <button type="button" onClick={onDelete} className="h-7 rounded-full border border-line px-2.5 text-[0.75rem] text-sub hover:text-alert">
              삭제
            </button>
          )}
          <span className="flex items-center gap-1 text-[1.125rem] font-bold text-ink" aria-label={`평점 ${r.rating}점`}>
            <Star className="size-4 fill-[#e2b33c] text-[#e2b33c]" aria-hidden />
            {r.rating}
          </span>
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
          {r.tags.map((t) => (
            <span key={t} className="rounded-md bg-[#f1efe9] px-2.5 py-1 text-[0.8125rem] font-semibold text-sub">
              {t}
            </span>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={r.likedByMe}
          aria-label={r.likedByMe ? '좋아요 취소' : '좋아요'}
          onClick={onLike}
          className={`flex shrink-0 items-center gap-1.5 text-[1rem] font-bold ${r.likedByMe ? 'text-brand-strong' : 'text-ink'}`}
        >
          <ThumbsUp className={`size-5 ${r.likedByMe ? 'fill-brand-soft' : ''}`} strokeWidth={1.8} />
          {r.likeCount}
        </button>
      </footer>
    </article>
  );
}
