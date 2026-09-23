import type { Reason, ReasonStatus } from '@/api/types';
import { EXTRACTION_LABEL, ORIGIN_FIELD_LABEL, REASON_STATUS_MARK, SOURCE_DATASET, SOURCE_LABEL } from '@/lib/labels';

const TONE: Record<ReasonStatus, string> = {
  MET: 'bg-ok',
  NOT_MET: 'bg-no',
  CONDITION: 'bg-cond',
  MISSING: 'bg-unknown',
  INFO: 'bg-brand-title',
};

/** 판정 이유 한 줄씩 — 왼쪽 상태 기호, 가운데 항목과 설명, 오른쪽 근거 문장 */
export function ReasonList({ reasons, detailed = false }: { reasons: readonly Reason[]; detailed?: boolean }) {
  if (reasons.length === 0) return <p className="py-2 text-[0.8125rem] text-faint">판정에 쓴 조건이 없습니다.</p>;
  return (
    <ul className="divide-y divide-[#dde6df]">
      {reasons.map((r, i) => {
        const ev = r.evidence[0];
        return (
          <li key={`${r.field}-${i}`} className="flex items-start gap-3 py-2.5">
            <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-[0.3rem] text-[0.75rem] font-bold text-white ${TONE[r.status]}`} aria-hidden>
              {REASON_STATUS_MARK[r.status]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.9375rem] font-semibold text-ink">{r.label}</p>
              <p className="text-[0.8125rem] text-sub">{r.message}</p>
              {detailed &&
                r.evidence.map((e, j) => (
                  <p key={j} className="mt-1 text-[0.75rem] leading-[1.6] text-faint">
                    <span className="font-semibold text-sub">{SOURCE_LABEL[e.source] ?? e.source}</span>
                    {SOURCE_DATASET[e.source] ? ` · ${SOURCE_DATASET[e.source]}` : ''}
                    {e.originField ? ` · 「${ORIGIN_FIELD_LABEL[e.originField] ?? e.originField}」 항목` : ''}
                    {e.extractionMethod ? ` · ${EXTRACTION_LABEL[e.extractionMethod] ?? e.extractionMethod}` : ''}
                    {' — '}
                    "{e.text}"
                  </p>
                ))}
            </div>
            {!detailed && ev && (
              <p
                className="max-w-[45%] shrink-0 truncate pt-0.5 text-right text-[0.75rem] text-faint"
                title={[SOURCE_DATASET[ev.source], ev.originField ? `「${ORIGIN_FIELD_LABEL[ev.originField] ?? ev.originField}」 항목` : null, ev.text]
                  .filter(Boolean)
                  .join(' · ')}
              >
                출처: {SOURCE_LABEL[ev.source] ?? ev.source}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
