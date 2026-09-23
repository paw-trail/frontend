import { useQueryClient } from '@tanstack/react-query';
import { KeyRound, Mail, PawPrint } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { GOOGLE_AUTHORIZE_URL, authApi } from '@/api/auth';
import { isApiError } from '@/api/client';
import { qk } from '@/api/keys';
import { GoogleMark } from '@/components/brand/GoogleMark';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { EMAIL_PATTERN } from '@/lib/format';
import { applyFieldErrors } from '@/lib/forms';
import { AuthCard, AuthLayout } from './AuthLayout';
import { LOGIN_FAILED_LINES, authMessage } from './messages';

type LoginForm = { email: string; password: string };
type LoginState = { from?: string; notice?: string } | null;

// 구글 로그인이 실패하면 auth 가 /login/error?reason= 으로 돌려보낸다 — 이 페이지 위의 모달
const OAUTH_ERRORS: Record<string, { title: string; body: string }> = {
  FAILED: { title: '구글 로그인에 실패했습니다', body: '다시 시도해 주세요.' },
  WITHDRAWN: { title: '탈퇴한 계정입니다', body: '이 구글 계정으로 가입했던 계정은 탈퇴 처리되었습니다.' },
};

/** 명세서 2장 로그인 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const state = location.state as LoginState;
  const [formError, setFormError] = useState<string[] | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const oauthError =
    location.pathname === '/login/error' ? (OAUTH_ERRORS[params.get('reason') ?? ''] ?? OAUTH_ERRORS.FAILED) : null;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await authApi.login(values);
      queryClient.removeQueries({ queryKey: qk.session });
      const from = state?.from;
      navigate(from && !from.startsWith('/login') ? from : '/', { replace: true });
    } catch (error) {
      if (isApiError(error, 'LOGIN_FAILED')) {
        setFormError(LOGIN_FAILED_LINES);
      } else if (!applyFieldErrors(error, setError, ['email', 'password'])) {
        setFormError([authMessage(error)]);
      }
    }
  });

  return (
    <AuthLayout>
      <AuthCard>
        <h2 className="flex items-center gap-2 text-[1.75rem] font-bold tracking-[-0.01em] text-brand-title">
          로그인
          <PawPrint className="size-6" strokeWidth={2.2} aria-hidden />
        </h2>
        <p className="mt-1.5 text-[0.875rem] text-sub">함께하개 회원님이 되시면 앞으로도 기억할게요!</p>

        {state?.notice && (
          <p className="mt-5 rounded-[0.625rem] bg-brand-soft px-3.5 py-2.5 text-[0.8125rem] text-brand-strong">{state.notice}</p>
        )}

        <form className="mt-9 space-y-6" onSubmit={onSubmit} noValidate>
          <TextField
            label="이메일 주소"
            size="lg"
            type="email"
            autoComplete="email"
            placeholder="email@example.com"
            icon={<Mail className="size-[1.125rem]" />}
            error={errors.email?.message}
            {...register('email', {
              required: '이메일 주소를 입력해 주세요.',
              pattern: { value: EMAIL_PATTERN, message: '이메일 형식이 올바르지 않습니다.' },
            })}
          />
          <TextField
            label="비밀번호"
            size="lg"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호를 입력해주세요"
            icon={<KeyRound className="size-[1.125rem]" />}
            error={errors.password?.message}
            {...register('password', { required: '비밀번호를 입력해 주세요.' })}
          />

          {formError && (
            <div role="alert" className="rounded-[0.625rem] bg-alert-soft px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-alert">
              {formError.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            로그인하기
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-[0.8125rem]">
          <Link to="/password/reset" className="text-sub hover:text-ink">
            비밀번호 찾기
          </Link>
          <p className="text-sub">
            아직 회원이 아니신가요?{' '}
            <Link to="/signup" className="font-semibold text-brand-strong hover:underline">
              회원가입
            </Link>
          </p>
        </div>

        <div className="mt-8 border-t border-line pt-7">
          <p className="text-center text-[0.75rem] text-faint">간편 SNS 로그인</p>
          <button
            type="button"
            onClick={() => window.location.assign(GOOGLE_AUTHORIZE_URL)}
            className="mt-3.5 flex h-12 w-full items-center justify-center gap-2.5 rounded-[0.625rem] border border-[#dadce0] bg-white text-[0.9375rem] font-semibold text-[#1f1f1f] transition-colors hover:bg-[#f8f9fa]"
          >
            <GoogleMark />
            구글로 계속하기
          </button>
        </div>

        {/* 쓰던 화면을 잃지 않게 새 창으로 연다 */}
        <p className="mt-6 text-center text-[0.75rem] text-faint">
          <a href="/privacy" target="_blank" rel="noreferrer" className="hover:text-sub hover:underline">
            개인정보처리방침
          </a>
        </p>
      </AuthCard>

      {oauthError && (
        <Modal
          title={oauthError.title}
          onClose={() => navigate('/login', { replace: true })}
          actions={<Button onClick={() => navigate('/login', { replace: true })}>확인</Button>}
        >
          {oauthError.body}
        </Modal>
      )}
    </AuthLayout>
  );
}
