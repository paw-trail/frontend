import { Heart } from 'lucide-react';
import { Link } from 'react-router';
import type { PlaceType, Verdict } from '@/api/types';
import { PLACE_TYPE_LABEL } from '@/lib/labels';
import { PlaceImage } from './PlaceImage';
import { VerdictBadge } from './VerdictBadge';

/** 6 · 7장 카드 하나 — 검색 카드와 최근 본 장소 카드를 이 모양으로 맞춰 그린다 */
export type PlaceCardModel = {
  placeId: string;
  name: string;
  placeType: PlaceType;
  imageUrl: string | null;
  region: string | null;
  distance: string | null;
  verdict: Verdict | null;
  body: string | null;
  footer: string | null;
};

type Props = { card: PlaceCardModel; favorite: boolean; onToggleFavorite: () => void };

export function PlaceCard({ card, favorite, onToggleFavorite }: Props) {
  const typeLabel = PLACE_TYPE_LABEL[card.placeType] ?? '장소';
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#ece6da] bg-white shadow-card">
      <Link to={`/places/${card.placeId}`} className="flex flex-1 flex-col focus-visible:outline-offset-[-2px]">
        <PlaceImage src={card.imageUrl} placeType={card.placeType} alt={card.name} className="h-[9.875rem] w-full" />
        <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
          <div className="flex items-center justify-between text-[0.75rem]">
            <span className="truncate text-faint">{card.region ? `${typeLabel} · ${card.region}` : typeLabel}</span>
            {card.distance && <span className="shrink-0 font-semibold text-distance">{card.distance}</span>}
          </div>
          <h3 className="mt-1.5 truncate text-[1.1875rem] font-bold tracking-[-0.01em] text-ink">{card.name}</h3>
          {card.verdict && (
            <div className="mt-2.5">
              <VerdictBadge verdict={card.verdict} />
            </div>
          )}
          {card.body && <p className="mt-2.5 line-clamp-2 text-[0.875rem] leading-[1.55] text-sub">{card.body}</p>}
        </div>
        {card.footer && (
          <p className="truncate border-t border-[#f0ebe1] bg-[#faf8f3] px-4 py-2.5 text-[0.75rem] text-faint">{card.footer}</p>
        )}
      </Link>
      <button
        type="button"
        aria-pressed={favorite}
        aria-label={favorite ? `${card.name} 즐겨찾기에서 빼기` : `${card.name} 즐겨찾기에 담기`}
        onClick={onToggleFavorite}
        className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/95 shadow-[0_2px_8px_rgb(0_0_0/0.12)] transition-transform active:scale-90"
      >
        <Heart className={`size-[1.15rem] ${favorite ? 'fill-[#e0533d] text-[#e0533d]' : 'text-[#e0533d]'}`} strokeWidth={2} />
      </button>
    </article>
  );
}

/** 불러오는 동안 자리를 잡아 두는 카드 */
export function PlaceCardSkeleton() {
  return (
    <div className="flex h-[22rem] flex-col overflow-hidden rounded-2xl border border-[#ece6da] bg-white">
      <div className="h-[9.875rem] animate-pulse bg-[#efe9dd]" />
      <div className="space-y-3 px-4 pt-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-[#efe9dd]" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-[#efe9dd]" />
        <div className="h-5 w-1/4 animate-pulse rounded bg-[#efe9dd]" />
      </div>
    </div>
  );
}
