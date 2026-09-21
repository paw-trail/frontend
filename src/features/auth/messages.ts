import { ApiError, commonMessage } from '@/api/client';

// 문구는 화면이 code 마다 가진다 — 서버 message 를 그대로 뿌리지 않는다 (2026.9.3 결정)
export const LOGIN_FAILED_LINES = [
  '이메일 또는 비밀번호를 다시 확인해주세요.',
  '구글로 가입하셨다면 아래 [구글로 계속하기]를 눌러주세요.',
];

export const PASSWORD_HINT = '8자 이상 72자 이하 · 한글은 한 글자가 세 자리로 계산됩니다';
export const PASSWORD_TOO_LONG = '비밀번호가 너무 깁니다. 한글은 한 글자가 세 자리로 계산됩니다';

const CODE_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: '이미 가입된 이메일입니다. 로그인해 주세요.',
  MAIL_SEND_COOLDOWN: '잠시 후 다시 요청해 주세요.',
  MAIL_SEND_FAILED: '메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.',
  INVALID_VERIFICATION_CODE: '인증 코드가 올바르지 않거나 만료되었습니다.',
  TOO_MANY_VERIFICATION_ATTEMPTS: '시도가 너무 많습니다. 코드를 다시 받아 주세요.',
  EMAIL_NOT_VERIFIED: '이메일 인증을 먼저 완료해 주세요.',
  ACCOUNT_WITHDRAWN: '탈퇴한 계정입니다.',
};

export function authMessage(error: unknown): string {
  if (error instanceof ApiError && CODE_MESSAGES[error.code]) return CODE_MESSAGES[error.code];
  return commonMessage(error);
}
