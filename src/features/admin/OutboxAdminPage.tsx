import { useInfiniteQuery, useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Info, PawPrint } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { OUTBOX_SERVICES, outboxApi, type OutboxKey } from '@/api/admin';
import { commonMessage, isApiError } from '@/api/client';
import { Button } from '@/components/ui/Button';

const at = (iso: string) => iso.slice(0, 16).replace('T', ' ');

/** 명세서 20장 이벤트 재발행 — 서비스 5개의 멈춘 이벤트를 보고 다시 보낸다 */
export function OutboxAdminPage() {
  const queryClient = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const counts = useQueries({
    queries: OUTBOX_SERVICES.map((s) => ({
      queryKey: ['admin', 'outbox', 'count', s.key],
      queryFn: () => outboxApi.list(s.key, 0, 1),
      staleTime: 30_000,
    })),
  });
  // 고른 서비스가 없으면 멈춘 이벤트가 있는 첫 서비스를 연다
  const picked = sp.get('service') as OutboxKey | null;
  const firstBusy = OUTBOX_SERVICES.find((_, i) => (counts[i].data?.page.totalElements ?? 0) > 0)?.key;
  const selected: OutboxKey = picked ?? firstBusy ?? 'accounts';
  const label = OUTBOX_SERVICES.find((s) => s.key === selected)!.label;

  const list = useInfiniteQuery({
    queryKey: ['admin', 'outbox', 'list', selected],
    queryFn: ({ pageParam }) => outboxApi.list(selected, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page.number + 1 < last.page.totalPages ? last.page.number + 1 : undefined),
    staleTime: 10_000,
  });
  const rows = (list.data?.pages ?? []).flatMap((p) => p.content);
  const total = list.data?.pages[0]?.page.totalElements ?? 0;

  const [rowError, setRowError] = useState<Record<string, string>>({});
  const retry = useMutation({
    mutationFn: (id: string) => outboxApi.retry(selected, id),
    onMutate: (id) => setRowError((m) => ({ ...m, [id]: '' })),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'outbox'] }),
    onError: (e, id) =>
      setRowError((m) => ({
        ...m,
        [id]: isApiError(e, 'OUTBOX_REPUBLISH_FAILED') ? '다시 보내지 못했습니다. 카프카가 떠 있는지 확인한 뒤 다시 눌러 주세요.' : commonMessage(e),
      })),
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'outbox'] });

  return (
    <section>
      <h1 className="text-[1.875rem] font-bold tracking-[-0.01em] text-ink">이벤트 재발행</h1>
      <p className="mt-1 text-[0.9375rem] text-sub">발행이 끝내 실패해 자동 재시도가 멈춘 이벤트입니다. 목록이 비어 있다면 손댈 것이 없습니다.</p>

      <div className="mt-5 grid grid-cols-5 gap-3">
        {OUTBOX_SERVICES.map((s, i) => {
          const n = counts[i].data?.page.totalElements;
          const on = s.key === selected;
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={on}
              onClick={() => setSp({ service: s.key })}
              className={`rounded-2xl bg-white px-5 py-4 text-left shadow-card transition-shadow ${on ? 'ring-2 ring-brand-strong' : 'hover:ring-1 hover:ring-line'}`}
            >
              <p className="text-[0.9375rem] font-bold text-ink">{s.label}</p>
              <p className="text-[0.75rem] text-faint">/{s.key}</p>
              <p className="mt-2 flex items-end justify-between">
                <span>
                  <b className={`text-[2rem] leading-none ${n ? 'text-alert' : 'text-faint'}`}>{n ?? '-'}</b>
                  <span className="ml-1 text-[0.875rem] text-sub">건</span>
                </span>
                <PawPrint className={`size-5 ${n ? 'text-alert/50' : 'text-brand/40'}`} aria-hidden />
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-[1.125rem] font-bold text-ink">
          {label} 서비스에서 멈춘 이벤트 {total > 0 && <span className="text-[0.9375rem] text-alert">{total}건</span>}
        </h2>
        <Button variant="outline" className="h-9" onClick={refresh}>
          새로고침
        </Button>
      </div>

      <div className="mt-3 space-y-3">
        {list.isPending ? (
          [0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#efe9dd]" />)
        ) : list.isError ? (
          <p className="rounded-2xl bg-white px-6 py-8 text-center text-[0.9375rem] text-alert shadow-card">{commonMessage(list.error)}</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-12 text-center shadow-card">
            <PawPrint className="size-8 text-brand/60" aria-hidden />
            <p className="mt-3 text-[1rem] font-bold text-ink">{label} 서비스에는 멈춘 이벤트가 없습니다.</p>
            <p className="mt-1 text-[0.875rem] text-sub">자동 재시도가 모두 성공했다는 뜻입니다.</p>
          </div>
        ) : (
          rows.map((m) => (
            <article key={m.id} className="flex items-center gap-5 rounded-2xl bg-white px-6 py-4 shadow-card">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-unknown-soft px-2 py-0.5 text-[0.75rem] font-semibold text-unknown">{m.topic}</span>
                  <span className="rounded-md bg-alert-soft px-2 py-0.5 text-[0.75rem] font-semibold text-alert">재시도 {m.retryCount}회</span>
                  <span className="text-[0.8125rem] text-faint">생성 {at(m.createdAt)}</span>
                </p>
                <p className="mt-2 truncate text-[0.875rem]">
                  <span className="mr-3 text-faint">대상</span>
                  <span className="font-mono font-semibold text-ink">{m.aggregateId}</span>
                  <span className="ml-2 text-faint">{m.aggregateType}</span>
                </p>
                {m.lastError && (
                  <p className="mt-1 truncate text-[0.8125rem]" title={m.lastError}>
                    <span className="mr-3 text-faint">마지막 오류</span>
                    <span className="text-alert">{m.lastError}</span>
                  </p>
                )}
                {rowError[m.id] && <p className="mt-1 text-[0.8125rem] text-alert">{rowError[m.id]}</p>}
              </div>
              <Button variant="strong" className="shrink-0" disabled={retry.isPending && retry.variables === m.id} onClick={() => retry.mutate(m.id)}>
                {retry.isPending && retry.variables === m.id ? '보내는 중' : '다시 보내기'}
              </Button>
            </article>
          ))
        )}
      </div>
      {list.hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => void list.fetchNextPage()}>
            더 보기
          </Button>
        </div>
      )}

      <div className="mt-5 flex gap-3 rounded-2xl border border-line bg-white/70 px-6 py-4">
        <Info className="mt-0.5 size-5 shrink-0 text-sub" aria-hidden />
        <div className="text-[0.875rem] leading-relaxed">
          <p className="font-bold text-ink">이벤트 내용(payload)은 목록에 담기지 않습니다</p>
          <p className="text-sub">재발행에 필요한 것은 식별자뿐이라 목록에는 대상만 보입니다. 내용을 확인해야 하면 카프카에서 직접 봅니다.</p>
        </div>
      </div>
    </section>
  );
}
