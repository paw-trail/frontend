import { ChevronDown } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useBasis, type BasisMode } from '@/features/basis/BasisProvider';
import { useOutsideClick } from '@/lib/hooks';

/** 히어로의 판정 기준 드롭다운 「모두 함께」 · 이름별 */
export function BasisChip() {
  const b = useBasis();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClick(box, close, open);

  if (b.pets.length === 0) {
    return (
      <span className="flex h-10 items-center whitespace-nowrap rounded-lg bg-[#f3ede2] px-3 text-[0.9375rem] font-semibold text-faint">
        반려동물 없음
      </span>
    );
  }

  const label = b.together ? '모두 함께' : (b.selected[0]?.name ?? '');
  const choose = (m: BasisMode) => {
    b.setMode(m);
    setOpen(false);
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1 whitespace-nowrap rounded-lg bg-[#f3ede2] px-3 text-[0.9375rem] font-semibold text-ink hover:bg-[#ece4d6]"
      >
        {label}
        <ChevronDown className="size-4 text-sub" aria-hidden />
      </button>
      {open && (
        <ul role="listbox" aria-label="판정 기준" className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[13rem] rounded-xl border border-line bg-white py-1.5 text-left shadow-float">
          {b.pets.length > 1 && (
            <li>
              <button type="button" role="option" aria-selected={b.together} onClick={() => choose({ kind: 'all' })} className={optionClass(b.together)}>
                모두 함께
              </button>
            </li>
          )}
          {b.pets.map((p) => {
            const isDefault = p.petId === b.defaultPet?.petId;
            const selected = !b.together && b.selected[0]?.petId === p.petId;
            return (
              <li key={p.petId}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(isDefault ? { kind: 'default' } : { kind: 'pet', petId: p.petId })}
                  className={optionClass(selected)}
                >
                  {p.name}
                  {isDefault && <span className="ml-1.5 text-[0.75rem] font-normal text-faint">대표</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const optionClass = (on: boolean) =>
  `w-full px-4 py-2.5 text-left text-[0.9375rem] ${on ? 'bg-brand-soft font-semibold text-brand-strong' : 'text-ink hover:bg-field'}`;
