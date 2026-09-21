# 함께하개 프론트엔드 — API 대조표 (4/4)

> 2026년 9월 20일 기준입니다. 그 뒤에 바뀐 것(11장 안내 시작 · 거리순 · 날씨 띠 · 출처 표기 등)은 [README 11장](../../README.md#11-명세와-달라진-것)에 있습니다.

이 판(4/4)에는 그림이 없는 사용자 화면 4개, 17~21장 관리자, 명세서와 실물이 다른 것 총목록이 들어갑니다. 1~2장은 그림이 없는 화면 4개(알림 목록 · 계정 관리 · 알림 설정 · 문의 내역), 3~4장은 관리자 17~21장, 5장은 명세서와 실물이 다른 것 총목록입니다.

| 레포 | 대조한 판 | 압축에 담긴 커밋 |
|---|---|---|
| auth-service | v0.2.0 (7d81919) | develop d9f7c55 — 코드는 태그와 같음 |
| pet-service | v0.1.0 (766289b) | develop d78dfbe — 코드는 태그와 같음 |
| place-service | v0.1.3 (95db7e5) | feat/34-search-indexing b9ddae9 — 코드는 태그와 같음 |
| policy-service | v0.1.2 | main f064d1e |
| search-service | v0.1.0 | main 67b5e16 |
| verdict-service | v0.1.0 (0232024) | develop 475b48d — 코드는 태그와 같음 |
| gateway-server · config | main | 2c9689c · 93a7c45 |
| user-service | v0.2.1 | main 59718c7 |
| notification-service | v0.1.0 | main 8dd17ae |
| report-service | v0.1.0 (1571631) | develop dde9b2d — 코드는 태그와 같음 |

**믿는 순서는 1/4 과 같습니다.** 레포 코드 → 레포 README → config 라우트 → 명세서 순입니다. 이 4개 화면은 명세서에 그림이 없어, 화면 설계는 12~16장의 틀과 말씨를 따라 여기서 정하고 (안) 으로 적습니다.

<br><br>

---

## 0. 읽는 법

장마다 표를 둡니다. 열은 「하는 일 · 실물 · 화면이 할 일」 3개입니다 — 명세서 그림이 없어 「영역 · 명세서」 열을 두지 않습니다. 요청 칸의 ● 는 필수, ○ 는 선택입니다. 상태 코드를 적지 않은 응답은 200 입니다.

<br><br>

---

## 1. 그림이 없는 화면

<br><br>

---

### 1-1. 알림 목록

**들어오는 곳은 헤더의 벨입니다.** (안) 12~16장의 틀(프로필 카드 · 왼쪽 메뉴)을 쓰지 않는 단독 화면 `/notifications` 로 둡니다. 마이페이지 메뉴 8개에 알림 목록이 없기 때문입니다. 위에 제목 「알림」 과 [모두 읽음], 아래에 알림 카드 목록과 [더 보기] 입니다.

| 하는 일 | 실물 | 화면이 할 일 |
|---|---|---|
| 목록 | `GET /api/v1/notifications` · `page ○` (기본 0) · `size ○` (기본 20) → `PageResponse<NotificationCardOutput>` | 새것부터 · [더 보기] 로 다음 쪽 |
| 한 건 읽음 | `PATCH /api/v1/notifications/{notificationId}/read` · 없으면 404 `NOTIFICATION_NOT_FOUND` | 카드를 누를 때 — 안 읽은 것만 부르고 옮겨 감 |
| 모두 읽음 | `PATCH /api/v1/notifications/read-all` | [모두 읽음] |
| 안 읽은 수 | `GET /api/v1/notifications/unread-count` · `{unreadCount}` | 헤더 벨의 숫자 — 읽음 처리 뒤 다시 부름 |

```
NotificationCardOutput   notificationId · notifType (POLICY_CHANGED · REPORT_RESOLVED) · placeId · placeName
                         · title · body · readAt (안 읽었으면 null) · createdAt
```

| 칸 | 화면 |
|---|---|
| `notifType` | 앞의 작은 표시 — 「조건 변경」 · 「제보 결과」 (1/4 1-8) |
| `title` · `body` | 서버가 만든 문장 그대로 |
| `readAt` | `null` 이면 안 읽음 — 카드 왼쪽에 점 · 바탕을 옅은 초록으로 |
| `createdAt` | 「3시간 전」 · 하루가 지나면 「9월 18일」 (안) |
| 누르면 | `POLICY_CHANGED` 는 그 장소의 8장, `REPORT_RESOLVED` 는 문의 내역으로 |

알림이 없으면 (안) 「새 알림이 없습니다. 즐겨찾기 · 일정에 담은 장소의 조건이 바뀌거나 제보가 처리되면 알려 드립니다.」 를 둡니다.

<br><br>

---

### 1-2. 계정 관리

(안) 12~16장의 틀 안 `/mypage/account` 에 3개 구역을 둡니다 — 프로필(사진 · 닉네임), 비밀번호 바꾸기, 탈퇴.

| 하는 일 | 실물 | 화면이 할 일 |
|---|---|---|
| 지금 값 | `GET /api/v1/users/me` · `GET /api/v1/auth/me` | 닉네임 · 사진 · 이메일 · 가입 방식(`authProvider`) |
| 사진 주소 받기 | `POST /api/v1/users/me/upload-url` · `{fileName ●, contentType ● (jpeg · png), contentLength ●}` → `{uploadUrl, fileUrl, expiresIn}` | 반려동물 사진과 같은 차례 (1/4 2-5) — S3 에 `PUT` 한 뒤 아래로 |
| 사진 · 닉네임 바꾸기 | `PATCH /api/v1/users/me` · `{nickname ○ (2~20자), profileImageUrl ○}` → `ProfileOutput` | 보낸 칸만 바뀜 · 사진은 `null` 로 지움 · 닉네임은 지울 수 없음 |
| 비밀번호 바꾸기 | `PATCH /api/v1/auth/me/password` · `{currentPassword ●, newPassword ● (8~72자 · 72바이트)}` | 구글로 가입한 계정은 비밀번호가 없어 이 구역을 숨김 |
| 탈퇴 코드 받기 | `POST /api/v1/auth/withdraw/verify-request` (본문 없음) | 가입한 이메일로 6자리 코드 — 60초 동안 다시 보내기를 잠금 |
| 탈퇴 | `DELETE /api/v1/auth/me` · `{code ● (숫자 6자리)}` | 한 번 더 묻고 부름 → 세션 캐시를 비우고 로그인 화면으로 · 「탈퇴를 마쳤습니다」 |

| code | 어디서 | 문구 (안) |
|---|---|---|
| `VALIDATION_FAILED` 400 | 셋 다 | 칸마다 서버 문구 — 예 「닉네임은 2자 이상 20자 이하여야 합니다」 |
| `CURRENT_PASSWORD_MISMATCH` 400 | 비밀번호 | 지금 비밀번호가 맞지 않습니다. |
| `PASSWORD_NOT_SUPPORTED` 400 | 비밀번호 | 구글로 가입한 계정은 비밀번호를 쓰지 않습니다. (구역을 숨기므로 개발 중에만 봄) |
| `MAIL_SEND_COOLDOWN` 429 | 탈퇴 코드 | 잠시 후 다시 요청해 주세요. |
| `INVALID_VERIFICATION_CODE` 400 | 탈퇴 | 인증 코드가 올바르지 않거나 만료되었습니다. |
| `TOO_MANY_VERIFICATION_ATTEMPTS` 429 | 탈퇴 | 시도가 너무 많습니다. 코드를 다시 받아 주세요. |

---

**탈퇴하면 되돌릴 수 없고 기록이 지워집니다.** 탈퇴를 누르기 전에 (안) 「즐겨찾기 · 일정 · 방문 기록 · 반려동물 정보가 지워지고 되돌릴 수 없습니다」 를 보이고, 코드 입력과 [탈퇴하기] 를 한 창에 둡니다. 브라우저 저장소의 내 후기는 서버가 지울 수 없어, 화면이 탈퇴 직후 내 계정의 후기를 저장소에서 지웁니다 (안).

<br><br>

---

### 1-3. 알림 설정

(안) 12~16장의 틀 안 `/mypage/notifications` 에 켜고 끄는 줄 2개를 둡니다. 11장의 「경로 안내」 와 같은 스위치입니다.

| 하는 일 | 실물 | 화면이 할 일 |
|---|---|---|
| 지금 값 | `GET /api/v1/notifications/settings` → `{policyChanged, reportResolved}` | 스위치 2개 |
| 바꾸기 | `PATCH /api/v1/notifications/settings` · `{policyChanged ○, reportResolved ○}` → 바뀐 값 | 누른 스위치의 칸만 보냄 · 먼저 바꾸고 실패하면 되돌림 |

| 칸 | 줄 이름 (안) | 설명 (안) |
|---|---|---|
| `policyChanged` | 동반 조건이 바뀌면 알림 | 즐겨찾기 · 일정에 담은 장소의 동반 조건이 바뀌면 알려 드립니다 |
| `reportResolved` | 제보가 처리되면 알림 | 보낸 제보가 처리되면 결과를 알려 드립니다 |

<br><br>

---

### 1-4. 문의 내역

(안) 12~16장의 틀 안 `/mypage/inquiries` 에 내가 보낸 제보(8장 [정보가 틀렸어요] · 후기 [신고])를 새것부터 카드로 둡니다.

| 하는 일 | 실물 | 화면이 할 일 |
|---|---|---|
| 목록 | `GET /api/v1/reports/me` · `page ○` (기본 0) · `size ○` (기본 20) → `PageResponse<ReportCardOutput>` | 카드 · [더 보기] |

```
ReportCardOutput   reportId · reportType · placeId · placeName · targetReviewId · fieldName · reportedValue
                   · content · visitedAt · status (PENDING · ACCEPTED · REJECTED) · memo · reviewedAt · createdAt
```

| 칸 | 화면 |
|---|---|
| `reportType` | 앞의 표시 — 정보 오류 · 조건 오류 · 잘못 병합됨 · 폐업 · 후기 신고 (1/4 1-8) |
| `placeName` | 누르면 그 장소의 8장 |
| `fieldName` · `reportedValue` | 「전화번호 → 02-1234-5678」 처럼 — `fieldName` 은 장소 칸 이름이라 화면 문구로 바꿈 (2/4 2-3) |
| `content` | 보낸 내용 |
| `status` | 배지 — 접수됨 · 처리됨 · 반려됨 (1/4 1-8) |
| `memo` · `reviewedAt` | 처리되면 「답변」 으로 — 관리자가 남긴 메모와 처리한 날 |
| `createdAt` | 「2026년 9월 20일 보냄」 |

보낸 제보가 없으면 (안) 「보낸 문의가 없습니다. 장소 정보가 틀렸다면 장소 상세의 [정보가 틀렸어요] 로 알려 주세요.」 를 둡니다.

<br><br>

---

## 2. 정할 것 — 그림이 없는 화면의 (안)

| 번호 | 정할 것 | (안) |
|---|---|---|
| 1 | 알림 목록의 자리 | 틀 없는 단독 화면 `/notifications` |
| 2 | 알림을 누르면 | 읽음 처리 뒤 조건 변경은 8장, 제보 결과는 문의 내역 |
| 3 | 계정 관리 구역 | 프로필 · 비밀번호 · 탈퇴 3개 · 구글 계정은 비밀번호 구역을 숨김 |
| 4 | 탈퇴 뒤 브라우저 저장소 | 내 계정의 후기를 지움 |
| 5 | 알림 설정 | 스위치 2개 · 누른 칸만 보냄 |
| 6 | 문의 내역 | 새것부터 카드 · 처리되면 관리자 메모를 「답변」 으로 |

<br><br>

---

## 3. 장별 대조 — 17~21장 관리자

<br><br>

---

### 3-1. 관리자 공통

**들어오는 곳은 헤더 계정 메뉴의 「관리자 화면」 입니다.** `GET /api/v1/auth/me` 의 `role` 이 `ADMIN` 일 때만 메뉴가 보이고, `/admin` 은 17장 제보 처리로 엽니다. 게이트웨이가 `ADMIN` 이 아닌 요청을 403 `ACCESS_DENIED` 로 막으므로, (안) 화면도 `role` 을 먼저 보고 「관리자만 볼 수 있습니다」 로 막습니다.

| 틀 | 내용 |
|---|---|
| 헤더 | 로고 옆에 [관리자] 표시 (그림대로) |
| 왼쪽 「관리자 메뉴」 | 제보 처리 · 장소 관리 · 조건 정정 · 이벤트 재발행 · 운영 |
| 제보 처리 배지 | 접수됨 건수 — `GET /api/v1/admin/reports?status=PENDING&size=1` 의 `totalElements` (안) |
| 이벤트 재발행 배지 | 서비스 5개의 멈춘 이벤트 합 — 각 `outbox?size=1` 의 `totalElements` (안) |

---

**게이트웨이의 관리자 라우트는 7개입니다** (`config/gateway-server.yml`).

| 라우트 | 경로 | 서비스 | 쓰는 장 |
|---|---|---|---|
| admin-accounts | `/api/v1/admin/accounts/**` | auth | 20장 |
| admin-pets | `/api/v1/admin/pets/**` | pet | 20장 |
| admin-places | `/api/v1/admin/places/**` | place | 18 · 20장 |
| admin-policies | `/api/v1/admin/policies/**` | policy | 19 · 20장 |
| admin-reports | `/api/v1/admin/reports/**` | report | 17 · 19 · 20장 |
| admin-verdicts | `/api/v1/admin/verdicts/**` | verdict | ⚠라우트만 있고 받는 API 가 없음 (3-6) |
| admin-search | `/api/v1/admin/search/**` | search | 21장 |

로컬에서 관리자 화면을 보려면 시험 계정의 `role` 을 `ADMIN` 으로 바꾸고 다시 로그인합니다 (policy README 9-4). 끝나면 되돌립니다.

<br><br>

---

### 3-2. 17장 제보 처리

개선안 그대로 만듭니다. 제목과 부제, 상태 칩(접수됨 · 처리됨 · 반려됨 · 전체), 제보 카드(유형 · 장소 · 고친 값 · 내용 · 보호자 · 방문일 · 처리 메모 · [승인] · [반려] · [정정하러 가기]), 「잘못 병합됨」 안내 상자입니다.

| 영역 | 명세서 | 실물 | 화면이 할 일 |
|---|---|---|---|
| ① | 메뉴 배지 (각 목록의 totalElements) | 같음 | 3-1 |
| ② | `GET /admin/reports?status=` | `GET /api/v1/admin/reports` · `status ○` (빼면 전체) · `page ○` · `size ○` (기본 20) → `PageResponse<AdminReportCardOutput>` | 칩의 건수는 (안) 상태마다 `size=1` 로 불러 `totalElements` |
| ③ | (위 응답의 content) | 아래 15칸 | 카드 |
| ④ | (PATCH 요청의 memo) | `memo ●` · 1~500자 | 처리 메모 — 사용자의 문의 내역에 「답변」 으로 보임 (1-4) |
| ⑤ | `PATCH /admin/reports/{id}` | `PATCH /api/v1/admin/reports/{reportId}` · `{status ● (ACCEPTED · REJECTED), memo ●}` → `{reportId, status, memo, reviewedBy, reviewedAt}` · `report.resolved` 발행 | 409 `REPORT_ALREADY_RESOLVED` · 404 `REPORT_NOT_FOUND` |
| ⑦ | 정정하러 가기 (화면 이동) | 서버 호출 없음 | 유형마다 다른 화면으로 — 아래 |

```
AdminReportCardOutput   reportId · reportType · placeId · placeName · targetReviewId · fieldName · reportedValue
                        · content · visitedAt · reporter {accountId, nickname, profileImageUrl}
                        · status · memo · reviewedBy · reviewedAt · createdAt
```

| 그림 | 칸 |
|---|---|
| 「정보 오류」 · 「카페 그린뜰」 · 「8b41c0de-…-7f22」 | `reportType` · `placeName` · `placeId` 앞뒤 |
| 「고친 값: tel → 031-555-0180」 | `fieldName` (화면 문구와 칸 이름을 함께 — 「전화번호(tel)」) · `reportedValue` |
| 「몽이 보호자 · 방문 2026-08-28」 | `reporter.nickname` · `visitedAt` |

---

**[정정하러 가기] 는 유형마다 다른 화면으로 갑니다.**

| 유형 | 가는 곳 | 비고 |
|---|---|---|
| `INFO_WRONG` | 18장 장소 정보 수정 — 장소와 칸을 채워 엶 | |
| `CONDITION_WRONG` | 19장 조건 정정 — 장소와 제보 번호를 넘김 | 정정을 저장하면 팝업이 이 제보의 승인을 물음 |
| `PLACE_MERGED_WRONG` | 18장 — 그 장소를 엶 | ⚠소스 분리는 연결 행 id 를 주는 API 가 없어 할 수 없음 (3-3) |
| `CLOSED` | 18장 — 영업 상태 칸 | `status` 를 `CLOSED` 로 |
| `REVIEW_ABUSE` | 8장 후기 구역 | ⚠후기가 브라우저 저장소에 있어, 신고한 사람의 브라우저가 아니면 그 후기가 보이지 않음 |

<br><br>

---

### 3-3. 18장 장소 관리

그림은 원본 주석판입니다. 수정 대기 목록 · 장소 정보 수정 · 묶여 있는 소스 3개 구역입니다.

| 영역 | 명세서 | 실물 | 화면이 할 일 |
|---|---|---|---|
| ① | `GET /admin/places/pending` | `GET /api/v1/admin/places/pending` · `page ○` · `size ○` (기본 20) → `PageResponse<PlacePendingOutput>` | 수정 대기 표 |
| ① | 승인 · 반려 | `POST /api/v1/admin/places/pending/{pendingId}/approve` · `/reject` → **204** | 404 `PENDING_NOT_FOUND` · 409 `PENDING_ALREADY_RESOLVED` |
| — | 장소 찾기 | ⚠관리자용 장소 조회가 없음 | (안) 공개 자동완성(`/search/suggest`)으로 찾고 `GET /api/v1/places/{placeId}` 로 지금 값을 채움 |
| ② | `PATCH /admin/places/{placeId}` | 같음 · 보낸 칸만 → `PlaceDetailOutput` · 고친 칸은 수집이 덮지 못하게 잠김 | 아래 칸 규칙 |
| ③ | `DELETE /admin/places/{id}/sources/{sid}` | `DELETE /api/v1/admin/places/{placeId}/sources/{sourceLinkId}` → **204** · 409 `PLACE_LAST_SOURCE` | ⚠`sourceLinkId` 를 주는 API 가 없음 — 상세의 `sources` 는 `{source, sourceLabel}` 뿐 · (안) 묶인 소스는 보여만 주고 분리 버튼을 두지 않음 |

```
PlacePendingOutput   pendingId · placeId · placeName · fieldName · currentValue · newValue · source · detectedAt
```

| 칸 | 규칙 |
|---|---|
| `name` | 200자까지 · 지울 수 없음 |
| `addressRoad` · `addressJibun` | 300자까지 · **함께 보내야 함** · 비울 수 없음 · ⚠상세는 `address` 한 줄이라 (안) 주소를 고칠 때는 두 칸을 새로 적게 함 |
| `tel` | 30자까지 |
| `homepage` · `reservationUrl` · `imageUrl` · `overview` | 지울 수 있음 |
| `businessHours` · `closedDays` | 600자 · 200자까지 |
| `status` | `ACTIVE` · `CLOSED` · `UNKNOWN` · 지울 수 없음 |
| 전체 | 하나 이상 보내야 함 · 400 `PLACE_ADDRESS_INVALID` (주소로 좌표를 못 찾음) |

<br><br>

---

### 3-4. 19장 조건 정정

그림은 원본 주석판과 승인 팝업입니다. 대상 장소 · 소스끼리 어긋난 값 · 정정 입력 · [재병합만 실행] · [정정 저장] 입니다.

| 영역 | 명세서 | 실물 | 화면이 할 일 |
|---|---|---|---|
| ① | `GET /places/{id}` · `/verdict` · `/conflicts` | 같음 · ⚠판정은 `petIds ●` | 이름 · 충돌 건수 · 판정 배지는 (안) 관리자의 대표 반려동물로 · 없으면 숨김 |
| ② | `GET /places/{placeId}/conflicts` | 같음 (policy) | 2/4 2-3 의 표 |
| — | — | `GET /api/v1/admin/policies/{placeId}` → `{placeId, fields (20칸), correction {source, reason, correctedAt}}` | ⚠**새로 찾은 호출.** 정정 입력의 처음 값 · 이미 정정했으면 출처와 까닭 |
| ③ | (PUT 요청의 fields) | 20칸 — 아래 | 참 · 거짓 칸은 3값(참 · 거짓 · 모름=`null`) |
| ④ | `POST /admin/policies/{id}/remerge` | `POST /api/v1/admin/policies/{placeId}/remerge` → **204** | 정정 없이 병합만 다시 |
| ⑤ | `PUT /admin/policies/{id}/manual` | `PUT /api/v1/admin/policies/{placeId}/manual` · `{source ● (MANUAL · OWNER), reason ●, fields ● (20칸)}` → 위와 같은 모양 · `policy.changed` 발행 | 400 `POLICY_SOURCE_NOT_ALLOWED` · 409 `POLICY_OWNER_CORRECTION_EXISTS` (업장 확인이 있는데 관리자 확인으로 덮으려 함) |
| (팝업) | `PATCH /admin/reports/{id}` | 17장과 같음 · `memo ●` | ⚠그림 팝업에 메모 칸이 없음 — (안) 팝업에 메모 칸을 둠 |

```
fields   scope · guideDogOnly · petOnly · indoorAllowed · outdoorAllowed · maxWeightKg (0 초과 · 소수 둘째 자리) · weightInclusive
         · maxCount (1 이상) · sizeRule · breedRule · carrierRequired · leashRequired · excludedZones [] · allowedZonesOnly []
         · excludedDays [] · extraFeeAmount (0 이상) · extraFeeUnit · requiredItems [] · vaccineProof · advanceInquiry
```

<br><br>

---

### 3-5. 20장 이벤트 재발행

그림은 원본 주석판입니다. 서비스별 카드 5개와 멈춘 이벤트 목록 · [다시 보내기] 입니다.

| 영역 | 명세서 | 실물 | 화면이 할 일 |
|---|---|---|---|
| ① | `GET /admin/{서비스}/outbox` | `GET /api/v1/admin/{accounts · pets · places · policies · reports}/outbox` · `page ○` · `size ○` (기본 20) → `PageResponse<OutboxMessageOutput>` | 카드 5개에 멈춘 건수 · 누르면 그 서비스 목록 |
| ③ | (위 응답의 항목) | 아래 8칸 | 토픽 · 대상 · 재시도 횟수 · 마지막 오류 |
| ④ | `POST /admin/{서비스}/outbox/{id}/retry` | 같음 · 200 `data: null` · 500 `OUTBOX_REPUBLISH_FAILED` | 성공하면 목록에서 빠짐 · 건수 다시 셈 |

```
OutboxMessageOutput   id · eventId · topic · aggregateType · aggregateId · createdAt · retryCount · lastError
```

멈춘 이벤트가 없으면 (안) 「멈춘 이벤트가 없습니다. 발행이 끝까지 실패한 이벤트만 여기에 쌓입니다.」 를 둡니다.

<br><br>

---

### 3-6. 21장 운영

개선안 그대로 만들되 판정 캐시 카드는 뺍니다 (아래). 「검색 색인 재구축」 카드와 후기 삭제 안내 상자입니다.

| 영역 | 명세서 | 실물 | 화면이 할 일 |
|---|---|---|---|
| ① | `POST /admin/search/reindex` | `POST /api/v1/admin/search/reindex` → `{startedAt}` · 409 `REINDEX_ALREADY_RUNNING` | [재구축] — 한 번 더 묻고 부름 · 「마지막 실행」 을 읽을 API 가 없어 (안) 이 브라우저에서 누른 시각을 적음 |
| ② | `DELETE /admin/verdicts/cache` | ⚠verdict 에 관리자 API 가 없음 (게이트웨이 라우트만 있음) | (안) 카드를 뺌 |
| — | 후기 삭제 안내 | — | 그림대로 — 신고된 후기는 17장에서, 직접 발견한 후기는 8장 후기 카드에서 지움 (브라우저 저장소) |

<br><br>

---

## 4. 정할 것 — 관리자의 (안)

| 번호 | 정할 것 | (안) |
|---|---|---|
| 7 | 권한 | 화면도 `role` 을 보고 막음 — 「관리자만 볼 수 있습니다」 |
| 8 | 메뉴 · 칩의 건수 | 상태마다 `size=1` 로 불러 `totalElements` |
| 9 | 후기 신고 처리 | 후기가 브라우저 저장소에 있어 신고한 사람의 브라우저에서만 보임 — 17장 카드에 안내 |
| 10 | 소스 분리 | 연결 행 id 를 주는 API 가 없어 버튼을 두지 않음 |
| 11 | 18장 장소 찾기 | 공개 자동완성 + 공개 상세 |
| 12 | 19장 판정 배지 | 관리자의 대표 반려동물로 · 없으면 숨김 |
| 13 | 19장 승인 팝업 | 필수인 메모 칸을 둠 |
| 14 | 21장 판정 캐시 | 카드를 뺌 |
| 15 | 21장 마지막 실행 | 이 브라우저에서 누른 시각 |

<br><br>

---

## 5. 명세서와 실물이 다른 것 — 총목록

1/4 ~ 4/4 에 흩어진 차이를 한곳에 모았습니다. 명세서를 고칠 때 이 표를 체크리스트로 씁니다. 「화면이 한 것」 은 지금 프론트가 맞춘 방법이고, 「고칠 쪽」 은 그림대로 되려면 어디를 고쳐야 하는지입니다.

| 고칠 쪽 | 뜻 |
|---|---|
| 서버 | API 나 응답 칸이 새로 있어야 그림대로 됨 — 괄호 안이 그 서비스 |
| 명세서 | 실물은 이미 있고 문서만 고치면 됨 |
| 데이터 | 수집 원천에 값이 없음 |
| 그림 | 명세서의 화면 그림 · 문구를 고치면 됨 |

<br><br>

---

### 5-1. 서버 · API 가 없는 것

화면에 자리가 있는데 받을 API 나 칸이 없어, 프론트가 다른 길로 채운 것입니다.

| 번호 | 자리 | 명세서 | 실물 | 화면이 한 것 | 고칠 쪽 |
|---|---|---|---|---|---|
| 1 | 후기 (8 · 9 · 16장) | review 서버 — `/places/{id}/reviews` · `/reviews/**` | 서버 없음 — 게이트웨이 라우트만 있어 503 | 브라우저 저장소 `pawtrail.reviews.v1` · `VITE_REVIEW_MODE=remote` 로 서버 전환 | 서버 (review) |
| 2 | 후기 태그 · 사진 (9장) | `GET /reviews/tags` · `POST /reviews/upload-url` | 없음 | 명세서의 태그 5개 고정 · 사진은 브라우저에서 줄여 저장 | 서버 (review) |
| 3 | 평점 (6 · 7 · 10 · 12 · 14 · 15장) | 카드마다 평점 | `ratingAvg` 늘 `null` | 저장소의 후기 평균 · 없으면 숨김 | 서버 (review) |
| 4 | 작성한 후기 수 (12~16장) | `stats.reviewCount` | 늘 `null` | 저장소에서 셈 | 서버 (review) |
| 5 | 후기 신고 처리 (17장) | 신고된 후기를 보고 처리 | 후기가 쓴 사람의 브라우저에만 있음 | 이 브라우저에 있으면 내용 · 없으면 안내 | 서버 (review) |
| 6 | 판정 캐시 비우기 (21장) | `DELETE /admin/verdicts/cache` | verdict 에 관리자 API 없음 · 게이트웨이 라우트만 | 카드를 뺌 | 서버 (verdict) |
| 7 | 재색인 마지막 실행 (21장) | 「마지막 실행: 2026-08-31」 | 읽을 API 없음 · 누를 때 `startedAt` 만 | 이 브라우저에서 누른 때 | 서버 (search) |
| 8 | 인기 지역 칩 (6장) | 양평 · 가평 · 남양주 · 춘천 · 강릉 | 주는 API 없음 | 그림의 5개 고정 · 지역 목록에 있는 것만 | 서버 (search) |
| 9 | 용품점 마커 (11장) | 경로 주변 용품점 | 검색에 `supplyPoint` 조건 · 카드 칸 없음 | 일정 안의 용품점만 | 서버 (search) |
| 10 | 동물병원 마커 (11장) | 지도 마커 | 검색 카드에 좌표 없음 | 가까운 5곳만 상세로 좌표 | 서버 (search) |
| 11 | 소스 분리 (18장) | `DELETE /admin/places/{id}/sources/{sid}` | `sourceLinkId` 를 주는 API 없음 | 묶인 소스를 보여만 줌 | 서버 (place) |
| 12 | 장소 고르기 (18장) | 장소를 골라 고침 | 관리자용 장소 조회 없음 | 공개 자동완성 + 공개 상세 | 서버 (place) |
| 13 | 대표 반려동물 삭제 (13장) | 그림에 없음 | user 가 pet 삭제 이벤트를 받지 않아 `defaultPetId` 가 남음 | 남은 첫째로 다시 지정 · 없으면 `null` | 서버 (user) |

<br><br>

---

### 5-2. 경로 · 필수 칸 · 규칙이 다른 것

실물이 이미 있고 명세서만 고치면 되는 것입니다. 새로 찾은 호출도 여기에 둡니다.

| 번호 | 자리 | 명세서 | 실물 | 화면이 한 것 | 고칠 쪽 |
|---|---|---|---|---|---|
| 14 | 즐겨찾기 빼기 (6~8 · 14 · 15장) | `DELETE /favorites` | `DELETE /favorites/{placeId}` | 경로에 장소 id | 명세서 |
| 15 | 사진 주소 발급 (5 · 13장) | `{fileName, contentType}` | `contentLength` 도 필수 · jpeg · png 만 | 파일 크기를 함께 보냄 | 명세서 |
| 16 | 첫 반려동물 (5장) | 대표 지정 없음 | `PATCH /users/me/default-pet` 을 따로 불러야 함 | 등록하며 대표로 지정 | 명세서 |
| 17 | 구글 로그인 결과 (2장) | 없음 | `/login/success?isNew=` · `/login/error?reason=` (`FAILED` · `WITHDRAWN`) | 결과 화면 둘 | 명세서 |
| 18 | 공통 400 모양 | 없음 | `data [{field, message}]` · 본문을 못 읽으면 `field` 가 `body` | 칸마다 오류 문구 | 명세서 |
| 19 | 탐색 카운트 (6장) | 반려동물 없이도 부름 | `petIds` 가 없으면 400 | 반려동물이 있을 때만 부름 | 명세서 |
| 20 | 판정 상세 (8 · 19장) | `petIds` 없이 부름 | `petIds` ● (1~100) | 판정 기준의 반려동물 · 19장은 관리자의 대표 | 명세서 |
| 21 | 거리순 검색 (7장) | 늘 좌표를 보냄 | 좌표를 보내면 반경 20km 로 거름 | 거리순일 때만 좌표 | 명세서 |
| 22 | 지도 검색 | `GET /search/map` | search 에 없어 404 | 목록 검색만 씀 | 명세서 |
| 23 | 지역 목록 (6장) | 없음 | `GET /search/regions` | 지역 고르기 | 명세서 |
| 24 | 상세를 열 때 (8장) | 표에 없음 | `POST /users/me/recent-places` · `POST /search/trending/views` 둘 다 | 1분 안에 같은 장소면 생략 | 명세서 |
| 25 | 제보 유형별 칸 (8장) | 유형별 규칙 없음 | 허용 안 된 칸을 보내면 400 | 유형마다 칸을 나눔 | 명세서 |
| 26 | 일정 수정 (10장) | 그림에 없음 | `PATCH /itineraries/{stopId}` · 같은 날 안에서만 | 두지 않음 | 명세서 |
| 27 | 일정 중복 (8장) | 없음 | 같은 장소 · 같은 시각이면 400 `ITINERARY_DUPLICATE` | 문구로 알림 | 명세서 |
| 28 | 다녀왔어요 (10장) | `POST /visits` | `itineraryStopId` 만 보내면 됨 · 두 번 보내도 같은 기록 | 지난 시각 카드에만 | 명세서 |
| 29 | 하루 요약 (12장) | 없음 | 같은 날짜 60초 · 하루 20번 · 200자 | 429 문구 둘 | 명세서 |
| 30 | 반려동물 수정 (13장) | `PATCH /pets/{petId}` | 보낸 칸만 · 사진 · 메모만 `null` 로 지움 | 바뀐 칸만 보냄 | 명세서 |
| 31 | 목록 조립 실패 (12~15장) | 없음 | place 를 못 부르면 목록 통째로 502 · 판정만 못 부르면 `null` | 다시 불러오기 · 배지 숨김 | 명세서 |
| 32 | 장소 주소 수정 (18장) | 주소 한 칸 | 도로명 · 지번을 함께 | 두 칸을 새로 적게 함 | 명세서 |
| 33 | 정정 처음 값 (19장) | 표에 없음 | `GET /admin/policies/{placeId}` | 정정 입력의 처음 값 | 명세서 |

<br><br>

---

### 5-3. 응답 칸 · 데이터가 그림과 다른 것

그림의 자리를 채울 값이 응답에 없거나, 수집 원천에 값이 없는 것입니다.

| 번호 | 자리 | 명세서 | 실물 | 화면이 한 것 | 고칠 쪽 |
|---|---|---|---|---|---|
| 34 | 장소 카드 (6 · 7장) | 시군구 · 하트 · 출처 문장 | 시군구 칸 · `isFavorite` 없음 · 한 줄 근거(`evidenceSummary`)만 | 주소 두 번째 토막 · 즐겨찾기 목록 · 「출처: 공공데이터 · {날짜} 기준」 | 서버 (search) |
| 35 | 인기 급상승 거리 (6장) | 카드마다 거리 | `distanceM` 늘 `null` | 거리를 숨김 | 명세서 |
| 36 | 최근 본 장소 (6장) | 인기 급상승과 같은 카드 | 8칸 · 대표 반려동물 기준 판정 1개 | 본문 자리에 준비물 | 명세서 |
| 37 | 상세 사진 (8장) | 3장 | `imageUrl` 1개 · 사진이 있는 장소 약 16% | 1장 넓게 · 없으면 종류별 기본 그림 | 데이터 |
| 38 | 가까운 역 (8 · 11장) | 「홍대입구역 6번 출구에서 250m」 | 역 데이터 없음 | 주소 · 「현재 내 위치」 | 데이터 |
| 39 | 검색 칩 (7장) | 야외석 보유 · 무료주차 지원 | 야외석 데이터 없음 · 주차는 가능 여부만 | 야외석 뺌 · 「주차 가능」 | 데이터 |
| 40 | 일정 · 동반 기록 시각 (10 · 12장) | 「11:00 ~ 12:00」 | 시작 시각 하나 | 시작 시각만 | 서버 (user) |
| 41 | 그날 요약 (12장) | 날짜 묶음마다 | 하루 한 카드에만 실림 | 날짜로 묶어 꺼냄 | 명세서 |
| 42 | 방문한 장소 (15장) | 장소마다 1장 | 방문마다 1장 | 장소로 묶고 횟수 | 명세서 |
| 43 | 날씨 띠 (6장) | 「이번 주말」 예보 | `GET /weather` · 오늘 남은 시간만 | 오늘 비 · 눈이 있을 때만 | 명세서 |

<br><br>

---

### 5-4. 그림 · 문구가 다른 것

명세서의 화면 그림이나 문구를 고치면 되는 것입니다.

| 번호 | 자리 | 명세서 | 실물 | 화면이 한 것 | 고칠 쪽 |
|---|---|---|---|---|---|
| 44 | 소셜 로그인 (2장) | 노란 「카카오로 계속하기」 | 구글만 | 구글 버튼 | 그림 |
| 45 | 판정 배지 문구 (6 · 7장) | 「정보 없음」 | `UNKNOWN` | 「확인 필요」 | 그림 |
| 46 | 상세 상단 배지 (8장) | 크기별 동반 가능 3개 | 반려동물마다 판정 1개 | 반려동물마다 배지 | 그림 |
| 47 | 질문 부제 (9장) | 「이거이거이거가 있었어요」 | 자리 채움 문구 | 질문별 안내 | 그림 |
| 48 | 지도 (10 · 11장) | 일러스트 | 카카오맵 SDK · 경로 서버가 없어 직선 | 카카오 지도 · 키가 없으면 좌표를 펼친 약도 | 그림 |
| 49 | 안내 문장 (11장) | 만든 사람의 설명문 | 화면 문구가 아님 | 「길 안내 문장 대신 경로선과 거리로 안내합니다」 | 그림 |
| 50 | 정렬 칩 (12 · 16장) | 전체 · 최근순 · 오래된 순 · 높은 · 낮은 평점순 | 「전체」 와 「최근순」 이 같은 순서 | 하나로 | 그림 |
| 51 | 칩 이름 (14장) | 공원/산책 · 펜션/숙소 | 메인의 종류 7개 | 7개 이름으로 맞춤 | 그림 |
| 52 | 제보 처리 메모 (19장 팝업) | 메모 칸 없음 | `memo` 필수 (1~500자) | 팝업에 메모 칸 | 그림 |

<br><br>

---

### 5-5. 고칠 쪽별 건수

모두 52건입니다.

| 고칠 쪽 | 건수 | 번호 |
|---|---|---|
| 서버 | 15 | 1~13 · 34 · 40 |
| 명세서 | 25 | 14~33 · 35 · 36 · 41~43 |
| 데이터 | 3 | 37~39 |
| 그림 | 9 | 44~52 |
