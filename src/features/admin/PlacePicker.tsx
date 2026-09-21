import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { qk } from '@/api/keys';
import { searchApi } from '@/api/search';
import { useDebounced, useOutsideClick } from '@/lib/hooks';
import { PLACE_TYPE_LABEL } from '@/lib/labels';

/**
 * 관리자 장소 찾기 — 관리자용 조회가 없어 공개 자동완성으로 찾는다 (대조표 4/4 안 11).
 */
export function PlacePicker({ onPick }: { onPick: (placeId: string) => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClick(box, close, open);
  const term = useDebounced(q.trim(), 250);
  const suggest = useQuery({ queryKey: qk.suggest(term), queryFn: () => searchApi.suggest(term), enabled: term.length > 0, staleTime: 60_000, retry: false });
  const items = term ? (suggest.data ?? []) : [];

  return (
    <div ref={box} className="relative w-[30rem] max-w-full">
      <div className="flex h-11 items-center gap-2 rounded-[0.625rem] border border-line bg-white px-3.5 focus-within:border-brand">
        <Search className="size-4 text-sub" aria-hidden />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="고칠 장소 이름으로 찾기"
          aria-label="장소 찾기"
          className="h-full min-w-0 flex-1 bg-transparent text-[0.9375rem] outline-none placeholder:text-faint focus-visible:outline-none"
        />
      </div>
      {open && items.length > 0 && (
        <ul className="absolute left-0 top-[calc(100%+0.375rem)] z-30 w-full overflow-hidden rounded-xl border border-line bg-white py-1.5 shadow-float">
          {items.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => {
                  onPick(s.placeId);
                  setOpen(false);
                  setQ('');
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-field"
              >
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
