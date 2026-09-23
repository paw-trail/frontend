import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { commonMessage } from '@/api/client';
import { notificationsApi } from '@/api/notifications';
import type { NotificationSettings } from '@/api/types';
import { Switch } from '@/components/ui/Switch';

const ROWS: { key: keyof NotificationSettings; title: string; body: string }[] = [
  { key: 'policyChanged', title: '동반 조건이 바뀌면 알림', body: '즐겨찾기 · 일정에 담은 장소의 동반 조건이 바뀌면 알려 드립니다.' },
  { key: 'reportResolved', title: '제보가 처리되면 알림', body: '보낸 제보가 처리되면 결과를 알려 드립니다.' },
];

/** 알림 설정 — 그림이 없어 대조표 4/4 1-3 의 (안) 대로. 누른 칸만 보내고, 먼저 바꾸고 실패하면 되돌린다 */
export function NotificationSettingsPage() {
  const queryClient = useQueryClient();
  const key = ['notifications', 'settings'];
  const settings = useQuery({ queryKey: key, queryFn: notificationsApi.settings, staleTime: 60_000 });
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (patch: Partial<NotificationSettings>) => notificationsApi.updateSettings(patch),
    onMutate: async (patch) => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<NotificationSettings>(key);
      if (previous) queryClient.setQueryData(key, { ...previous, ...patch });
      return { previous };
    },
    onError: (e, _patch, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
      setError(commonMessage(e));
    },
    onSuccess: (next) => queryClient.setQueryData(key, next),
  });

  return (
    <section>
      <h1 className="text-[1.875rem] font-bold tracking-[-0.01em] text-ink">알림 설정</h1>
      <p className="mt-1 text-[0.9375rem] text-sub">받을 알림을 고를 수 있어요.</p>

      <div className="mt-6 divide-y divide-line rounded-2xl bg-white shadow-card">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-6 px-7 py-6">
            <div>
              <p className="text-[1.0625rem] font-bold text-ink">{row.title}</p>
              <p className="mt-1 text-[0.875rem] text-sub">{row.body}</p>
            </div>
            {settings.data ? (
              <Switch checked={settings.data[row.key]} label={row.title} onChange={(v) => save.mutate({ [row.key]: v })} />
            ) : (
              <span className="h-8 w-[3.25rem] animate-pulse rounded-full bg-[#efe9dd]" />
            )}
          </div>
        ))}
      </div>
      {(error || settings.isError) && (
        <p role="alert" className="mt-4 rounded-[0.625rem] bg-alert-soft px-3.5 py-2.5 text-[0.8125rem] text-alert">
          {error ?? '알림 설정을 불러오지 못했습니다.'}
        </p>
      )}
    </section>
  );
}
