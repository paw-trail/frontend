import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { qk } from '@/api/keys';
import { SplashScreen } from './SplashScreen';

/**
 * 구글 로그인이 끝나면 auth 가 /login/success?isNew= 로 돌려보낸다. 쿠키는 이미 심겨 있다.
 * 새로 가입한 계정이면 반려동물 등록(명세서 5장)으로, 아니면 첫 화면으로.
 */
export function OAuthSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = params.get('isNew') === 'true';

  useEffect(() => {
    queryClient.removeQueries({ queryKey: qk.session });
    navigate(isNew ? '/signup/pets' : '/', { replace: true });
  }, [isNew, navigate, queryClient]);

  return <SplashScreen />;
}
