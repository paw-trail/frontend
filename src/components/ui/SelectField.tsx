import { ChevronDown } from 'lucide-react';
import { useId, type ComponentPropsWithRef } from 'react';

type Option = { value: string; label: string };

type Props = Omit<ComponentPropsWithRef<'select'>, 'size'> & {
  label: string;
  options: readonly Option[];
  /** 고르기 전 흐리게 보이는 첫 줄 */
  placeholder?: string;
  /** 지금 값 — 비어 있으면 첫 줄처럼 흐리게 */
  current?: string;
  error?: string;
  hint?: string;
  size?: 'md' | 'lg';
};

export function SelectField({ label, options, placeholder, current, error, hint, size = 'lg', id, className = '', ...rest }: Props) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const messageId = `${selectId}-message`;

  return (
    <div className={className}>
      <label htmlFor={selectId} className={`mb-1.5 block font-semibold text-ink ${size === 'lg' ? 'text-[0.875rem]' : 'text-[0.8125rem]'}`}>
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={`w-full appearance-none rounded-[0.625rem] border bg-field pl-3.5 pr-11 text-[0.9375rem] outline-none transition-colors focus-visible:outline-none ${
            size === 'lg' ? 'h-12' : 'h-11'
          } ${current ? 'text-ink' : 'text-faint'} ${error ? 'border-alert' : 'border-line focus:border-brand'}`}
          {...rest}
        >
          {placeholder !== undefined && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} className="text-ink">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-sub" />
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
