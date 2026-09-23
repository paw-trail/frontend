import { api } from './client';
import { putToSignedUrl } from './pets';
import type { MyReview, PageResponse, PlaceReviewList, UploadUrl } from './types';

/*
 * 후기 — paw-trail/review-service v0.1.0.
 *
 * 사진 파일은 이 서비스를 지나가지 않는다. 주소를 발급받아 브라우저가 S3 에 직접 올리고
 * 작성 · 수정 요청에는 받은 fileUrl 만 담는다 (pet · user 프로필 사진과 같은 방식).
 *
 * 수정은 보낸 칸만 바뀐다. 사진 · 태그는 안 보내면 그대로 두고 빈 배열을 보내면 비운다.
 * 반려동물과 방문일은 요청에 아예 없다 — 방문 당시의 기록이라 서버가 잠가 둔다.
 */

/** 목록 정렬 — 서버가 받는 값 그대로 */
export type ReviewSort = 'recent' | 'oldest' | 'rating_desc' | 'rating_asc';

export type PlaceReviewQuery = {
  sort?: ReviewSort;
  /** 장소 후기 목록에만 있다 · 요약(평균 · 후기 수)은 이 거르기를 따라가지 않는다 */
  photoOnly?: boolean;
  page?: number;
  size?: number;
};

export type MyReviewQuery = {
  sort?: ReviewSort;
  page?: number;
  size?: number;
};

export type ReviewCreateBody = {
  /** 1~5마리 · 보낸 순서가 카드 배지 순서가 된다 */
  petIds: string[];
  visitedAt: string;
  rating: number;
  facilityScore: number;
  ruleScore: number;
  moodScore: number;
  content: string;
  /** upload-url 로 받은 fileUrl (5장까지) */
  photos?: string[];
  tags?: string[];
};

/** 보낸 칸만 바뀐다 — 빈 배열은 「다 비우기」라서 안 보내는 것과 뜻이 다르다 */
export type ReviewUpdateBody = Partial<Pick<ReviewCreateBody, 'rating' | 'facilityScore' | 'ruleScore' | 'moodScore' | 'content' | 'photos' | 'tags'>>;

/** 서버가 보는 상한 — 20MiB (review-service app.storage.max-image-bytes) */
export const REVIEW_PHOTO_MAX_BYTES = 20 * 1024 * 1024;

/**
 * 사진 한 장 올리기.
 * contentLength 가 서명에 들어가므로 올릴 파일의 크기를 그대로 보내야 한다 —
 * 한 바이트만 달라도 S3 가 403 으로 거절한다.
 */
async function uploadPhoto(file: File): Promise<string> {
  const issued = await api<UploadUrl>('/reviews/upload-url', {
    method: 'POST',
    body: { fileName: file.name, contentType: file.type, contentLength: file.size },
  });
  await putToSignedUrl(issued.uploadUrl, file);
  return issued.fileUrl;
}

export const reviewsApi = {
  byPlace: (placeId: string, query: PlaceReviewQuery = {}) => api<PlaceReviewList>(`/places/${placeId}/reviews`, { query }),
  create: (placeId: string, body: ReviewCreateBody) => api<{ reviewId: string }>(`/places/${placeId}/reviews`, { method: 'POST', body }),
  update: (reviewId: string, body: ReviewUpdateBody) => api<null>(`/reviews/${reviewId}`, { method: 'PATCH', body }),
  remove: (reviewId: string) => api<null>(`/reviews/${reviewId}`, { method: 'DELETE' }),
  /** 관리자가 남의 후기를 내릴 때 — 지우는 동작은 같고 지운 사람만 다르게 남는다 */
  removeAsAdmin: (reviewId: string) => api<null>(`/admin/reviews/${reviewId}`, { method: 'DELETE' }),
  mine: (query: MyReviewQuery = {}) => api<PageResponse<MyReview>>('/reviews/me', { query }),
  /** 두 번 눌러도 결과가 같다 (서버가 멱등) */
  like: (reviewId: string) => api<null>(`/reviews/${reviewId}/like`, { method: 'POST' }),
  unlike: (reviewId: string) => api<null>(`/reviews/${reviewId}/like`, { method: 'DELETE' }),
  /** 고를 수 있는 태그 — config 에서 내려온다 (적힌 순서가 화면 순서) */
  tags: () => api<string[]>('/reviews/tags'),
  uploadPhoto,
};
