import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { qk } from '@/api/keys';
import { searchApi } from '@/api/search';
import { usersApi } from '@/api/users';
import { fromRecentCard, fromSearchCard, withLocalDistance } from '@/components/place/cardModels';
import { BasisBar } from '@/features/basis/BasisBar';
import { useBasis } from '@/features/basis/BasisProvider';
import { useFavorites } from '@/features/favorites/useFavorites';
import { useLocationState } from '@/features/location/LocationProvider';
import { useRegion } from '@/features/region/RegionProvider';
import { CategoryRow } from './CategoryRow';
import { Hero } from './Hero';
import { PlaceSection } from './PlaceSection';

// 히어로 사진을 고를 몫까지 넉넉히 받고 카드는 앞의 4장만 그린다
const TRENDING_SIZE = 10;

/** 명세서 6장 메인 */
export function MainPage() {
  const { state: location } = useLocationState();
  // 내 위치는 서버로 보내지 않고 카드 거리만 브라우저에서 잰다
  const here = location.status === 'granted' ? location.coords : null;
  const navigate = useNavigate();
  const basis = useBasis();
  const { region } = useRegion();
  const favorites = useFavorites();

  const trending = useQuery({
    queryKey: qk.trending(region.sidoCode, basis.petIds, TRENDING_SIZE),
    queryFn: () => searchApi.trending({ sidoCode: region.sidoCode, size: TRENDING_SIZE, petIds: basis.petIds }),
    staleTime: 60_000,
  });
  const recent = useQuery({ queryKey: qk.recent(4), queryFn: () => usersApi.recentPlaces(4), staleTime: 30_000, retry: false });

  const recentFavorite = new Map((recent.data ?? []).map((c) => [c.placeId, c.isFavorite]));

  return (
    <main className="pb-2">
      <Hero />
      <CategoryRow />

      <PlaceSection
        title="내 주변 인기 급상승 장소"
        subtitle="많은 반려인들이 검색한 장소예요"
        moreLabel="전체 보기"
        onMore={() => navigate(`/search?sort=popular&sidoCode=${region.sidoCode}`)}
        status={trending.status}
        cards={(trending.data ?? []).slice(0, 4).map((c) => fromSearchCard(withLocalDistance(c, here)))}
        isFavorite={(card) => favorites.ids.has(card.placeId)}
        onToggleFavorite={(card, current) => favorites.toggle(card.placeId, current)}
        emptyText="이 지역에서 아직 많이 찾은 장소가 없습니다. 지역을 바꿔 보세요."
        errorText="인기 급상승 장소를 불러오지 못했습니다."
        onRetry={() => void trending.refetch()}
      />

      <PlaceSection
        title="최근 확인해본 동반 장소"
        moreLabel="전체보기"
        moreTone="plain"
        onMore={() => navigate('/recent')}
        status={recent.status}
        cards={(recent.data ?? []).map(fromRecentCard)}
        isFavorite={(card) => (favorites.loaded ? favorites.ids.has(card.placeId) : Boolean(recentFavorite.get(card.placeId)))}
        onToggleFavorite={(card, current) => favorites.toggle(card.placeId, current)}
        emptyText="아직 확인한 장소가 없습니다. 궁금한 장소를 열어 보면 여기에 쌓입니다."
        errorText="최근 확인한 장소를 불러오지 못했습니다."
        onRetry={() => void recent.refetch()}
      />

      <BasisBar />
    </main>
  );
}
