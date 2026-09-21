import type { PlaceDetail, PlaceVerdictDetail } from '@/api/types';
import type { Pet } from '@/api/types';
import { FACILITY_LABEL, SOURCE_LABEL } from '@/lib/labels';
import { useState } from 'react';
import { BasisPicker } from '@/features/basis/BasisBar';
import { useBasis } from '@/features/basis/BasisProvider';
import { ReasonList } from './ReasonList';

type Props = {
  place: PlaceDetail;
  verdict: PlaceVerdictDetail | undefined;
  verdictStatus: 'pending' | 'error' | 'success';
  pets: Pet[];
  onOpenDocuments: () => void;
};

/** 8장 「시설 안내」 — 편의제공 사항 · 장소 소개 · 확인 사항 */
export function FacilitySection({ place, verdict, verdictStatus, pets, onOpenDocuments }: Props) {
  const basis = useBasis();
  const [picking, setPicking] = useState(false);
  const canSwitch = basis.pets.length > 1;
  const extra = [
    place.businessHours && ['영업시간', place.businessHours],
    place.closedDays && ['휴무일', place.closedDays],
  ].filter(Boolean) as [string, string][];

  return (
    <section id="facility" className="scroll-mt-24 rounded-2xl bg-[#f1f3ee] p-6">
      <div className="rounded-xl bg-[#e6eee8] px-5 py-4">
        <p className="text-[0.875rem] font-bold text-ink">펫 동반 편의제공 사항</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {place.facilities.length > 0 ? (
            place.facilities.map((f) => (
              <span key={f} className="rounded-full bg-white px-3.5 py-1.5 text-[0.8125rem] font-semibold text-ink shadow-[0_1px_2px_rgb(0_0_0/0.05)]">
                {FACILITY_LABEL[f] ?? f}
              </span>
            ))
          ) : (
            <span className="text-[0.8125rem] text-sub">공공데이터에 적힌 편의제공 사항이 없습니다</span>
          )}
          <span className="text-[0.75rem] text-faint">공공데이터에 적힌 것만 보여 드립니다</span>
        </div>
      </div>

      <p className="mt-5 text-[0.9375rem] font-bold text-ink">장소 소개</p>
      <div className="mt-2 rounded-xl border border-line bg-white px-5 py-4">
        <p className="whitespace-pre-line text-[0.875rem] leading-[1.75] text-sub">{place.overview || '소개 글이 없습니다.'}</p>
        {(extra.length > 0 || place.homepage || place.reservationUrl) && (
          <dl className="mt-3 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[0.8125rem]">
            {extra.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-faint">{k}</dt>
                <dd className="whitespace-pre-line text-ink">{v}</dd>
              </div>
            ))}
            {place.homepage && (
              <>
                <dt className="text-faint">홈페이지</dt>
                <dd className="truncate">
                  <a href={place.homepage} target="_blank" rel="noreferrer" className="text-brand-strong underline-offset-2 hover:underline">
                    {place.homepage}
                  </a>
                </dd>
              </>
            )}
            {place.reservationUrl && (
              <>
                <dt className="text-faint">예약</dt>
                <dd className="truncate">
                  <a href={place.reservationUrl} target="_blank" rel="noreferrer" className="text-brand-strong underline-offset-2 hover:underline">
                    예약 페이지 열기
                  </a>
                </dd>
              </>
            )}
          </dl>
        )}
        <p className="mt-3 text-[0.75rem] text-faint">
          출처: {[...new Set(place.sources.map((s) => SOURCE_LABEL[s.source] ?? s.sourceLabel))].join(' · ') || '공공데이터'}
          {place.dataBaseDate ? ` · ${place.dataBaseDate} 기준` : ''}
        </p>
      </div>

      <div className="mt-5 rounded-xl bg-[#e6eee8] px-5 py-4">
        {pets.length === 0 ? (
          <p className="text-[0.875rem] text-sub">반려동물을 등록하면 이 장소의 동반 조건을 맞춰 판정해 드립니다.</p>
        ) : verdictStatus === 'pending' ? (
          <p className="text-[0.875rem] text-faint">판정을 불러오는 중</p>
        ) : verdictStatus === 'error' || !verdict ? (
          <p className="text-[0.875rem] text-alert">판정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : (
          pets.map((pet) => {
            const v = verdict.verdicts.find((x) => x.petId === pet.petId);
            return (
              <div key={pet.petId} className="[&+&]:mt-4">
                <p className="flex items-baseline gap-2">
                  <span className="text-[0.9375rem] font-bold text-ink">확인 사항</span>
                  <span className="text-[0.75rem] text-faint">
                    {pet.name} ({pet.breedName} · {pet.weightKg.toFixed(1)}kg) 기준
                  </span>
                  {/* 같은 장소에서 아이를 바꿔 보며 판정 차이를 확인할 수 있게 */}
                  {canSwitch && (
                    <button
                      type="button"
                      onClick={() => setPicking(true)}
                      className="ml-auto self-center rounded-full border border-line bg-white px-3 py-1 text-[0.75rem] font-semibold text-brand-strong hover:bg-field"
                    >
                      기준 바꾸기
                    </button>
                  )}
                </p>
                <div className="mt-1">
                  <ReasonList reasons={(v?.reasons ?? []).filter((r) => r.status !== 'INFO')} />
                </div>
              </div>
            );
          })
        )}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onOpenDocuments}
            className="h-9 rounded-lg border border-line bg-white px-3.5 text-[0.8125rem] font-semibold text-ink hover:bg-field"
          >
            근거 원문 전체 보기 ›
          </button>
        </div>
      </div>
      {picking && <BasisPicker onClose={() => setPicking(false)} />}
    </section>
  );
}
