# 함께하개 프론트엔드 — API 대조표 (1/4)

> 2026년 9월 20일 기준입니다. 그 뒤에 바뀐 것(11장 안내 시작 · 거리순 · 날씨 띠 · 출처 표기 등)은 [README 11장](../../README.md#11-명세와-달라진-것)에 있습니다.

명세서(2026.9.4 판) 1부의 장마다 「부르는 API」 표를 **레포 실물**로 다시 쓴 문서입니다. 명세서는 그 뒤 구현에서 경로 · 파라미터 · 응답 칸이 많이 바뀌어, 화면 그림과 문구만 믿고 API 는 레포의 컨트롤러 · 요청/응답 DTO · 검증 애노테이션 · 에러 코드 · config 를 직접 열어 확인했습니다.

이 판(1/4)에는 공통 규약과 1~5장(스플래시 · 로그인 · 계정 만들기 · 비밀번호 찾기 · 반려동물 등록)이 들어 있습니다. 6~8장은 2/4, 9~16장은 3/4, 17~21장과 그림이 없는 화면은 4/4 에 들어갑니다.

| 레포 | 대조한 판 | 압축에 담긴 커밋 |
|---|---|---|
| gateway-server | main | 2c9689c |
| config | main | 93a7c45 |
| common | 0.0.14 | main 36534db |
| auth-service | v0.2.0 (7d81919) | develop d9f7c55 — 코드는 태그와 같음 |
| user-service | v0.2.1 | main 59718c7 |
| pet-service | v0.1.0 (766289b) | develop d78dfbe — 코드는 태그와 같음 |
| place-service | v0.1.3 (95db7e5) | feat/34-search-indexing b9ddae9 — 코드는 태그와 같음 |
| policy-service | v0.1.2 | main f064d1e |
| verdict-service | v0.1.0 (0232024) | develop 475b48d — 코드는 태그와 같음 |
| search-service | v0.1.0 | main 67b5e16 |
| report-service | v0.1.0 (1571631) | develop dde9b2d — 코드는 태그와 같음 |
| notification-service | v0.1.0 | main 8dd17ae |
| weather-service | v0.1.0 (0e4b6c5) | develop 23105c9 — 코드는 태그와 같음 |

**믿는 순서는 레포 코드 → 레포 README → config 라우트 → 명세서입니다.** 명세서에서는 화면 그림과 문구만 가져옵니다. 예외였던 후기는 2026년 9월 23일에 review v0.1.0 으로 붙어 이제 레포 실물을 따릅니다 (아래 후기 관련 서술은 그 전의 것입니다).

<br><br>

---

## 0. 읽는 법

장마다 표 하나를 둡니다. 열은 네 개입니다.

| 열 | 뜻 |
|---|---|
| 영역 | 명세서 주석판의 번호 (①②③ …). 번호가 없는 줄은 이 대조에서 새로 찾은 호출입니다 |
| 명세서 | 명세서 「부르는 API」 표에 적힌 경로. 명세서가 `/api/v1` 을 줄여 쓴 곳이 있습니다 |
| 실물 | 레포에서 확인한 경로와 응답. 게이트웨이 기준 전체 경로로 적습니다 |
| 화면이 할 일 | 실물에 맞춰 화면이 처리할 것. **(안)** 은 아직 정하지 않은 처리의 제안입니다 |

---

**표기** — 요청 칸의 ● 는 필수, ○ 는 선택입니다. 괄호 안은 검증 조건입니다. 상태 코드를 적지 않은 응답은 200 입니다.

<br><br>

---

## 1. 공통 규약

<br><br>

---

### 1-1. 부르는 곳

모든 API 는 게이트웨이의 `/api/v1/**` 로 부릅니다. 서비스 포트(8081~8094)로 직접 부르지 않습니다.

| 단계 | 하는 일 |
|---|---|
| 브라우저 `localhost:5173` | `fetch('/api/v1/…', { credentials: 'include' })` — 쿠키가 저절로 실림 |
| Vite 개발 서버 | `server.proxy` 가 `/api` 를 `http://localhost:8080` 으로 넘김 — 브라우저 입장에서 같은 출처라 CORS 가 생기지 않음 |
| gateway-server `8080` | 쿠키의 토큰 검증 → `X-User-Id` · `X-User-Role` 을 붙임 → 라우트 표에 있는 경로만 넘김 |
| 도메인 서비스 | 헤더만 믿고 처리 |

배포 때는 nginx 가 `/` 를 프론트로, `/api` 를 게이트웨이로 묶습니다. 개발 서버의 프록시가 같은 구조를 흉내 냅니다.

<br><br>

---

### 1-2. 게이트웨이 라우트 — 20개

`config/gateway-server.yml` 실물입니다. **라우트에 없는 경로는 서비스에 API 가 있어도 게이트웨이가 404 `ROUTE_NOT_FOUND` 를 냅니다.**

| 라우트 | 경로 | 이 프론트가 부르는 화면 | 비고 |
|---|---|---|---|
| auth-service | `/api/v1/auth/**` | 1~4 · 계정 관리 | |
| user-service | `/api/v1/users/**` · `/api/v1/favorites/**` · `/api/v1/visits/**` · `/api/v1/itineraries/**` | 1 · 5 · 6 · 8 · 10~15 | |
| pet-service | `/api/v1/pets/**` · `/api/v1/breeds` | 1 · 5 · 8 · 9 · 13 | |
| place-service | `/api/v1/places/{placeId}` · `/api/v1/places/{placeId}/documents` | 8 · 9 | |
| verdict-service | `/api/v1/places/{placeId}/verdict` | 8 | |
| review-service | `/api/v1/places/{placeId}/reviews` · `/api/v1/reviews/**` | 8 · 9 · 16 | 2026.9.23 부터 실제로 부름 (review v0.1.0) |
| policy-service | `/api/v1/places/{placeId}/conflicts` | 8 · 19 | |
| search-service | `/api/v1/search/**` | 1 · 6 · 7 · 8 | `/api/v1/search/map` 은 라우트를 지나 search 에서 404 |
| report-service | `/api/v1/reports/**` | 8 · 문의 내역 | |
| notification-service | `/api/v1/notifications/**` | 헤더 벨 · 알림 목록 · 알림 설정 | |
| weather-service | `/api/v1/weather/**` | 6 · 7 · 8 | |
| admin-accounts | `/api/v1/admin/accounts/**` | 20 | |
| admin-pets | `/api/v1/admin/pets/**` | 20 | |
| admin-places | `/api/v1/admin/places/**` | 18 · 20 | |
| admin-policies | `/api/v1/admin/policies/**` | 19 · 20 | |
| admin-reports | `/api/v1/admin/reports/**` | 17 · 19 · 20 | |
| admin-verdicts | `/api/v1/admin/verdicts/**` | 21 | 라우트만 있고 API 가 없음 — 판정 캐시 버튼은 비활성 |
| admin-search | `/api/v1/admin/search/**` | 21 | |
| admin-reviews | `/api/v1/admin/reviews/**` | 8 | review v0.1.0 과 함께 열림 — 관리자가 남의 후기를 내릴 때 |
| admin-ingest | `/api/v1/admin/ingest/**` | 21 | 2026.9.22 추가 — 운영 화면의 「최신 수집 실행」 |

관리자 후기 삭제는 8장 후기 카드에서만 부릅니다. 17장 제보 처리에는 삭제 버튼을 두지 않고, 후기로 가는 링크만 둡니다.

<br><br>

---

### 1-3. 로그인 없이 통과하는 경로 — 9줄

`app.gateway.permit-all` 실물입니다. 이 밖의 경로는 쿠키가 없으면 게이트웨이가 401 `AUTHENTICATION_FAILED` 를 냅니다.

```
/api/v1/auth/signup
/api/v1/auth/login
/api/v1/auth/refresh
/api/v1/auth/logout
/api/v1/auth/oauth/**
/api/v1/auth/password/reset-request
/api/v1/auth/password/reset
/api/v1/auth/email/verify-request
/api/v1/auth/email/verify
```

<br><br>

---

### 1-4. 쿠키와 토큰 갱신

**토큰은 HttpOnly 쿠키 두 개이고 JS 는 읽지도 저장하지도 않습니다.** 요청마다 `credentials: 'include'` 만 붙입니다.

| 항목 | 실물 |
|---|---|
| 로컬 쿠키 설정 | `application-local.yml` — `secure: false` 라 http 에서도 붙음 |
| 쿠키 도메인 | `domain: ""` — 호스트 전용. 5173 과 8080 이 둘 다 `localhost` 라 양쪽에 실림 |
| 리프레시 쿠키 경로 | `refresh-path: /api/v1/auth` — 갱신 · 로그아웃 요청에만 실림 |
| 로그인 여부 | `GET /api/v1/auth/me` 로만 판단 |
| 갱신 | `POST /api/v1/auth/refresh` — 본문 없음 · 200 `data: null` · 쿠키 둘을 새로 심음 |
| 로그아웃 | `POST /api/v1/auth/logout` — 토큰이 없거나 만료돼도 늘 200 |

---

**401 이 네 종류라 `code` 로 가릅니다.** 갱신을 시도하는 것은 `AUTHENTICATION_FAILED` 하나뿐입니다. `LOGIN_FAILED` 에 갱신을 걸면 로그인 실패가 갱신 실패로 둔갑합니다.

| code | 낸 곳 | 화면 |
|---|---|---|
| `AUTHENTICATION_FAILED` | 게이트웨이 (`traceId: null`) | 갱신 한 번 → 원래 요청 다시 → 또 401 이면 로그인 화면 |
| `INVALID_REFRESH_TOKEN` | auth — 갱신 실패 | 로그인 화면 |
| `LOGIN_FAILED` | auth — 로그인 실패 | 로그인 폼 문구 (2장) |
| `OAUTH_AUTHENTICATION_FAILED` | auth — 소셜 실패 | 주소창 이동이라 fetch 로는 오지 않음 (2장) |

---

**동시에 여러 요청이 401 이면 갱신은 하나만 합니다.** 먼저 온 401 이 갱신을 시작하고, 뒤에 온 401 은 그 갱신이 끝나기를 기다렸다가 원래 요청을 다시 보냅니다. 갱신 요청 자체와 auth 의 로그인 · 가입 계열 요청은 이 처리에서 뺍니다.

<br><br>

---

### 1-5. 응답 봉투

모든 응답은 같은 모양입니다. 성공은 `code: "SUCCESS"` 입니다.

```json
{ "code": "SUCCESS", "message": "요청이 성공적으로 처리되었습니다.", "data": { }, "traceId": "c1f0…" }
```

목록은 `data` 가 `PageResponse` 입니다.

```json
{ "content": [ ], "page": { "number": 0, "size": 20, "totalElements": 142, "totalPages": 8 } }
```

실패는 `data: null` 이 기본입니다. `VALIDATION_FAILED` 만 `data` 에 칸별 오류 배열이 올 수 있습니다.

```json
{ "code": "VALIDATION_FAILED", "message": "올바르지 않은 입력값 입니다.",
  "data": [ { "field": "weightKg", "message": "체중은 0보다 커야 합니다." } ], "traceId": "…" }
```

| 400 이 난 자리 | `field` | `message` |
|---|---|---|
| 요청 본문 검증 실패 | 칸 이름 (예 `weightKg`) | 애노테이션에 적힌 문구 |
| 경로 · 쿼리 타입 오류 | 파라미터 이름 | `타입이 올바르지 않습니다. (입력값: …)` |
| 본문을 읽을 수 없음 | `body` | `요청 본문을 읽을 수 없습니다. 형식을 확인해 주세요.` |
| 필수 파라미터 없음 | 파라미터 이름 | `필수 값입니다.` |
| 서비스 코드가 직접 던짐 | — | `data: null` |

auth 만 common 0.0.13 이라 본문을 읽을 수 없는 요청에 400 대신 500 `INTERNAL_ERROR` 가 나갑니다. 화면이 보내는 본문은 늘 형식이 맞으므로 영향은 작습니다.

---

**상태 코드는 대부분 200 이고, 아래 경로만 다릅니다.** fetch 래퍼는 204 의 빈 본문을 처리해야 합니다.

| 상태 | 경로 |
|---|---|
| 201 | `POST /api/v1/auth/signup` · `POST /api/v1/pets` · `POST /api/v1/reports` |
| 202 | `POST /api/v1/admin/search/reindex` |
| 204 (본문 없음) | `POST /api/v1/search/trending/views` · `DELETE /api/v1/admin/places/{placeId}/sources/{sourceLinkId}` · `POST /api/v1/admin/places/pending/{pendingId}/approve` · `POST /api/v1/admin/places/pending/{pendingId}/reject` · `POST /api/v1/admin/policies/{placeId}/remerge` |
| 302 | `GET /api/v1/auth/oauth/{provider}/authorize` · `GET /api/v1/auth/oauth/{provider}/callback` — fetch 가 아니라 주소창 이동으로만 |

<br><br>

---

### 1-6. 공통 에러 코드

**분기는 상태 코드가 아니라 `code` 로 합니다.** 같은 429 에 뜻이 둘인 자리(`SUMMARY_COOLDOWN` · `SUMMARY_DAILY_LIMIT`)가 있습니다.

| code | 상태 | 낸 곳 | 화면 |
|---|---|---|---|
| `VALIDATION_FAILED` | 400 | common | `data` 배열이면 칸마다 표시 · `null` 이면 폼 구성 문제 |
| `AUTHENTICATION_FAILED` | 401 | common · 게이트웨이 | 1-4 의 갱신 |
| `ACCESS_DENIED` | 403 | common · 게이트웨이 | 관리자 화면 접근 막힘 |
| `RESOURCE_NOT_FOUND` | 404 | common | 없는 경로 · user 프로필이 아직 없음 (가입 직후) |
| `METHOD_NOT_ALLOWED` | 405 | common | 개발 중에만 봄 |
| `INTERNAL_ERROR` | 500 | common · 게이트웨이 | "잠시 후 다시 시도해 주세요" |
| `EXTERNAL_API_ERROR` | 502 | common | user 가 목록을 조립하다 place 를 못 부름 등 — 그 영역만 "불러오지 못했습니다" |
| `ROUTE_NOT_FOUND` | 404 | 게이트웨이만 | 개발 중에만 봄 (경로 오타) |
| `SERVICE_UNAVAILABLE` | 503 | 게이트웨이만 | 그 서비스가 안 떠 있음 — 그 영역만 "불러오지 못했습니다" · 페이지는 뜸 |

게이트웨이가 낸 응답은 `traceId` 가 `null` 입니다. 도메인 서비스까지 가지 않았다는 뜻입니다.

<br><br>

---

### 1-7. 서비스별 에러 코드

각 서비스의 `ErrorCode` 열거형 실물입니다. 서버 문구를 화면에 그대로 뿌리지 않고, 화면이 `code` 마다 문구를 가집니다. 문구를 고칠 때 서버 배포가 필요 없게 하기 위함입니다.

| 서비스 | code | 상태 | 서버 문구 |
|---|---|---|---|
| auth | `EMAIL_ALREADY_EXISTS` | 409 | 이미 사용 중인 이메일입니다. |
| auth | `EMAIL_NOT_VERIFIED` | 400 | 이메일 인증을 먼저 완료해 주세요. |
| auth | `INVALID_VERIFICATION_CODE` | 400 | 인증 코드가 올바르지 않거나 만료되었습니다. |
| auth | `TOO_MANY_VERIFICATION_ATTEMPTS` | 429 | 인증 시도가 너무 많습니다. 코드를 다시 요청해 주세요. |
| auth | `MAIL_SEND_COOLDOWN` | 429 | 메일 요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요. |
| auth | `MAIL_SEND_FAILED` | 500 | 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요. |
| auth | `LOGIN_FAILED` | 401 | 이메일 또는 비밀번호가 올바르지 않습니다. |
| auth | `ACCOUNT_WITHDRAWN` | 403 | 탈퇴한 계정입니다. |
| auth | `PASSWORD_NOT_SUPPORTED` | 400 | 소셜 로그인으로 가입한 계정입니다. |
| auth | `INVALID_REFRESH_TOKEN` | 401 | 다시 로그인해 주세요. |
| auth | `CURRENT_PASSWORD_MISMATCH` | 400 | 현재 비밀번호가 올바르지 않습니다. |
| auth | `UNSUPPORTED_OAUTH_PROVIDER` | 400 | 지원하지 않는 로그인 방식입니다. |
| auth | `OAUTH_AUTHENTICATION_FAILED` | 401 | 소셜 로그인에 실패했습니다. |
| auth | `INVALID_OAUTH_STATE` | 400 | 잘못된 접근입니다. 처음부터 다시 시도해 주세요. |
| auth | `ACCOUNT_NOT_FOUND` | 404 | 계정을 찾을 수 없습니다. |
| user | `PET_NOT_FOUND` | 404 | 반려동물을 찾을 수 없습니다. |
| user | `PET_UNAVAILABLE` | 502 | 반려동물 정보를 확인하지 못했습니다. |
| user | `VERDICT_UNAVAILABLE` | 502 | 판정을 불러오지 못해 기록하지 못했습니다. |
| user | `VISIT_NOT_FOUND` | 404 | 이미 삭제되었거나 없는 기록입니다. |
| user | `ITINERARY_NOT_FOUND` | 404 | 이미 삭제되었거나 없는 일정입니다. |
| user | `ITINERARY_DUPLICATE` | 400 | 그 시각에 이미 같은 장소가 담겨 있습니다. |
| user | `SUMMARY_COOLDOWN` | 429 | 잠시 후에 다시 시도해 주세요. |
| user | `SUMMARY_DAILY_LIMIT` | 429 | 오늘 만들 수 있는 요약을 다 썼습니다. |
| user | `SUMMARY_GENERATION_FAILED` | 502 | 요약을 만들지 못했습니다. 다시 시도해 주세요. |
| pet | `PET_NOT_FOUND` | 404 | 반려동물을 찾을 수 없습니다. |
| place | `PLACE_NOT_FOUND` | 404 | 장소를 찾을 수 없습니다. |
| place | `PLACE_SOURCE_NOT_FOUND` | 404 | 그 장소에 묶인 소스가 아닙니다. |
| place | `PLACE_LAST_SOURCE` | 409 | 마지막 소스는 뗄 수 없습니다. |
| place | `PLACE_ADDRESS_INVALID` | 400 | 주소를 정규화할 수 없습니다. 시도부터 적어 주세요. |
| place | `PENDING_NOT_FOUND` | 404 | 반영 대기 값을 찾을 수 없습니다. |
| place | `PENDING_ALREADY_RESOLVED` | 409 | 이미 처리된 반영 대기 값입니다. |
| place | `PLACE_DOCUMENTS_UNAVAILABLE` | 503 | 원문을 지금 가져올 수 없습니다. |
| policy | `POLICY_SOURCE_NOT_ALLOWED` | 400 | 이 경로로 넣을 수 없는 소스입니다. |
| policy | `POLICY_OWNER_CORRECTION_EXISTS` | 409 | 장소가 직접 알려준 조건이 있어 관리자 정정이 반영되지 않습니다. |
| policy | `POLICY_SOURCE_NOT_FOUND` | 404 | 재병합할 조건 소스가 없는 장소입니다. |
| verdict | `PET_UNAVAILABLE` | 502 | 반려동물 정보를 불러오지 못했습니다. |
| verdict | `POLICY_UNAVAILABLE` | 502 | 동반 조건을 불러오지 못했습니다. |
| search | `VERDICT_UNAVAILABLE` | 502 | 동반 판정을 불러오지 못했습니다. |
| search | `REINDEX_ALREADY_RUNNING` | 409 | 이미 실행 중인 재색인이 있습니다. |
| report | `REPORT_ALREADY_PENDING` | 409 | 처리 중인 같은 제보가 있습니다. |
| report | `REPORT_DAILY_LIMIT` | 429 | 오늘 올릴 수 있는 제보를 다 썼습니다. |
| report | `REPORT_NOT_FOUND` | 404 | 제보를 찾을 수 없습니다. |
| report | `REPORT_ALREADY_RESOLVED` | 409 | 이미 처리한 제보입니다. |
| notification | `NOTIFICATION_NOT_FOUND` | 404 | 알림을 찾을 수 없습니다. |
| weather | `WEATHER_UNAVAILABLE` | 503 | 날씨를 불러오지 못했습니다. |
| auth · pet · place · policy · report | `OUTBOX_REPUBLISH_FAILED` | 500 | 이벤트 재발행에 실패했습니다. (pet 은 「이벤트를 다시 보내지 못했습니다.」) |

search 의 `PLACE_UNAVAILABLE` · `REVIEW_UNAVAILABLE` 은 색인을 채우는 길에서만 쓰여 응답으로 나가지 않습니다.

<br><br>

---

### 1-8. 화면 문구로 바꿀 열거형

서버는 코드값을 보내고 사람 말은 화면이 붙입니다. 「출처」 열의 **그림**은 명세서 그림에 적힌 문구, **서버**는 레포 열거형에 붙은 라벨, **(안)** 은 제안입니다.

**장소 종류 `placeType`** — place `PlaceType` 9개입니다. 메인의 카테고리 아이콘 7개가 이 9개를 빠짐없이 덮습니다.

| 코드 | 카드 표기 | 메인 카테고리 칩 | 출처 |
|---|---|---|---|
| `CAFE` | 카페 | 카페 | 그림 |
| `RESTAURANT` | 음식점 | 음식점 | 그림 |
| `PARK` | 공원 | 공원 | 그림 |
| `STAY` | 숙소 | 숙소/캠핑 | 그림 (칩이 둘을 묶음) |
| `CAMPING` | 캠핑장 | 숙소/캠핑 | 그림 |
| `VET` | 동물병원 | 병원 | 그림 |
| `LEISURE` | 레저 · 체험 | 레저/체험/문화 | 칩은 그림 · 카드는 (안) |
| `CULTURE` | 문화시설 | 레저/체험/문화 | 그림 |
| `ETC` | 관광지 | 기타 | 칩은 그림 · 카드는 (안) — 그림의 「관광지 · 양평」 |

---

**판정 `verdict`** — 그림은 UNKNOWN 을 「정보 없음」으로 적었지만 2026.9.19 에 「확인 필요」로 정해졌습니다. 조건 행이 없는 장소와, 그 반려견에게 필요한 칸이 빈 장소를 함께 뜻하기 때문입니다.

| 코드 | 배지 | 탐색 카운트 칸 | 색 (그림) |
|---|---|---|---|
| `ALLOWED` | 동반 가능 | 동반 가능 장소 | 초록 |
| `CONDITIONAL` | 조건부 가능 | 조건부 동반 가능 | 주황 |
| `NOT_ALLOWED` | 동반 불가 | 동반 불가 장소 | 빨강 |
| `UNKNOWN` | 확인 필요 | 확인 필요 | 보라 |

즐겨찾기 · 최근 본 장소의 `UNKNOWN` 은 대표 반려동물이 없을 때도 옵니다. `/users/me` 의 `defaultPetId` 가 `null` 이면 「대표 반려동물을 설정해 주세요」, 있으면 「확인 필요」로 가릅니다. 동물병원(`placeType: VET`)은 어느 화면에서든 판정 배지를 그리지 않습니다.

---

**판정 이유 줄 `reasons[].status`** — verdict `ReasonStatus` 5개입니다. 서버가 막힌 것부터 보냅니다.

| 코드 | 아이콘 | 뜻 |
|---|---|---|
| `NOT_MET` | ✗ | 조건을 못 맞춤 |
| `MISSING` | ? | 필요한 정보가 없음 |
| `CONDITION` | ! | 조건이 붙음 |
| `MET` | ✓ | 맞춤 |
| `INFO` | i | 안내 |

---

**근거의 출처** — 줄마다 `evidence[]` 가 붙고, 근거마다 `source`(소스 코드)와 `extractionMethod`(읽은 방식)가 옵니다.

| 값 | 화면 문구 | 출처 |
|---|---|---|
| `extractionMethod: RULE` | 공공데이터 항목 | 2026.9.19 결정 |
| `extractionMethod: LLM` | 안내문을 AI 가 읽음 | 2026.9.19 결정 |
| `extractionMethod: MANUAL` | 관리자 확인 | (안) |
| `extractionMethod: MIXED` | 공공데이터 항목 · 안내문 | (안) — policy 열거형에 있어 나올 수 있음 |
| `source: PET_TOUR` | 한국관광공사 | 서버 (place `SourceType`) |
| `source: GOCAMPING` | 한국관광공사 고캠핑 | 서버 |
| `source: CULTURE_CSV` | 문화정보원 | 서버 |
| `source: MOIS_VET` | 행정안전부 동물병원 인허가 | 서버 |
| `source: MANUAL` · `correctionSource: MANUAL` | 관리자 확인 | (안) |
| `source: OWNER` · `correctionSource: OWNER` | 업장 확인 | (안) |

---

**반려동물**

| 코드 | 화면 문구 | 출처 |
|---|---|---|
| `breedSize: SMALL` | 소형견 | 서버 (verdict 라벨) · 그림 |
| `breedSize: MEDIUM` | 중형견 | 서버 · 그림 |
| `breedSize: LARGE` | 대형견 | 서버 · 그림 |
| `species: DOG` | — | 판정 그대로 |
| `species: CAT` · `ETC` | 「반려견 기준 판정입니다」 한 줄을 장소 상세 위에 | 2026.9.19 결정 |

---

**날씨** — weather 열거형입니다. 기상청 용어를 그대로 씁니다.

| 코드 | 화면 문구 |
|---|---|
| `sky: CLEAR` · `MOSTLY_CLOUDY` · `CLOUDY` | 맑음 · 구름많음 · 흐림 |
| `pty: NONE` · `RAIN` · `RAIN_SNOW` · `SNOW` · `SHOWER` | 없음 · 비 · 비/눈 · 눈 · 소나기 |

---

**제보 · 알림 · 편의시설 · 영업 상태**

| 코드 | 화면 문구 | 출처 |
|---|---|---|
| `reportType: INFO_WRONG` | 정보 오류 | 그림 (17장) |
| `reportType: PLACE_MERGED_WRONG` | 잘못 병합됨 | 그림 (17장) |
| `reportType: CLOSED` | 폐업 | 그림 (17장) |
| `reportType: CONDITION_WRONG` | 조건 오류 | (안) |
| `reportType: REVIEW_ABUSE` | 후기 신고 | (안) |
| `status: PENDING` · `ACCEPTED` · `REJECTED` | 접수됨 · 처리됨 · 반려됨 | 그림 (17장 탭) |
| `notifType: POLICY_CHANGED` · `REPORT_RESOLVED` | 조건 변경 · 제보 결과 | (안) |
| `facilities: PLAYGROUND` | 전용 놀이 공간 | 그림 (8장) |
| `facilities: PARKING` | 주차 편의성 | 그림 (8장) |
| `facilities: WALKING_TRAIL` | 산책로 | (안) |
| `facilities: RESERVATION` | 예약 가능 | (안) |
| `status: CLOSED` (장소) | 폐업 | (안) — `ACTIVE` · `UNKNOWN` 은 표시하지 않음 |

<br><br>

---

### 1-9. 값 모양

| 항목 | 실물 | 화면 |
|---|---|---|
| 식별자 | UUID v7 문자열 36자 | 그대로 |
| 시각 | `LocalDateTime` — `"2026-09-20T14:00:00"` 처럼 시간대 없는 한국 시각 | 시간대를 붙이거나 UTC 로 바꾸지 않음 |
| 날짜 | `LocalDate` — `"2026-09-20"` | 그대로 |
| 목록 파라미터 | 같은 이름을 되풀이 — `placeType=PARK&placeType=CAFE` | `[]` 를 붙이지 않음 |
| 체중 | `BigDecimal` — JSON 숫자 `5.4` | 소수 첫째 자리까지 |
| 전화번호 | `02-381-5052` 와 `0222377582` 가 섞여 옴 | 화면이 하이픈을 넣어 맞춤 |
| 사진 주소 | 반려동물 · 프로필 사진은 서명 붙은 주소 (1시간 뒤 만료) | `GET /api/v1/pets` · `GET /api/v1/users/me` 는 캐시하지 않음 |

<br><br>

---

## 2. 장별 대조 — 1~5장

<br><br>

---

### 2-1. 1장 스플래시 · 로딩

그림은 원본 주석판 그대로 씁니다. 로고 · 「함께하개」 · 「반려동물과 함께하는 장소 탐험」 · 점 네 개 · 「가까운 장소를 탐색하고 있어요...」 입니다.

| 영역 | 명세서 | 실물 | 화면이 할 일 |
|---|---|---|---|
| ② | `GET /api/v1/auth/me` | 같음 · `{accountId, email, role, authProvider}` | 401 이면 1-4 의 갱신 → 그래도 401 이면 로그인 화면 |
| ③ | `GET /api/v1/users/me` | 같음 · `ProfileOutput` (아래) | 404 `RESOURCE_NOT_FOUND` 는 가입 직후라 프로필이 아직 없는 것 — 짧게 재시도 (안: 0.5초 간격 다섯 번) |
| ③ | `GET /api/v1/pets` | 같음 · `PetOutput[]` (5장) | 캐시하지 않음 |
| ④ | `GET /api/v1/search?lat=&lon=` | 부를 수 있으나 메인이 이 결과를 쓰는 자리가 없음 | (안) 여기서는 위치 권한만 묻고 좌표를 얻음. 메인의 인기 급상승 · 날씨 · 지역 드롭다운이 그 값을 씀 |
| ⑤ | 미정 — 고정 지역 | 사용자 지역을 저장하는 칸이 없음 (2026.9.3 결정) | (안) 위치를 거부하면 그림의 드롭다운 값 「서울 마포구」 (`sidoCode=11` · `sigunguName=마포구`) |
| ⑥ | 미정 — 병원 도배 | 종류를 안 고르면 검색이 동물병원까지 줌 | 메인은 검색을 바로 부르지 않아 해당 없음. 검색 화면의 종류 칩 기본값에서 다룸 (7장) |

세 호출은 병렬로 부릅니다. 순차가 아닙니다.

---

**좌표를 시도로 바꾸는 곳이 서버에 없습니다.** 인기 급상승은 `sidoCode` 를, 지역 드롭다운은 `sidoCode` + `sigunguName` 을 받습니다. 날씨는 좌표를 그대로 받습니다. (안) 카카오 지도 JS SDK 의 좌표 → 행정구역 변환(`coord2RegionCode`)으로 법정동 코드 앞 두 자리를 시도 코드로, 2단계 이름을 시군구 이름으로 씁니다. 서버 호출이 늘지 않고, 카카오 JS 키가 있어야 합니다. 시군구 이름은 `GET /api/v1/search/regions` 목록에 있는 값인지 대조한 뒤 씁니다.

```
ProfileOutput   accountId · nickname (소셜 가입 직후 null) · profileImageUrl (서명 주소 · null 가능)
                · defaultPetId (null 가능) · stats { visitCount · reviewCount (review 를 못 부르면 null) · favoriteCount }
AccountOutput   accountId · email · role (USER · ADMIN) · authProvider (LOCAL · GOOGLE)
```

`stats.reviewCount` 는 review 서버가 없어 늘 `null` 입니다. 마이페이지의 후기 수는 브라우저 저장소의 값으로 채웁니다.

<br><br>

---

### 2-2. 2장 로그인

그림은 원본 주석판 그대로 씁니다. **다만 그림의 노란 「카카오로 계속하기」 버튼은 구글로 바꿉니다.** 소셜 제공자가 2026.8.31 에 구글로 정해졌습니다. 버튼의 자리 · 크기는 그림대로 두고 색과 로고만 구글 표기 규정을 따릅니다.

| 영역 | 명세서 | 실물 | 화면이 할 일 |
|---|---|---|---|
| ① | `POST /api/v1/auth/login` | 같음 · 요청 `{email ●, password ●}` (둘 다 빈 값 불가) · 응답 `AccountOutput` + 쿠키 둘 | 성공하면 스플래시의 세 호출을 다시 돌려 메인으로 |
| ③ | 비밀번호 찾기 (화면 이동) | — | 4장으로 |
| ④ | `GET /auth/oauth/google/authorize` | `GET /api/v1/auth/oauth/google/authorize` → 302 | fetch 가 아니라 주소창 이동 (`location.href`) |
| ⑤ | 회원가입 (화면 이동) | — | 3장으로 |
| ⑥ | `/login/error?reason=` | 사유 값은 `FAILED` · `WITHDRAWN` 둘 | 로그인 화면 위 모달 |
| — | — | 성공은 `/login/success?isNew=true` 또는 `false` | `true` 면 5장으로 · 닉네임이 `null` 이라 닉네임 입력을 함께 받음 (안) · `false` 면 메인으로 |

---

**구글 로그인의 흐름입니다.** 콜백은 게이트웨이(8080)로 돌아온 뒤 프론트(5173)로 다시 보냅니다. 쿠키는 포트를 가리지 않아 5173 에서도 붙습니다.

| 차례 | 주소 | 누가 |
|---|---|---|
| 1 | `localhost:5173/api/v1/auth/oauth/google/authorize` | 버튼 → Vite 프록시 → auth 가 302 |
| 2 | 구글 로그인 화면 | 사용자 |
| 3 | `localhost:8080/api/v1/auth/oauth/google/callback` | 구글이 돌려보냄 (config 의 `redirect-uri`) · auth 가 쿠키 둘을 심음 |
| 4 | `localhost:5173/login/success?isNew=…` 또는 `/login/error?reason=…` | auth 가 302 (config 의 `frontend-base-url: http://localhost:5173`) |

---

**실패 문구는 화면이 `code` 마다 가집니다** (2026.9.3 결정). 둘째 줄은 실패한 사람 모두에게 똑같이 나갑니다. 계정이 있는지, 소셜 계정인지를 드러내지 않기 위함입니다.

| code | 문구 |
|---|---|
| `LOGIN_FAILED` 401 | 이메일 또는 비밀번호를 다시 확인해주세요. / 구글로 가입하셨다면 아래 [구글로 계속하기]를 눌러주세요. |
| `ACCOUNT_WITHDRAWN` 403 | 탈퇴한 계정입니다. (안) |
| `VALIDATION_FAILED` 400 | 빈 칸 표시 |
| 모달 `reason=FAILED` | 구글 로그인에 실패했습니다. 다시 시도해 주세요. (안) |
| 모달 `reason=WITHDRAWN` | 탈퇴한 계정입니다. (안) |

<br><br>

---

### 2-3. 3장 계정 만들기 — 그림 없음

명세서에도 그림이 없는 장입니다. 화면 설계는 따로 정하고, 여기에는 실물 계약만 적습니다. 5장이 「Step 2 of 2」 이므로 이 화면이 「Step 1 of 2」 입니다.

| 차례 | 명세서 | 실물 | 화면이 할 일 |
|---|---|---|---|
| 인증코드 받기 | `POST /auth/email/verify-request` | `POST /api/v1/auth/email/verify-request` · `{email ● (이메일 형식 · 255자)}` · 200 `data: null` | 60초 동안 다시 보내기를 잠금 |
| 코드 확인 | `POST /auth/email/verify` | `POST /api/v1/auth/email/verify` · `{email ●, code ● (숫자 6자리)}` · 200 `data: null` | 통과 표시는 30분 유지 |
| 가입 | `POST /api/v1/auth/signup` | 같음 · `{email ●, password ● (8~72자 · 72바이트), nickname ● (2~20자)}` · **201** `AccountOutput` + 쿠키 둘 | 가입이 곧 로그인 — 5장으로 |

| code | 어디서 | 문구 (안) |
|---|---|---|
| `EMAIL_ALREADY_EXISTS` 409 | 코드 받기 · 가입 | 이미 가입된 이메일입니다. 로그인해 주세요. |
| `MAIL_SEND_COOLDOWN` 429 | 코드 받기 | 잠시 후 다시 요청해 주세요. |
| `MAIL_SEND_FAILED` 500 | 코드 받기 | 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요. |
| `INVALID_VERIFICATION_CODE` 400 | 코드 확인 | 인증 코드가 올바르지 않거나 만료되었습니다. |
| `TOO_MANY_VERIFICATION_ATTEMPTS` 429 | 코드 확인 | 시도가 너무 많습니다. 코드를 다시 받아 주세요. |
| `EMAIL_NOT_VERIFIED` 400 | 가입 | 이메일 인증을 먼저 완료해 주세요. (30분이 지났으면 다시) |
| `VALIDATION_FAILED` 400 | 셋 다 | 칸마다 서버 문구 — 예 「비밀번호가 너무 깁니다. 한글은 한 글자가 세 자리로 계산됩니다」 |

가입 인증은 이미 가입된 이메일이면 409 로 알립니다. 비밀번호 찾기(4장)는 반대로 계정이 있는지를 숨깁니다.

<br><br>

---

### 2-4. 4장 비밀번호 찾기

개선안 그대로 만듭니다. 이메일 입력과 코드 발송 → 인증 코드 6자리와 남은 시간 → 새 비밀번호 → 저장입니다. 아래 카드는 코드를 보낸 뒤에 열립니다.

| 영역 | 명세서 | 실물 | 화면이 할 일 |
|---|---|---|---|
| ① | `POST /auth/password/reset-request` | `POST /api/v1/auth/password/reset-request` · `{email ●}` · **늘 200** | 가입 안 된 이메일 · 발송 제한에 걸린 요청도 200 이라 성공 · 실패를 가르지 않음. 버튼을 60초 잠그고 「재발송 (52초)」 처럼 셈 |
| ③ | `POST /auth/password/reset` | `POST /api/v1/auth/password/reset` · `{email ●, code ● (숫자 6자리), newPassword ● (8~72자 · 72바이트)}` · 200 | 성공하면 그 계정의 토큰이 모두 폐기됨 — 로그인 화면으로 |

| code | 문구 |
|---|---|
| `INVALID_VERIFICATION_CODE` 400 | 인증 코드가 올바르지 않거나 만료되었습니다. |
| `TOO_MANY_VERIFICATION_ATTEMPTS` 429 | 시도가 너무 많습니다. 코드를 다시 받아 주세요. |
| `VALIDATION_FAILED` 400 | 칸마다 서버 문구 |

그림의 문구를 그대로 씁니다 — 「메일을 보냈습니다. 받은 편지함을 확인해주세요.」 · 「메일이 오지 않는다면 스팸함을 확인해주세요.」 · 「구글로 가입한 계정은 비밀번호를 사용하지 않습니다.」 · 「8자 이상 72자 이하 · 한글은 한 글자가 세 자리로 계산됩니다」. 코드 칸 오른쪽의 남은 시간(그림 「09:41」)은 발송 시각부터 화면이 셉니다.

<br><br>

---

### 2-5. 5장 반려동물 등록

개선안 그대로 만듭니다. 머리의 「반려동물 정보 등록 · Step 2 of 2」 와 진행 막대, 왼쪽 폼, 오른쪽 「보호자 정보」 · 「등록된 우리아이들 정보」 · [반려동물 추가] · [가입 완료하고 시작하기] 입니다.

| 영역 | 명세서 | 실물 | 화면이 할 일 |
|---|---|---|---|
| ① | `GET /api/v1/breeds` | 같음 · `[{code, nameKo}]` — 이름 가나다순 뒤에 `MIX` · `OTHER` | `defaultSize` 는 없음. 크기는 체중으로 정함 |
| ② | `POST /api/v1/pets/upload-url` | 같음 · `{fileName ●, contentType ● (image/jpeg · image/png), contentLength ● (양수)}` → `{uploadUrl, fileUrl, expiresIn}` | ⚠명세서와 메모리에는 `contentLength` 가 없었음. 아래 올리기 차례대로 |
| ⑦ | `POST /api/v1/pets` | 같음 · **201** `PetOutput` | 아래 요청 칸 |
| ⑦ | `GET /api/v1/pets` (직후) | 같음 · `PetOutput[]` | 오른쪽 목록을 새로 그림 |
| — | — | `GET /api/v1/users/me` · `GET /api/v1/auth/me` | 오른쪽 「보호자 정보: {nickname} ({email})」 |
| — | — | `PATCH /api/v1/users/me/default-pet` `{petId}` · 200 `data: null` | ⚠**새로 찾은 호출.** 첫 반려동물이면 화면이 대표로 지정해야 함 — 아래 |

---

**사진은 서버를 거치지 않고 S3 로 바로 올립니다.**

| 차례 | 요청 | 주의 |
|---|---|---|
| 1 | `POST /api/v1/pets/upload-url` `{fileName, contentType, contentLength}` | `contentLength` 는 올릴 파일의 정확한 바이트 수 |
| 2 | `PUT {uploadUrl}` · 본문은 파일 그대로 | `Content-Type` 을 1과 똑같이 — 다르면 S3 가 403 |
| 3 | `POST /api/v1/pets` 의 `photoUrl` 에 1의 `fileUrl` | `fileUrl` 은 서명이 없어 그 주소로는 안 열림. 보여 줄 때는 `GET /api/v1/pets` 가 주는 서명 주소를 씀 |

---

**`POST /api/v1/pets` 요청 칸**입니다.

| 칸 | 필수 | 조건 | 폼 |
|---|---|---|---|
| `name` | ● | 30자까지 | 반려동물 이름 |
| `breedCode` | ● | `GET /api/v1/breeds` 의 `code` | 종 드롭다운 |
| `weightKg` | ● | 0 초과 200 이하 · 소수 첫째 자리까지 | 몸무게 (kg) |
| `breedSize` | ○ | `SMALL` · `MEDIUM` · `LARGE` | 크기 — 안 보내면 서버가 체중으로 채움 |
| `hasCarrier` | ● | 참 · 거짓 | 동반 장비 「이동장 있음」 |
| `hasStroller` | ● | 참 · 거짓 | 동반 장비 「유모차 있음」 |
| `vaccineCompleted` | ● | 참 · 거짓 | 접종 여부 「미접종 · 접종 완료」 |
| `vaccineProofAvailable` | ● | 참 · 거짓 | 「접종 증명서를 가지고 있나요?」 「없음 · 있음」 |
| `photoUrl` | ○ | 올리기 차례 3의 `fileUrl` | 반려견 사진 |
| `note` | ○ | 200자까지 | 5장 그림에는 칸이 없음 (13장에는 있음) |

크기 드롭다운은 그림의 안내(「몸무게로 자동 선택되며 바꿀 수 있습니다」)대로 몸무게를 넣으면 화면이 미리 골라 보여 줍니다. **사용자가 드롭다운을 직접 바꿨을 때만 `breedSize` 를 보냅니다.** 안 바꿨으면 서버 계산에 맡겨, 화면의 경계값과 서버의 경계값이 어긋나도 저장 값이 틀리지 않게 합니다.

---

**응답 `PetOutput`** 은 14칸입니다.

```
petId · name · weightKg · breedSize · hasCarrier · hasStroller · vaccineCompleted · vaccineProofAvailable
photoUrl (서명 주소 · null 가능) · note · breedCode · breedName · species (DOG · CAT · ETC) · isDangerousBreed
```

---

**첫 반려동물을 등록해도 대표가 저절로 지정되지 않습니다.** user 는 가입 · 탈퇴 이벤트만 받고 반려동물 이벤트를 받지 않습니다. 그림은 첫 폼을 「우리아이 기본정보(대표)」 로 적고 있고, 메인의 「몽이와 함께 어디로 갈까요?」 · 판정 기준 배너 · 즐겨찾기 배지가 모두 대표를 씁니다.

| 상황 | 화면이 할 일 |
|---|---|
| 등록 성공 · `/users/me` 의 `defaultPetId` 가 `null` | `PATCH /api/v1/users/me/default-pet` `{petId: 방금 받은 petId}` |
| 이미 대표가 있음 | 부르지 않음 |
| 대표 지정이 404 `PET_NOT_FOUND` · 502 `PET_UNAVAILABLE` | 등록은 된 상태 — 13장에서 다시 지정할 수 있게 안내 (문구를 둘로 가름) |

| code | 문구 |
|---|---|
| `VALIDATION_FAILED` 400 · `data` 배열 | 칸마다 서버 문구 — 예 「체중은 소수점 첫째 자리까지만 적을 수 있습니다.」 |
| `VALIDATION_FAILED` 400 · `data: null` | 모르는 견종 코드 등 — 개발 중에만 봄 |

<br><br>

---

## 3. 다음 판에 들어갈 것

| 판 | 장 |
|---|---|
| 2/4 | 6 메인 · 7 검색 결과 · 8 장소 상세 (후기 목록의 로컬 계약 포함) |
| 3/4 | 9 후기 작성 · 10 일정 확인 · 11 안내 시작 · 12~16 마이페이지 |
| 4/4 | 17~21 관리자 · 그림이 없는 화면 (알림 목록 · 계정 관리 · 알림 설정 · 문의 내역) · 명세와 실물이 다른 것 총목록 |
