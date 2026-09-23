import { env } from './env';

// 카카오 지도 JS SDK 중 이 화면들이 쓰는 것만 타입으로 적는다
export type KakaoLatLng = object;
export type KakaoMap = {
  relayout(): void;
  setCenter(c: KakaoLatLng): void;
  setBounds(bounds: object, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
  setLevel(level: number): void;
};
type Overlay = { setMap(map: KakaoMap | null): void };
export type KakaoMaps = {
  load(cb: () => void): void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => { extend(ll: KakaoLatLng): void };
  Map: new (el: HTMLElement, opts: { center: KakaoLatLng; level: number }) => KakaoMap;
  Marker: new (opts: { position: KakaoLatLng; map?: KakaoMap }) => Overlay;
  Polyline: new (opts: {
    path: KakaoLatLng[];
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: string;
    map?: KakaoMap | null;
  }) => Overlay;
  CustomOverlay: new (opts: {
    position: KakaoLatLng;
    content: HTMLElement | string;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
    map?: KakaoMap | null;
  }) => Overlay;
};
type KakaoGlobal = { maps: KakaoMaps };

declare global {
  interface Window {
    kakao?: KakaoGlobal;
  }
}

let loading: Promise<KakaoMaps> | null = null;

export const hasKakaoKey = () => env.kakaoMapKey.length > 0;

/** SDK 를 한 번만 불러온다. 키가 없으면 실패로 끝나고 화면은 약도로 대신한다 */
export function loadKakaoMaps(): Promise<KakaoMaps> {
  if (!hasKakaoKey()) return Promise.reject(new Error('카카오 JS 키가 없습니다'));
  if (!loading) {
    loading = new Promise<KakaoMaps>((resolve, reject) => {
      const ready = () => window.kakao!.maps.load(() => resolve(window.kakao!.maps));
      if (window.kakao?.maps) {
        ready();
        return;
      }
      const script = document.createElement('script');
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(env.kakaoMapKey)}&autoload=false&libraries=services`;
      script.async = true;
      script.onload = ready;
      script.onerror = () => {
        loading = null;
        reject(new Error('카카오 지도를 불러오지 못했습니다'));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

export type RoutePoint = { name: string; lat: number; lon: number };

/**
 * 카카오맵 길찾기 주소 (출발 · 도착).
 * 카카오는 길찾기 URL 에 경유지를 넣을 수 없어(공식 답변) 구간마다 하나씩 연다.
 * 출발을 모르면 목적지만 넘겨 카카오가 출발지를 묻게 한다.
 */
export function kakaoRouteUrl(from: RoutePoint | null, to: RoutePoint): string {
  const dest = `${encodeURIComponent(to.name)},${to.lat},${to.lon}`;
  if (!from) return `https://map.kakao.com/link/to/${dest}`;
  return `https://map.kakao.com/link/from/${encodeURIComponent(from.name)},${from.lat},${from.lon}/to/${dest}`;
}

/** 키 없이 열리는 카카오맵 길찾기 주소 */
export function kakaoDirectionsUrl(name: string, lat: number, lon: number): string {
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lon}`;
}
