import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { adminPoliciesApi, adminReportsApi } from '@/api/admin';
import { commonMessage, isApiError } from '@/api/client';
import { placesApi } from '@/api/places';
import type { PolicyFields } from '@/api/types';
import { VerdictBadge } from '@/components/place/VerdictBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { usePets, useProfile } from '@/features/auth/session';
import { formatDateKo } from '@/lib/format';
import { SOURCE_LABEL } from '@/lib/labels';
import { PlacePicker } from './PlacePicker';

type Kind = 'tri' | 'enum' | 'number' | 'list';
type Spec = { key: keyof PolicyFields; label: string; kind: Kind; yes?: string; no?: string; options?: [string, string][]; hint?: string };

// 순서 · 이름은 policy README 2-4 그대로 — 관리자 화면이 정정 전후를 이 순서로 펼친다
const SPECS: Spec[] = [
  { key: 'scope', label: '동반 범위', kind: 'enum', options: [['ALL_AREA', '전 구역'], ['PARTIAL', '일부 구역'], ['NONE', '동반 불가'], ['UNKNOWN', '알 수 없음']] },
  { key: 'guideDogOnly', label: '안내견 한정', kind: 'tri', yes: '안내견만', no: '안내견 외에도' },
  { key: 'petOnly', label: '반려견 동반 전용', kind: 'tri', yes: '반려견과만', no: '반려견 없이도' },
  { key: 'indoorAllowed', label: '실내 동반', kind: 'tri', yes: '가능', no: '불가' },
  { key: 'outdoorAllowed', label: '실외 동반', kind: 'tri', yes: '가능', no: '불가' },
  { key: 'maxWeightKg', label: '체중 제한 (kg)', kind: 'number', hint: '소수 둘째 자리까지' },
  { key: 'weightInclusive', label: '체중 기준', kind: 'tri', yes: '이하', no: '미만' },
  { key: 'maxCount', label: '마릿수 제한', kind: 'number', hint: '1 이상' },
  { key: 'sizeRule', label: '크기 제한', kind: 'enum', options: [['SMALL_ONLY', '소형견만'], ['SMALL_MEDIUM', '소형 · 중형견'], ['ALL', '제한 없음']] },
  { key: 'breedRule', label: '견종 제한', kind: 'enum', options: [['NONE', '제한 없음'], ['DANGEROUS_MUZZLE', '맹견은 입마개'], ['DANGEROUS_BANNED', '맹견 불가']] },
  { key: 'carrierRequired', label: '이동장', kind: 'tri', yes: '필요', no: '필요 없음' },
  { key: 'leashRequired', label: '목줄', kind: 'tri', yes: '필요', no: '필요 없음' },
  { key: 'excludedZones', label: '동반 불가 구역', kind: 'list', hint: '쉼표로 나눠 적음 · 예) 실내, 잔디' },
  { key: 'allowedZonesOnly', label: '동반 가능 구역', kind: 'list', hint: '쉼표로 나눠 적음' },
  { key: 'excludedDays', label: '동반 불가일', kind: 'list', hint: '쉼표로 나눠 적음' },
  { key: 'extraFeeAmount', label: '추가 요금 (원)', kind: 'number', hint: '0 이상' },
  { key: 'extraFeeUnit', label: '요금 기준', kind: 'enum', options: [['PER_DOG', '마리당'], ['PER_NIGHT', '1박당'], ['PER_VISIT', '방문당']] },
  { key: 'requiredItems', label: '준비물', kind: 'list', hint: '쉼표로 나눠 적음 · 예) 목줄, 배변봉투' },
  { key: 'vaccineProof', label: '접종 증명', kind: 'tri', yes: '필요', no: '필요 없음' },
  { key: 'advanceInquiry', label: '사전 문의', kind: 'tri', yes: '필요', no: '필요 없음' },
];

// 입력칸은 글자로 들고 있다가 저장할 때 서버 값으로 바꾼다 — 비우면 null(모름)
type Draft = Record<keyof PolicyFields, string>;
const toDraft = (f: PolicyFields): Draft =>
  Object.fromEntries(
    SPECS.map((s) => {
      const v = f[s.key];
      return [s.key, v === null || v === undefined ? '' : Array.isArray(v) ? v.join(', ') : String(v)];
    }),
  ) as Draft;

function fromDraft(d: Draft, original: PolicyFields): { fields: PolicyFields; error: string | null } {
  const out = {} as Record<string, unknown>;
  for (const s of SPECS) {
    const raw = d[s.key].trim();
    if (s.kind === 'tri') out[s.key] = raw === '' ? null : raw === 'true';
    else if (s.kind === 'enum') out[s.key] = raw === '' ? null : raw;
    else if (s.kind === 'list') {
      const orig = original[s.key];
      // 비웠고 원래 빈 목록이었으면 빈 목록(제한 없음)을 지킨다 · 원래 모름이면 모름
      out[s.key] = raw === '' ? (Array.isArray(orig) && orig.length === 0 ? [] : null) : raw.split(',').map((x) => x.trim()).filter(Boolean);
    } else {
      if (raw === '') out[s.key] = null;
      else {
        const n = Number(raw);
        if (!Number.isFinite(n)) return { fields: original, error: `${s.label}에 숫자를 적어 주세요.` };
        if (s.key === 'maxWeightKg' && (n <= 0 || !/^\d{1,3}(\.\d{1,2})?$/.test(raw))) return { fields: original, error: '체중 제한은 0보다 크고 소수 둘째 자리까지입니다.' };
        if (s.key === 'maxCount' && (!Number.isInteger(n) || n < 1)) return { fields: original, error: '마릿수 제한은 1 이상의 정수입니다.' };
        if (s.key === 'extraFeeAmount' && (!Number.isInteger(n) || n < 0)) return { fields: original, error: '추가 요금은 0 이상의 정수입니다.' };
        out[s.key] = n;
      }
    }
  }
  return { fields: out as PolicyFields, error: null };
}

/** 명세서 19장 조건 정정 — 17장에서 오면 정정 뒤 그 제보의 승인을 묻는다 */
export function PoliciesAdminPage() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const placeId = sp.get('placeId');
  const reportId = sp.get('reportId');
  const profile = useProfile();
  const pets = usePets();
  const myPet = (pets.data ?? []).find((p) => p.petId === profile.data?.defaultPetId) ?? pets.data?.[0];

  const place = useQuery({ queryKey: ['place', placeId], queryFn: () => placesApi.detail(placeId!), enabled: Boolean(placeId), staleTime: 30_000 });
  const policy = useQuery({ queryKey: ['adminPolicy', placeId], queryFn: () => adminPoliciesApi.get(placeId!), enabled: Boolean(placeId), staleTime: 0 });
  const conflicts = useQuery({ queryKey: ['placeConflicts', placeId], queryFn: () => placesApi.conflicts(placeId!), enabled: Boolean(placeId), staleTime: 30_000 });
  // 판정 배지는 petIds 가 필요 — 관리자의 대표 반려동물로, 없으면 숨김 (대조표 4/4 안 12)
  const verdict = useQuery({
    queryKey: ['placeVerdict', placeId, myPet ? [myPet.petId] : []],
    queryFn: () => placesApi.verdict(placeId!, [myPet!.petId]),
    enabled: Boolean(placeId && myPet),
    staleTime: 30_000,
  });

  const [draft, setDraft] = useState<Draft | null>(null);
  const [source, setSource] = useState<'MANUAL' | 'OWNER'>('MANUAL');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);

  useEffect(() => {
    if (policy.data) {
      setDraft(toDraft(policy.data.fields));
      setSource(policy.data.correction?.source ?? 'MANUAL');
    }
  }, [policy.data]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['adminPolicy', placeId] });
    void queryClient.invalidateQueries({ queryKey: ['placeConflicts', placeId] });
    void queryClient.invalidateQueries({ queryKey: ['placeVerdict', placeId] });
  };

  const save = useMutation({
    mutationFn: (fields: PolicyFields) => adminPoliciesApi.manual(placeId!, { source, reason: reason.trim(), fields }),
    onSuccess: (res) => {
      queryClient.setQueryData(['adminPolicy', placeId], res);
      refresh();
      setMsg({ ok: true, text: '정정을 저장했습니다. 판정에 곧 반영됩니다.' });
      if (reportId) setApproveOpen(true);
    },
    onError: (e) =>
      setMsg({
        ok: false,
        text:
          isApiError(e, 'POLICY_OWNER_CORRECTION_EXISTS') ? '업장 확인 정정이 이미 있어 관리자 확인으로 덮을 수 없습니다. 출처를 업장 확인으로 바꿔 주세요.'
          : isApiError(e, 'POLICY_SOURCE_NOT_ALLOWED') ? '정정 출처는 관리자 확인이나 업장 확인만 쓸 수 있습니다.'
          : isApiError(e, 'VALIDATION_FAILED') ? (e.fieldErrors[0]?.message ?? '적은 값을 다시 확인해 주세요.')
          : commonMessage(e),
      }),
  });
  const remerge = useMutation({
    mutationFn: () => adminPoliciesApi.remerge(placeId!),
    onSuccess: () => {
      refresh();
      setMsg({ ok: true, text: '정정 없이 병합만 다시 했습니다.' });
    },
    onError: (e) => setMsg({ ok: false, text: commonMessage(e) }),
  });

  const submit = () => {
    if (!draft || !policy.data) return;
    setMsg(null);
    if (!reason.trim()) return setMsg({ ok: false, text: '정정하는 까닭을 적어 주세요.' });
    const { fields, error } = fromDraft(draft, policy.data.fields);
    if (error) return setMsg({ ok: false, text: error });
    save.mutate(fields);
  };

  const control = 'h-10 w-full rounded-[0.625rem] border border-line bg-field px-3 text-[0.875rem] text-ink outline-none focus:border-brand focus-visible:outline-none';

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.875rem] font-bold tracking-[-0.01em] text-ink">조건 정정</h1>
          <p className="mt-1 text-[0.9375rem] text-sub">소스끼리 어긋난 동반 조건을 확인하고 관리자 확인으로 바로잡습니다. 저장하면 판정이 다시 계산됩니다.</p>
        </div>
        <PlacePicker onPick={(id) => setSp({ placeId: id })} />
      </div>

      {!placeId ? (
        <p className="mt-6 rounded-2xl bg-white px-6 py-12 text-center text-[0.9375rem] text-sub shadow-card">정정할 장소를 오른쪽 위에서 찾아 주세요.</p>
      ) : (
        <>
          <div className="mt-6 rounded-2xl bg-white px-7 py-5 shadow-card">
            <p className="text-[0.8125rem] font-semibold text-sub">대상 장소</p>
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <Link to={`/places/${placeId}`} className="text-[1.25rem] font-bold text-ink hover:underline">
                {place.data?.name ?? '…'}
              </Link>
              {verdict.data?.verdicts[0] && myPet && <VerdictBadge verdict={verdict.data.verdicts[0].verdict} prefix={myPet.name} />}
              {conflicts.data && conflicts.data.length > 0 && (
                <span className="rounded-md bg-cond-soft px-2 py-0.5 text-[0.75rem] font-semibold text-cond">어긋난 값 {conflicts.data.length}건</span>
              )}
              {policy.data?.correction && (
                <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[0.75rem] font-semibold text-brand-strong">
                  {SOURCE_LABEL[policy.data.correction.source]} · {formatDateKo(policy.data.correction.correctedAt)}
                </span>
              )}
            </div>
            {policy.data?.correction && <p className="mt-1.5 text-[0.8125rem] text-sub">지난 정정의 까닭: {policy.data.correction.reason}</p>}
          </div>

          <div className="mt-5 rounded-2xl bg-white px-7 py-5 shadow-card">
            <h2 className="text-[1.125rem] font-bold text-ink">소스끼리 어긋난 값</h2>
            {conflicts.isPending ? (
              <div className="mt-3 h-16 animate-pulse rounded-xl bg-[#efe9dd]" />
            ) : !conflicts.data || conflicts.data.length === 0 ? (
              <p className="mt-2 text-[0.875rem] text-sub">어긋난 값이 없습니다.</p>
            ) : (
              <table className="mt-3 w-full text-left text-[0.875rem]">
                <thead>
                  <tr className="border-b border-line text-[0.8125rem] text-faint">
                    <th className="py-2 pr-4 font-medium">항목</th>
                    <th className="py-2 pr-4 font-medium">출처</th>
                    <th className="py-2 font-medium">적힌 값</th>
                  </tr>
                </thead>
                <tbody>
                  {conflicts.data.flatMap((c) =>
                    c.sourceValues.map((v, i) => (
                      <tr key={`${c.fieldName}-${i}`} className="border-b border-line/60 last:border-0">
                        <td className="py-2 pr-4 font-semibold text-ink">{i === 0 ? c.label : ''}</td>
                        <td className="py-2 pr-4 text-sub">{SOURCE_LABEL[v.source] ?? v.source}</td>
                        <td className="py-2 text-ink">{v.value ?? '비어 있음'}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-5 rounded-2xl bg-white px-7 py-6 shadow-card">
            <h2 className="text-[1.125rem] font-bold text-ink">정정 입력</h2>
            <p className="mt-0.5 text-[0.8125rem] text-sub">지금 병합된 값으로 채워 둡니다. 참 · 거짓 칸의 「모름」 과 비운 칸은 이 정정에서 정하지 않은 값입니다.</p>
            {!draft ? (
              <div className="mt-4 h-40 animate-pulse rounded-xl bg-[#efe9dd]" />
            ) : (
              <>
                <div className="mt-4 grid grid-cols-[10rem_minmax(0,1fr)] gap-3">
                  <label className="text-[0.875rem] font-semibold text-ink" htmlFor="corr-source">
                    출처
                  </label>
                  <select id="corr-source" className={control} value={source} onChange={(e) => setSource(e.target.value as 'MANUAL' | 'OWNER')}>
                    <option value="MANUAL">관리자 확인</option>
                    <option value="OWNER">업장 확인</option>
                  </select>
                  <label className="text-[0.875rem] font-semibold text-ink" htmlFor="corr-reason">
                    까닭
                  </label>
                  <textarea
                    id="corr-reason"
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="예) 업장에 전화로 확인 — 10kg 이하만 동반 가능"
                    className={`${control} h-auto resize-none py-2 leading-relaxed`}
                  />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3.5 border-t border-line pt-5">
                  {SPECS.map((s) => (
                    <div key={s.key} className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-center gap-3">
                      <span className="text-[0.875rem] font-semibold text-ink">{s.label}</span>
                      {s.kind === 'tri' ? (
                        <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={s.label}>
                          {([['true', s.yes], ['false', s.no], ['', '모름']] as [string, string][]).map(([v, l]) => (
                            <button
                              key={v || 'unknown'}
                              type="button"
                              role="radio"
                              aria-checked={draft[s.key] === v}
                              onClick={() => setDraft({ ...draft, [s.key]: v })}
                              className={`h-9 rounded-lg border text-[0.8125rem] font-semibold ${
                                draft[s.key] === v ? 'border-brand-strong bg-brand-strong text-white' : 'border-line bg-white text-ink hover:bg-field'
                              }`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      ) : s.kind === 'enum' ? (
                        <select className={control} value={draft[s.key]} onChange={(e) => setDraft({ ...draft, [s.key]: e.target.value })}>
                          <option value="">모름</option>
                          {s.options!.map(([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className={control}
                          value={draft[s.key]}
                          inputMode={s.kind === 'number' ? 'decimal' : undefined}
                          placeholder={s.hint}
                          onChange={(e) => setDraft({ ...draft, [s.key]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            {msg && (
              <p role={msg.ok ? 'status' : 'alert'} className={`mt-5 rounded-[0.625rem] px-3.5 py-2.5 text-[0.8125rem] ${msg.ok ? 'bg-brand-soft text-brand-strong' : 'bg-alert-soft text-alert'}`}>
                {msg.text}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" disabled={remerge.isPending || !policy.data} onClick={() => remerge.mutate()}>
                재병합만 실행
              </Button>
              <Button variant="strong" size="lg" className="w-[10rem]" disabled={save.isPending || !draft} onClick={submit}>
                {save.isPending ? '저장하는 중' : '정정 저장'}
              </Button>
            </div>
          </div>
        </>
      )}

      {approveOpen && reportId && (
        <ApproveReportModal
          reportId={reportId}
          onClose={() => setApproveOpen(false)}
          onDone={() => {
            setApproveOpen(false);
            navigate('/admin');
          }}
        />
      )}
    </section>
  );
}

/** 19장 팝업 — 정정한 김에 그 제보를 승인한다. 메모는 필수라 칸을 둔다 (그림에는 없음 · 대조표 4/4 안 13) */
function ApproveReportModal({ reportId, onClose, onDone }: { reportId: string; onClose: () => void; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [memo, setMemo] = useState('동반 조건을 확인해 바로잡았습니다. 알려 주셔서 고맙습니다.');
  const [error, setError] = useState<string | null>(null);
  const approve = useMutation({
    mutationFn: () => adminReportsApi.resolve(reportId, { status: 'ACCEPTED', memo: memo.trim() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      onDone();
    },
    onError: (e) => setError(isApiError(e, 'REPORT_ALREADY_RESOLVED') ? '이미 처리된 제보입니다.' : commonMessage(e)),
  });
  return (
    <Modal
      title="이 제보도 승인할까요?"
      size="md"
      onClose={onClose}
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            나중에
          </Button>
          <Button variant="strong" disabled={approve.isPending || !memo.trim()} onClick={() => approve.mutate()}>
            승인하기
          </Button>
        </>
      }
    >
      <p>정정을 저장했습니다. 이 정정의 계기가 된 제보를 승인하면 보낸 사람에게 결과가 알림으로 갑니다.</p>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-[0.8125rem] font-semibold text-ink">처리 메모 (보낸 사람에게 답변으로 보임)</span>
        <textarea
          rows={3}
          maxLength={500}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="w-full resize-none rounded-[0.625rem] border border-line bg-field px-3 py-2 text-[0.875rem] leading-relaxed text-ink outline-none focus:border-brand focus-visible:outline-none"
        />
      </label>
      {error && <p className="mt-2 text-[0.8125rem] text-alert">{error}</p>}
    </Modal>
  );
}
