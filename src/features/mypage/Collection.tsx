import { Heart, PawPrint, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { PlaceType, Verdict } from '@/api/types';
import { PlaceImage } from '@/components/place/PlaceImage';
import { VerdictBadge } from '@/components/place/VerdictBadge';
import { Button } from '@/components/ui/Button';
import { PLACE_CATEGORIES } from '@/lib/labels';

export type CollectionItem = {
  placeId: string;
  name: string;
  placeType: PlaceType;
  imageUrl: string | null;
  verdict: Verdict | null;
  tags: string[];
  note?: string;
  rating?: number;
  favorite: boolean;
};

type Props = {
  title: string;
  subtitle: string;
  items: CollectionItem[];
  status: 'pending' | 'error' | 'success';
  errorText: string;
  emptyTitle: string;
  emptyHint: string;
  onRetry: () => void;
  onToggleFavorite: (item: CollectionItem) => void;
};

// 칩 이름은 메인의 종류 7개로 맞춘다 (대조표 3/4 안 16)
const categoryOf = (t: PlaceType) => PLACE_CATEGORIES.find((c) => c.types.includes(t))?.key ?? 'etc';

/** 14 · 15장 — 종류 칩(개수 · 0건 숨김) · 카드 2열 · 빈 화면 */
export function Collection({ title, subtitle, items, status, errorText, emptyTitle, emptyHint, onRetry, onToggleFavorite }: Props) {
  const [chip, setChip] = useState('all');
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) m.set(categoryOf(it.placeType), (m.get(categoryOf(it.placeType)) ?? 0) + 1);
    return m;
  }, [items]);
  const chips = PLACE_CATEGORIES.filter((c) => (counts.get(c.key) ?? 0) > 0);
  const active = chip === 'all' || counts.has(chip) ? chip : 'all';
  const shown = active === 'all' ? items : items.filter((it) => categoryOf(it.placeType) === active);

  return (
    <section>
      <h1 className="text-[1.875rem] font-bold tracking-[-0.01em] text-ink">{title}</h1>
      <p className="mt-1 text-[0.9375rem] text-sub">{subtitle}</p>

      {status === 'success' && items.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {[{ key: 'all', label: '전체' }, ...chips].map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={active === c.key}
              onClick={() => setChip(c.key)}
              className={`h-9 rounded-full border px-4 text-[0.875rem] font-semibold transition-colors ${
                active === c.key ? 'border-brand-strong bg-brand-strong text-white' : 'border-line bg-white text-ink hover:bg-field'
              }`}
            >
              {c.label} ({c.key === 'all' ? items.length : counts.get(c.key)})
            </button>
          ))}
        </div>
      )}

      <div className="mt-5">
        {status === 'pending' ? (
          <div className="grid grid-cols-2 gap-5">
            {[0, 1].map((i) => (
              <div key={i} className="h-[20rem] animate-pulse rounded-2xl bg-[#efe9dd]" />
            ))}
          </div>
        ) : status === 'error' ? (
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-white/60 px-6 py-8">
            <p className="text-[0.9375rem] text-sub">{errorText}</p>
            <Button variant="outline" onClick={onRetry}>
              다시 불러오기
            </Button>
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center shadow-card">
            <span className="grid size-16 place-items-center rounded-full bg-[#eef1ec]">
              <PawPrint className="size-7 text-brand-strong" aria-hidden />
            </span>
            <p className="mt-4 text-[1.0625rem] font-bold text-ink">{emptyTitle}</p>
            <p className="mt-1 text-[0.875rem] text-sub">{emptyHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {shown.map((it) => (
              <article key={it.placeId} className="relative overflow-hidden rounded-2xl bg-white shadow-card">
                <Link to={`/places/${it.placeId}`} className="block">
                  <PlaceImage src={it.imageUrl} placeType={it.placeType} alt={it.name} className="h-[13.5rem] w-full" />
                </Link>
                <button
                  type="button"
                  aria-pressed={it.favorite}
                  aria-label={it.favorite ? `${it.name} 즐겨찾기에서 빼기` : `${it.name} 즐겨찾기에 담기`}
                  onClick={() => onToggleFavorite(it)}
                  className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/95 shadow-[0_2px_8px_rgb(0_0_0/0.12)] transition-transform active:scale-90"
                >
                  <Heart className={`size-[1.15rem] ${it.favorite ? 'fill-[#e0533d] text-[#e0533d]' : 'text-[#e0533d]'}`} strokeWidth={2} />
                </button>
                <div className="px-5 pb-5 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/places/${it.placeId}`} className="min-w-0 truncate text-[1.0625rem] font-bold text-ink hover:underline">
                      {it.name}
                    </Link>
                    {it.rating !== undefined && (
                      <span className="flex shrink-0 items-center gap-1 text-[0.9375rem] font-semibold text-ink">
                        <Star className="size-4 text-[#e2b33c]" aria-hidden />
                        {it.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {it.verdict && <VerdictBadge verdict={it.verdict} />}
                    {it.note && <span className="text-[0.8125rem] text-faint">{it.note}</span>}
                  </div>
                  {it.tags.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {it.tags.map((t) => (
                        <span key={t} className="rounded-md bg-[#f1efe9] px-2 py-0.5 text-[0.75rem] font-semibold text-sub">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
