import { useQueries, useQuery } from '@tanstack/react-query';
import { ChevronRight, ShieldAlert } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { adminReportsApi, OUTBOX_SERVICES, outboxApi } from '@/api/admin';
import { Button } from '@/components/ui/Button';
import { useAuthMe } from '@/features/auth/session';

const MENU: [string, string, 'reports' | 'outbox' | null][] = [
  ['/admin', '제보 처리', 'reports'],
  ['/admin/places', '장소 관리', null],
  ['/admin/policies', '조건 정정', null],
  ['/admin/outbox', '이벤트 재발행', 'outbox'],
  ['/admin/ops', '운영', null],
];

/** 17~21장 공통 틀 — 왼쪽 관리자 메뉴 · 건수 배지. ADMIN 이 아니면 막는다 (대조표 4/4 3-1) */
export function AdminLayout() {
  const me = useAuthMe();
  const navigate = useNavigate();
  const isAdmin = me.data?.role === 'ADMIN';

  // 건수는 목록을 size=1 로 불러 totalElements 를 읽는다
  const pending = useQuery({
    queryKey: ['admin', 'reports', 'count', 'PENDING'],
    queryFn: () => adminReportsApi.list('PENDING', 0, 1),
    enabled: isAdmin,
    staleTime: 30_000,
  });
  const outbox = useQueries({
    queries: OUTBOX_SERVICES.map((s) => ({
      queryKey: ['admin', 'outbox', 'count', s.key],
      queryFn: () => outboxApi.list(s.key, 0, 1),
      enabled: isAdmin,
      staleTime: 30_000,
    })),
  });
  const outboxTotal = outbox.reduce((sum, q) => sum + (q.data?.page.totalElements ?? 0), 0);

  if (!isAdmin) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="size-10 text-alert" aria-hidden />
        <p className="text-[1.25rem] font-bold text-ink">관리자만 볼 수 있습니다</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          첫 화면으로
        </Button>
      </main>
    );
  }

  return (
    <main className="px-16 pb-16 pt-8">
      <div className="grid grid-cols-[15.5rem_minmax(0,1fr)] items-start gap-7">
        <nav aria-label="관리자 메뉴" className="rounded-2xl bg-white py-3 shadow-card">
          <p className="px-5 pb-2 text-[0.8125rem] font-bold text-sub">관리자 메뉴</p>
          {MENU.map(([to, label, badge]) => {
            const count = badge === 'reports' ? (pending.data?.page.totalElements ?? 0) : badge === 'outbox' ? outboxTotal : 0;
            return (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `mx-2 flex items-center justify-between rounded-lg px-3.5 py-2.5 text-[0.9375rem] transition-colors ${
                    isActive ? 'bg-brand-soft font-semibold text-ink' : 'text-sub hover:bg-field hover:text-ink'
                  }`
                }
              >
                {label}
                {count > 0 ? (
                  <span className="min-w-[1.5rem] rounded-full bg-alert-soft px-2 py-0.5 text-center text-[0.75rem] font-bold text-alert">{count}</span>
                ) : (
                  <ChevronRight className="size-4 text-faint" aria-hidden />
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
