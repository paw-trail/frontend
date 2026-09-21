import type { BreedSize } from '@/api/types';

/** pet-service BreedSize.fromWeight 와 같은 기준 — 10kg 부터 중형, 25kg 부터 대형 */
export function sizeFromWeight(weightKg: number): BreedSize {
  if (weightKg >= 25) return 'LARGE';
  if (weightKg >= 10) return 'MEDIUM';
  return 'SMALL';
}

/** 서버 검증과 같다 — 0 초과 200 이하 · 소수 첫째 자리까지 */
export const WEIGHT_PATTERN = /^\d{1,3}(\.\d)?$/;

export function formatWeight(weightKg: number): string {
  return `${Number(weightKg.toFixed(1))}kg`;
}
