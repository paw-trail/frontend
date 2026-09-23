import { Check, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { petSentence, useBasis, type BasisMode } from './BasisProvider';

/** 6 · 7장 아래 「현재 판정 기준」 띠 — [기준 변경하기] 는 서버를 부르지 않는다 */
export function BasisBar({ inset = 'mx-16' }: { inset?: string }) {
  const b = useBasis();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const sentence =
    b.pets.length === 0
      ? '등록한 반려동물이 없어 판정 없이 보여 드립니다'
      : b.together
        ? `현재 판정 기준: ${b.selected.map((p) => p.name).join(' · ')} 함께 (가장 엄격한 판정)`
        : `현재 판정 기준: ${b.selected[0] ? petSentence(b.selected[0]) : ''}`;

  return (
    <section className={`${inset} mb-14 mt-12 flex items-center gap-4 rounded-[1.25rem] bg-white px-6 py-5 shadow-float`}>
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#f3efe6] text-brand-strong">
        <SlidersHorizontal className="size-5" strokeWidth={2} aria-hidden />
      </span>
      <p className="min-w-0 flex-1 truncate text-[1.1875rem] font-bold text-ink">{sentence}</p>
      {b.pets.length === 0 ? (
        <Button variant="strong" className="rounded-full px-5" onClick={() => navigate('/signup/pets')}>
          반려동물 등록
        </Button>
      ) : (
        <Button variant="strong" className="rounded-full px-5" onClick={() => setOpen(true)}>
          기준 변경하기
        </Button>
      )}
      {open && <BasisPicker onClose={() => setOpen(false)} />}
    </section>
  );
}

/** 판정 기준 선택 창 — 아래 띠와 장소 상세의 「기준 바꾸기」가 함께 쓴다 */
export function BasisPicker({ onClose }: { onClose: () => void }) {
  const b = useBasis();
  const options: { mode: BasisMode; title: string; detail: string }[] = [
    ...b.pets.map((p) => ({
      mode: (p.petId === b.defaultPet?.petId ? { kind: 'default' } : { kind: 'pet', petId: p.petId }) as BasisMode,
      title: p.petId === b.defaultPet?.petId ? `${p.name} (대표)` : p.name,
      detail: petSentence(p).slice(p.name.length + 2, -1),
    })),
    ...(b.pets.length > 1
      ? [{ mode: { kind: 'all' } as BasisMode, title: '모두 함께', detail: '가장 엄격한 판정으로 봅니다' }]
      : []),
  ];
  const isCurrent = (m: BasisMode) =>
    m.kind === 'all'
      ? b.together
      : !b.together && b.selected[0]?.petId === (m.kind === 'pet' ? m.petId : b.defaultPet?.petId);

  return (
    <Modal title="판정 기준 바꾸기" onClose={onClose} actions={<Button variant="outline" onClick={onClose}>닫기</Button>}>
      <ul className="mt-2 space-y-2">
        {options.map((o) => (
          <li key={o.title}>
            <button
              type="button"
              onClick={() => {
                b.setMode(o.mode);
                onClose();
              }}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                isCurrent(o.mode) ? 'border-brand bg-brand-soft' : 'border-line hover:bg-field'
              }`}
            >
              <span>
                <span className="block text-[0.9375rem] font-semibold text-ink">{o.title}</span>
                <span className="block text-[0.8125rem] text-sub">{o.detail}</span>
              </span>
              {isCurrent(o.mode) && <Check className="size-5 text-brand-strong" aria-label="지금 기준" />}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
