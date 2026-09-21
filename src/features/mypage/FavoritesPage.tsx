import { useFavorites } from '@/features/favorites/useFavorites';
import { useRatingAverages } from '@/features/reviews/reviewStore';
import { Collection } from './Collection';

/** 명세서 14장 즐겨찾기 — 이 화면에서는 빼기만 한다 */
export function FavoritesPage() {
  const favorites = useFavorites();
  const ratings = useRatingAverages();
  const items = favorites.cards.map((f) => ({
    placeId: f.placeId,
    name: f.name,
    placeType: f.placeType,
    imageUrl: f.imageUrl,
    verdict: f.verdict,
    tags: f.requiredItems,
    rating: ratings.get(f.placeId),
    favorite: true,
  }));

  return (
    <Collection
      title="즐겨찾기 목록"
      subtitle="자주 가거나 꼭 가보고 싶어 찜한 반려동물 안심 동반 장소들입니다."
      items={items}
      status={favorites.status}
      errorText="즐겨찾기를 불러오지 못했습니다."
      emptyTitle="선택하신 카테고리에 즐겨찾기 내역이 없습니다."
      emptyHint="마음에 드는 안심 장소를 탐색해보며 하트 아이콘을 눌러 추가해 보세요!"
      onRetry={() => void favorites.refetch()}
      onToggleFavorite={(it) => favorites.toggle(it.placeId, true)}
    />
  );
}
