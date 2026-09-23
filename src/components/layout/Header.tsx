import { useQuery } from '@tanstack/react-query';
import { Bell, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { qk } from '@/api/keys';
import { notificationsApi } from '@/api/notifications';
import { HeaderLogo } from '@/components/brand/Logo';
import { useSampleUnread } from '@/features/notifications/sampleNotification';
import { AccountMenu } from './AccountMenu';

/** 명세서 5장 이후 모든 화면의 머리 — 로고 · 벨 · 여정 · 계정 */
export function Header() {
  // 헤더 벨 — 실시간이 아니라 45초마다 안 읽은 수를 묻는다 (notification 은 SSE 를 안 씀)
  const unread = useQuery({
    queryKey: qk.unreadCount,
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 45_000,
    staleTime: 30_000,
    retry: false,
  });
  const serverCount = unread.data?.unreadCount ?? 0;
  const count = serverCount + useSampleUnread(serverCount);
  const inAdmin = useLocation().pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-30 h-[4.75rem] border-b border-[#ece6da] bg-white">
      <div className="shell flex h-full items-center justify-between px-14">
        <div className="flex items-center gap-2.5">
          <Link to="/" aria-label="함께하개 첫 화면">
            <HeaderLogo />
          </Link>
          {inAdmin && (
            <Link to="/admin" className="rounded-md bg-brand-strong px-2 py-0.5 text-[0.8125rem] font-bold text-white">
              관리자
            </Link>
          )}
        </div>
        <nav className="flex items-center gap-5" aria-label="바로가기">
          <Link to="/notifications" aria-label={count > 0 ? `알림 ${count}개` : '알림'} className="relative text-ink">
            <Bell className="size-6" strokeWidth={1.8} />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-alert px-1 text-[0.6875rem] font-bold text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
          <Link to="/itinerary" aria-label="내 여정" className="text-ink">
            <MapPin className="size-6" strokeWidth={1.8} />
          </Link>
          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}
