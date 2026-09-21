import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router';
import { adminPlacesApi, type PlaceAdminUpdateBody } from '@/api/admin';
import { commonMessage, isApiError } from '@/api/client';
import { placesApi } from '@/api/places';
import type { PlaceDetail } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { formatDateKo } from '@/lib/format';
import { applyFieldErrors } from '@/lib/forms';
import { PLACE_FIELD_LABEL, SOURCE_LABEL } from '@/lib/labels';
import { handleSamplePending, isSampleId, useSamplePendings } from './sampleAdminData';
import { PlacePicker } from './PlacePicker';

/** 명세서 18장 장소 관리 — 수정 대기 · 장소 정보 수정 · 묶여 있는 소스 */
export function PlacesAdminPage() {
  const [sp, setSp] = useSearchParams();
  const placeId = sp.get('placeId');
  const field = sp.get('field');

  return (
    <section>
      <h1 className="text-[1.875rem] font-bold tracking-[-0.01em] text-ink">장소 관리</h1>
      <p className="mt-1 text-[0.9375rem] text-sub">수집이 덮지 못한 변경을 승인하고, 장소 정보를 직접 고칩니다. 고친 칸은 다음 수집이 덮지 않습니다.</p>
      <PendingSection />
      <EditSection placeId={placeId} field={field} onPick={(id) => setSp({ placeId: id })} />
    </section>
  );
}

function Card({ title, sub, right, children }: { title: string; sub?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl bg-white px-7 py-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[1.1875rem] font-bold text-ink">{title}</h2>
          {sub && <p className="mt-0.5 text-[0.8125rem] text-sub">{sub}</p>}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function PendingSection() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const list = useInfiniteQuery({
    queryKey: ['admin', 'pending'],
    queryFn: ({ pageParam }) => adminPlacesApi.pending(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page.number + 1 < last.page.totalPages ? last.page.number + 1 : undefined),
    staleTime: 15_000,
  });
  const act = useMutation({
    mutationFn: ({ id, ok }: { id: string; ok: boolean }) => (ok ? adminPlacesApi.approve(id) : adminPlacesApi.reject(id)),
    onMutate: () => setError(null),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'pending'] }),
    onError: (e) =>
      setError(
        isApiError(e, 'PENDING_ALREADY_RESOLVED') ? '이미 처리된 변경입니다.'
        : isApiError(e, 'PENDING_NOT_FOUND') ? '없는 변경입니다. 목록을 새로 불러왔습니다.'
        : commonMessage(e),
      ),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'pending'] }),
  });
  const fromServer = (list.data?.pages ?? []).flatMap((p) => p.content);
  // 서버에 대기 건이 없을 때만 시연용 예시를 보여 준다
  const samples = useSamplePendings(fromServer.length);
  const rows = fromServer.length > 0 ? fromServer : samples;
  const showingSamples = fromServer.length === 0 && samples.length > 0;
  const total = fromServer.length > 0 ? (list.data?.pages[0]?.page.totalElements ?? 0) : samples.length;

  // 예시 행은 서버를 부르지 않고 이 브라우저에서 처리한다
  const handleOrMutate = ({ id, ok }: { id: string; ok: boolean }) => {
    if (isSampleId(id)) {
      handleSamplePending(id);
      return;
    }
    act.mutate({ id, ok });
  };

  return (
    <Card title={`수정 대기 목록${total ? ` (${total})` : ''}`} sub="관리자가 고친 칸을 수집이 다른 값으로 바꾸려 할 때 여기에 쌓입니다.">
      {list.isPending ? (
        <div className="h-24 animate-pulse rounded-xl bg-[#efe9dd]" />
      ) : list.isError ? (
        <p className="text-[0.875rem] text-alert">{commonMessage(list.error)}</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl bg-field px-5 py-6 text-center text-[0.875rem] text-sub">승인을 기다리는 변경이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          {showingSamples && (
            <p className="mb-3 rounded-xl border border-dashed border-cond/50 bg-cond-soft/50 px-4 py-2.5 text-[0.8125rem] text-sub">
              대기 중인 변경이 없어 <b className="font-semibold text-ink">예시</b>를 띄우고 있습니다. 실제 변경이 쌓이면 이 예시는 사라집니다.
            </p>
          )}
          <table className="w-full text-left text-[0.875rem]">
            <thead>
              <tr className="border-b border-line text-[0.8125rem] text-faint">
                {['장소', '칸', '지금 값', '새 값', '출처', '감지', ''].map((h) => (
                  <th key={h} className="py-2 pr-4 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.pendingId} className="border-b border-line/70 align-top last:border-0">
                  <td className="py-3 pr-4 font-semibold text-ink">
                    <Link to={`/admin/places?placeId=${r.placeId}`} className="hover:underline">
                      {r.placeName}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-sub">{PLACE_FIELD_LABEL[r.fieldName] ?? r.fieldName}</td>
                  <td className="max-w-[12rem] py-3 pr-4 text-sub">{r.currentValue ?? '비어 있음'}</td>
                  <td className="max-w-[12rem] py-3 pr-4 font-semibold text-ink">{r.newValue ?? '비어 있음'}</td>
                  <td className="py-3 pr-4 text-sub">{SOURCE_LABEL[r.source] ?? r.source}</td>
                  <td className="whitespace-nowrap py-3 pr-4 text-faint">{formatDateKo(r.detectedAt)}</td>
                  <td className="whitespace-nowrap py-3">
                    <div className="flex gap-1.5">
                      <Button variant="strong" className="h-8 px-3 text-[0.8125rem]" disabled={act.isPending} onClick={() => handleOrMutate({ id: r.pendingId, ok: true })}>
                        승인
                      </Button>
                      <Button variant="outline" className="h-8 px-3 text-[0.8125rem] text-alert" disabled={act.isPending} onClick={() => handleOrMutate({ id: r.pendingId, ok: false }) }>
                        반려
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {error && <p className="mt-3 text-[0.8125rem] text-alert">{error}</p>}
      {list.hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => void list.fetchNextPage()}>
            더 보기
          </Button>
        </div>
      )}
    </Card>
  );
}

type EditForm = {
  name: string;
  tel: string;
  status: 'ACTIVE' | 'CLOSED' | 'UNKNOWN';
  addressRoad: string;
  addressJibun: string;
  homepage: string;
  reservationUrl: string;
  imageUrl: string;
  businessHours: string;
  closedDays: string;
  overview: string;
};
function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.8125rem] font-semibold text-ink">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[0.75rem] text-alert">{error}</span> : hint ? <span className="mt-1 block text-[0.75rem] text-faint">{hint}</span> : null}
    </label>
  );
}

const CLEARABLE = ['tel', 'homepage', 'reservationUrl', 'imageUrl', 'businessHours', 'closedDays', 'overview'] as const;

const toForm = (p: PlaceDetail): EditForm => ({
  name: p.name,
  tel: p.tel ?? '',
  status: p.status,
  addressRoad: '',
  addressJibun: '',
  homepage: p.homepage ?? '',
  reservationUrl: p.reservationUrl ?? '',
  imageUrl: p.imageUrl ?? '',
  businessHours: p.businessHours ?? '',
  closedDays: p.closedDays ?? '',
  overview: p.overview ?? '',
});

function EditSection({ placeId, field, onPick }: { placeId: string | null; field: string | null; onPick: (id: string) => void }) {
  const queryClient = useQueryClient();
  const place = useQuery({ queryKey: ['place', placeId], queryFn: () => placesApi.detail(placeId!), enabled: Boolean(placeId), staleTime: 30_000 });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<EditForm>();

  useEffect(() => {
    if (place.data) reset(toForm(place.data));
    setMsg(null);
  }, [place.data, reset]);

  // 17장에서 넘어온 칸을 강조한다 (제보의 fieldName · 폐업은 status · 주소는 도로명 칸)
  const target = field === 'address' ? 'addressRoad' : field;
  const ring = (name: keyof EditForm) => (target === name ? 'ring-2 ring-cond/60' : '');

  const onSubmit = handleSubmit(async (v) => {
    if (!place.data) return;
    setMsg(null);
    const before = toForm(place.data);
    const body: PlaceAdminUpdateBody = {};
    if (v.name.trim() !== before.name) body.name = v.name.trim();
    if (v.status !== before.status) body.status = v.status;
    for (const k of CLEARABLE) {
      const next = v[k].trim();
      if (next !== before[k].trim()) body[k] = next === '' ? null : next;
    }
    const road = v.addressRoad.trim();
    const jibun = v.addressJibun.trim();
    if (road || jibun) {
      if (!road || !jibun) {
        setMsg({ ok: false, text: '주소를 고칠 때는 도로명과 지번을 함께 적어 주세요.' });
        return;
      }
      body.addressRoad = road;
      body.addressJibun = jibun;
    }
    if (Object.keys(body).length === 0) {
      setMsg({ ok: true, text: '바뀐 내용이 없습니다.' });
      return;
    }
    try {
      const updated = await adminPlacesApi.update(place.data.placeId, body);
      queryClient.setQueryData(['place', place.data.placeId], updated);
      setMsg({ ok: true, text: '저장했습니다. 고친 칸은 다음 수집이 덮지 않습니다.' });
    } catch (e) {
      if (isApiError(e, 'PLACE_ADDRESS_INVALID')) setMsg({ ok: false, text: '주소로 좌표를 찾지 못했습니다. 주소를 다시 확인해 주세요.' });
      else if (!applyFieldErrors(e, setError, ['name', 'tel', 'addressRoad', 'addressJibun', 'businessHours', 'closedDays'])) {
        setMsg({ ok: false, text: isApiError(e, 'VALIDATION_FAILED') ? (e.fieldErrors[0]?.message ?? '적은 값을 다시 확인해 주세요.') : commonMessage(e) });
      }
    }
  });

  const input = 'h-11 w-full rounded-[0.625rem] border border-line bg-field px-3.5 text-[0.9375rem] text-ink outline-none focus:border-brand focus-visible:outline-none';
  return (
    <>
      <Card title="장소 정보 수정" sub="보낸 칸만 바뀝니다. 비운 칸은 지워집니다 (이름 · 영업 상태 · 주소는 지울 수 없음)." right={<PlacePicker onPick={onPick} />}>
        {!placeId ? (
          <p className="rounded-xl bg-field px-5 py-6 text-center text-[0.875rem] text-sub">고칠 장소를 오른쪽 위에서 찾아 주세요.</p>
        ) : place.isPending ? (
          <div className="h-40 animate-pulse rounded-xl bg-[#efe9dd]" />
        ) : place.isError ? (
          <p className="text-[0.875rem] text-alert">{isApiError(place.error, 'PLACE_NOT_FOUND') ? '없는 장소입니다.' : commonMessage(place.error)}</p>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <p className="mb-4 text-[0.875rem] text-sub">
              <Link to={`/places/${place.data.placeId}`} className="font-bold text-ink hover:underline">
                {place.data.name}
              </Link>
              <span className="ml-2 text-faint">{place.data.placeId}</span>
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field error={errors.name?.message} label="이름">
                <input className={`${input} ${ring('name')}`} maxLength={200} {...register('name', { validate: (x) => x.trim() !== '' || '이름은 지울 수 없습니다.' })} />
              </Field>
              <Field error={errors.tel?.message} label="전화번호">
                <input className={`${input} ${ring('tel')}`} maxLength={30} {...register('tel')} />
              </Field>
              <Field error={errors.addressRoad?.message} label="도로명 주소" hint={`지금: ${place.data.address ?? '없음'} · 고칠 때만 두 칸을 함께 적음`}>
                <input className={`${input} ${ring('addressRoad')}`} maxLength={300} placeholder="고칠 때만 적어 주세요" {...register('addressRoad')} />
              </Field>
              <Field error={errors.addressJibun?.message} label="지번 주소">
                <input className={input} maxLength={300} placeholder="도로명과 함께 적어 주세요" {...register('addressJibun')} />
              </Field>
              <Field error={errors.status?.message} label="영업 상태">
                <select className={`${input} ${ring('status')}`} {...register('status')}>
                  <option value="ACTIVE">영업 중</option>
                  <option value="CLOSED">폐업</option>
                  <option value="UNKNOWN">알 수 없음</option>
                </select>
              </Field>
              <Field error={errors.homepage?.message} label="홈페이지">
                <input className={`${input} ${ring('homepage')}`} {...register('homepage')} />
              </Field>
              <Field error={errors.reservationUrl?.message} label="예약 주소">
                <input className={input} {...register('reservationUrl')} />
              </Field>
              <Field error={errors.imageUrl?.message} label="사진 주소">
                <input className={`${input} ${ring('imageUrl')}`} {...register('imageUrl')} />
              </Field>
              <Field error={errors.businessHours?.message} label="영업시간">
                <input className={`${input} ${ring('businessHours')}`} maxLength={600} {...register('businessHours')} />
              </Field>
              <Field error={errors.closedDays?.message} label="휴무일">
                <input className={`${input} ${ring('closedDays')}`} maxLength={200} {...register('closedDays')} />
              </Field>
            </div>
            <div className="mt-4">
              <Field error={errors.overview?.message} label="장소 소개">
                <textarea rows={3} className={`${input} h-auto resize-none py-2.5 leading-relaxed ${ring('overview')}`} {...register('overview')} />
              </Field>
            </div>
            {msg && (
              <p role={msg.ok ? 'status' : 'alert'} className={`mt-4 rounded-[0.625rem] px-3.5 py-2.5 text-[0.8125rem] ${msg.ok ? 'bg-brand-soft text-brand-strong' : 'bg-alert-soft text-alert'}`}>
                {msg.text}
              </p>
            )}
            <div className="mt-5 flex justify-end">
              <Button type="submit" variant="strong" size="lg" className="w-[10rem]" disabled={isSubmitting}>
                {isSubmitting ? '저장하는 중' : '저장'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {place.data && (
        <Card title="묶여 있는 소스" sub="이 장소에 합쳐진 수집 출처입니다.">
          <ul className="divide-y divide-line">
            {place.data.sources.map((s, i) => (
              <li key={`${s.source}-${i}`} className="flex items-center justify-between py-2.5 text-[0.9375rem]">
                <span className="font-semibold text-ink">{s.sourceLabel}</span>
                <span className="text-[0.8125rem] text-faint">{s.source}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg bg-field px-4 py-3 text-[0.8125rem] text-sub">
            잘못 묶인 소스를 떼어 내려면 연결 번호가 필요한데, 지금 서버가 그 번호를 알려 주지 않아 이 화면에서는 목록만 보여 드립니다.
          </p>
        </Card>
      )}
    </>
  );
}
