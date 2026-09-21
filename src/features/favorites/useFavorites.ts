import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { favoritesApi } from '@/api/favorites';
import { qk } from '@/api/keys';
import type { FavoriteCard } from '@/api/types';

/**
 * 즐겨찾기 하트 — 카드 응답에 담김 여부가 없어 목록을 한 번 불러 placeId 모음으로 쓴다 (대조표 2/4 1-3).
 * 누르면 먼저 바꾸고 실패하면 되돌린다.
 */
export function useFavorites() {
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: qk.favorites, queryFn: favoritesApi.list, staleTime: 60_000, retry: false });
  const ids = useMemo(() => new Set((list.data ?? []).map((f) => f.placeId)), [list.data]);

  const mutation = useMutation({
    mutationFn: ({ placeId, on }: { placeId: string; on: boolean }) =>
      on ? favoritesApi.add(placeId) : favoritesApi.remove(placeId),
    onMutate: async ({ placeId, on }) => {
      await queryClient.cancelQueries({ queryKey: qk.favorites });
      const previous = queryClient.getQueryData<FavoriteCard[]>(qk.favorites);
      const base = previous ?? [];
      const next: FavoriteCard[] = on
        ? [
            ...base,
            {
              placeId,
              name: '',
              placeType: 'ETC',
              imageUrl: null,
              verdict: null,
              requiredItems: [],
              ratingAvg: null,
              memo: null,
              createdAt: new Date().toISOString(),
            },
          ]
        : base.filter((f) => f.placeId !== placeId);
      queryClient.setQueryData(qk.favorites, next);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(qk.favorites, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.favorites });
      void queryClient.invalidateQueries({ queryKey: qk.recentAll });
      // 마이페이지 위의 즐겨찾기 수가 바로 따라오도록
      void queryClient.invalidateQueries({ queryKey: qk.profile });
    },
  });

  const toggle = useCallback(
    (placeId: string, current: boolean) => mutation.mutate({ placeId, on: !current }),
    [mutation],
  );

  // 낙관적으로 넣은 자리(이름이 빈 것)는 목록 화면에 보이지 않게 한다
  const cards = useMemo(() => (list.data ?? []).filter((f) => f.name), [list.data]);
  return { ids, loaded: list.isSuccess, toggle, cards, status: list.status, refetch: list.refetch };
}
