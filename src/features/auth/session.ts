import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { qk } from '@/api/keys';
import { petsApi } from '@/api/pets';
import { usersApi } from '@/api/users';

/** 로그인 여부는 이것으로만 판단한다 */
export function useAuthMe() {
  return useQuery({ queryKey: qk.authMe, queryFn: authApi.me, staleTime: 5 * 60_000, retry: false });
}

/**
 * 가입 직후에는 account.created 가 아직 안 와서 404 일 수 있다 — 짧게 다시 부른다.
 * 사진은 서명 주소이나 내려받기 유효 시간이 한 시간이라 30초는 캐시한다 —
 * 캐시가 없으면 화면을 옮길 때마다 다시 불러, 404 인 동안 스플래시와 본문이 왕복한다.
 */
export function useProfile() {
  return useQuery({
    queryKey: qk.profile,
    queryFn: usersApi.me,
    staleTime: 30_000,
    // 가입 직후에는 account.created 가 도착하기까지 잠깐 404 다 — 약 5초까지 기다린다
    retry: (count, error) => error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND' && count < 7,
    retryDelay: 700,
  });
}

/** 반려동물 사진이 서명 주소라 캐시하지 않는다 */
export function usePets() {
  return useQuery({ queryKey: qk.pets, queryFn: petsApi.list, staleTime: 0 });
}
