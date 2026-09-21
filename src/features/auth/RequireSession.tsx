import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { isApiError } from '@/api/client';
import { useLocationState } from '@/features/location/LocationProvider';
import { useMinimumDelay } from '@/lib/hooks';
import { useAuthMe, usePets, useProfile } from './session';
import { useSignOut } from './useSignOut';
import { SplashScreen } from './SplashScreen';

/**
 * 로그인이 필요한 화면의 입구 (명세서 1장 스플래시).
 * /auth/me · /users/me · /pets 셋을 병렬로 부르고, 그동안 스플래시를 보인다.
 * 로그인 필수 서비스라 401 이면 로그인 화면으로 보낸다.
 */
export function RequireSession() {
  const location = useLocation();
  const signOut = useSignOut();
  const me = useAuthMe();
  const profile = useProfile();
  const pets = usePets();
  const minimumShown = useMinimumDelay(700);
  const { request } = useLocationState();
  const settled = useRef(false);
  const signingOut = useRef(false);
  const profileMissing = profile.isError && isApiError(profile.error, 'RESOURCE_NOT_FOUND');

  useEffect(() => {
    request();
  }, [request]);

  // 프로필이 끝내 없으면 이 세션은 더 쓸 수 없다 — 한 번만 로그아웃시킨다
  useEffect(() => {
    if (!profileMissing || signingOut.current) return;
    signingOut.current = true;
    void signOut('이 계정의 정보를 찾지 못했습니다. 다른 계정으로 로그인하거나 새로 가입해 주세요.');
  }, [profileMissing, signOut]);

  if (isApiError(me.error) && me.error.status === 401) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (me.isError) {
    return (
      <SplashScreen
        failed
        onRetry={() => {
          void me.refetch();
          void profile.refetch();
          void pets.refetch();
        }}
      />
    );
  }

  // 계정은 있는데 프로필이 없는 상태 — user 가 account.created 를 아직 처리하지 못한 것이다.
  // 닉네임 · 대표 반려동물이 없어 거의 모든 화면이 비므로 여기서 멈추고 알린다.
  // 계정은 살아 있는데 프로필이 없는 상태 — 탈퇴한 계정의 토큰이 남았을 때가 대부분이다.
  // 사용자가 손쓸 수 있는 게 없으므로 막아 세우지 않고 바로 로그아웃시켜 로그인 화면으로 보낸다.
  if (profileMissing) {
    return <SplashScreen message="로그인 정보를 확인하고 있어요..." />;
  }

  // 한 번 다 불러온 뒤에는 다시 막지 않는다 —
  // 막으면 본문이 떴다가 그 화면이 다시 부르는 사이 스플래시로 돌아가 왕복한다.
  if (settled.current === false) {
    if (me.isPending || profile.isPending || pets.isPending || !minimumShown) {
      return <SplashScreen />;
    }
    settled.current = true;
  }

  // 프로필 · 반려동물이 실패해도 페이지는 뜬다 — 그 영역만 빈다
  return <Outlet />;
}
