import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router/dom';
import { setSessionExpiredHandler } from '@/api/client';
import { LocationProvider } from '@/features/location/LocationProvider';
import { queryClient } from './queryClient';
import { router } from './router';

// 토큰 갱신까지 실패하면 세션 캐시를 비우고 로그인 화면으로
setSessionExpiredHandler(() => {
  queryClient.clear();
  if (!window.location.pathname.startsWith('/login')) {
    void router.navigate('/login', { replace: true });
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocationProvider>
        <RouterProvider router={router} />
      </LocationProvider>
    </QueryClientProvider>
  );
}
