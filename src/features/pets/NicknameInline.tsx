import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { isApiError } from '@/api/client';
import { qk } from '@/api/keys';
import { usersApi } from '@/api/users';
import { Button } from '@/components/ui/Button';

/**
 * 구글로 새로 가입하면 닉네임이 비어 있다 — 5장 「보호자 정보」 칸에서 받는다.
 * 닉네임은 후기에 표시되므로 비워 둔 채 두지 않게 한다.
 */
export function NicknameInline({ email }: { email: string }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const nickname = value.trim();
    if (nickname.length < 2 || nickname.length > 20) {
      setError('닉네임은 2자 이상 20자 이하여야 합니다');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await usersApi.updateProfile({ nickname });
      await queryClient.invalidateQueries({ queryKey: qk.profile });
    } catch (e) {
      const field = isApiError(e, 'VALIDATION_FAILED') ? e.fieldErrors.find((f) => f.field === 'nickname') : undefined;
      setError(field?.message ?? '닉네임을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-b border-line pb-3.5">
      <div className="flex items-center gap-2.5">
        <span className="shrink-0 text-[1.0625rem] font-bold text-ink">보호자 정보:</span>
        <input
          aria-label="닉네임"
          value={value}
          maxLength={20}
          placeholder="닉네임 (후기에 표시됩니다)"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save();
          }}
          className={`h-10 min-w-0 flex-1 rounded-[0.625rem] border bg-field px-3 text-[0.9375rem] outline-none focus-visible:outline-none ${
            error ? 'border-alert' : 'border-line focus:border-brand'
          }`}
        />
        <Button size="md" className="h-10 shrink-0" onClick={save} disabled={saving}>
          저장
        </Button>
      </div>
      <p className={`mt-1.5 text-[0.75rem] ${error ? 'text-alert' : 'text-faint'}`}>
        {error ?? `${email} · 구글로 가입해 닉네임이 비어 있습니다`}
      </p>
    </div>
  );
}
