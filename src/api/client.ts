/*
 * 모든 API 호출이 지나는 곳.
 *
 * 응답 봉투 { code, message, data, traceId } 를 풀어 data 만 돌려주고,
 * 실패는 ApiError 로 던진다. 분기는 상태 코드가 아니라 code 로 한다.
 *
 * 401 이 와도 code 가 AUTHENTICATION_FAILED(게이트웨이 · 토큰 만료)일 때만 갱신한다.
 * LOGIN_FAILED 같은 401 에 갱신을 걸면 로그인 실패가 갱신 실패로 둔갑한다.
 * 동시에 여러 요청이 401 이면 갱신은 한 번만 하고 나머지는 그 결과를 기다린다.
 */

export type FieldError = { field: string; message: string };

type Envelope<T> = {
  code: string;
  message: string;
  data: T;
  traceId: string | null;
};

export const NETWORK_ERROR = 'NETWORK_ERROR';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly data: unknown;
  readonly traceId: string | null;

  constructor(status: number, code: string, message: string, data: unknown = null, traceId: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
    this.traceId = traceId;
  }

  /** VALIDATION_FAILED 의 칸별 오류. 없으면 빈 배열. */
  get fieldErrors(): FieldError[] {
    return Array.isArray(this.data) ? (this.data as FieldError[]) : [];
  }
}

export function isApiError(error: unknown, code?: string): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code);
}

type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue | readonly QueryValue[]>;

/** 목록 파라미터는 같은 이름을 되풀이한다 — placeType=PARK&placeType=CAFE */
export function toQueryString(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      if (v === undefined || v === null || v === '') continue;
      params.append(key, String(v));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
};

let sessionExpiredHandler: (() => void) | null = null;

/** 갱신까지 실패했을 때 부를 함수 (로그인 화면으로 보냄) */
export function setSessionExpiredHandler(handler: () => void) {
  sessionExpiredHandler = handler;
}

let refreshing: Promise<boolean> | null = null;

function refreshOnce(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: string | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }
  try {
    return await fetch(`/api/v1${path}${toQueryString(options.query)}`, {
      method: options.method ?? 'GET',
      headers,
      body,
      credentials: 'include',
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, NETWORK_ERROR, '서버에 연결하지 못했습니다.');
  }
}

async function readEnvelope(res: Response): Promise<Envelope<unknown> | null> {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as Envelope<unknown>;
    return typeof parsed === 'object' && parsed !== null && typeof parsed.code === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function toError(res: Response, envelope: Envelope<unknown> | null): ApiError {
  if (envelope) {
    return new ApiError(res.status, envelope.code, envelope.message, envelope.data, envelope.traceId);
  }
  // 봉투가 없는 실패 — 게이트웨이가 안 떠 있어 개발 서버 프록시가 직접 답한 경우 등
  return new ApiError(
    res.status,
    res.status >= 500 ? 'SERVICE_UNAVAILABLE' : 'UNKNOWN_ERROR',
    '요청을 처리하지 못했습니다.',
  );
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await send(path, options);
  let envelope = await readEnvelope(res);

  if (res.status === 401 && envelope?.code === 'AUTHENTICATION_FAILED') {
    if (await refreshOnce()) {
      res = await send(path, options);
      envelope = await readEnvelope(res);
    }
    if (res.status === 401) {
      setTimeout(() => sessionExpiredHandler?.(), 0);
    }
  }

  if (res.ok && (envelope === null || envelope.code === 'SUCCESS')) {
    return (envelope?.data ?? undefined) as T;
  }
  throw toError(res, envelope);
}

/** 화면에 띄울 일반 문구 — 서버 문구를 그대로 쓰지 않는다 */
export function commonMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  switch (error.code) {
    case NETWORK_ERROR:
    case 'SERVICE_UNAVAILABLE':
      return '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.';
    case 'ACCESS_DENIED':
      return '이 화면을 볼 권한이 없습니다.';
    default:
      return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
}
