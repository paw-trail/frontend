import { api } from './client';
import type { Breed, BreedSize, Pet, UploadUrl } from './types';

export type PetCreateBody = {
  name: string;
  breedCode: string;
  weightKg: number;
  /** 비우면 서버가 체중으로 정한다 */
  breedSize?: BreedSize;
  hasCarrier: boolean;
  hasStroller: boolean;
  vaccineCompleted: boolean;
  vaccineProofAvailable: boolean;
  /** upload-url 로 받은 fileUrl */
  photoUrl?: string;
  note?: string;
};

/** S3 로 직접 올리다 실패한 경우 — 서버 응답이 아니라 따로 구분한다 */
export class PhotoUploadError extends Error {
  /** S3 가 돌려준 까닭 (SignatureDoesNotMatch · AccessDenied …) · 닿지 못했으면 network */
  readonly code: string;

  constructor(code = '') {
    super('사진을 올리지 못했습니다.');
    this.name = 'PhotoUploadError';
    this.code = code;
  }
}

/**
 * 서명된 주소로 파일을 올린다. 실패하면 S3 가 준 까닭을 콘솔에 남긴다 —
 * 화면에는 같은 문구가 나가지만 개발자 도구에서 원인이 바로 보이게 하기 위함이다.
 */
export async function putToSignedUrl(uploadUrl: string, file: File): Promise<void> {
  let res: Response;
  try {
    res = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  } catch (e) {
    console.error('[사진 올리기] S3 에 닿지 못했습니다 (네트워크 · CORS)', e);
    throw new PhotoUploadError('network');
  }
  if (res.ok) return;

  const body = await res.text().catch(() => '');
  const pick = (tag: string) => new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(body)?.[1] ?? '';
  const code = pick('Code');
  let signedHeaders = '';
  try {
    signedHeaders = new URL(uploadUrl).searchParams.get('X-Amz-SignedHeaders') ?? '';
  } catch {
    signedHeaders = '';
  }
  console.error(
    [
      `[사진 올리기] S3 가 거절했습니다 — status=${res.status} code=${code || '(없음)'}`,
      `message: ${pick('Message') || '(없음)'}`,
      `보낸 형식: ${file.type} · 크기: ${file.size}`,
      `서명에 들어간 헤더: ${signedHeaders || '(없음)'}`,
      body ? `응답 본문:\n${body}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  );
  throw new PhotoUploadError(code || String(res.status));
}

export const PHOTO_TYPES = ['image/jpeg', 'image/png'] as const;
/** pet-service 의 storage.max-image-bytes (20MiB) */
export const PHOTO_MAX_BYTES = 20 * 1024 * 1024;

/**
 * 사진 올리기 — 주소를 받아 브라우저가 S3 에 직접 PUT 한다.
 * 서명에 형식과 크기가 들어가므로 Content-Type 을 파일 형식 그대로 보내야 한다.
 */
async function uploadPhoto(file: File): Promise<string> {
  const issued = await api<UploadUrl>('/pets/upload-url', {
    method: 'POST',
    body: { fileName: file.name, contentType: file.type, contentLength: file.size },
  });
  await putToSignedUrl(issued.uploadUrl, file);
  return issued.fileUrl;
}

/** 보낸 칸만 바뀐다 — 사진 · 메모만 null 로 지울 수 있다 (대조표 3/4 4-2) */
export type PetUpdateBody = Partial<Omit<PetCreateBody, 'photoUrl' | 'note'>> & {
  photoUrl?: string | null;
  note?: string | null;
};

export const petsApi = {
  list: () => api<Pet[]>('/pets'),
  breeds: () => api<Breed[]>('/breeds'),
  create: (body: PetCreateBody) => api<Pet>('/pets', { method: 'POST', body }),
  update: (petId: string, body: PetUpdateBody) => api<Pet>(`/pets/${petId}`, { method: 'PATCH', body }),
  remove: (petId: string) => api<null>(`/pets/${petId}`, { method: 'DELETE' }),
  uploadPhoto,
};
