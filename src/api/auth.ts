import { api } from './client';
import type { Account } from './types';

export const authApi = {
  me: () => api<Account>('/auth/me'),
  login: (body: { email: string; password: string }) => api<Account>('/auth/login', { method: 'POST', body }),
  logout: () => api<null>('/auth/logout', { method: 'POST' }),

  sendSignupCode: (email: string) => api<null>('/auth/email/verify-request', { method: 'POST', body: { email } }),
  verifySignupCode: (email: string, code: string) =>
    api<null>('/auth/email/verify', { method: 'POST', body: { email, code } }),
  signup: (body: { email: string; password: string; nickname: string }) =>
    api<Account>('/auth/signup', { method: 'POST', body }),

  sendResetCode: (email: string) => api<null>('/auth/password/reset-request', { method: 'POST', body: { email } }),
  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    api<null>('/auth/password/reset', { method: 'POST', body }),

  /** 이메일로 가입한 계정만 — 구글 계정은 400 PASSWORD_NOT_SUPPORTED */
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api<null>('/auth/me/password', { method: 'PATCH', body }),
  /** 가입한 이메일로 탈퇴 코드 6자리 */
  sendWithdrawCode: () => api<null>('/auth/withdraw/verify-request', { method: 'POST' }),
  withdraw: (code: string) => api<null>('/auth/me', { method: 'DELETE', body: { code } }),
};

/** 구글 로그인은 fetch 가 아니라 주소창 이동으로 시작한다 (302 를 따라가야 함) */
export const GOOGLE_AUTHORIZE_URL = '/api/v1/auth/oauth/google/authorize';
