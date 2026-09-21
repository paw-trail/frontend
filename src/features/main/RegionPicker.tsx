import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { qk } from '@/api/keys';
import { searchApi } from '@/api/search';
import { useRegion } from '@/features/region/RegionProvider';
import { useOutsideClick } from '@/lib/hooks';
import { sidoShort } from '@/lib/regions';

/** 히어로의 지역 드롭다운 「서울 마포구」 — GET /api/v1/search/regions */
export function RegionPicker() {
  const { region, setRegion, label } = useRegion();
  const [open, setOpen] = useState(false);
  const [sido, setSido] = useState(region.sidoCode);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClick(box, close, open);

  const regions = useQuery({ queryKey: qk.regions, queryFn: searchApi.regions, staleTime: Infinity, retry: false });
  const current = regions.data?.find((r) => r.sidoCode === sido);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setSido(region.sidoCode);
          setOpen((v) => !v);
        }}
        className="flex h-10 items-center gap-1 whitespace-nowrap rounded-lg bg-[#f3ede2] px-3 text-[0.9375rem] font-semibold text-ink hover:bg-[#ece4d6]"
      >
        {label}
        <ChevronDown className="size-4 text-sub" aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="지역 고르기"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-30 grid w-[30rem] grid-cols-[8.5rem_minmax(0,1fr)] overflow-hidden rounded-xl border border-line bg-white text-left shadow-float"
        >
          {regions.isPending ? (
            <p className="col-span-2 px-4 py-6 text-center text-[0.875rem] text-faint">불러오는 중</p>
          ) : regions.isError ? (
            <p className="col-span-2 px-4 py-6 text-center text-[0.875rem] text-alert">지역 목록을 불러오지 못했습니다.</p>
          ) : (
            <>
              <ul className="max-h-[21rem] overflow-y-auto border-r border-line py-1.5">
                {regions.data.map((r) => (
                  <li key={r.sidoCode}>
                    <button
                      type="button"
                      onClick={() => setSido(r.sidoCode)}
                      className={`w-full px-4 py-2 text-left text-[0.875rem] ${
                        r.sidoCode === sido ? 'bg-brand-soft font-semibold text-brand-strong' : 'text-ink hover:bg-field'
                      }`}
                    >
                      {sidoShort(r.sidoName, r.sidoCode)}
                    </button>
                  </li>
                ))}
              </ul>
              <ul className="grid max-h-[21rem] grid-cols-2 content-start gap-0.5 overflow-y-auto p-1.5">
                <li className="col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRegion({ sidoCode: sido, sidoName: current?.sidoName });
                      setOpen(false);
                    }}
                    className="w-full rounded-md px-3 py-2 text-left text-[0.875rem] font-semibold text-brand-strong hover:bg-field"
                  >
                    {sidoShort(current?.sidoName, sido)} 전체
                  </button>
                </li>
                {current?.sigungus.map((s) => (
                  <li key={s.name}>
                    <button
                      type="button"
                      onClick={() => {
                        setRegion({ sidoCode: sido, sidoName: current.sidoName, sigunguName: s.name });
                        setOpen(false);
                      }}
                      className={`flex w-full items-baseline justify-between rounded-md px-3 py-2 text-left text-[0.875rem] hover:bg-field ${
                        region.sidoCode === sido && region.sigunguName === s.name ? 'font-semibold text-brand-strong' : 'text-ink'
                      }`}
                    >
                      {s.name}
                      <span className="text-[0.75rem] text-faint">{s.placeCount}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
