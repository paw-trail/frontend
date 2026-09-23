import type { Verdict } from '@/api/types';
import { VERDICT_LABEL } from '@/lib/labels';

const TONE: Record<Verdict, string> = {
  ALLOWED: 'bg-ok-soft text-ok',
  CONDITIONAL: 'bg-cond-soft text-cond',
  NOT_ALLOWED: 'bg-no-soft text-no',
  UNKNOWN: 'bg-unknown-soft text-unknown',
};

/** 판정 배지 — 문구는 1/4 1-8 (UNKNOWN 은 「확인 필요」) */
export function VerdictBadge({ verdict, prefix, size = 'sm' }: { verdict: Verdict; prefix?: string; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold ${TONE[verdict]} ${
        size === 'md' ? 'h-7 px-2.5 text-[0.8125rem]' : 'h-6 px-2 text-[0.75rem]'
      }`}
    >
      {prefix ? `${prefix} · ` : ''}
      {VERDICT_LABEL[verdict]}
    </span>
  );
}
