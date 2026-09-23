import { ChevronDown, PawPrint } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuthMe, useProfile } from '@/features/auth/session';
import { useSignOut } from '@/features/auth/useSignOut';

export function AccountMenu() {
  const me = useAuthMe();
  const profile = useProfile();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const signOut = useSignOut();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const photo = profile.data?.profileImageUrl ?? null;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="내 계정"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full"
      >
        {photo ? (
          <img src={photo} alt="" className="size-9 rounded-full object-cover" />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
            <PawPrint className="size-[1.125rem]" />
          </span>
        )}
        <ChevronDown className="size-4 text-sub" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-12 z-40 w-48 overflow-hidden rounded-xl border border-line bg-white py-1.5 shadow-float">
          <p className="truncate px-4 pb-2 pt-1.5 text-[0.8125rem] text-faint">{profile.data?.nickname ?? me.data?.email}</p>
          <Link role="menuitem" to="/mypage" className="block px-4 py-2 text-[0.875rem] text-ink hover:bg-field" onClick={() => setOpen(false)}>
            마이페이지
          </Link>
          {me.data?.role === 'ADMIN' && (
            <Link role="menuitem" to="/admin" className="block px-4 py-2 text-[0.875rem] text-ink hover:bg-field" onClick={() => setOpen(false)}>
              관리자 화면
            </Link>
          )}
          <button role="menuitem" type="button" onClick={() => void signOut()} className="block w-full px-4 py-2 text-left text-[0.875rem] text-ink hover:bg-field">
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
