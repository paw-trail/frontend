import { useId, type ComponentPropsWithRef } from 'react';

const BASE =
  'h-11 rounded-[0.625rem] border text-[0.9375rem] font-semibold transition-colors disabled:cursor-default disabled:opacity-45';
const ON = 'border-brand-strong bg-brand-strong text-white';
const OFF = 'border-line bg-white text-ink hover:bg-field';

/** 따로 켜고 끄는 단추 (5장 동반 장비) — 켜면 진한 초록 */
export function ToggleButton({
  pressed,
  className = '',
  type = 'button',
  ...rest
}: ComponentPropsWithRef<'button'> & { pressed: boolean }) {
  return <button type={type} aria-pressed={pressed} className={`${BASE} ${pressed ? ON : OFF} ${className}`} {...rest} />;
}

type Choice<T> = { value: T; label: string };

type Props<T extends string | boolean> = {
  label: string;
  options: readonly Choice<T>[];
  value: T | null;
  onChange: (value: T) => void;
  hint?: string;
  error?: string;
  disabled?: boolean;
};

/** 둘 중 하나 고르기 (5장 접종 여부 · 증명서) */
export function ChoiceGroup<T extends string | boolean>({ label, options, value, onChange, hint, error, disabled }: Props<T>) {
  const labelId = useId();
  return (
    <div>
      <p id={labelId} className="mb-1.5 text-[0.875rem] font-semibold text-ink">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-2 gap-2.5">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`${BASE} ${value === o.value ? ON : OFF}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {error ? (
        <p className="mt-1.5 text-[0.75rem] text-alert">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.75rem] text-faint">{hint}</p>
      ) : null}
    </div>
  );
}
