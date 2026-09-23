import { useEffect, useRef, useState } from 'react';
import type { PlaceDetail } from '@/api/types';
import mapFallback from '@/assets/placeholders/map-fallback.svg';
import { hasKakaoKey, kakaoDirectionsUrl, loadKakaoMaps } from '@/lib/kakao';

/**
 * 8장 「상세 위치 지도」 — 카카오 JS 키가 있으면 지도를 그리고, 없으면 약도 그림에 핀을 둔다.
 * 가까운 역 데이터가 없어 그림의 「홍대입구역 6번 출구에서 250m」 자리에는 주소를 적는다.
 */
export function MapCard({ place }: { place: PlaceDetail }) {
  const box = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'loading' | 'map' | 'fallback'>(hasKakaoKey() ? 'loading' : 'fallback');
  const { lat, lon } = place;

  useEffect(() => {
    if (lat === null || lon === null || !hasKakaoKey()) {
      setMode('fallback');
      return;
    }
    let cancelled = false;
    loadKakaoMaps()
      .then((maps) => {
        if (cancelled || !box.current) return;
        const center = new maps.LatLng(lat, lon);
        const map = new maps.Map(box.current, { center, level: 4 });
        new maps.Marker({ position: center, map });
        setMode('map');
      })
      .catch(() => {
        if (!cancelled) setMode('fallback');
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-card">
      <h2 className="text-[1.125rem] font-bold text-ink">상세 위치 지도</h2>
      <div className="relative mt-4 h-[10rem] overflow-hidden rounded-xl bg-[#f4efe4]">
        {mode !== 'map' && (
          <>
            <img src={mapFallback} alt="" className="absolute inset-0 size-full object-cover" />
            <svg viewBox="0 0 24 32" className="absolute left-1/2 top-1/2 h-10 -translate-x-1/2 -translate-y-full drop-shadow" aria-hidden>
              <path d="M12 31s10-11.6 10-19A10 10 0 0 0 2 12c0 7.4 10 19 10 19z" fill="#e0533d" />
              <circle cx="12" cy="12" r="4" fill="#fff" />
            </svg>
          </>
        )}
        <div ref={box} className={`absolute inset-0 ${mode === 'map' ? '' : 'invisible'}`} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[0.875rem] text-sub" title={place.address ?? undefined}>
          {place.address ?? '주소 정보가 없습니다'}
        </p>
        {lat !== null && lon !== null && (
          <a
            href={kakaoDirectionsUrl(place.name, lat, lon)}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-[0.875rem] font-bold text-brand-strong hover:underline"
          >
            길찾기 ›
          </a>
        )}
      </div>
    </section>
  );
}
