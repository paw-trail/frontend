import { useSyncExternalStore } from 'react';
import { shrinkPhoto } from '@/features/reviews/photos';

/**
 * 반려동물 · 프로필 사진의 임시 보관소.
 *
 * 사진은 원래 S3 로 올리는데(주소를 받아 브라우저가 직접 PUT), 그 길이 막히면
 * 사진만 빼고 저장되어 화면이 비어 보인다. 그때 이 브라우저에만 담아 두고 대신 보여 준다.
 * 서버에 올라간 사진이 있으면 늘 그쪽이 먼저다.
 */
const KEY = 'pawtrail.localPhotos.v1';

type PhotoMap = Record<string, string>;

let cache: PhotoMap | null = null;
const listeners = new Set<() => void>();

function read(): PhotoMap {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as PhotoMap) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: PhotoMap) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장 공간이 차면 그냥 못 담는다 — 화면은 기본 그림으로 간다
  }
  listeners.forEach((l) => l());
}

/** 반려동물 사진 열쇠 */
export const petKey = (petId: string) => `pet:${petId}`;
/** 내 프로필 사진 열쇠 */
export const MY_PHOTO_KEY = 'user:me';

/** 고른 파일을 줄여서 담는다 */
export async function saveLocalPhoto(key: string, file: File): Promise<void> {
  const dataUrl = await shrinkPhoto(file);
  write({ ...read(), [key]: dataUrl });
}

export function removeLocalPhoto(key: string): void {
  const next = { ...read() };
  delete next[key];
  write(next);
}

export function getLocalPhoto(key: string): string | null {
  return read()[key] ?? null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 담아 둔 사진 전부 — 목록을 그릴 때처럼 여러 개가 필요할 때 */
export function useLocalPhotos(): Readonly<Record<string, string>> {
  return useSyncExternalStore(subscribe, read, read);
}

/** 서버 사진이 없을 때 이 브라우저에 담아 둔 사진을 돌려준다 */
export function useLocalPhoto(key: string, serverUrl: string | null | undefined): string | null {
  const photos = useSyncExternalStore(subscribe, read, read);
  return serverUrl ?? photos[key] ?? null;
}
