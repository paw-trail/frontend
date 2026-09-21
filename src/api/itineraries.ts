import { api } from './client';
import type { ItineraryCard } from './types';

export const itinerariesApi = {
  /** visitAt 은 시간대 없이 2026-10-15T13:00:00 · 지난 시각도 됨 · 같은 장소 같은 시각이면 400 ITINERARY_DUPLICATE */
  add: (body: { placeId: string; visitAt: string; petId?: string }) =>
    api<{ stopId: string }>('/itineraries', { method: 'POST', body }),
  /** 그날 일정 — date 는 2026-09-20 */
  list: (date: string) => api<ItineraryCard[]>('/itineraries', { query: { date } }),
  /** 일정 있는 날 — from 이 to 보다 뒤면 400 */
  dates: (from: string, to: string) => api<string[]>('/itineraries/dates', { query: { from, to } }),
  remove: (stopId: string) => api<null>(`/itineraries/${stopId}`, { method: 'DELETE' }),
};
