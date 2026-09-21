import { useSyncExternalStore } from 'react';
import type { AdminReportCard, PlacePending, ReportStatus } from '@/api/types';

/**
 * 시연용 예시 자료 (관리자 화면).
 *
 * 제보와 수정 대기는 사용자가 실제로 넣어야 쌓이는데, 새로 띄운 환경에는 아무것도 없어
 * 17 · 18장이 빈 화면으로 보인다. 그래서 「테스트」라고 밝힌 예시를 서버 자료가 없을 때만 끼운다.
 * 처리한 결과는 이 브라우저에만 남고, 서버 자료가 한 건이라도 있으면 예시는 사라진다.
 */
const KEY = 'pawtrail.sampleAdmin.v1';

type Handled = {
  reports: Record<string, { status: 'ACCEPTED' | 'REJECTED'; memo: string; reviewedAt: string }>;
  pendings: string[];
};

const EMPTY: Handled = { reports: {}, pendings: [] };

let cache: Handled | null = null;
const listeners = new Set<() => void>();

function read(): Handled {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as Handled) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Handled) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장이 막혀도 이번 화면에서는 처리된 것으로 보인다
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const isSampleId = (id: string) => id.startsWith('sample-');

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const REPORTER = { accountId: 'sample-account', nickname: '다정이네', profileImageUrl: null };

const BASE_REPORTS: AdminReportCard[] = [
  {
    reportId: 'sample-report-1',
    reportType: 'CONDITION_WRONG',
    placeId: 'sample-place-1',
    placeName: '카페 그린뜰',
    targetReviewId: null,
    fieldName: null,
    reportedValue: '실내 동반 불가',
    content: '[테스트 데이터] 실내는 안 되고 테라스만 된다고 직원분이 안내했습니다.',
    visitedAt: '2026-09-19',
    status: 'PENDING',
    memo: null,
    reviewedAt: null,
    createdAt: hoursAgo(3),
    reporter: REPORTER,
    reviewedBy: null,
  },
  {
    reportId: 'sample-report-2',
    reportType: 'INFO_WRONG',
    placeId: 'sample-place-1',
    placeName: '카페 그린뜰',
    targetReviewId: null,
    fieldName: 'tel',
    reportedValue: '02-123-4567',
    content: '[테스트 데이터] 전화번호가 바뀌었습니다. 매장 안내문에 적힌 번호로 적어 둡니다.',
    visitedAt: '2026-09-19',
    status: 'PENDING',
    memo: null,
    reviewedAt: null,
    createdAt: hoursAgo(9),
    reporter: REPORTER,
    reviewedBy: null,
  },
  {
    reportId: 'sample-report-3',
    reportType: 'CLOSED',
    placeId: 'sample-place-2',
    placeName: '한강마루 산책로',
    targetReviewId: null,
    fieldName: null,
    reportedValue: null,
    content: '[테스트 데이터] 가 보니 공사 중이라 당분간 이용할 수 없었습니다.',
    visitedAt: '2026-09-20',
    status: 'PENDING',
    memo: null,
    reviewedAt: null,
    createdAt: hoursAgo(26),
    reporter: REPORTER,
    reviewedBy: null,
  },
  {
    reportId: 'sample-report-4',
    reportType: 'INFO_WRONG',
    placeId: 'sample-place-2',
    placeName: '한강마루 산책로',
    targetReviewId: null,
    fieldName: 'name',
    reportedValue: '한강마루 근린공원',
    content: '[테스트 데이터] 현장 안내판 이름과 다릅니다.',
    visitedAt: null,
    status: 'ACCEPTED',
    memo: '안내판 사진을 확인해 이름을 고쳤습니다. 알려 주셔서 고맙습니다.',
    reviewedAt: hoursAgo(20),
    createdAt: hoursAgo(50),
    reporter: REPORTER,
    reviewedBy: 'admin',
  },
];

const BASE_PENDINGS: PlacePending[] = [
  {
    pendingId: 'sample-pending-1',
    placeId: 'sample-place-1',
    placeName: '카페 그린뜰',
    fieldName: 'tel',
    currentValue: '02-000-0000',
    newValue: '02-123-4567',
    source: 'CULTURE_CSV',
    detectedAt: hoursAgo(7),
  },
  {
    pendingId: 'sample-pending-2',
    placeId: 'sample-place-2',
    placeName: '한강마루 산책로',
    fieldName: 'businessHours',
    currentValue: '상시 개방',
    newValue: '06:00~22:00',
    source: 'PET_TOUR',
    detectedAt: hoursAgo(31),
  },
];

/** 예시 제보 — 처리한 것은 처리 결과를 반영해 돌려준다 */
export function useSampleReports(serverTotal: number, status: ReportStatus | 'ALL'): AdminReportCard[] {
  const handled = useSyncExternalStore(subscribe, read, read);
  if (serverTotal > 0) return [];

  const all = BASE_REPORTS.map((r) => {
    const done = handled.reports[r.reportId];
    return done ? { ...r, status: done.status, memo: done.memo, reviewedAt: done.reviewedAt, reviewedBy: 'admin' } : r;
  });
  return status === 'ALL' ? all : all.filter((r) => r.status === status);
}

/** 칩에 보일 예시 건수 */
export function sampleCount(status: ReportStatus | 'ALL'): number {
  const handled = read();
  const all = BASE_REPORTS.map((r) => handled.reports[r.reportId]?.status ?? r.status);
  return status === 'ALL' ? all.length : all.filter((s) => s === status).length;
}

/** 예시 제보를 처리한다 (이 브라우저에만 남는다) */
export function resolveSampleReport(reportId: string, status: 'ACCEPTED' | 'REJECTED', memo: string): void {
  const now = read();
  write({ ...now, reports: { ...now.reports, [reportId]: { status, memo, reviewedAt: new Date().toISOString() } } });
}

/** 예시 수정 대기 — 승인하거나 반려한 것은 목록에서 뺀다 */
export function useSamplePendings(serverTotal: number): PlacePending[] {
  const handled = useSyncExternalStore(subscribe, read, read);
  if (serverTotal > 0) return [];
  return BASE_PENDINGS.filter((p) => !handled.pendings.includes(p.pendingId));
}

export function handleSamplePending(pendingId: string): void {
  const now = read();
  if (now.pendings.includes(pendingId)) return;
  write({ ...now, pendings: [...now.pendings, pendingId] });
}
