import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { VisitCard } from '@/api/types';
import { visitsApi } from '@/api/visits';
import { useFavorites } from '@/features/favorites/useFavorites';
import { useRatingAverages } from '@/features/reviews/reviewStore';
import { Collection } from './Collection';

/**
 * 명세서 15장 방문한 장소 — 방문마다 카드가 오므로 장소마다 가장 최근 방문 1장으로 묶는다 (대조표 3/4 안 17).
 * 배지는 방문 당시 판정, 준비물은 지금의 안내다.
 */
export function VisitedPage() {
  const visits = useQuery({ queryKey: ['visits'], queryFn: visitsApi.list, staleTime: 15_000 });
  const favorites = useFavorites();
  const ratings = useRatingAverages();

  const places = useMemo(() => {
    const byPlace = new Map<string, { latest: VisitCard; count: number }>();
    for (const v of visits.data ?? []) {
      const cur = byPlace.get(v.placeId);
      if (!cur) byPlace.set(v.placeId, { latest: v, count: 1 });
      else byPlace.set(v.placeId, { latest: v.visitedAt > cur.latest.visitedAt ? v : cur.latest, count: cur.count + 1 });
    }
    return [...byPlace.values()].sort((a, b) => b.latest.visitedAt.localeCompare(a.latest.visitedAt));
  }, [visits.data]);

  const items = places.map(({ latest: v, count }) => ({
    placeId: v.placeId,
    name: v.name,
    placeType: v.placeType,
    imageUrl: v.imageUrl,
    verdict: v.verdictAtVisit,
    tags: v.requiredItems,
    note: `${v.visitedAt.slice(0, 10).replace(/-/g, '.')} 방문${count > 1 ? ` · ${count}번` : ''}`,
    rating: ratings.get(v.placeId),
    favorite: favorites.loaded ? favorites.ids.has(v.placeId) : v.isFavorite,
  }));

  return (
    <Collection
      title="방문한 장소"
      subtitle="함께가서 추억을 쌓은 장소예요."
      items={items}
      status={visits.status}
      errorText="방문한 장소를 불러오지 못했습니다."
      emptyTitle="선택하신 카테고리에 방문한 내역이 없습니다."
      emptyHint="일정에서 [다녀왔어요] 를 누르면 여기에 쌓입니다."
      onRetry={() => void visits.refetch()}
      onToggleFavorite={(it) => favorites.toggle(it.placeId, it.favorite)}
    />
  );
}
