import { Star } from 'lucide-react';
import { Link } from 'react-router';
import type { ItineraryCard } from '@/api/types';
import { PlaceImage } from '@/components/place/PlaceImage';
import { VerdictBadge } from '@/components/place/VerdictBadge';
import { Button } from '@/components/ui/Button';

type Props = {
  stop: ItineraryCard;
  order: number;
  rating: number | undefined;
  past: boolean;
  visiting: boolean;
  onDelete: () => void;
  onVisited: () => void;
};

/** 10장 카드 — 사진 · [삭제] · 「이름(11:00)」 · 평점 · 판정 · [다녀왔어요] 또는 [후기 쓰기] */
export function StopCard({ stop, order, rating, past, visiting, onDelete, onVisited }: Props) {
  const time = stop.visitAt.slice(11, 16);
  const reviewLink = `/places/${stop.placeId}/review?visitedAt=${stop.visitAt.slice(0, 10)}${stop.petId ? `&petId=${stop.petId}` : ''}`;
  return (
    <article className="relative overflow-hidden rounded-2xl bg-white shadow-card">
      <Link to={`/places/${stop.placeId}`} className="block">
        <div className="relative h-[13rem]">
          <PlaceImage src={stop.imageUrl} placeType={stop.placeType} alt={stop.name} className="size-full" />
          <span className="absolute left-3 top-3 grid size-8 place-items-center rounded-full bg-brand-strong text-[0.875rem] font-bold text-white shadow">
            {order}
          </span>
        </div>
      </Link>
      <button
        type="button"
        onClick={onDelete}
        className="absolute right-3 top-3 h-7 rounded-full border border-[#f0d6d3] bg-white/95 px-3 text-[0.75rem] font-semibold text-alert hover:bg-white"
      >
        삭제
      </button>
      <div className="px-5 pb-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <Link to={`/places/${stop.placeId}`} className="min-w-0 text-[1.1875rem] font-bold tracking-[-0.01em] text-ink hover:underline">
            {stop.name}({time})
          </Link>
          {rating !== undefined && (
            <span className="flex shrink-0 items-center gap-1 text-[1rem] font-semibold text-ink">
              <Star className="size-4 text-[#e2b33c]" strokeWidth={2} aria-hidden />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {stop.verdict && <VerdictBadge verdict={stop.verdict} />}
            {stop.visited && <span className="rounded-md bg-[#eceae4] px-2 py-0.5 text-[0.75rem] font-semibold text-sub">다녀옴</span>}
          </div>
          {stop.visited ? (
            <Link to={reviewLink} className="text-[0.875rem] font-semibold text-brand-strong hover:underline">
              후기 쓰기 ›
            </Link>
          ) : (
            past && (
              <Button variant="line" className="h-9 px-3.5 text-[0.8125rem]" disabled={visiting} onClick={onVisited}>
                {visiting ? '기록하는 중' : '다녀왔어요'}
              </Button>
            )
          )}
        </div>
      </div>
    </article>
  );
}
