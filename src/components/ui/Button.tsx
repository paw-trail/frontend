import type { ComponentPropsWithRef } from 'react';

type Variant = 'primary' | 'strong' | 'outline' | 'line' | 'soft';
type Size = 'md' | 'lg' | 'xl';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-strong disabled:bg-brand-disabled',
  strong: 'bg-brand-strong text-white hover:bg-[#3f5c51] disabled:bg-brand-disabled',
  outline: 'border border-line bg-white text-ink hover:bg-field disabled:text-faint',
  line: 'border border-brand bg-white text-brand-strong hover:bg-brand-soft disabled:text-faint',
  soft: 'bg-brand-soft text-brand-strong hover:bg-[#dde8e0] disabled:text-faint',
};

// 높이 · 글자 크기는 여기서만 정한다 — className 으로 덮으면 어느 쪽이 이길지 보장되지 않는다
const SIZES: Record<Size, string> = {
  md: 'h-11 text-[0.9375rem]',
  lg: 'h-[3.125rem] text-[1rem]',
  xl: 'h-[3.25rem] text-[1.0625rem]',
};

type Props = ComponentPropsWithRef<'button'> & { variant?: Variant; size?: Size };

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-[0.625rem] px-4 font-semibold transition-colors ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}
