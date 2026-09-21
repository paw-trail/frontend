import { useInfiniteQuery, useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { adminReportsApi } from '@/api/admin';
import { commonMessage, isApiError } from '@/api/client';
import type { AdminReportCard, ReportStatus, ReportType } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { isSampleId, resolveSampleReport, sampleCount, useSampleReports } from './sampleAdminData';
import { useStoredReviews } from '@/features/reviews/reviewStore';
import { formatDateKo } from '@/lib/format';
import { REPORT_STATUS_LABEL, REPORT_TYPE_LABEL, reportFieldLabel } from '@/lib/labels';

type Tab = ReportStatus | 'ALL';
const TABS: { key: Tab; label: string }[] = [
  { key: 'PENDING', label: '접수됨' },
  { key: 'ACCEPTED', label: '처리됨' },
  { key: 'REJECTED', label: '반려됨' },
  { key: 'ALL', label: '전체' },
];

const TYPE_TONE: Record<ReportType, string> = {
  INFO_WRONG: 'bg-cond-soft text-cond',
  CONDITION_WRONG: 'bg-brand-soft text-brand-strong',
  PLACE_MERGED_WRONG: 'bg-unknown-soft text-unknown',
  CLOSED: 'bg-no-soft text-no',
  REVIEW_ABUSE: 'bg-alert-soft text-alert',
};

const STATUS_TONE: Record<ReportStatus, string> = {
  PENDING: 'bg-[#f3efe6] text-sub',
  ACCEPTED: 'bg-ok-soft text-ok',
  REJECTED: 'bg-no-soft text-no',
};

const shortId = (id: string) => `${id.slice(0, 8)}-…-${id.slice(-4)}`;

// [정정하러 가기] 는 유형마다 다른 화면으로 (대조표 4/4 3-2)
function fixPath(r: AdminReportCard): string {
  switch (r.reportType) {
    case 'INFO_WRONG':
      return `/admin/places?placeId=${r.placeId}${r.fieldName ? `&field=${r.fieldName}` : ''}`;
    case 'CONDITION_WRONG':
      return `/admin/policies?placeId=${r.placeId}&reportId=${r.reportId}`;
    case 'CLOSED':
      return `/admin/places?placeId=${r.placeId}&field=status`;
    case 'REVIEW_ABUSE':
      return `/places/${r.placeId}#reviews`;
    default:
      return `/admin/places?placeId=${r.placeId}`;
  }
}

/** 명세서 17장 제보 처리 */
export function ReportsAdminPage() {
  const [tab, setTab] = useState<Tab>('PENDING');
  const counts = useQueries({
    queries: TABS.map((t) => ({
      queryKey: ['admin', 'reports', 'count', t.key],
      queryFn: () => adminReportsApi.list(t.key === 'ALL' ? undefined : t.key, 0, 1),
      staleTime: 30_000,
    })),
  });
  const list = useInfiniteQuery({
    queryKey: ['admin', 'reports', 'list', tab],
    queryFn: ({ pageParam }) => adminReportsApi.list(tab === 'ALL' ? undefined : tab, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page.number + 1 < last.page.totalPages ? last.page.number + 1 : undefined),
    staleTime: 10_000,
  });
  const fromServer = (list.data?.pages ?? []).flatMap((p) => p.content);
  // 서버에 제보가 하나도 없을 때만 시연용 예시를 끼운다 (내용에 「테스트 데이터」라고 적혀 있다)
  const serverTotal = counts[TABS.findIndex((t) => t.key === 'ALL')]?.data?.page.totalElements ?? 0;
  const samples = useSampleReports(serverTotal, tab);
  const items = fromServer.length > 0 ? fromServer : samples;
  const showingSamples = fromServer.length === 0 && samples.length > 0;
  const countOf = (i: number) => {
    const real = counts[i].data?.page.totalElements;
    if (real === undefined) return '-';
    if (real > 0 || serverTotal > 0) return real;
    const key = TABS[i].key;
    return sampleCount(key);
  };

  return (
    <section>
      <h1 className="text-[1.875rem] font-bold tracking-[-0.01em] text-ink">제보 처리</h1>
      <p className="mt-1 text-[0.9375rem] text-sub">사용자가 올린 정보 오류를 확인하고 승인하거나 반려합니다. 결과는 알림으로 전달됩니다.</p>

      <div className="mt-5 flex gap-2">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`h-10 rounded-full border px-4 text-[0.875rem] font-semibold transition-colors ${
              tab === t.key ? 'border-brand-strong bg-brand-strong text-white' : 'border-line bg-white text-ink hover:bg-field'
            }`}
          >
            {t.label} ({countOf(i)})
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {showingSamples && (
          <p className="mb-3 rounded-xl border border-dashed border-cond/50 bg-cond-soft/50 px-4 py-2.5 text-[0.8125rem] text-sub">
            아직 들어온 제보가 없어 화면을 보여 주기 위한 <b className="font-semibold text-ink">예시 제보</b>를 띄우고 있습니다. 실제 제보가 들어오면 이 예시는 사라집니다.
          </p>
        )}
        {list.isPending ? (
          [0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-[#efe9dd]" />)
        ) : list.isError ? (
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-white/60 px-6 py-8">
            <p className="text-[0.9375rem] text-sub">{commonMessage(list.error)}</p>
            <Button variant="outline" onClick={() => void list.refetch()}>
              다시 불러오기
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-2xl bg-white px-6 py-12 text-center text-[0.9375rem] text-sub shadow-card">
            {tab === 'PENDING' ? '처리할 제보가 없습니다.' : '해당하는 제보가 없습니다.'}
          </p>
        ) : (
          items.map((r) => <ReportAdminCard key={r.reportId} report={r} />)
        )}
      </div>
      {list.hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" className="px-8" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
            더 보기
          </Button>
        </div>
      )}

      <div className="mt-6 flex gap-3 rounded-2xl border border-cond/30 bg-cond-soft px-6 py-4">
        <Info className="mt-0.5 size-5 shrink-0 text-cond" aria-hidden />
        <div className="text-[0.875rem] leading-relaxed">
          <p className="font-bold text-cond">잘못 병합됨 제보는 입력 폼이 다릅니다</p>
          <p className="text-sub">다른 유형은 어느 칸이 틀렸는지를 묻지만, 이 유형은 어느 장소와 잘못 묶였는지를 묻습니다. 장소 관리에서 묶인 소스를 확인할 수 있습니다.</p>
        </div>
      </div>
    </section>
  );
}

function ReportAdminCard({ report: r }: { report: AdminReportCard }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reviews = useStoredReviews();
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resolve = useMutation({
    mutationFn: (status: 'ACCEPTED' | 'REJECTED') => adminReportsApi.resolve(r.reportId, { status, memo: memo.trim() }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
    onError: (e) =>
      setError(
        isApiError(e, 'REPORT_ALREADY_RESOLVED') ? '이미 처리된 제보입니다.'
        : isApiError(e, 'REPORT_NOT_FOUND') ? '없는 제보입니다.'
        : isApiError(e, 'VALIDATION_FAILED') ? (e.fieldErrors[0]?.message ?? '처리 메모를 다시 확인해 주세요.')
        : commonMessage(e),
      ),
  });

  const submit = (status: 'ACCEPTED' | 'REJECTED') => {
    setError(null);
    if (!memo.trim()) return setError('처리 메모를 적어 주세요. 사용자에게 답변으로 보입니다.');
    if (isSampleId(r.reportId)) {
      resolveSampleReport(r.reportId, status, memo.trim());
      return;
    }
    resolve.mutate(status);
  };

  const review = r.targetReviewId ? reviews.find((x) => x.reviewId === r.targetReviewId) : undefined;
  const pending = r.status === 'PENDING';

  return (
    <article className="grid grid-cols-[minmax(0,1fr)_17rem] gap-6 rounded-2xl bg-white px-6 py-5 shadow-card">
      <div className="min-w-0">
        <p className="flex items-center gap-2">
          <span className={`shrink-0 rounded-md px-2 py-0.5 text-[0.75rem] font-semibold ${TYPE_TONE[r.reportType]}`}>{REPORT_TYPE_LABEL[r.reportType]}</span>
          <span className="truncate text-[1.0625rem] font-bold text-ink">{r.placeName ?? '이름 없는 장소'}</span>
          <span className="shrink-0 text-[0.75rem] text-faint">{shortId(r.placeId)}</span>
        </p>
        {(r.fieldName || r.reportedValue) && (
          <p className="mt-2 text-[0.875rem] text-ink">
            <span className="mr-2 text-faint">고친 값</span>
            {r.fieldName && <b>{reportFieldLabel(r.fieldName)}</b>}
            {r.fieldName && r.reportedValue && ' → '}
            {r.reportedValue && <b>{r.reportedValue}</b>}
          </p>
        )}
        <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink">{r.content}</p>
        {r.reportType === 'REVIEW_ABUSE' && (
          <p className="mt-2 rounded-lg bg-field px-3 py-2 text-[0.8125rem] text-sub">
            {review ? `신고된 후기: "${review.content.slice(0, 80)}${review.content.length > 80 ? '…' : ''}"` : '후기는 쓴 사람의 브라우저에 저장돼 있어, 이 브라우저에서는 내용을 볼 수 없습니다.'}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[0.8125rem] text-faint">
            {r.reporter.nickname ?? '회원'} 보호자{r.visitedAt ? ` · 방문 ${r.visitedAt}` : ''} · {formatDateKo(r.createdAt)} 접수
          </p>
          <button
            type="button"
            disabled={isSampleId(r.reportId)}
            title={isSampleId(r.reportId) ? '예시 제보라 옮겨 갈 장소가 없습니다' : undefined}
            onClick={() => navigate(fixPath(r))}
            className="h-7 shrink-0 rounded-full border border-line px-3 text-[0.75rem] font-semibold text-sub hover:text-ink disabled:opacity-40 disabled:hover:text-sub"
          >
            정정하러 가기
          </button>
        </div>
      </div>

      <div className="border-l border-line pl-6">
        {pending ? (
          <>
            <label className="block">
              <span className="text-[0.8125rem] font-semibold text-sub">처리 메모</span>
              <textarea
                value={memo}
                maxLength={500}
                rows={3}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="사용자에게 답변으로 보입니다"
                className="mt-1.5 w-full resize-none rounded-[0.625rem] border border-line bg-field px-3 py-2 text-[0.875rem] leading-relaxed text-ink outline-none placeholder:text-faint focus:border-brand focus-visible:outline-none"
              />
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="strong" disabled={resolve.isPending} onClick={() => submit('ACCEPTED')}>
                승인
              </Button>
              <Button variant="outline" className="border-[#f0d6d3] text-alert" disabled={resolve.isPending} onClick={() => submit('REJECTED')}>
                반려
              </Button>
            </div>
            {error && <p className="mt-2 text-[0.75rem] text-alert">{error}</p>}
          </>
        ) : (
          <>
            <span className={`inline-block rounded-md px-2.5 py-1 text-[0.8125rem] font-semibold ${STATUS_TONE[r.status]}`}>{REPORT_STATUS_LABEL[r.status]}</span>
            <p className="mt-3 text-[0.8125rem] font-semibold text-sub">처리 메모</p>
            <p className="mt-1 whitespace-pre-line text-[0.875rem] leading-relaxed text-ink">{r.memo}</p>
            {r.reviewedAt && <p className="mt-2 text-[0.75rem] text-faint">{formatDateKo(r.reviewedAt)} 처리</p>}
          </>
        )}
      </div>
    </article>
  );
}
