import { Navigate, createBrowserRouter } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { AccountPage } from '@/features/account/AccountPage';
import { AdminLayout } from '@/features/admin/AdminLayout';
import { OpsAdminPage } from '@/features/admin/OpsAdminPage';
import { OutboxAdminPage } from '@/features/admin/OutboxAdminPage';
import { PlacesAdminPage } from '@/features/admin/PlacesAdminPage';
import { PoliciesAdminPage } from '@/features/admin/PoliciesAdminPage';
import { ReportsAdminPage } from '@/features/admin/ReportsAdminPage';
import { InquiriesPage } from '@/features/account/InquiriesPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { OAuthSuccessPage } from '@/features/auth/OAuthSuccessPage';
import { PasswordResetPage } from '@/features/auth/PasswordResetPage';
import { RequireSession } from '@/features/auth/RequireSession';
import { SignupPage } from '@/features/auth/SignupPage';
import { MainPage } from '@/features/main/MainPage';
import { NotificationSettingsPage } from '@/features/notifications/NotificationSettingsPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { MyPageLayout } from '@/features/mypage/MyPageLayout';
import { FavoritesPage } from '@/features/mypage/FavoritesPage';
import { MyReviewsPage } from '@/features/mypage/MyReviewsPage';
import { PetEditPage } from '@/features/mypage/PetEditPage';
import { MyRecentPage } from '@/features/mypage/MyRecentPage';
import { VisitedPage } from '@/features/mypage/VisitedPage';
import { VisitsPage } from '@/features/mypage/VisitsPage';
import { ItineraryPage } from '@/features/itinerary/ItineraryPage';
import { PetRegisterPage } from '@/features/pets/PetRegisterPage';
import { PlaceDetailPage } from '@/features/place/PlaceDetailPage';
import { RecentPage } from '@/features/recent/RecentPage';
import { ReviewWritePage } from '@/features/reviews/ReviewWritePage';
import { PrivacyPage } from '@/features/legal/PrivacyPage';
import { SearchPage } from '@/features/search/SearchPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/login/error', element: <LoginPage /> },
  { path: '/login/success', element: <OAuthSuccessPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/password/reset', element: <PasswordResetPage /> },
  // 개인정보처리방침 — 로그인 전에도 읽을 수 있어야 해서 RequireSession 바깥에 둔다
  { path: '/privacy', element: <PrivacyPage /> },
  {
    element: <RequireSession />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <MainPage /> },
          { path: 'signup/pets', element: <PetRegisterPage /> },
          { path: 'search', element: <SearchPage /> },
          { path: 'recent', element: <RecentPage /> },
          { path: 'places/:placeId', element: <PlaceDetailPage /> },
          { path: 'places/:placeId/review', element: <ReviewWritePage /> },
          { path: 'itinerary', element: <ItineraryPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <ReportsAdminPage /> },
              { path: 'places', element: <PlacesAdminPage /> },
              { path: 'policies', element: <PoliciesAdminPage /> },
              { path: 'outbox', element: <OutboxAdminPage /> },
              { path: 'ops', element: <OpsAdminPage /> },
            ],
          },
          {
            path: 'mypage',
            element: <MyPageLayout />,
            children: [
              { index: true, element: <VisitsPage /> },
              { path: 'pets', element: <PetEditPage /> },
              { path: 'favorites', element: <FavoritesPage /> },
              { path: 'recent', element: <MyRecentPage /> },
          { path: 'visited', element: <VisitedPage /> },
              { path: 'reviews', element: <MyReviewsPage /> },
              { path: 'account', element: <AccountPage /> },
              { path: 'notifications', element: <NotificationSettingsPage /> },
              { path: 'inquiries', element: <InquiriesPage /> },
            ],
          },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);
