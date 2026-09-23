import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { qk } from '@/api/keys';
import { searchApi } from '@/api/search';
import { usersApi } from '@/api/users';

// 같은 장소를 곧바로 다시 열어도 한 번만 센다 (개발 모드의 이중 실행도 막음)
const recordedAt = new Map<string, number>();

/**
 * 8장을 열 때 기록한다 — 최근 본 장소(user)와 인기 급상승 점수(search).
 * 둘 다 명세서 표에 없던 호출이다 (대조표 2/4 2-3). 실패해도 화면은 그대로 둔다.
 */
export function useRecordView(placeId: string | undefined) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!placeId) return;
    const last = recordedAt.get(placeId) ?? 0;
    if (Date.now() - last < 60_000) return;
    recordedAt.set(placeId, Date.now());
    usersApi
      .recordRecent(placeId)
      .then(() => queryClient.invalidateQueries({ queryKey: qk.recentAll }))
      .catch(() => undefined);
    searchApi.recordView(placeId).catch(() => undefined);
  }, [placeId, queryClient]);
}
