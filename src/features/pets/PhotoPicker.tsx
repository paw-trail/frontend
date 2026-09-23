import { Camera, X } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from '@/api/pets';

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
  error: string | null;
  onError: (message: string | null) => void;
  /** 이미 올린 사진 (13장 수정) — 새 파일을 고르지 않았을 때 보인다 */
  existingUrl?: string | null;
  onRemoveExisting?: () => void;
};

/** 5장 「반려견 사진」 — 점선 상자를 누르면 파일을 고른다. 올리기는 [등록] 때 한다. */
export function PhotoPicker({ file, onChange, error, onError, existingUrl, onRemoveExisting }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const preview = objectUrl ?? existingUrl ?? null;

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const pick = (picked: File | undefined) => {
    if (!picked) return;
    if (!(PHOTO_TYPES as readonly string[]).includes(picked.type)) {
      onError('JPG, PNG 파일만 올릴 수 있습니다.');
      return;
    }
    if (picked.size > PHOTO_MAX_BYTES) {
      onError('20MB 이하 사진만 올릴 수 있습니다.');
      return;
    }
    onError(null);
    onChange(picked);
  };

  return (
    <div className="flex h-full flex-col">
      <p className="mb-1.5 text-[0.875rem] font-semibold text-ink">반려견 사진</p>
      <div className="relative min-h-[15rem] flex-1">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={`flex size-full flex-col items-center justify-center overflow-hidden rounded-xl border-[1.5px] border-dashed bg-[#edf1ec] transition-colors hover:bg-[#e4ebe5] ${
            error ? 'border-alert' : 'border-brand-strong/70'
          }`}
        >
          {preview ? (
            <img src={preview} alt="고른 사진 미리보기" className="absolute inset-0 size-full object-cover" />
          ) : (
            <>
              <Camera className="size-7 text-brand-strong" strokeWidth={1.8} aria-hidden />
              <span className="mt-2.5 text-[0.9375rem] font-bold text-brand-strong">클릭하여 사진을 업로드</span>
              <span className="mt-1 text-[0.8125rem] text-sub">JPG, PNG 형식 지원</span>
            </>
          )}
        </button>
        {preview && (
          <button
            type="button"
            aria-label="사진 빼기"
            onClick={() => {
              if (file) onChange(null);
              else onRemoveExisting?.();
              onError(null);
            }}
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70"
          >
            <X className="size-4" />
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept={PHOTO_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      {error && <p className="mt-1.5 text-[0.75rem] text-alert">{error}</p>}
    </div>
  );
}
