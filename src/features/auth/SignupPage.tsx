import { useQueryClient } from '@tanstack/react-query';
import { CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { authApi } from '@/api/auth';
import { isApiError } from '@/api/client';
import { qk } from '@/api/keys';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { EMAIL_PATTERN, formatClock, utf8Bytes } from '@/lib/format';
import { applyFieldErrors } from '@/lib/forms';
import { useCountdown } from '@/lib/hooks';
import { AuthCard, AuthLayout, MailSentNotice } from './AuthLayout';
import { PASSWORD_HINT, PASSWORD_TOO_LONG, authMessage } from './messages';

const RESEND_WAIT_MS = 60_000;
const CODE_TTL_MS = 10 * 60_000;

type SignupForm = { password: string; nickname: string };

/**
 * 명세서 3장 계정 만들기 (Step 1 of 2) — 명세서에 그림이 없어 2 · 4장과 같은 배치로 그렸다.
 * 인증코드 받기 → 코드 확인(통과 표시 30분) → 가입. 가입하면 쿠키가 심겨 바로 5장으로 간다.
 */
export function SignupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resendLeft = useCountdown(sentAt === null ? null : sentAt + RESEND_WAIT_MS);
  const codeLeft = useCountdown(sentAt === null ? null : sentAt + CODE_TTL_MS);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>();

  const changeEmail = (value: string) => {
    setEmail(value);
    if (sentAt !== null || verified) {
      setSentAt(null);
      setVerified(false);
      setCode('');
      setCodeError(null);
    }
  };

  const sendCode = async () => {
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setEmailError('이메일 형식이 올바르지 않습니다.');
      return;
    }
    setEmailError(null);
    setSending(true);
    try {
      await authApi.sendSignupCode(value);
      setSentAt(Date.now());
      setCode('');
      setCodeError(null);
    } catch (error) {
      setEmailError(authMessage(error));
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      setCodeError('인증 코드는 6자리 숫자입니다.');
      return;
    }
    setCodeError(null);
    setVerifying(true);
    try {
      await authApi.verifySignupCode(email.trim(), code);
      setVerified(true);
    } catch (error) {
      setCodeError(authMessage(error));
    } finally {
      setVerifying(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    if (!verified) {
      setFormError('이메일 인증을 먼저 완료해 주세요.');
      return;
    }
    try {
      await authApi.signup({ email: email.trim(), password: values.password, nickname: values.nickname.trim() });
      queryClient.removeQueries({ queryKey: qk.session });
      navigate('/signup/pets', { replace: true });
    } catch (error) {
      if (isApiError(error, 'EMAIL_NOT_VERIFIED')) {
        // 인증 표시는 30분 뒤 사라진다 — 다시 받게 한다
        setVerified(false);
        setSentAt(null);
        setFormError(authMessage(error));
      } else if (isApiError(error, 'EMAIL_ALREADY_EXISTS')) {
        setEmailError(authMessage(error));
      } else if (!applyFieldErrors(error, setError, ['password', 'nickname'])) {
        setFormError(authMessage(error));
      }
    }
  });

  const sent = sentAt !== null;
  const sendLabel = !sent ? '인증코드 받기' : resendLeft > 0 ? `재발송 (${resendLeft}초)` : '재발송';

  return (
    <AuthLayout>
      <AuthCard>
        <div className="flex items-baseline justify-between">
          <h2 className="text-[1.625rem] font-bold tracking-[-0.01em] text-brand-title">회원가입</h2>
          <span className="text-[0.875rem] font-semibold text-brand-strong">Step 1 of 2</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ebe5d9]">
          <div className="h-full w-1/2 rounded-full bg-brand-disabled" />
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          <div className="grid grid-cols-[minmax(0,1fr)_8.25rem] items-start gap-2.5">
            <TextField
              label="이메일 주소"
              type="email"
              autoComplete="email"
              placeholder="email@example.com"
              value={email}
              readOnly={verified}
              error={emailError ?? undefined}
              onChange={(e) => changeEmail(e.target.value)}
            />
            <Button
              variant={sent ? 'outline' : 'primary'}
              className="mt-[1.625rem]"
              onClick={sendCode}
              disabled={verified || sending || (sent && resendLeft > 0)}
            >
              {sendLabel}
            </Button>
          </div>

          {sent && !verified && (
            <>
              <MailSentNotice />
              <div className="grid grid-cols-[minmax(0,1fr)_8.25rem] items-start gap-2.5">
                <TextField
                  label="인증 코드"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="메일로 받은 6자리 숫자"
                  value={code}
                  error={codeError ?? undefined}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  trailing={<span className={`text-[0.8125rem] tabular-nums ${codeLeft > 0 ? 'text-faint' : 'text-alert'}`}>{formatClock(codeLeft)}</span>}
                />
                <Button className="mt-[1.625rem]" onClick={verifyCode} disabled={verifying}>
                  확인
                </Button>
              </div>
            </>
          )}

          {verified && (
            <p className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ok">
              <CircleCheck className="size-4" aria-hidden />
              이메일 인증을 마쳤습니다
            </p>
          )}

          <TextField
            label="비밀번호"
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호를 입력해주세요"
            hint={PASSWORD_HINT}
            error={errors.password?.message}
            {...register('password', {
              required: '비밀번호를 입력해 주세요.',
              minLength: { value: 8, message: '비밀번호는 8자 이상 72자 이하여야 합니다' },
              maxLength: { value: 72, message: '비밀번호는 8자 이상 72자 이하여야 합니다' },
              validate: (v) => utf8Bytes(v) <= 72 || PASSWORD_TOO_LONG,
            })}
          />
          <TextField
            label="닉네임"
            autoComplete="nickname"
            placeholder="예) 김다정"
            hint="2자 이상 20자 이하 · 후기에 표시됩니다"
            error={errors.nickname?.message}
            {...register('nickname', {
              required: '닉네임을 입력해 주세요.',
              validate: (v) => (v.trim().length >= 2 && v.trim().length <= 20) || '닉네임은 2자 이상 20자 이하여야 합니다',
            })}
          />

          {formError && (
            <p role="alert" className="rounded-[0.625rem] bg-alert-soft px-3.5 py-2.5 text-[0.8125rem] text-alert">
              {formError}
            </p>
          )}

          <Button type="submit" variant="strong" className="w-full" disabled={!verified || isSubmitting}>
            가입하고 반려동물 등록하기
          </Button>
        </form>

        <p className="mt-4 text-center text-[0.8125rem] text-sub">
          이미 회원이신가요?{' '}
          <Link to="/login" className="font-semibold text-brand-strong hover:underline">
            로그인
          </Link>
        </p>
        {/* 입력하던 값을 잃지 않게 새 창으로 연다 */}
        <p className="mt-2 text-center text-[0.75rem] text-faint">
          가입하면 입력한 정보를{' '}
          <a href="/privacy" target="_blank" rel="noreferrer" className="text-sub underline hover:text-ink">
            개인정보처리방침
          </a>
          에 따라 처리합니다.
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
