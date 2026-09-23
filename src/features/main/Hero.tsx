import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { qk } from '@/api/keys';
import { searchApi } from '@/api/search';
import heroIllustration from '@/assets/placeholders/hero-default.jpg';
import { useBasis } from '@/features/basis/BasisProvider';
import { useRegion } from '@/features/region/RegionProvider';
import { withJosa } from '@/lib/format';
import { POPULAR_REGION_LABELS } from '@/lib/regions';
import { SearchBar } from './SearchBar';

/** 6장 히어로 — 배경은 명세서 그림대로 일러스트 한 장으로 고정한다 */
export function Hero() {
  const b = useBasis();

  const title = b.together
    ? '우리 아이들과 함께 어디로 갈까요?'
    : b.selected[0]
      ? `${withJosa(b.selected[0].name, '와', '과')} 함께 어디로 갈까요?`
      : '어디로 떠나볼까요?';

  return (
    <section className="relative h-[24.75rem] bg-[#dfe9e2]">
      {/* 배경만 잘라 낸다 — 상자를 통째로 자르면 지역 고르기 목록이 잘린다 */}
      <div className="absolute inset-0 overflow-hidden">
      <img src={heroIllustration} alt="" className="absolute inset-0 size-full object-cover" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgb(16_24_20/0.62)_0%,rgb(16_24_20/0.4)_40%,rgb(16_24_20/0.08)_78%)]"
      />

      </div>

      <div className="relative px-16 pt-[3.25rem]">
        <h1 className="text-[2.5rem] font-extrabold tracking-[-0.02em] text-white [text-shadow:0_1px_12px_rgb(0_0_0/0.18)]">{title}</h1>
        <p className="mt-2 text-[1.125rem] text-white/90">반려동물에게 딱 맞는 안심 동반 장소를 추천합니다.</p>
        <div className="mt-7">
          <SearchBar />
        </div>
        <PopularRegions />
      </div>

    </section>
  );
}

/** 인기 지역 칩 — 그림의 5개 가운데 지역 목록에 있는 것만 (대조표 2/4 안 A) */
function PopularRegions() {
  const navigate = useNavigate();
  const { setRegion } = useRegion();
  const regions = useQuery({ queryKey: qk.regions, queryFn: searchApi.regions, staleTime: Infinity, retry: false });

  const chips = POPULAR_REGION_LABELS.flatMap((label) => {
    for (const r of regions.data ?? []) {
      const hit = r.sigungus.find((s) => s.name.startsWith(label) && /[시군구]$/.test(s.name) && s.name.length <= label.length + 1);
      if (hit) return [{ label, sidoCode: r.sidoCode, sidoName: r.sidoName, sigunguName: hit.name }];
    }
    return [];
  });
  if (chips.length === 0) return null;

  return (
    <div className="mt-6 flex items-center gap-2.5">
      <span className="text-[0.9375rem] font-semibold text-white">인기 지역:</span>
      {chips.map((c) => (
        <button
          key={c.label}
          type="button"
          onClick={() => {
            setRegion({ sidoCode: c.sidoCode, sidoName: c.sidoName, sigunguName: c.sigunguName });
            navigate(`/search?sidoCode=${c.sidoCode}&sigunguName=${encodeURIComponent(c.sigunguName)}`);
          }}
          className="h-8 rounded-full border border-white/70 bg-white/15 px-3.5 text-[0.875rem] font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
