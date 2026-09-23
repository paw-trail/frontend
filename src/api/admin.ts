import { api } from './client';
import type { AdminReportCard, OutboxMessage, PageResponse, PlaceDetail, PlacePending, PolicyAdmin, PolicyFields, ReportStatus } from './types';

/** 17장 — 게이트웨이가 ADMIN 이 아니면 403 ACCESS_DENIED */
export const adminReportsApi = {
  list: (status: ReportStatus | undefined, page: number, size = 20) =>
    api<PageResponse<AdminReportCard>>('/admin/reports', { query: { status, page, size } }),
  /** memo 는 필수 1~500자 — 사용자 문의 내역에 「답변」 으로 보인다 */
  resolve: (reportId: string, body: { status: 'ACCEPTED' | 'REJECTED'; memo: string }) =>
    api<{ reportId: string; status: ReportStatus; memo: string; reviewedBy: string; reviewedAt: string }>(`/admin/reports/${reportId}`, {
      method: 'PATCH',
      body,
    }),
};

/** 18장 PATCH — 보낸 칸만 · 주소는 도로명 · 지번을 함께 · 이름 · 상태는 지울 수 없음 */
export type PlaceAdminUpdateBody = {
  name?: string;
  addressRoad?: string;
  addressJibun?: string;
  tel?: string | null;
  homepage?: string | null;
  reservationUrl?: string | null;
  imageUrl?: string | null;
  overview?: string | null;
  businessHours?: string | null;
  closedDays?: string | null;
  status?: 'ACTIVE' | 'CLOSED' | 'UNKNOWN';
};

/** 18장 */
export const adminPlacesApi = {
  update: (placeId: string, body: PlaceAdminUpdateBody) => api<PlaceDetail>(`/admin/places/${placeId}`, { method: 'PATCH', body }),
  pending: (page: number, size = 20) => api<PageResponse<PlacePending>>('/admin/places/pending', { query: { page, size } }),
  approve: (pendingId: string) => api<void>(`/admin/places/pending/${pendingId}/approve`, { method: 'POST' }),
  reject: (pendingId: string) => api<void>(`/admin/places/pending/${pendingId}/reject`, { method: 'POST' }),
};

/** 19장 — 정정은 출처 MANUAL · OWNER 만 · 업장 확인이 있으면 관리자 확인으로 못 덮음 (409) */
export const adminPoliciesApi = {
  get: (placeId: string) => api<PolicyAdmin>(`/admin/policies/${placeId}`),
  manual: (placeId: string, body: { source: 'MANUAL' | 'OWNER'; reason: string; fields: PolicyFields }) =>
    api<PolicyAdmin>(`/admin/policies/${placeId}/manual`, { method: 'PUT', body }),
  remerge: (placeId: string) => api<void>(`/admin/policies/${placeId}/remerge`, { method: 'POST' }),
};

/** 20장 — 발행을 끝까지 실패한 이벤트가 있는 서비스 5개 */
export const OUTBOX_SERVICES = [
  { key: 'accounts', label: '계정', service: 'auth' },
  { key: 'pets', label: '반려동물', service: 'pet' },
  { key: 'places', label: '장소', service: 'place' },
  { key: 'policies', label: '조건', service: 'policy' },
  { key: 'reports', label: '제보', service: 'report' },
] as const;
export type OutboxKey = (typeof OUTBOX_SERVICES)[number]['key'];

export const outboxApi = {
  list: (key: OutboxKey, page: number, size = 20) => api<PageResponse<OutboxMessage>>(`/admin/${key}/outbox`, { query: { page, size } }),
  retry: (key: OutboxKey, outboxId: string) => api<null>(`/admin/${key}/outbox/${outboxId}/retry`, { method: 'POST' }),
};

/** 21장 — 마지막 실행 시각을 읽을 API 는 없다 */
export const adminSearchApi = {
  reindex: () => api<{ startedAt: string }>('/admin/search/reindex', { method: 'POST' }),
};

/**
 * 21장 공사 데이터 최신 수집 — 한국관광공사 OpenAPI 를 그 자리에서 호출해 바뀐 원문을 가져온다.
 * 반려동물 동반여행은 증분(목록 + 바뀐 것만 상세), 고캠핑은 목록 조회 한 번으로 전량.
 * 게이트웨이의 관리자 입구(ADMIN 만)로 부른다. 같은 소스를 10분 안에 다시 부르면 429,
 * 화면이 보내지 않는 조합은 400 으로 돌아온다. 매일 04:00 예약 실행도 같은 규칙을 쓴다.
 */
export type IngestSource = 'PET_TOUR' | 'GOCAMPING';
export type IngestRun = {
  id: string;
  source: string;
  runType: 'FULL' | 'INCREMENTAL' | 'LINK' | 'DIRECT';
  /** INTERRUPTED 는 받아 오다 멈춘 것 — 다음 실행이 그 자리를 이어받는다 (실패와 다름) */
  status: 'RUNNING' | 'DONE' | 'FAILED' | 'QUOTA_STOPPED' | 'INTERRUPTED';
  startedAt: string;
  finishedAt: string | null;
  fetchedCount: number;
  changedCount: number;
  progress: Record<string, { count: number; cursor: string | null }> | null;
  errorMessage: string | null;
};
export const adminIngestApi = {
  run: (source: IngestSource) =>
    api<{ runId: string }>('/admin/ingest/runs', {
      method: 'POST',
      body: { source, runType: source === 'PET_TOUR' ? 'INCREMENTAL' : 'FULL' },
    }),
  runs: (size = 10) => api<{ runs: IngestRun[] }>('/admin/ingest/runs', { query: { size } }),
};
