import type { Conflict, Pet, PlaceVerdictDetail } from '@/api/types';
import { VerdictBadge } from '@/components/place/VerdictBadge';
import { SOURCE_LABEL } from '@/lib/labels';
import { ReasonList } from './ReasonList';

type Props = {
  verdict: PlaceVerdictDetail | undefined;
  pets: Pet[];
  conflicts: Conflict[] | undefined;
  conflictsStatus: 'pending' | 'error' | 'success';
};

/** 8장 「규정」 — 반려동물별 판정 이유와 근거 전체 · 가기 전에 챙길 것 · 출처끼리 어긋난 값 */
export function RulesSection({ verdict, pets, conflicts, conflictsStatus }: Props) {
  return (
    <section id="rules" className="scroll-mt-24 mt-10">
      <h2 className="text-[1.25rem] font-bold text-ink">규정</h2>
      <p className="mt-1 text-[0.875rem] text-sub">반려동물마다 이 장소의 동반 조건을 어떻게 판정했는지, 그 근거가 무엇인지 보여 드립니다.</p>

      {verdict && verdict.requiredItems.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[0.875rem] font-semibold text-ink">가기 전에 챙길 것</span>
          {verdict.requiredItems.map((it) => (
            <span key={it} className="rounded-md bg-brand-soft px-2.5 py-1 text-[0.8125rem] font-semibold text-brand-strong">
              {it}
            </span>
          ))}
        </div>
      )}
      {verdict?.correctionSource && (
        <p className="mt-3 text-[0.8125rem] text-brand-strong">
          관리자가 확인한 정보입니다 · {SOURCE_LABEL[verdict.correctionSource] ?? verdict.correctionSource}
        </p>
      )}

      {pets.length === 0 ? (
        <p className="mt-4 rounded-xl bg-white px-5 py-4 text-[0.875rem] text-sub shadow-card">반려동물을 등록하면 반려동물에 맞춘 판정 이유를 보여 드립니다.</p>
      ) : (
        verdict &&
        pets.map((pet) => {
          const v = verdict.verdicts.find((x) => x.petId === pet.petId);
          if (!v) return null;
          return (
            <div key={pet.petId} className="mt-4 rounded-xl bg-white px-5 py-4 shadow-card">
              <div className="flex items-center gap-2.5">
                <span className="text-[0.9375rem] font-bold text-ink">{pet.name}</span>
                <VerdictBadge verdict={v.verdict} />
              </div>
              <div className="mt-2">
                <ReasonList reasons={v.reasons} detailed />
              </div>
            </div>
          );
        })
      )}

      {verdict?.hasConflict && (
        <div className="mt-5 rounded-xl border border-cond/40 bg-cond-soft px-5 py-4">
          <p className="text-[0.9375rem] font-bold text-cond">출처끼리 다르게 적힌 조건이 있습니다</p>
          <p className="mt-1 text-[0.8125rem] text-sub">판정은 믿을 만한 출처를 앞세워 정했지만, 가기 전에 한 번 더 확인해 주세요.</p>
          {conflictsStatus === 'pending' ? (
            <p className="mt-3 text-[0.8125rem] text-faint">불러오는 중</p>
          ) : conflictsStatus === 'error' ? (
            <p className="mt-3 text-[0.8125rem] text-alert">어긋난 값을 불러오지 못했습니다.</p>
          ) : (
            <table className="mt-3 w-full text-left text-[0.8125rem]">
              <thead>
                <tr className="text-faint">
                  <th className="py-1.5 font-medium">항목</th>
                  <th className="py-1.5 font-medium">출처</th>
                  <th className="py-1.5 font-medium">적힌 값</th>
                </tr>
              </thead>
              <tbody>
                {(conflicts ?? []).flatMap((c) =>
                  c.sourceValues.map((sv, i) => (
                    <tr key={`${c.fieldName}-${i}`} className="border-t border-cond/20 align-top">
                      <td className="py-1.5 pr-3 font-semibold text-ink">
                        {i === 0 ? c.label : ''}
                        {i === 0 && c.conflictType === 'INTRA_SOURCE' && <span className="ml-1 font-normal text-faint">(한 출처 안에서 다름)</span>}
                      </td>
                      <td className="py-1.5 pr-3 text-sub">{SOURCE_LABEL[sv.source] ?? sv.source}</td>
                      <td className="py-1.5 text-ink">{sv.value ?? '비어 있음'}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
