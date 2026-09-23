import { useQueryClient } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { authApi } from '@/api/auth';
import { commonMessage, isApiError } from '@/api/client';
import { qk } from '@/api/keys';
import { PHOTO_MAX_BYTES, PHOTO_TYPES, PhotoUploadError } from '@/api/pets';
import { usersApi } from '@/api/users';
import { MY_PHOTO_KEY, removeLocalPhoto, saveLocalPhoto, useLocalPhoto } from '@/features/pets/petPhotoStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { authMessage, PASSWORD_HINT, PASSWORD_TOO_LONG } from '@/features/auth/messages';
import { useAuthMe, useProfile } from '@/features/auth/session';
import { utf8Bytes } from '@/lib/format';
import { applyFieldErrors } from '@/lib/forms';
import { useCountdown } from '@/lib/hooks';
import { clearSessionPrefs } from '@/lib/storage';

type Msg = { ok: boolean; text: string } | null;

/** 계정 관리 — 그림이 없어 대조표 4/4 1-2 의 (안) 대로. 프로필 · 비밀번호 · 탈퇴 */
export function AccountPage() {
  const queryClient = useQueryClient();
  const me = useAuthMe();
  const profile = useProfile();
  const myPhoto = useLocalPhoto(MY_PHOTO_KEY, profile.data?.profileImageUrl);
  const isLocal = me.data?.authProvider === 'LOCAL';

  const [nickname, setNickname] = useState(profile.data?.nickname ?? '');
  useEffect(() => setNickname(profile.data?.nickname ?? ''), [profile.data?.nickname]);
  const [profileMsg, setProfileMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const refreshProfile = () => queryClient.invalidateQueries({ queryKey: qk.profile });

  const run = async (work: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setProfileMsg(null);
    try {
      await work();
      await refreshProfile();
      setProfileMsg({ ok: true, text: done });
    } catch (e) {
      const field = isApiError(e, 'VALIDATION_FAILED') ? e.fieldErrors[0]?.message : undefined;
      setProfileMsg({
        ok: false,
        text: e instanceof PhotoUploadError ? '사진을 올리지 못했습니다. 잠시 후 다시 시도해 주세요.' : (field ?? commonMessage(e)),
      });
    } finally {
      setBusy(false);
    }
  };

  const pickPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) return setProfileMsg({ ok: false, text: 'JPG, PNG 사진만 올릴 수 있습니다.' });
    if (file.size > PHOTO_MAX_BYTES) return setProfileMsg({ ok: false, text: '20MB 이하 사진만 올릴 수 있습니다.' });
    void run(async () => {
      try {
        const url = await usersApi.uploadProfilePhoto(file);
        await usersApi.updateProfile({ profileImageUrl: url });
        removeLocalPhoto(MY_PHOTO_KEY);
      } catch (e) {
        // 사진 저장소로 못 올리면 이 브라우저에만 담아 둔다
        if (!(e instanceof PhotoUploadError)) throw e;
        await saveLocalPhoto(MY_PHOTO_KEY, file);
      }
    }, '프로필 사진을 바꿨습니다.');
  };

  const trimmed = nickname.trim();
  const nicknameChanged = trimmed !== (profile.data?.nickname ?? '');

  return (
    <section>
      <h1 className="text-[1.875rem] font-bold tracking-[-0.01em] text-ink">계정 관리</h1>
      <p className="mt-1 text-[0.9375rem] text-sub">프로필과 비밀번호를 바꾸거나 탈퇴할 수 있어요.</p>

      <div className="mt-6 space-y-5">
        <Card title="프로필">
          <div className="flex items-center gap-6">
            {myPhoto ? (
              <img src={myPhoto} alt="" className="size-24 rounded-full object-cover" />
            ) : (
              <span className="grid size-24 place-items-center rounded-full bg-brand-soft text-brand-strong">
                <UserRound className="size-11" strokeWidth={1.5} aria-hidden />
              </span>
            )}
            <div className="flex gap-2">
              <Button variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}>
                사진 바꾸기
              </Button>
              {myPhoto && (
                <Button variant="outline" disabled={busy} onClick={() => void run(() => (async () => {
                  removeLocalPhoto(MY_PHOTO_KEY);
                  if (profile.data?.profileImageUrl) await usersApi.updateProfile({ profileImageUrl: null });
                })(), '프로필 사진을 지웠습니다.')}>
                  사진 지우기
                </Button>
              )}
              <input
                ref={fileInput}
                type="file"
                accept={PHOTO_TYPES.join(',')}
                className="hidden"
                onChange={(e) => {
                  pickPhoto(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          <div className="mt-6 grid max-w-[34rem] grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <TextField label="닉네임" value={nickname} maxLength={20} hint="2자 이상 20자 이하 · 후기에 표시됩니다" onChange={(e) => setNickname(e.target.value)} />
            <Button
              className="mt-[1.6rem]"
              disabled={busy || !nicknameChanged}
              onClick={() => {
                if (trimmed.length < 2) return setProfileMsg({ ok: false, text: '닉네임은 2자 이상 20자 이하여야 합니다' });
                void run(() => usersApi.updateProfile({ nickname: trimmed }), '닉네임을 바꿨습니다.');
              }}
            >
              저장
            </Button>
          </div>

          <dl className="mt-5 grid max-w-[34rem] grid-cols-[5.5rem_minmax(0,1fr)] gap-y-2 text-[0.9375rem]">
            <dt className="text-faint">이메일</dt>
            <dd className="truncate text-ink">{me.data?.email}</dd>
            <dt className="text-faint">가입 방식</dt>
            <dd className="text-ink">{isLocal ? '이메일로 가입' : '구글로 가입'}</dd>
          </dl>
          {profileMsg && <Note msg={profileMsg} />}
        </Card>

        {isLocal ? (
          <PasswordCard />
        ) : (
          <Card title="비밀번호">
            <p className="text-[0.9375rem] text-sub">구글로 가입한 계정은 비밀번호를 쓰지 않습니다. 로그인할 때 [구글로 계속하기] 를 눌러 주세요.</p>
          </Card>
        )}

        <Card title="탈퇴">
          <p className="text-[0.9375rem] leading-relaxed text-sub">
            탈퇴하면 즐겨찾기 · 일정 · 방문 기록 · 반려동물 정보와 남긴 후기가 지워지고 되돌릴 수 없습니다.
          </p>
          <Button variant="outline" className="mt-4 text-alert" onClick={() => setWithdrawOpen(true)}>
            탈퇴하기
          </Button>
        </Card>
      </div>

      {withdrawOpen && <WithdrawModal onClose={() => setWithdrawOpen(false)} />}
    </section>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white px-7 py-6 shadow-card">
      <h2 className="text-[1.1875rem] font-bold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Note({ msg }: { msg: NonNullable<Msg> }) {
  return (
    <p role={msg.ok ? 'status' : 'alert'} className={`mt-4 rounded-[0.625rem] px-3.5 py-2.5 text-[0.8125rem] ${msg.ok ? 'bg-brand-soft text-brand-strong' : 'bg-alert-soft text-alert'}`}>
      {msg.text}
    </p>
  );
}

function PasswordCard() {
  const [msg, setMsg] = useState<Msg>(null);
  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } = useForm<{ currentPassword: string; newPassword: string }>();

  const onSubmit = handleSubmit(async (v) => {
    setMsg(null);
    try {
      await authApi.changePassword(v);
      reset();
      setMsg({ ok: true, text: '비밀번호를 바꿨습니다.' });
    } catch (e) {
      if (isApiError(e, 'CURRENT_PASSWORD_MISMATCH')) setError('currentPassword', { message: '지금 비밀번호가 맞지 않습니다.' });
      else if (isApiError(e, 'PASSWORD_NOT_SUPPORTED')) setMsg({ ok: false, text: '구글로 가입한 계정은 비밀번호를 쓰지 않습니다.' });
      else if (!applyFieldErrors(e, setError, ['currentPassword', 'newPassword'])) setMsg({ ok: false, text: commonMessage(e) });
    }
  });

  return (
    <Card title="비밀번호 바꾸기">
      <form onSubmit={onSubmit} noValidate className="max-w-[34rem] space-y-4">
        <TextField
          label="지금 비밀번호"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword', { required: '지금 비밀번호를 입력해 주세요.' })}
        />
        <TextField
          label="새 비밀번호"
          type="password"
          autoComplete="new-password"
          hint={PASSWORD_HINT}
          error={errors.newPassword?.message}
          {...register('newPassword', {
            required: '새 비밀번호를 입력해 주세요.',
            minLength: { value: 8, message: '비밀번호는 8자 이상 72자 이하여야 합니다' },
            maxLength: { value: 72, message: '비밀번호는 8자 이상 72자 이하여야 합니다' },
            validate: (x) => utf8Bytes(x) <= 72 || PASSWORD_TOO_LONG,
          })}
        />
        <Button type="submit" variant="strong" disabled={isSubmitting}>
          비밀번호 바꾸기
        </Button>
      </form>
      {msg && <Note msg={msg} />}
    </Card>
  );
}

/** 탈퇴 — 코드 메일을 받아 6자리를 넣고 탈퇴한다. 후기는 서버가 account.withdrawn 을 받아 정리한다 */
function WithdrawModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useAuthMe();
  const [sentAt, setSentAt] = useState<number | null>(null);
  const left = useCountdown(sentAt === null ? null : sentAt + 60_000);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setError(null);
    setBusy(true);
    try {
      await authApi.sendWithdrawCode();
      setSentAt(Date.now());
    } catch (e) {
      setError(authMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setError(null);
    setBusy(true);
    try {
      await authApi.withdraw(code);
      clearSessionPrefs();
      queryClient.clear();
      navigate('/login', { replace: true, state: { notice: '탈퇴를 마쳤습니다. 그동안 함께해 주셔서 고맙습니다.' } });
    } catch (e) {
      setError(authMessage(e));
      setBusy(false);
    }
  };

  return (
    <Modal
      title="정말 탈퇴할까요?"
      size="md"
      onClose={onClose}
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button variant="strong" className="bg-alert hover:bg-[#a93028]" disabled={busy || !/^\d{6}$/.test(code)} onClick={() => void confirm()}>
            탈퇴하기
          </Button>
        </>
      }
    >
      <p>
        즐겨찾기 · 일정 · 방문 기록 · 반려동물 정보가 지워지고 되돌릴 수 없습니다. 가입한 이메일(<b className="text-ink">{me.data?.email}</b>)로 받은 인증 코드를 넣어 주세요.
      </p>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_8.5rem] items-start gap-2.5">
        <TextField
          label="인증 코드"
          inputMode="numeric"
          maxLength={6}
          placeholder="메일로 받은 6자리 숫자"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
        <Button variant="outline" className="mt-[1.6rem]" disabled={busy || (sentAt !== null && left > 0)} onClick={() => void send()}>
          {sentAt === null ? '코드 받기' : left > 0 ? `재발송 (${left}초)` : '재발송'}
        </Button>
      </div>
      {error && <p className="mt-3 rounded-[0.625rem] bg-alert-soft px-3.5 py-2.5 text-[0.8125rem] text-alert">{error}</p>}
    </Modal>
  );
}
