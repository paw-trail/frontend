import { api } from './client';
import type { FavoriteCard } from './types';

export const favoritesApi = {
  list: () => api<FavoriteCard[]>('/favorites'),
  /** 이미 담긴 장소도 성공 */
  add: (placeId: string) => api<null>('/favorites', { method: 'POST', body: { placeId } }),
  remove: (placeId: string) => api<null>(`/favorites/${placeId}`, { method: 'DELETE' }),
};
