import type { PetVerdict, Verdict } from '@/api/types';

// search 의 Verdict 순서와 같다 — 앞일수록 엄격함
const STRICT_ORDER: readonly Verdict[] = ['NOT_ALLOWED', 'UNKNOWN', 'CONDITIONAL', 'ALLOWED'];

/** 여러 반려동물의 판정을 가장 엄격한 것 하나로 (search Verdict::stricter 와 같음) */
export function strictest(verdicts: readonly PetVerdict[] | undefined): Verdict | null {
  let best: Verdict | null = null;
  for (const v of verdicts ?? []) {
    if (!v.verdict) continue;
    if (best === null || STRICT_ORDER.indexOf(v.verdict) < STRICT_ORDER.indexOf(best)) best = v.verdict;
  }
  return best;
}
