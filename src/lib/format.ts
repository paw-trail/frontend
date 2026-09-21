export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 남은 초를 09:41 처럼 */
export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 비밀번호 상한은 72바이트 — 한글은 한 글자가 3바이트 */
export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** 전화번호에 하이픈을 넣는다 — 서버는 02-381-5052 와 0222377582 를 섞어 보낸다 */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return '';
  const d = raw.replace(/\D/g, '');
  if (d.startsWith('02')) {
    if (d.length === 9) return `02-${d.slice(2, 5)}-${d.slice(5)}`;
    if (d.length === 10) return `02-${d.slice(2, 6)}-${d.slice(6)}`;
  }
  if (d.length === 8 && /^1[5-9]/.test(d)) return `${d.slice(0, 4)}-${d.slice(4)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  return raw;
}

/** 이름 끝 글자의 받침으로 조사를 고른다 — 몽이와 · 콩과 */
export function withJosa(name: string, noBatchim: string, batchim: string): string {
  const code = name.charCodeAt(name.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return `${name}${noBatchim}`;
  return `${name}${(code - 0xac00) % 28 === 0 ? noBatchim : batchim}`;
}

/** 850m · 12.4km */
export function formatDistance(meters: number | null | undefined): string | null {
  if (meters === null || meters === undefined) return null;
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/** 카드 응답에 시군구 칸이 없어 주소 두 번째 토막을 쓴다 (대조표 2/4 1-2) */
export function sigunguOf(address: string | null | undefined): string | null {
  if (!address) return null;
  const parts = address.trim().split(/\s+/);
  if (parts[0]?.startsWith('세종')) return '세종';
  return parts[1] ?? null;
}

/** 2026-09-20T15:00:00 → 오후 3시 */
export function hourLabel(iso: string): string {
  const h = Number(iso.slice(11, 13));
  if (Number.isNaN(h)) return '';
  if (h === 0) return '밤 12시';
  if (h < 12) return `오전 ${h}시`;
  if (h === 12) return '낮 12시';
  return `오후 ${h - 12}시`;
}

/** 2026-10-05 → 2026년 10월 05일 (명세서 그림의 표기) */
export function formatDateKo(date: string | null | undefined): string {
  if (!date) return '';
  const [y, m, d] = date.slice(0, 10).split('-');
  return y && m && d ? `${y}년 ${m}월 ${d}일` : date;
}

/** 오늘 날짜 2026-09-20 (브라우저 시간대) */
export function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 2026-10-15 → 2026년 10월 15일 (목) — 8장 「일정 추가」 그림의 표기 */
export function formatDateWithWeekday(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return `${y}년 ${m}월 ${d}일 (${WEEKDAYS[new Date(y, m - 1, d).getDay()]})`;
}

/** 13:00 → 오후 1:00 */
export function formatTimeKo(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${h < 12 ? '오전' : '오후'} ${hour12}:${String(m).padStart(2, '0')}`;
}

/** 3분 전 · 5시간 전 · 9월 18일 — 알림 목록 */
export function timeAgo(iso: string): string {
  const then = new Date(iso.length === 19 ? iso : iso.slice(0, 19)).getTime();
  const diff = Math.max(0, Date.now() - then) / 60_000;
  if (Number.isNaN(diff)) return '';
  if (diff < 1) return '방금';
  if (diff < 60) return `${Math.floor(diff)}분 전`;
  if (diff < 24 * 60) return `${Math.floor(diff / 60)}시간 전`;
  const [, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${m}월 ${d}일`;
}
