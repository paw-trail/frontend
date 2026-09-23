import { useSyncExternalStore } from 'react';
import type { NotificationCard } from '@/api/types';

/**
 * 시연용 예시 알림 한 건.
 *
 * 알림은 담아 둔 장소의 조건이 바뀌거나 제보가 처리돼야 쌓이는데, 갓 만든 계정에는 아무것도 없어
 * 화면이 비어 보인다. 그래서 제목에 「테스트 알림」이라고 분명히 밝힌 예시 한 건을 이 브라우저에만 둔다.
 * 읽음 여부도 이 브라우저에만 남는다. 서버 알림이 한 건이라도 오면 이 예시는 더 이상 보이지 않는다.
 */
const KEY = 'pawtrail.sampleNotification.readAt.v1';

export const SAMPLE_NOTIFICATION_ID = 'sample-notification';

let cache: string | null | undefined;
const listeners = new Set<() => void>();

function readAt(): string | null {
  if (cache === undefined) {
    try {
      cache = window.localStorage.getItem(KEY);
    } catch {
      cache = null;
    }
  }
  return cache ?? null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 예시 알림을 읽음으로 표시한다 */
export function markSampleRead(): void {
  const now = new Date().toISOString();
  cache = now;
  try {
    window.localStorage.setItem(KEY, now);
  } catch {
    // 저장이 막혀도 이번 화면에서는 읽음으로 보인다
  }
  listeners.forEach((l) => l());
}

function build(readAtValue: string | null): NotificationCard {
  const created = new Date(Date.now() - 35 * 60_000).toISOString();
  return {
    notificationId: SAMPLE_NOTIFICATION_ID,
    notifType: 'POLICY_CHANGED',
    placeId: null,
    placeName: null,
    title: '[테스트 알림] 담아 둔 장소의 동반 조건이 바뀌었어요',
    body: '즐겨찾기한 장소의 조건이 바뀌면 이렇게 알려 드립니다. 이 알림은 화면을 보여 주기 위한 예시입니다.',
    readAt: readAtValue,
    createdAt: created,
  };
}

/** 서버 알림이 하나도 없을 때만 보여 줄 예시 알림 (읽음 상태를 따라간다) */
export function useSampleNotification(serverCount: number): NotificationCard | null {
  const readAtValue = useSyncExternalStore(subscribe, readAt, readAt);
  if (serverCount > 0) return null;
  return build(readAtValue);
}

/** 헤더 벨에 더할 안 읽은 수 */
export function useSampleUnread(serverCount: number): number {
  const readAtValue = useSyncExternalStore(subscribe, readAt, readAt);
  return serverCount === 0 && readAtValue === null ? 1 : 0;
}
