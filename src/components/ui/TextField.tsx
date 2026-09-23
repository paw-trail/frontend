import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';

type Props = Omit<ComponentPropsWithRef<'input'>, 'size'> & {
  label: string;
  icon?: ReactNode;
  /** 입력칸 안 오른쪽 (남은 시간 등) */
  trailing?: ReactNode;
  error?: string;
  hint?: string;
  size?: 'md' | 'lg';
};

/** 명세서 그림의 입력칸 — 흰 기운이 도는 바탕 · 옅은 테두리 · 위에 굵은 라벨 */
export function TextField({ label, icon, trailing, error, hint, id, size = 'md', className = '', ...rest }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;

  return (
    <div className={className}>
      <label htmlFor={inputId} className={`mb-1.5 block font-semibold text-ink ${size === 'lg' ? 'text-[0.875rem]' : 'text-[0.8125rem]'}`}>
        {label}
      </label>
      <div
        className={`flex ${size === 'lg' ? 'h-12' : 'h-11'} items-center gap-2 rounded-[0.625rem] border bg-field px-3.5 transition-colors ${
          error ? 'border-alert' : 'border-line focus-within:border-brand'
        }`}
      >
        {icon && <span className="shrink-0 text-faint">{icon}</span>}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-[0.9375rem] text-ink outline-none placeholder:text-faint read-only:text-sub focus-visible:outline-none"
          {...rest}
        />
        {trailing}
      </div>
      {error ? (
        <p id={messageId} className="mt-1.5 text-[0.75rem] text-alert">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-1.5 text-[0.75rem] text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
