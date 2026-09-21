import { useQuery } from '@tanstack/react-query';
import { qk } from '@/api/keys';
import { usersApi } from '@/api/users';
import { fromRecentCard } from '@/components/place/cardModels';
import { PlaceCard, PlaceCardSkeleton } from '@/components/place/PlaceCard';
import { Button } from '@/components/ui/Button';
import { useFavorites } from '@/features/favorites/useFavorites';

/** 최근 확인해본 장소 목록 — /recent 와 마이페이지에서 함께 쓴다 (서버 상한 20곳) */
export function RecentList() {
  const recent = useQuery({ queryKey: qk.recent(20), queryFn: () => usersApi.recentPlaces(20), staleTime: 30_000, retry: false });
  const favorites = useFavorites();
  const cards = (recent.data ?? []).map(fromRecentCard);
  const saved = new Map((recent.data ?? []).map((c) => [c.placeId, c.isFavorite]));

  if (recent.status === 'pending') {
    return (
      <div className="grid grid-cols-4 gap-[1.375rem]">
        {Array.from({ length: 4 }, (_, i) => (
          <PlaceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (recent.status === 'error') {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-white/60 px-6 py-8">
        <p className="text-[0.9375rem] text-sub">최근 확인한 장소를 불러오지 못했습니다.</p>
        <Button variant="outline" onClick={() => void recent.refetch()}>
          다시 불러오기
        </Button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center text-[0.9375rem] text-sub">
        아직 확인한 장소가 없습니다. 궁금한 장소를 열어 보면 여기에 쌓입니다.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-[1.375rem]">
      {cards.map((card) => {
        const fav = favorites.loaded ? favorites.ids.has(card.placeId) : Boolean(saved.get(card.placeId));
        return <PlaceCard key={card.placeId} card={card} favorite={fav} onToggleFavorite={() => favorites.toggle(card.placeId, fav)} />;
      })}
    </div>
  );
}
