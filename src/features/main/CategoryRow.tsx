import { CakeSlice, Coffee, Gift, LayoutGrid, MapPin, Tent, Thermometer, Trees, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useRegion } from '@/features/region/RegionProvider';
import { PLACE_CATEGORIES } from '@/lib/labels';

// 그림의 아이콘 그대로
const ICONS: Record<string, LucideIcon> = {
  cafe: Coffee,
  restaurant: CakeSlice,
  park: Trees,
  stay: Tent,
  vet: Thermometer,
  leisure: Gift,
  etc: MapPin,
};

/** 종류를 안 고르고 그 지역 전체를 보는 칸 — 그림에는 없지만 목록으로 바로 갈 길을 둔다 */
const ALL = { key: '', label: '전체' };

/** 6장 종류 7개 + 전체 — 누르면 그 종류로 7장을 연다 (숙소/캠핑 · 레저/체험/문화는 종류 2개씩) */
export function CategoryRow() {
  const navigate = useNavigate();
  const { region } = useRegion();

  return (
    <nav aria-label="장소 종류" className="flex justify-center gap-[2.25rem] py-11">
      {[ALL, ...PLACE_CATEGORIES].map((c) => {
        const Icon = c.key === '' ? LayoutGrid : (ICONS[c.key] ?? MapPin);
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              const params = new URLSearchParams({ sidoCode: region.sidoCode });
              if (c.key) params.set('category', c.key);
              if (region.sigunguName) params.set('sigunguName', region.sigunguName);
              navigate(`/search?${params.toString()}`);
            }}
            className="group flex w-[4.375rem] flex-col items-center"
          >
            <span className="grid size-[4.375rem] place-items-center rounded-full border border-[#ece6da] bg-white shadow-card transition-colors group-hover:border-brand/50">
              <Icon className="size-[1.85rem] text-ink" strokeWidth={1.5} aria-hidden />
            </span>
            <span className="mt-2.5 whitespace-nowrap text-[0.9375rem] font-semibold text-ink">{c.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
