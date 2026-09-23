import { ChevronRight } from 'lucide-react';
import { PlaceCard, PlaceCardSkeleton, type PlaceCardModel } from '@/components/place/PlaceCard';
import { Button } from '@/components/ui/Button';

type Props = {
  title: string;
  subtitle?: string;
  moreLabel: string;
  moreTone?: 'brand' | 'plain';
  onMore: () => void;
  status: 'pending' | 'error' | 'success';
  cards: PlaceCardModel[];
  isFavorite: (card: PlaceCardModel) => boolean;
  onToggleFavorite: (card: PlaceCardModel, current: boolean) => void;
  emptyText: string;
  errorText: string;
  onRetry: () => void;
};

/** 6장 카드 구역 — 제목 · 전체 보기 · 카드 4장 */
export function PlaceSection(p: Props) {
  return (
    <section className="px-16 pt-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[1.5rem] font-bold tracking-[-0.01em] text-ink">{p.title}</h2>
          {p.subtitle && <p className="mt-1 text-[0.9375rem] text-sub">{p.subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={p.onMore}
          className={`flex items-center text-[0.875rem] font-semibold ${p.moreTone === 'plain' ? 'text-sub' : 'text-brand-strong'} hover:underline`}
        >
          {p.moreLabel}
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <div className="mt-5">
        {p.status === 'pending' ? (
          <div className="grid grid-cols-4 gap-5">
            {[0, 1, 2, 3].map((i) => (
              <PlaceCardSkeleton key={i} />
            ))}
          </div>
        ) : p.status === 'error' ? (
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-white/60 px-6 py-8">
            <p className="text-[0.9375rem] text-sub">{p.errorText}</p>
            <Button variant="outline" onClick={p.onRetry}>
              다시 불러오기
            </Button>
          </div>
        ) : p.cards.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-8 text-center text-[0.9375rem] text-sub">{p.emptyText}</p>
        ) : (
          <div className="grid grid-cols-4 gap-5">
            {p.cards.map((card) => {
              const fav = p.isFavorite(card);
              return <PlaceCard key={card.placeId} card={card} favorite={fav} onToggleFavorite={() => p.onToggleFavorite(card, fav)} />;
            })}
          </div>
        )}
      </div>
    </section>
  );
}
