import { api } from './client';
import type { PageResponse, ReportCard, ReportType } from './types';

/** 유형마다 보낼 수 있는 칸이 다르다 — 허용되지 않는 칸을 보내도 400 (대조표 2/4 2-3) */
export type ReportBody = {
  placeId: string;
  reportType: ReportType;
  content: string;
  fieldName?: string;
  reportedValue?: string;
  visitedAt?: string;
  targetReviewId?: string;
};

export const reportsApi = {
  create: (body: ReportBody) => api<{ reportId: string }>('/reports', { method: 'POST', body }),
  /** 내가 보낸 제보 · size 기본 20 */
  mine: (page: number, size = 20) => api<PageResponse<ReportCard>>('/reports/me', { query: { page, size } }),
};
