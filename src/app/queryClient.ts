import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // 4xx 는 다시 불러도 같으므로 5xx · 연결 실패만 한 번 더
      retry: (failureCount, error) =>
        error instanceof ApiError && (error.status >= 500 || error.status === 0) && failureCount < 1,
    },
    mutations: { retry: false },
  },
});
