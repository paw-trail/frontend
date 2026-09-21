import { api } from './client';
import type { Conflict, PlaceDetail, PlaceDocument, PlaceVerdictDetail } from './types';

export const placesApi = {
  detail: (placeId: string) => api<PlaceDetail>(`/places/${placeId}`),
  documents: (placeId: string) => api<{ documents: PlaceDocument[] }>(`/places/${placeId}/documents`),
  /** verdict — petIds 는 1~100 · 없으면 400 이라 부르는 쪽이 막는다 */
  verdict: (placeId: string, petIds: readonly string[]) =>
    api<PlaceVerdictDetail>(`/places/${placeId}/verdict`, { query: { petIds } }),
  /** policy — 판정 응답의 hasConflict 가 참일 때만 부른다 */
  conflicts: (placeId: string) => api<Conflict[]>(`/places/${placeId}/conflicts`),
};
