import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { env } from '@/lib/env';
import { sidoShort } from '@/lib/regions';
import { readSession, writeSession } from '@/lib/storage';

/**
 * 지역 — 시도 코드와 시군구 이름의 쌍 (대조표 2/4 1-4).
 * 좌표를 지역으로 바꾸는 곳이 서버에 없어, 카카오 JS 키가 생기기 전까지는 고정 지역에서 시작하고
 * 사용자가 드롭다운으로 고른다.
 */
export type RegionChoice = { sidoCode: string; sidoName?: string; sigunguName?: string };

type Ctx = { region: RegionChoice; setRegion: (r: RegionChoice) => void; label: string };
const RegionContext = createContext<Ctx | null>(null);

function initialRegion(): RegionChoice {
  const saved = readSession<RegionChoice>('pawtrail.region');
  if (saved && typeof saved.sidoCode === 'string') return saved;
  return { sidoCode: env.fallbackRegion.sidoCode, sigunguName: env.fallbackRegion.sigunguName };
}

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<RegionChoice>(initialRegion);
  const setRegion = useCallback((r: RegionChoice) => {
    setRegionState(r);
    writeSession('pawtrail.region', r);
  }, []);
  const label = `${sidoShort(region.sidoName, region.sidoCode)} ${region.sigunguName ?? '전체'}`;
  const value = useMemo(() => ({ region, setRegion, label }), [region, setRegion, label]);
  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion(): Ctx {
  const value = useContext(RegionContext);
  if (!value) throw new Error('RegionProvider 안에서만 쓸 수 있습니다.');
  return value;
}
