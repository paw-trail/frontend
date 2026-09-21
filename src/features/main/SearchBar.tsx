import { useQuery } from '@tanstack/react-query';
import { MapPin, Search } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { qk } from '@/api/keys';
import { searchApi } from '@/api/search';
import { Button } from '@/components/ui/Button';
import { useRegion } from '@/features/region/RegionProvider';
import { useDebounced, useOutsideClick } from '@/lib/hooks';
import { PLACE_TYPE_LABEL } from '@/lib/labels';
import { BasisChip } from './BasisChip';
import { RegionPicker } from './RegionPicker';

/**
 * 6장 검색창 — 입력이 멈추면 자동완성(GET /search/suggest · 10개까지)을 부르고,
 * [찾아보기] 는 조건을 7장으로 넘긴다. 메인은 목록을 그리지 않는다.
 */
export function SearchBar() {
  const navigate = useNavigate();
  const { region } = useRegion();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClick(box, close, open);

  const term = useDebounced(q.trim(), 250);
  const suggest = useQuery({
    queryKey: qk.suggest(term),
    queryFn: () => searchApi.suggest(term),
    enabled: term.length > 0,
    staleTime: 60_000,
    retry: false,
  });
  const items = term.length > 0 ? (suggest.data ?? []) : [];
  const showList = open && items.length > 0;

  const goSearch = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    params.set('sidoCode', region.sidoCode);
    if (region.sigunguName) params.set('sigunguName', region.sigunguName);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div ref={box} className="relative w-[61rem] max-w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const picked = showList && active >= 0 ? items[active] : undefined;
          if (picked) navigate(`/places/${picked.placeId}`);
          else goSearch();
        }}
        className="flex h-[4.625rem] items-center gap-3 rounded-2xl bg-white pl-6 pr-3 shadow-float"
      >
        <Search className="size-6 shrink-0 text-sub" aria-hidden />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!showList) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((i) => (i + 1) % items.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
            }
          }}
          placeholder="지역, 장소명을 검색해보세요"
          aria-label="검색어"
          aria-autocomplete="list"
          aria-expanded={showList}
          className="h-full min-w-0 flex-1 bg-transparent text-[1.0625rem] text-ink outline-none placeholder:text-faint focus-visible:outline-none"
        />
        <span className="h-8 w-px shrink-0 bg-line" aria-hidden />
        <RegionPicker />
        <BasisChip />
        <Button type="submit" size="lg" className="shrink-0 px-6">
          찾아보기
        </Button>
      </form>

      {showList && (
        <ul role="listbox" aria-label="검색어 추천" className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-[36rem] overflow-hidden rounded-xl border border-line bg-white py-1.5 shadow-float">
          {items.map((s, i) => (
            <li key={s.placeId}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => navigate(`/places/${s.placeId}`)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${i === active ? 'bg-field' : 'hover:bg-field'}`}
              >
                <MapPin className="size-4 shrink-0 text-brand" aria-hidden />
                <span className="truncate font-semibold text-ink">{s.name}</span>
                <span className="shrink-0 text-[0.8125rem] text-faint">
                  {PLACE_TYPE_LABEL[s.placeType] ?? '장소'}
                  {s.sigunguName ? ` · ${s.sigunguName}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
