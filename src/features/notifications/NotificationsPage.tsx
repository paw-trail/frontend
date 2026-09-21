import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellOff } from 'lucide-react';
import { useNavigate } from 'react-router';
import { qk } from '@/api/keys';
import { notificationsApi } from '@/api/notifications';
import type { NotificationCard } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { timeAgo } from '@/lib/format';
import { NOTIF_TYPE_LABEL } from '@/lib/labels';
import { SAMPLE_NOTIFICATION_ID, markSampleRead, useSampleNotification } from './sampleNotification';

const TYPE_TONE = {
  POLICY_CHANGED: 'bg-cond-soft text-cond',
  REPORT_RESOLVED: 'bg-brand-soft text-brand-strong',
} as const;

/**
 * 알림 목록 — 명세서에 그림이 없어 대조표 4/4 1-1 의 (안) 대로 만든 단독 화면.
 * 누르면 읽음 처리 뒤 조건 변경은 그 장소로, 제보 결과는 문의 내역으로 옮겨 간다.
 */
export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const list = useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    queryFn: ({ pageParam }) => notificationsApi.list(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page.number + 1 < last.page.totalPages ? last.page.number + 1 : undefined),
    staleTime: 10_000,
  });
  const fromServer = (list.data?.pages ?? []).flatMap((p) => p.content);
  // 서버 알림이 하나도 없을 때만 시연용 예시 한 건을 끼운다 (제목에 「테스트 알림」이라 적혀 있다)
  const sample = useSampleNotification(fromServer.length);
  const items = sample ? [sample, ...fromServer] : fromServer;
  const hasUnread = items.some((n) => n.readAt === null);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    void queryClient.invalidateQueries({ queryKey: qk.unreadCount });
  };
  const readAll = useMutation({
    mutationFn: notificationsApi.readAll,
    onSuccess: refresh,
    onSettled: () => markSampleRead(),
  });

  const open = async (n: NotificationCard) => {
    if (n.notificationId === SAMPLE_NOTIFICATION_ID) {
      markSampleRead();
      void queryClient.invalidateQueries({ queryKey: qk.unreadCount });
      return;
    }
    if (n.readAt === null) {
      await notificationsApi.read(n.notificationId).catch(() => undefined);
      refresh();
    }
    if (n.notifType === 'POLICY_CHANGED' && n.placeId) navigate(`/places/${n.placeId}`);
    else navigate('/mypage/inquiries');
  };

  return (
    <main className="mx-auto w-[56rem] max-w-full px-4 pb-16 pt-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[1.875rem] font-bold tracking-[-0.01em] text-ink">알림</h1>
          <p className="mt-1 text-[0.9375rem] text-sub">담아 둔 장소의 조건이 바뀌거나 보낸 제보가 처리되면 알려 드립니다.</p>
        </div>
        <Button variant="outline" disabled={!hasUnread || readAll.isPending} onClick={() => readAll.mutate()}>
          모두 읽음
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {list.isPending ? (
          [0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#efe9dd]" />)
        ) : list.isError ? (
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-white/60 px-6 py-8">
            <p className="text-[0.9375rem] text-sub">알림을 불러오지 못했습니다.</p>
            <Button variant="outline" onClick={() => void list.refetch()}>
              다시 불러오기
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center shadow-card">
            <span className="grid size-16 place-items-center rounded-full bg-[#eef1ec]">
              <BellOff className="size-7 text-brand-strong" aria-hidden />
            </span>
            <p className="mt-4 text-[1.0625rem] font-bold text-ink">새 알림이 없습니다</p>
            <p className="mt-1 text-[0.875rem] text-sub">즐겨찾기 · 일정에 담은 장소의 조건이 바뀌거나 제보가 처리되면 알려 드립니다.</p>
          </div>
        ) : (
          items.map((n) => {
            const unread = n.readAt === null;
            return (
              <button
                key={n.notificationId}
                type="button"
                onClick={() => void open(n)}
                className={`flex w-full items-start gap-4 rounded-2xl px-6 py-5 text-left shadow-card transition-colors ${
                  unread ? 'bg-[#f2f6f2] hover:bg-[#ebf1ec]' : 'bg-white hover:bg-field'
                }`}
              >
                <span className={`mt-2 size-2.5 shrink-0 rounded-full ${unread ? 'bg-brand' : 'bg-transparent'}`} aria-label={unread ? '안 읽음' : undefined} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-[0.75rem] font-semibold ${TYPE_TONE[n.notifType]}`}>{NOTIF_TYPE_LABEL[n.notifType]}</span>
                    {n.placeName && <span className="truncate text-[0.8125rem] text-sub">{n.placeName}</span>}
                    <span className="ml-auto shrink-0 text-[0.8125rem] text-faint">{timeAgo(n.createdAt)}</span>
                  </span>
                  <span className={`mt-1.5 block text-[1rem] text-ink ${unread ? 'font-bold' : 'font-semibold'}`}>{n.title}</span>
                  <span className="mt-0.5 block text-[0.875rem] leading-relaxed text-sub">{n.body}</span>
                </span>
              </button>
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
    </main>
  );
}
