import { PawPrint } from 'lucide-react';
import type { SearchSummary, Verdict } from '@/api/types';

const ITEMS: { verdict: Verdict; key: keyof Omit<SearchSummary, 'total'>; label: string; tone: string; soft: string; ring: string }[] = [
  { verdict: 'ALLOWED', key: 'allowed', label: '동반 가능 장소', tone: 'text-ok', soft: 'bg-ok-soft', ring: 'border-ok' },
  { verdict: 'CONDITIONAL', key: 'conditional', label: '조건부 동반 가능', tone: 'text-cond', soft: 'bg-cond-soft', ring: 'border-cond' },
  { verdict: 'NOT_ALLOWED', key: 'notAllowed', label: '동반 불가 장소', tone: 'text-no', soft: 'bg-no-soft', ring: 'border-no' },
  // 그림의 「정보 없음」 은 UNKNOWN 의 화면 문구 「확인 필요」 로 쓴다 (대조표 1/4 1-8)
  { verdict: 'UNKNOWN', key: 'unknown', label: '확인 필요', tone: 'text-unknown', soft: 'bg-unknown-soft', ring: 'border-unknown' },
];

type Props = {
  summary: SearchSummary | undefined;
  status: 'pending' | 'error' | 'success';
  selected: Verdict | undefined;
  onSelect: (verdict: Verdict | undefined) => void;
};

/** 7장 판정별 건수 4칸 — GET /search/summary. 누르면 그 판정만 본다 */
export function VerdictCounts({ summary, status, selected, onSelect }: Props) {
  return (
    <div className="mt-4 grid grid-cols-4 gap-[1.375rem]">
      {ITEMS.map((it) => {
        const on = selected === it.verdict;
        const count = summary ? summary[it.key] : null;
        return (
          <button
            key={it.verdict}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(on ? undefined : it.verdict)}
            className={`flex items-center justify-between rounded-2xl border-2 bg-white px-5 py-4 text-left shadow-card transition-colors ${
              on ? it.ring : 'border-transparent hover:border-line'
            }`}
          >
            <span>
              <span className="block text-[0.875rem] font-medium text-sub">{it.label}</span>
              <span className={`mt-1 block text-[2.125rem] font-extrabold leading-tight tracking-[-0.02em] ${it.tone}`}>
                {status === 'success' && count !== null ? `${count.toLocaleString('ko-KR')}곳` : status === 'error' ? '-' : '…'}
              </span>
            </span>
            <span className={`grid size-10 place-items-center rounded-full ${it.soft}`}>
              <PawPrint className={`size-[1.15rem] ${it.tone}`} strokeWidth={2} aria-hidden />
            </span>
          </button>
        );
      })}
    </div>
  );
}
