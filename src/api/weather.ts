import { api } from './client';
import type { Weather } from './types';

/** 좌표와 지역 중 꼭 하나만 — 둘 다 · 둘 다 없음은 400 */
export type WeatherQuery = { lat: number; lon: number } | { sidoCode: string; sigunguName?: string };

export const weatherApi = {
  get: (q: WeatherQuery) => api<Weather>('/weather', { query: q }),
};
