import { useEffect, useId, type ReactNode } from 'react';

type Props = { title: string; children?: ReactNode; actions?: ReactNode; onClose: () => void; size?: 'sm' | 'md' | 'lg' };

const WIDTH = { sm: 'w-[27.5rem]', md: 'w-[34rem]', lg: 'w-[46rem]' } as const;

export function Modal({ title, children, actions, onClose, size = 'sm' }: Props) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={`${WIDTH[size]} flex max-h-[86vh] flex-col rounded-2xl bg-white p-7 shadow-float`}>
        <h2 id={titleId} className="text-[1.125rem] font-bold text-ink">
          {title}
        </h2>
        {children && <div className="mt-2 min-h-0 overflow-y-auto text-[0.875rem] leading-relaxed text-sub">{children}</div>}
        {actions && <div className="mt-6 flex shrink-0 justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}
