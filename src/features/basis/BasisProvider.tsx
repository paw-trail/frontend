import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Pet } from '@/api/types';
import { usePets, useProfile } from '@/features/auth/session';
import { readSession, writeSession } from '@/lib/storage';

/**
 * 판정 기준 — 어느 반려동물로 판정하나 (대조표 2/4 1-1).
 * 서버에 저장하지 않는 화면 상태다. 처음 값은 대표 반려동물.
 */
export type BasisMode = { kind: 'default' } | { kind: 'all' } | { kind: 'pet'; petId: string };

type Ctx = { mode: BasisMode; setMode: (m: BasisMode) => void };
const BasisContext = createContext<Ctx | null>(null);

function initialMode(): BasisMode {
  const saved = readSession<BasisMode>('pawtrail.basis');
  if (saved && (saved.kind === 'default' || saved.kind === 'all' || (saved.kind === 'pet' && typeof saved.petId === 'string'))) {
    return saved;
  }
  return { kind: 'default' };
}

export function BasisProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<BasisMode>(initialMode);
  const setMode = useCallback((m: BasisMode) => {
    setModeState(m);
    writeSession('pawtrail.basis', m);
  }, []);
  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return <BasisContext.Provider value={value}>{children}</BasisContext.Provider>;
}

export type Basis = {
  mode: BasisMode;
  setMode: (m: BasisMode) => void;
  pets: Pet[];
  defaultPet: Pet | null;
  /** 판정에 쓰는 반려동물 */
  selected: Pet[];
  petIds: string[];
  /** 둘 이상을 함께 판정하는 중 — 가장 엄격한 판정으로 합쳐진다 */
  together: boolean;
};

export function useBasis(): Basis {
  const ctx = useContext(BasisContext);
  if (!ctx) throw new Error('BasisProvider 안에서만 쓸 수 있습니다.');
  const pets = usePets();
  const profile = useProfile();
  const defaultPetId = profile.data?.defaultPetId;

  return useMemo(() => {
    const list = pets.data ?? [];
    const defaultPet = list.find((p) => p.petId === defaultPetId) ?? list[0] ?? null;
    let selected: Pet[];
    if (ctx.mode.kind === 'all') {
      selected = list;
    } else if (ctx.mode.kind === 'pet') {
      const id = ctx.mode.petId;
      const found = list.filter((p) => p.petId === id);
      selected = found.length ? found : defaultPet ? [defaultPet] : [];
    } else {
      selected = defaultPet ? [defaultPet] : [];
    }
    return {
      mode: ctx.mode,
      setMode: ctx.setMode,
      pets: list,
      defaultPet,
      selected,
      petIds: selected.map((p) => p.petId),
      together: selected.length > 1,
    };
  }, [ctx.mode, ctx.setMode, pets.data, defaultPetId]);
}

/** 「몽이 (말티즈 · 8.0kg · 이동장 있음 · 유모차 없음)」 */
export function petSentence(p: Pet): string {
  return `${p.name} (${p.breedName} · ${p.weightKg.toFixed(1)}kg · ${p.hasCarrier ? '이동장 있음' : '이동장 없음'} · ${
    p.hasStroller ? '유모차 있음' : '유모차 없음'
  })`;
}
