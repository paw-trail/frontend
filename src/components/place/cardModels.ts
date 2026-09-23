import { distanceM, type LatLon } from '@/lib/geo';
import type { RecentPlaceCard, SearchCard } from '@/api/types';
import { formatDistance, sigunguOf } from '@/lib/format';
import { strictest } from '@/lib/verdict';
import type { PlaceCardModel } from './PlaceCard';

/** 검색 · 인기 급상승 카드 (대조표 2/4 1-2) */
/**
 * 내 위치를 서버로 보내지 않고 브라우저에서 거리를 잰다 (공모전 안내 — 개인위치정보를 서버로 보내면 위치기반서비스 신고 대상).
 * 카드에 좌표가 없거나 위치를 모르면 그대로 둔다.
 */
export function withLocalDistance(c: SearchCard, here: LatLon | null): SearchCard {
  if (!here || typeof c.lat !== 'number' || typeof c.lon !== 'number') return c;
  return { ...c, distanceM: Math.round(distanceM(here, { lat: c.lat, lon: c.lon })) };
}

export function fromSearchCard(c: SearchCard): PlaceCardModel {
  return {
    placeId: c.placeId,
    name: c.name,
    placeType: c.placeType,
    imageUrl: c.imageUrl,
    region: sigunguOf(c.address),
    distance: formatDistance(c.distanceM),
    verdict: strictest(c.verdicts),
    body: c.evidenceSummary,
    // 기준일이 없는 장소도 있어 줄을 비우면 카드 높이가 들쭉날쭉해진다
    footer: c.dataBaseDate ? `출처: 공공데이터 · ${c.dataBaseDate} 기준` : '출처: 공공데이터',
  };
}

/** 최근 본 장소 — 주소 · 거리 · 한 줄 근거가 없어 본문 자리에 준비물을 적는다 (대조표 2/4 2-1) */
export function fromRecentCard(c: RecentPlaceCard): PlaceCardModel {
  return {
    placeId: c.placeId,
    name: c.name,
    placeType: c.placeType,
    imageUrl: c.imageUrl,
    region: null,
    distance: null,
    verdict: c.verdict,
    body: c.requiredItems.length ? `준비물: ${c.requiredItems.join(' · ')}` : null,
    footer: null,
  };
}
