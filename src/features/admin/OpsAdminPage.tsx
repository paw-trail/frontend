import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { adminIngestApi, adminSearchApi, type IngestRun, type IngestSource } from '@/api/admin';
import { commonMessage, isApiError } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { nowLocalIso } from '@/lib/geo';

// 마지막 실행을 읽을 API 가 없어 이 브라우저에서 누른 때만 적는다 (대조표 4/4 안 15)
const KEY = 'pawtrail.admin.reindexAt';
const at = (iso: string) => iso.slice(0, 16).replace('T', ' ');

const SOURCE_NAME: Record<string, string> = {
  PET_TOUR: '반려동물 동반여행',
  GOCAMPING: '고캠핑',
  CULTURE_CSV: '한국문화정보원 CSV',
  MOIS_VET: '행정안전부 동물병원 CSV',
};
const RUN_TYPE_NAME: Record<string, string> = { INCREMENTAL: '증분', FULL: '전량', LINK: '장소 연결', DIRECT: '직접 적재' };
const STATUS_VIEW: Record<IngestRun['status'], { label: string; tone: string }> = {
  RUNNING: { label: '도는 중', tone: 'bg-brand-soft text-brand-strong' },
  DONE: { label: '끝남', tone: 'bg-ok-soft text-ok' },
  FAILED: { label: '실패', tone: 'bg-alert-soft text-alert' },
  QUOTA_STOPPED: { label: '한도 도달', tone: 'bg-cond-soft text-cond' },
};

function took(r: IngestRun): string {
  if (!r.finishedAt) return '—';
  const sec = Math.max(0, Math.round((new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000));
  return sec >= 60 ? `${Math.floor(sec / 60)}분 ${sec % 60}초` : `${sec}초`;
}

/**
 * 공사 데이터 최신 수집 — 한국관광공사 OpenAPI 를 그 자리에서 호출해 바뀐 원문을 가져온다.
 * 표의 「부른 기능」은 실행 중에 실제로 호출한 OpenAPI 기능과 처리 건수다.
 */
function IngestCard() {
  const queryClient = useQueryClient();
  const [source, setSource] = useState<IngestSource>('PET_TOUR');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const runs = useQuery({
    queryKey: ['admin', 'ingest', 'runs'],
    queryFn: () => adminIngestApi.runs(10),
    // 도는 수집이 있으면 3초마다 다시 읽어 진행을 보여 준다
    refetchInterval: (q) => (q.state.data?.runs.some((r) => r.status === 'RUNNING') ? 3000 : false),
  });

  const run = useMutation({
    mutationFn: () => adminIngestApi.run(source),
    onMutate: () => setMsg(null),
    onSuccess: () => {
      setMsg({ ok: true, text: '수집을 시작했습니다. 한국관광공사 OpenAPI 를 호출하고 있어요.' });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ingest', 'runs'] });
    },
    onError: (e) =>
      setMsg({
        ok: false,
        text: isApiError(e, 'INGEST_ALREADY_RUNNING') ? '이미 수집이 돌고 있습니다. 끝난 뒤 다시 눌러 주세요.' : commonMessage(e),
      }),
  });

  const list = runs.data?.runs ?? [];

  return (
    <div className="mt-5 rounded-2xl bg-white px-7 py-6 shadow-card">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[1.125rem] font-bold text-ink">공사 데이터 최신 수집</p>
          <p className="mt-1 text-[0.875rem] text-sub">
            {/* 예약 실행(매일 04:00 증분)은 백엔드에 붙인 뒤 이 문장에 덧붙인다 */}
            한국관광공사 OpenAPI 를 지금 바로 호출해 바뀐 원문을 가져옵니다.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {(['PET_TOUR', 'GOCAMPING'] as IngestSource[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={source === s}
              onClick={() => setSource(s)}
              className={`h-10 rounded-xl border px-4 text-[0.875rem] font-semibold transition-colors ${
                source === s ? 'border-brand-strong bg-brand-strong text-white' : 'border-line bg-white text-ink hover:bg-field'
              }`}
            >
              {s === 'PET_TOUR' ? '반려동물 동반여행 · 증분' : '고캠핑 · 목록'}
            </button>
          ))}
          <Button variant="strong" className="h-10 px-5" disabled={run.isPending} onClick={() => run.mutate()}>
            최신 수집 실행
          </Button>
        </div>
      </div>

      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`mt-4 rounded-[0.625rem] px-3.5 py-2.5 text-[0.8125rem] ${msg.ok ? 'bg-brand-soft text-brand-strong' : 'bg-alert-soft text-alert'}`}>
          {msg.text}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <p className="text-[0.9375rem] font-bold text-ink">실행 기록</p>
        <button type="button" onClick={() => void runs.refetch()} className="flex items-center gap-1 text-[0.8125rem] text-sub hover:text-ink">
          <RefreshCw className="size-3.5" aria-hidden /> 새로고침
        </button>
      </div>
      {runs.isPending ? (
        <div className="mt-3 h-24 animate-pulse rounded-xl bg-[#efe9dd]" />
      ) : runs.isError ? (
        <p className="mt-3 text-[0.875rem] text-alert">{commonMessage(runs.error)}</p>
      ) : list.length === 0 ? (
        <p className="mt-3 rounded-xl bg-field px-5 py-6 text-center text-[0.875rem] text-sub">아직 수집 기록이 없습니다.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-[0.8125rem]">
            <thead>
              <tr className="border-b border-line text-faint">
                {['시작', '소스', '방식', '상태', '받은 건수', '바뀐 원문', '부른 기능', '걸린 시간'].map((h) => (
                  <th key={h} className="whitespace-nowrap py-2 pr-4 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b border-line/70 align-top last:border-0">
                  <td className="whitespace-nowrap py-2.5 pr-4 text-sub">{at(r.startedAt)}</td>
                  <td className="whitespace-nowrap py-2.5 pr-4 font-semibold text-ink">{SOURCE_NAME[r.source] ?? r.source}</td>
                  <td className="whitespace-nowrap py-2.5 pr-4 text-sub">{RUN_TYPE_NAME[r.runType] ?? r.runType}</td>
                  <td className="whitespace-nowrap py-2.5 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-[0.75rem] font-semibold ${STATUS_VIEW[r.status]?.tone ?? ''}`} title={r.errorMessage ?? undefined}>
                      {STATUS_VIEW[r.status]?.label ?? r.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-ink">{r.fetchedCount.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-ink">{r.changedCount.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-sub">
                    {r.progress && Object.keys(r.progress).length
                      ? Object.entries(r.progress)
                          .map(([op, v]) => `${op} ${v.count.toLocaleString()}`)
                          .join(' · ')
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-sub">{took(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * 명세서 21장 운영 — 공사 데이터 최신 수집, 검색 색인 재구축과 후기 삭제 안내.
 * 판정 캐시 카드는 verdict 에 관리자 API 가 없어 뺐다 (대조표 4/4 안 14).
 */
export function OpsAdminPage() {
  const [last, setLast] = useState<string | null>(() => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  });
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const reindex = useMutation({
    mutationFn: adminSearchApi.reindex,
    onMutate: () => setMsg(null),
    onSuccess: (res) => {
      const startedAt = res?.startedAt ?? nowLocalIso();
      try {
        localStorage.setItem(KEY, startedAt);
      } catch {
        /* 저장소를 못 쓰면 표시만 건너뛴다 */
      }
      setLast(startedAt);
      setConfirm(false);
      setMsg({ ok: true, text: '재구축을 시작했습니다. 뒤에서 돌고 있어요.' });
    },
    onError: (e) => {
      setConfirm(false);
      setMsg({ ok: false, text: isApiError(e, 'REINDEX_ALREADY_RUNNING') ? '이미 재구축이 돌고 있습니다. 끝난 뒤 다시 눌러 주세요.' : commonMessage(e) });
    },
  });

  return (
    <section>
      <h1 className="text-[1.875rem] font-bold tracking-[-0.01em] text-ink">운영</h1>

      <IngestCard />

      <div className="mt-5 w-[22rem] rounded-2xl bg-white px-7 py-6 text-center shadow-card">
        <p className="text-[1.125rem] font-bold text-ink">검색 색인 재구축</p>
        <p className="mt-1.5 text-[0.8125rem] text-faint">매일 04:00 에 저절로 돕니다</p>
        <p className="text-[0.8125rem] text-faint">이 브라우저에서 마지막으로 누른 때: {last ? at(last) : '없음'}</p>
        <Button variant="strong" className="mt-4 w-full" disabled={reindex.isPending} onClick={() => setConfirm(true)}>
          재구축
        </Button>
      </div>
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`mt-4 w-[22rem] rounded-[0.625rem] px-3.5 py-2.5 text-[0.8125rem] ${msg.ok ? 'bg-brand-soft text-brand-strong' : 'bg-alert-soft text-alert'}`}>
          {msg.text}
        </p>
      )}

      <div className="mt-6 flex max-w-[44rem] gap-3 rounded-2xl bg-[#e8eef5] px-6 py-4">
        <Info className="mt-0.5 size-5 shrink-0 text-[#4a6a8a]" aria-hidden />
        <div className="text-[0.875rem] leading-relaxed">
          <p className="font-bold text-ink">후기 삭제는 이 화면에 없습니다</p>
          <p className="text-sub">신고된 후기는 제보 처리에서 승인 · 반려로 다룹니다. 관리자가 직접 발견한 후기는 장소 상세의 후기 카드에서 바로 지웁니다.</p>
        </div>
      </div>

      {confirm && (
        <Modal
          title="검색 색인을 다시 만들까요?"
          onClose={() => setConfirm(false)}
          actions={
            <>
              <Button variant="outline" onClick={() => setConfirm(false)}>
                취소
              </Button>
              <Button variant="strong" disabled={reindex.isPending} onClick={() => reindex.mutate()}>
                재구축
              </Button>
            </>
          }
        >
          모든 장소의 검색 색인을 처음부터 다시 만듭니다. 뒤에서 돌며, 이미 돌고 있으면 새로 시작하지 않습니다.
        </Modal>
      )}
    </section>
  );
}
