import { api } from './client';
import type { DailySummary, VisitCard } from './types';

export const visitsApi = {
  /** 페이징 없음 — 12장 동반 기록 · 15장 방문한 장소가 같이 쓴다 */
  list: () => api<VisitCard[]>('/visits'),
  /** 일정에서 기록 — 그 일정의 장소 · 시각 · 반려동물로 남고, 두 번 보내도 같은 기록을 돌려준다 */
  recordStop: (itineraryStopId: string) => api<{ visitId: string }>('/visits', { method: 'POST', body: { itineraryStopId } }),
  remove: (visitId: string) => api<null>(`/visits/${visitId}`, { method: 'DELETE' }),
  /** 같은 날짜 60초 · 하루 20번 — 429 SUMMARY_COOLDOWN · SUMMARY_DAILY_LIMIT */
  summarize: (visitDate: string) => api<DailySummary>('/users/me/daily-summary', { method: 'POST', body: { visitDate } }),
};
