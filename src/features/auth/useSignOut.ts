import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { authApi } from '@/api/auth';
import { clearSessionPrefs } from '@/lib/storage';

/**
 * 로그아웃 — 한 군데로 모아 둔다.
 * 로그인 쿠키는 HttpOnly 라 자바스크립트로 지울 수 없고, 서버가 만료 쿠키를 내려 줘야 지워진다.
 * 그래서 화면을 옮기기 전에 반드시 /auth/logout 을 부르고, 실패해도 이 브라우저에 남은 것은 비운다.
 */
export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useCallback(
    async (notice?: string) => {
      try {
        await authApi.logout();
      } catch {
        // 이미 만료된 세션이면 401 이 나는데, 그 경우에도 아래 정리는 한다
      } finally {
        clearSessionPrefs();
        queryClient.clear();
        navigate('/login', { replace: true, state: notice ? { notice } : undefined });
      }
    },
    [navigate, queryClient],
  );
}
