/** 지도에 찍는 점 — 10 · 11장 공통 */
export type MapPoint = {
  id: string;
  lat: number;
  lon: number;
  /** stop 일정 · target 도착지 · me 내 위치 · vet 동물병원 · supply 용품점 */
  kind: 'stop' | 'target' | 'me' | 'vet' | 'supply';
  label?: string;
  order?: number;
  dim?: boolean;
};

export const MARKER_COLOR = {
  route: '#e39b35',
  stop: '#4a6a5e',
  target: '#e0533d',
  me: '#3b82f6',
  vet: '#8b5cf6',
  supply: '#ec4899',
} as const;
