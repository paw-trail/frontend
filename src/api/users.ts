import { api } from './client';
import { putToSignedUrl } from './pets';
import type { Profile, RecentPlaceCard, UploadUrl } from './types';

export const usersApi = {
  me: () => api<Profile>('/users/me'),
  /** 보낸 칸만 바꾼다. 닉네임은 2~20자 · 지울 수 없음 · 사진은 null 로 지움 */
  updateProfile: (body: { nickname?: string; profileImageUrl?: string | null }) =>
    api<Profile>('/users/me', { method: 'PATCH', body }),
  /** 프로필 사진 — 반려동물 사진과 같은 차례 (주소 발급 → S3 에 PUT → fileUrl 로 PATCH) */
  uploadProfilePhoto: async (file: File): Promise<string> => {
    const issued = await api<UploadUrl>('/users/me/upload-url', {
      method: 'POST',
      body: { fileName: file.name, contentType: file.type, contentLength: file.size },
    });
    await putToSignedUrl(issued.uploadUrl, file);
    return issued.fileUrl;
  },
  setDefaultPet: (petId: string | null) => api<null>('/users/me/default-pet', { method: 'PATCH', body: { petId } }),
  /** size 1~20 · place 를 못 부르면 목록 전체가 502 */
  recentPlaces: (size: number) => api<RecentPlaceCard[]>('/users/me/recent-places', { query: { size } }),
  /** 8장을 열 때 기록한다 — 안 하면 최근 본 장소가 쌓이지 않는다 */
  recordRecent: (placeId: string) => api<null>('/users/me/recent-places', { method: 'POST', body: { placeId } }),
};
