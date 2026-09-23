import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { authApi } from '@/api/auth';
import { isApiError } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { EMAIL_PATTERN, formatClock, utf8Bytes } from '@/lib/format';
import { applyFieldErrors } from '@/lib/forms';
import { useCountdown } from '@/lib/hooks';
import { AuthCard, AuthLayout, MailSentNotice } from './AuthLayout';
import { PASSWORD_HINT, PASSWORD_TOO_LONG, authMessage } from './messages';

const RESEND_WAIT_MS = 60_000; // auth 발송 쿨다운 60초
const CODE_TTL_MS = 10 * 60_000; // 인증 코드 수명 10분

type ResetForm = { code: string; newPassword: string };

/**
 * 명세서 4장 비밀번호 찾기 (개선안).
 * 발송은 가입 안 된 이메일 · 발송 제한에 걸린 요청도 늘 200 이라 성공과 실패를 가르지 않는다.
 * 아래 카드는 코드를 보낸 뒤에 열린다.
 */
export function PasswordResetPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resendLeft = useCountdown(sentAt === null ? null : sentAt + RESEND_WAIT_MS);
  const codeLeft = useCountdown(sentAt === null ? null : sentAt + CODE_TTL_MS);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>();

  const sendCode = async () => {
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setEmailError('이메일 형식이 올바르지 않습니다.');
      return;
    }
    setEmailError(null);
    setSending(true);
    try {
      await authApi.sendResetCode(value);
      setSentAt(Date.now());
    } catch (error) {
      setEmailError(authMessage(error));
    } finally {
      setSending(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await authApi.resetPassword({ email: email.trim(), code: values.code, newPassword: values.newPassword });
      // 재설정에 성공하면 그 계정의 토큰이 모두 폐기된다
      navigate('/login', { replace: true, state: { notice: '비밀번호를 바꿨습니다. 새 비밀번호로 로그인해 주세요.' } });
    } catch (error) {
      if (isApiError(error, 'INVALID_VERIFICATION_CODE') || isApiError(error, 'TOO_MANY_VERIFICATION_ATTEMPTS')) {
        setError('code', { type: 'server', message: authMessage(error) });
      } else if (!applyFieldErrors(error, setError, ['code', 'newPassword'])) {
        setFormError(authMessage(error));
      }
    }
  });

  const sent = sentAt !== null;
  const sendLabel = !sent ? '인증코드 받기' : resendLeft > 0 ? `재발송 (${resendLeft}초)` : '재발송';

  return (
    <AuthLayout cardOffset="pt-[1.875rem]">
      <AuthCard>
        <h2 className="text-[1.625rem] font-bold tracking-[-0.01em] text-brand-title">비밀번호 찾기</h2>

        <div className="mt-5">
          <TextField
            label="이메일 주소"
            type="email"
            autoComplete="email"
            placeholder="email@example.com"
            value={email}
            error={emailError ?? undefined}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!sent || resendLeft === 0) void sendCode();
              }
            }}
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => navigate('/login')}>
              취소
            </Button>
            <Button onClick={sendCode} disabled={sending || (sent && resendLeft > 0)}>
              {sendLabel}
            </Button>
          </div>
        </div>

        {sent && (
          <form className="mt-5 border-t border-line pt-5" onSubmit={onSubmit} noValidate>
            <MailSentNotice showSocialHint />

            <div className="mt-4 space-y-4">
              <TextField
                label="인증 코드"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="메일로 받은 6자리 숫자"
                error={errors.code?.message}
                trailing={<span className={`text-[0.8125rem] tabular-nums ${codeLeft > 0 ? 'text-faint' : 'text-alert'}`}>{formatClock(codeLeft)}</span>}
                {...register('code', {
                  required: '인증 코드를 입력해 주세요.',
                  pattern: { value: /^\d{6}$/, message: '인증 코드는 6자리 숫자입니다.' },
                })}
              />
              <TextField
                label="새로운 비밀번호"
                type="password"
                autoComplete="new-password"
                placeholder="비밀번호를 입력해주세요"
                hint={PASSWORD_HINT}
                error={errors.newPassword?.message}
                {...register('newPassword', {
                  required: '새 비밀번호를 입력해 주세요.',
                  minLength: { value: 8, message: '비밀번호는 8자 이상 72자 이하여야 합니다' },
                  maxLength: { value: 72, message: '비밀번호는 8자 이상 72자 이하여야 합니다' },
                  validate: (v) => utf8Bytes(v) <= 72 || PASSWORD_TOO_LONG,
                })}
              />
            </div>

            {formError && (
              <p role="alert" className="mt-4 rounded-[0.625rem] bg-alert-soft px-3.5 py-2.5 text-[0.8125rem] text-alert">
                {formError}
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => navigate('/login')}>
                취소
              </Button>
              <Button type="submit" variant="strong" disabled={isSubmitting}>
                비밀번호 저장
              </Button>
            </div>
          </form>
        )}
      </AuthCard>

      <p className="mt-3 text-right text-[0.8125rem] text-sub">
        아직 회원이 아니신가요?{' '}
        <Link to="/signup" className="font-semibold text-brand-strong hover:underline">
          회원가입
        </Link>
      </p>
    </AuthLayout>
  );
}
