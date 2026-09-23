import { useInfiniteQuery } from '@tanstack/react-query';
import { MessageSquareText } from 'lucide-react';
import { Link } from 'react-router';
import { reportsApi } from '@/api/reports';
import type { ReportCard, ReportStatus } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { formatDateKo } from '@/lib/format';
import { REPORT_STATUS_LABEL, REPORT_TYPE_LABEL, reportFieldLabel } from '@/lib/labels';

const STATUS_TONE: Record<ReportStatus, string> = {
  PENDING: 'bg-[#f3efe6] text-sub',
  ACCEPTED: 'bg-ok-soft text-ok',
  REJECTED: 'bg-no-soft text-no',
};

// 유형마다 보낸 칸이 다르다 (2/4 2-3) — 보낸 것만 한 줄로
function detailOf(r: ReportCard): string | null {
  if ((r.reportType === 'INFO_WRONG' || r.reportType === 'CONDITION_WRONG') && r.fieldName) {
    return `${reportFieldLabel(r.fieldName)}${r.reportedValue ? ` → ${r.reportedValue}` : ''}`;
  }
  if (r.reportType === 'PLACE_MERGED_WRONG' && r.reportedValue) return `잘못 합쳐진 장소: ${r.reportedValue}`;
  if (r.reportedValue) return `맞는 값: ${r.reportedValue}`;
  return null;
}

/** 문의 내역 — 그림이 없어 대조표 4/4 1-4 의 (안) 대로. 처리되면 관리자 메모를 「답변」 으로 */
export function InquiriesPage() {
  const list = useInfiniteQuery({
    queryKey: ['reports', 'mine'],
    queryFn: ({ pageParam }) => reportsApi.mine(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page.number + 1 < last.page.totalPages ? last.page.number + 1 : undefined),
    staleTime: 15_000,
  });
  const items = (list.data?.pages ?? []).flatMap((p) => p.content);

  return (
    <section>
      <h1 className="text-[1.875rem] font-bold tracking-[-0.01em] text-ink">문의 내역</h1>
      <p className="mt-1 text-[0.9375rem] text-sub">보낸 제보와 처리 결과예요.</p>

      <div className="mt-6 space-y-4">
        {list.isPending ? (
          [0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-[#efe9dd]" />)
        ) : list.isError ? (
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-white/60 px-6 py-8">
            <p className="text-[0.9375rem] text-sub">문의 내역을 불러오지 못했습니다.</p>
            <Button variant="outline" onClick={() => void list.refetch()}>
              다시 불러오기
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center shadow-card">
            <span className="grid size-16 place-items-center rounded-full bg-[#eef1ec]">
              <MessageSquareText className="size-7 text-brand-strong" aria-hidden />
            </span>
            <p className="mt-4 text-[1.0625rem] font-bold text-ink">보낸 문의가 없습니다</p>
            <p className="mt-1 text-[0.875rem] text-sub">장소 정보가 틀렸다면 장소 상세의 [정보가 틀렸어요] 로 알려 주세요.</p>
          </div>
        ) : (
          items.map((r) => {
            const detail = detailOf(r);
            return (
              <article key={r.reportId} className="rounded-2xl bg-white px-7 py-6 shadow-card">
                <header className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2">
                      <span className="shrink-0 rounded-md bg-[#f1efe9] px-2 py-0.5 text-[0.75rem] font-semibold text-sub">{REPORT_TYPE_LABEL[r.reportType]}</span>
                      {r.placeName && (
                        <Link to={`/places/${r.placeId}`} className="truncate text-[1.0625rem] font-bold text-ink hover:underline">
                          {r.placeName}
                        </Link>
                      )}
                    </p>
                    <p className="mt-1 text-[0.8125rem] text-faint">
                      {formatDateKo(r.createdAt)} 보냄{r.visitedAt ? ` · ${formatDateKo(r.visitedAt)} 방문` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2.5 py-1 text-[0.8125rem] font-semibold ${STATUS_TONE[r.status]}`}>{REPORT_STATUS_LABEL[r.status]}</span>
                </header>
                {detail && <p className="mt-3 text-[0.875rem] font-semibold text-ink">{detail}</p>}
                <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-[1.7] text-ink">{r.content}</p>
                {r.memo && (
                  <div className="mt-4 rounded-xl bg-[#f3f6f3] px-5 py-4">
                    <p className="text-[0.8125rem] font-bold text-brand-strong">답변{r.reviewedAt ? ` · ${formatDateKo(r.reviewedAt)}` : ''}</p>
                    <p className="mt-1 whitespace-pre-line text-[0.875rem] leading-relaxed text-ink">{r.memo}</p>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
      {list.hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" className="px-8" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
            {list.isFetchingNextPage ? '불러오는 중' : '더 보기'}
          </Button>
        </div>
      )}
    </section>
  );
}
