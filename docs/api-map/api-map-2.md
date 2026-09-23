# 함께하개 프론트엔드 — API 대조표 (2/4)

> 2026년 9월 20일 기준입니다. 그 뒤에 바뀐 것(11장 안내 시작 · 거리순 · 날씨 띠 · 출처 표기 등)은 [README 11장](../../README.md#11-명세와-달라진-것)에 있습니다.

이 판(2/4)에는 6~8장(메인 · 검색 결과 · 장소 상세)이 들어 있습니다. 공통 규약(부르는 곳 · 쿠키와 토큰 갱신 · 응답 봉투 · 에러 코드 · 열거형 문구 · 값 모양)은 1/4 을 따르며 여기서 되풀이하지 않습니다. 9~16장은 3/4, 17~21장과 그림이 없는 화면은 4/4 에 들어갑니다.

| 레포 | 대조한 판 | 압축에 담긴 커밋 |
|---|---|---|
| search-service | v0.1.0 | main 67b5e16 |
| verdict-service | v0.1.0 (0232024) | develop 475b48d — 코드는 태그와 같음 |
| place-service | v0.1.3 (95db7e5) | feat/34-search-indexing b9ddae9 — 코드는 태그와 같음 |
| policy-service | v0.1.2 | main f064d1e |
| user-service | v0.2.1 | main 59718c7 |
| report-service | v0.1.0 (1571631) | develop dde9b2d — 코드는 태그와 같음 |
| weather-service | v0.1.0 (0e4b6c5) | develop 23105c9 — 코드는 태그와 같음 |
| notification-service | v0.1.0 | main 8dd17ae |

**믿는 순서는 1/4 과 같습니다.** 레포 코드 → 레포 README → config 라우트 → 명세서 순이며, 명세서에서는 화면 그림과 문구만 가져옵니다. 후기는 서버가 없어 명세서의 후기 요청 · 응답 모양을 브라우저 저장소 구현의 계약으로 씁니다 (2-4).

<br><br>

---

## 0. 읽는 법

장마다 표 1개를 둡니다. 열의 뜻은 1/4 과 같습니다.

| 열 | 뜻 |
|---|---|
| 영역 | 명세서 주석판의 번호 (①②③ …). 번호가 없는 줄은 이 대조에서 새로 찾은 호출입니다 |
| 명세서 | 명세서 「부르는 API」 표에 적힌 경로 |
| 실물 | 레포에서 확인한 경로와 응답. 게이트웨이 기준 전체 경로로 적습니다 |
| 화면이 할 일 | 실물에 맞춰 화면이 처리할 것. **(안)** 은 아직 정하지 않은 처리의 제안입니다 |

---

**표기** — 요청 칸의 ● 는 필수, ○ 는 선택, ✗ 는 보내면 안 되는 칸입니다. 괄호 안은 검증 조건입니다. 상태 코드를 적지 않은 응답은 200 입니다.

<br><br>

---

## 1. 세 장이 함께 쓰는 것

<br><br>

---

### 1-1. 판정 기준

**6 · 7 · 8장의 판정은 모두 「어느 반려동물로 판정하느냐」 에 달려 있습니다.** 이 값은 서버에 저장하지 않는 화면 상태이며, 명세서도 「프론트 상태만 바꾸고 재조회」 로 적고 있습니다.

| 고른 것 | 보내는 `petIds` | 판정 |
|---|---|---|
| 대표 반려동물 (처음 값) | `defaultPetId` 1개 | 그 반려동물 기준 |
| 반려동물 1마리 | 그 `petId` 1개 | 그 반려동물 기준 |
| 모두 함께 | 등록한 반려동물 전부 (100마리까지) | 검색 카드 · 인기 급상승 · 탐색 카운트는 **가장 엄격한 판정 1개로 합칩니다** (search 의 `Verdict::stricter`). 상세는 반려동물마다 따로 줍니다 |
| 반려동물이 없음 | 보내지 않음 | 카드에 판정이 없음 · 탐색 카운트는 400 이라 부르지 않음 |

---

**아래 띠 「현재 판정 기준: 몽이 (말티즈 · 8.0kg · 이동장 있음 · 유모차 없음)」** 은 `GET /api/v1/pets` 의 값으로 만듭니다. 이름 · `breedName` · `weightKg` · `hasCarrier` · `hasStroller` 순입니다. 「모두 함께」 이면 (안) 「현재 판정 기준: 몽이 · 초코 함께 (가장 엄격한 판정)」 으로 적습니다. [기준 변경하기] 는 고르는 창을 열 뿐 서버를 부르지 않습니다.

---

**6장에서 고른 기준은 7 · 8장으로 이어집니다.** (안) 주소창 쿼리 `petIds` 에 담아 넘겨, 새로 고쳐도 유지되게 합니다.

<br><br>

---

### 1-2. 장소 카드 — 6 · 7장 공통

6장의 인기 급상승과 7장의 검색 결과는 같은 카드이며, 응답도 같은 `SearchCardOutput` 입니다. 그림의 칸을 응답에 맞추면 이렇습니다.

| 그림 | 응답 칸 | 화면이 할 일 |
|---|---|---|
| 사진 | `imageUrl` | `null` 이거나 못 불러오면 종류별 기본 그림 — 아래 |
| 「관광지 · 양평」 | `placeType` · `address` | 종류 문구는 1/4 1-8. ⚠카드 응답에 시군구 칸이 없음 — (안) `address` 의 두 번째 토막 |
| 「12.4km」 | `distanceM` | 좌표를 보낼 때만 값이 있음. 인기 급상승은 늘 `null` 이라 숨김 |
| 이름 | `name` | |
| 판정 배지 | `verdicts[] {petId, verdict}` | 1-1 대로 합친 판정 1개. ⚠그림의 「정보 없음」 은 `UNKNOWN` 의 화면 문구 「확인 필요」 로 씀 (1/4 1-8) |
| 본문 두 줄 | `evidenceSummary` | 판정 서버가 주는 카드 한 줄 근거 |
| 아래 「출처: 공공데이터 문장: …」 | 없음 | (안) 「출처: 공공데이터 · {dataBaseDate} 기준」 |
| 하트 | 없음 | ⚠카드 응답에 `isFavorite` 이 없음 — `GET /api/v1/favorites` 로 담긴 `placeId` 를 모아 표시 (1-3) |
| 평점 (그림에 없음) | `ratingAvg` · `reviewCount` | review 서버가 없어 늘 `null` · `0` |

**사진은 장소마다 대표 사진 1장뿐이고, 사진이 있는 장소는 약 16% 입니다.** place 의 `image_url` 은 관광공사 `firstimage` 와 고캠핑 `firstImageUrl` 두 곳에서만 채워집니다. 문화정보원(13,399곳)과 동물병원(5,451곳)은 사진을 주지 않습니다.

| 소스 | place 수 | 사진이 있는 비율 |
|---|---|---|
| PET_TOUR (관광공사) | 1,079 | 82.2% |
| GOCAMPING (고캠핑 · 관광공사) | 2,985 | 75.0% |
| CULTURE_CSV · MOIS_VET | 18,850 | 0% |

그래서 사진이 없는 장소를 위해 종류별 기본 그림 9장(`src/assets/placeholders/place-*.svg`)을 둡니다. 같은 풍경에 종류별 색조와 가운데 아이콘만 바꿔, 카드가 줄지어도 한 서비스의 그림으로 읽히게 합니다. 사진 주소가 깨졌을 때도 같은 그림으로 바꿉니다.

**관광공사 사진은 출처 표시가 이용 조건입니다** (`cpyrhtDivCd` Type1 · Type3). 히어로와 상세의 사진에는 「사진 한국관광공사」 를 적습니다. 두 사진 소스가 모두 관광공사라 사진이 있으면 출처가 같습니다.

---

`hasConflict` 가 참이면 (안) 배지 옆에 작은 「정보 충돌」 표시를 둡니다. `requiredItems` 는 카드에 쓰지 않고 상세에서 씁니다. 카드를 누르면 8장으로 갑니다.

---

**응답 `SearchCardOutput`** 은 13칸입니다.

```
placeId · name · placeType · address · imageUrl (null 가능) · distanceM (좌표를 줄 때만)
verdicts [{petId, verdict}] · hasConflict · evidenceSummary · requiredItems [] · ratingAvg · reviewCount · dataBaseDate
```

<br><br>

---

### 1-3. 즐겨찾기 하트

| 하는 일 | 명세서 | 실물 |
|---|---|---|
| 담기 | `POST /api/v1/favorites` | 같음 · `{placeId ●, memo ○ (200자)}` · 200 `data: null` · 이미 담긴 장소도 성공 |
| 빼기 | `DELETE /api/v1/favorites` | ⚠`DELETE /api/v1/favorites/{placeId}` · 200 `data: null` |
| 담긴 목록 | `GET /api/v1/favorites` (14장) | 같음 · `FavoriteCardOutput[]` 9칸 |

누르면 하트를 먼저 바꾸고, 실패하면 되돌립니다. 카드 응답에 담김 여부가 없으므로 6 · 7장을 열 때 `GET /api/v1/favorites` 를 한 번 불러 `placeId` 모음으로 하트를 채웁니다. 최근 본 장소 카드만 응답에 `isFavorite` 이 있습니다.

<br><br>

---

### 1-4. 지역

**지역은 `sidoCode` (시도 코드 두 자리)와 `sigunguName` (시군구 이름)의 쌍입니다.** 시군구만 보내면 검색이 400 을 냅니다.

| 하는 일 | 실물 |
|---|---|
| 지역 목록 | `GET /api/v1/search/regions` → `[{sidoCode, sidoName, placeCount, sigungus: [{name, placeCount}]}]` |
| 내 위치의 지역 | 서버에 없음 — 1/4 2-1 의 (안) 대로 카카오 JS SDK `coord2RegionCode` |
| 위치를 거부했거나 카카오 키가 없을 때 | 서울 마포구 (`sidoCode=11` · `sigunguName=마포구`) — `.env` 의 `VITE_FALLBACK_SIDO_CODE` · `VITE_FALLBACK_SIGUNGU_NAME` |

⚠`search/regions` 는 명세서 6장 표에 없던 경로입니다. 드롭다운 문구 「서울 마포구」 는 시도의 짧은 이름과 `sigunguName` 입니다. 짧은 이름은 앞 두 글자로 자르지 않고 표로 둡니다 — 자르면 충청북도가 「충청」 이 됩니다 (충북 · 충남 · 전북 · 전남 · 경북 · 경남).

<br><br>

---

## 2. 장별 대조 — 6~8장

<br><br>

---

### 2-1. 6장 메인

개선안 그대로 만듭니다. 위에서부터 날씨 띠 · 히어로(「몽이와 함께 어디로 갈까요?」 · 검색창 · 지역 · 판정 기준 · [찾아보기] · 인기 지역 칩) · 종류 7개 · 「내 주변 인기 급상승 장소」 카드 4장 · 「최근 확인해본 동반 장소」 카드 4장 · 「현재 판정 기준」 띠입니다.

| 영역 | 명세서 | 실물 | 화면이 할 일 |
|---|---|---|---|
| ① | `GET /notifications/unread-count` | `GET /api/v1/notifications/unread-count` · `{unreadCount}` | 헤더 벨 · 45초마다 |
| — | — | `GET /api/v1/weather` | ⚠**새로 찾은 호출.** 그림의 비 예보 띠 — 아래 |
| ③ | `GET /api/v1/search` | 같음 · 2-2 의 파라미터 표 | 메인은 목록을 그리지 않음 — [찾아보기] 가 조건을 7장으로 넘김 |
| ③ | `GET /api/v1/search/suggest?q=` | 같음 · `[{placeId, name, placeType, sigunguName}]` 10개까지 | 고르면 8장 · (안) 입력이 0.25초 멈추면 부름 |
| ④ | `GET /api/v1/pets` | 같음 (스플래시에서 받은 것) | 판정 기준 드롭다운 「모두 함께」 · 이름별 (1-1) |
| — | — | `GET /api/v1/search/regions` | ⚠**새로 찾은 호출.** 지역 드롭다운 「서울 마포구」 (1-4) |
| — | 인기 지역 칩 | 주는 API 없음 | (안) 아래 |
| — | 히어로 배경 (그림은 정원 일러스트) | 인기 급상승 응답의 `imageUrl` | 사진이 있는 첫 장소의 사진 · 오른쪽 아래 「{장소 이름} · 사진 한국관광공사」 (누르면 8장) · 사진이 하나도 없으면 히어로 기본 풍경(`hero-default.svg`) |
| ⑥ | `GET /api/v1/search/trending` | 같음 · `sidoCode ○` · `size ○` (기본 10 · 1~50) · `petIds ○` (100마리까지) → `SearchCardOutput[]` | 4장이라 `size=4` · 거리는 늘 `null` · 「전체 보기」 는 7장 인기순 |
| ⑨ | `GET /users/me/recent-places` | `GET /api/v1/users/me/recent-places` · `size ○` (기본 10 · 1~20) → `RecentPlaceCardOutput[]` | 4장이라 `size=4` · 카드 칸이 적음 — 아래 |
| ⑦ | `POST · DELETE /api/v1/favorites` | 1-3 | 하트 |
| ⑪ | 기준 변경하기 (호출 없음) | 같음 | 1-1 |
| — | 종류 7개 (호출 없음) | 같음 | 7장으로 `placeType` 을 넘김 — 숙소/캠핑은 `STAY` · `CAMPING`, 레저/체험/문화는 `LEISURE` · `CULTURE` |

---

**날씨 띠는 오늘 비 · 눈 소식이 있을 때만 띄웁니다.** 그림은 「이번 주말 양평 비 예보」 이지만, 날씨 서버는 오늘 남은 시간만 줍니다.

| 요청 | 조건 |
|---|---|
| `GET /api/v1/weather?lat=&lon=` | 위치를 받았을 때. 좌표가 격자 밖이면 400 |
| `GET /api/v1/weather?sidoCode=&sigunguName=` | 위치가 없을 때 (1-4 의 고정 지역). `sigunguName` 은 ○ |
| 둘 다 보냄 · 둘 다 없음 | 400 `VALIDATION_FAILED` |

```
WeatherOutput   baseAt · stale (새 발표를 못 받아 직전 발표를 준 것이면 true) · at · tmp (℃)
                · sky (CLEAR · MOSTLY_CLOUDY · CLOUDY) · pty (NONE · RAIN · RAIN_SNOW · SNOW · SHOWER) · pop (강수확률 %)
                · rainToday {firstAt, type} (오늘 남은 시간의 첫 비 · 눈 예보 · 없으면 null)
                · region {sidoCode, sigunguName, matched (SIGUNGU · SIDO)} (null 가능)
```

| 상태 | 띠 |
|---|---|
| `rainToday` 가 있음 | (안) 「오늘 {firstAt 시}부터 {type 문구} 예보 — 실내 동반 가능한 곳 미리 확인하세요!」 · 지역 이름을 앞에 붙임 |
| `rainToday` 가 `null` | 띄우지 않음 |
| 503 `WEATHER_UNAVAILABLE` | 띄우지 않음 — 페이지는 그대로 |
| [×] | (안) 이번 방문 동안 닫아 둠 |

`type` 문구는 (안) `RAIN` 비 · `RAIN_SNOW` 비나 눈 · `SNOW` 눈 · `SHOWER` 소나기입니다.

---

**히어로 제목은 판정 기준을 따릅니다.** 대표가 몽이면 「몽이와 함께 어디로 갈까요?」 이고, 이름에 받침이 있으면 「콩과 함께」 처럼 조사가 바뀝니다 (안: 마지막 글자의 받침으로 「와 · 과」 를 가름). 「모두 함께」 이면 (안) 「우리 아이들과 함께 어디로 갈까요?」, 반려동물이 없으면 (안) 「어디로 떠나볼까요?」 입니다.

---

**인기 지역 칩(양평 · 가평 · 남양주 · 춘천 · 강릉)을 주는 API 가 없습니다.** 인기 급상승은 장소 단위이고, 지역 단위의 인기는 세지 않습니다.

| 안 | 내용 | 장점 | 단점 |
|---|---|---|---|
| A | 그림의 5개를 고정으로 두고 `search/regions` 에 있는 것만 보임 | 그림과 같음 · 호출이 늘지 않음 | 「인기」 가 실제 인기가 아님 |
| B | `search/regions` 의 `placeCount` 상위 5개 | 데이터를 따름 | 「장소가 많은 지역」 이지 인기가 아님 · 그림과 다름 |

(안) A 를 권합니다. 칩은 지역으로 바로 가는 지름길이고, 두 안 모두 인기를 세지 않는다는 점은 같습니다. 누르면 7장으로 그 지역의 `sidoCode` · `sigunguName` 을 넘깁니다.

---

**최근 본 장소 카드는 칸이 적습니다.** `RecentPlaceCardOutput` 은 8칸입니다.

```
placeId · name · placeType · imageUrl · verdict (대표 반려동물 기준 · 대표가 없으면 null)
requiredItems [] · ratingAvg · isFavorite
```

주소 · 거리 · 한 줄 근거가 없어 그림의 카드를 그대로 채울 수 없습니다. (안) 종류 문구만 적고, 본문 자리에 준비물(`requiredItems`)을 적고, 출처 줄은 뺍니다. 판정은 대표 기준으로 고정이라 판정 기준을 바꿔도 이 줄은 바뀌지 않습니다.

⚠이 목록은 **8장을 열 때 화면이 `POST /api/v1/users/me/recent-places` 로 기록해야** 쌓입니다 (2-3). place 를 못 부르면 user 가 목록 전체를 502 로 돌려주므로, 그때는 이 구역만 「불러오지 못했습니다」 로 둡니다. 「전체보기」 는 (안) 최근 본 장소 20곳(상한)을 7장과 같은 격자로 보여 줍니다.

<br><br>

---

### 2-2. 7장 검색 결과

개선안 그대로 만듭니다. 검색창 · 칩 4개(거리순 · 평점순 · 야외석 보유 · 무료주차 지원) · 「몽이의 맞춤 "카페" 탐색 현황」 과 판정별 건수 4칸 · 카드 격자 · 「현재 판정 기준」 띠입니다.

| 영역 | 명세서 | 실물 | 화면이 할 일 |
|---|---|---|---|
| ① | `GET /api/v1/search` | 같음 · 아래 파라미터 · `PageResponse<SearchCardOutput>` | 카드 격자 · (안) 아래 [더 보기] 로 다음 쪽을 이어 붙임 |
| ① | 칩 「거리순 · 평점순」 | `sort=distance` · `sort=rating` | 인기순(`sort=popular`)은 6장 「전체 보기」 로 들어왔을 때만 칩을 켬 (안) |
| ① | 칩 「야외석 보유」 | 데이터 없음 | (안) 뺌 |
| ① | 칩 「무료주차 지원」 | `facility=PARKING` — 주차 가능 여부만 있고 무료인지는 모름 | (안) 문구를 「주차 가능」 으로 |
| ⑥ | `GET /api/v1/search/summary` | 같음 · 검색과 같은 조건(정렬 · 쪽 · `verdict` 빼고) · `petIds ●` → `{total, allowed, conditional, notAllowed, unknown}` | 4칸 — 동반 가능 · 조건부 동반 가능 · 동반 불가 · 확인 필요. (안) 칸을 누르면 그 판정만 (`verdict=`) |
| ⑦ | `POST · DELETE /api/v1/favorites` | 1-3 | 하트 |
| ⑨ | 기준 변경하기 (호출 없음) | 같음 | 1-1 |

---

**`GET /api/v1/search` 파라미터**입니다. 목록 값은 같은 이름을 되풀이해 보냅니다 (`placeType=PARK&placeType=CAFE`).

| 파라미터 | 필수 | 조건 | 화면 |
|---|---|---|---|
| `q` | ○ | | 검색창 |
| `sidoCode` | ○ | `sigunguName` 을 보내면 ● | 지역 |
| `sigunguName` | ○ | | 지역 |
| `lat` · `lon` | ○ | 둘 다 보내거나 둘 다 빼거나 | 브라우저 위치 |
| `radius` | ○ | 양수 · 미터 · 좌표를 보낼 때 기본 20000 | (안) 보내지 않음 |
| `placeType` | ○ 여러 번 | 1/4 1-8 의 9종 | 종류 — (안) 안 고르면 `VET` 을 뺀 8종을 보냄 |
| `facility` | ○ 여러 번 | `PARKING` · `WALKING_TRAIL` · `PLAYGROUND` · `RESERVATION` | 칩 |
| `verdict` | ○ 여러 번 | `petIds` 가 있어야 함 | 건수 칸을 누름 |
| `petIds` | ○ 여러 번 | 100마리까지 | 판정 기준 (1-1) |
| `sort` | ○ | `distance` · `rating` · `popular` (대소문자 무시). 그 밖의 값은 400. 빼면 좌표가 있을 때 거리순, 없을 때 평점순 | 칩 |
| `page` | ○ | 0부터 · 기본 0 | [더 보기] |
| `size` | ○ | 1~100 · 기본 20 | 20 |

---

**좌표는 거리순일 때만 보냅니다.** 좌표를 보내면 서버가 반경 20km(기본값)로 거릅니다. 평점순 · 인기순에서도 좌표를 보내면 지역을 골라도 내 위치에서 20km 밖의 장소가 빠집니다.

| 칩 | 보내는 것 | 카드 |
|---|---|---|
| 거리순 | 좌표 + 지역 · `sort=distance` — 위치 권한이 없으면 칩을 끔 | 거리가 나옴 |
| 평점순 | 지역만 · `sort=rating` — 위치가 없을 때의 기본값 | 거리가 없음 |
| 인기순 | 지역만 · `sort=popular` — 6장 「전체 보기」 로 들어왔을 때만 칩이 보임 | 거리가 없음 |

거리순에서 결과가 없으면 「거리순은 내 위치에서 20km 안의 장소만 봅니다. 평점순으로 바꾸면 고른 지역 전체를 봅니다.」 로 안내합니다.

---

**400 `VALIDATION_FAILED` 가 나는 조합**입니다. `data` 가 `null` 이라 칸별 문구가 없으므로, 화면이 이런 조합을 만들지 않게 합니다.

| 조합 | 막는 법 |
|---|---|
| `sigunguName` 만 있고 `sidoCode` 가 없음 | 지역은 늘 쌍으로 보냄 |
| `lat` 과 `lon` 중 하나만 있음 | 둘을 함께 보냄 |
| `sort=distance` 인데 좌표가 없음 | 위치가 없으면 거리순 칩을 끔 |
| `verdict` 가 있는데 `petIds` 가 없음 | 반려동물이 없으면 건수 칸을 누를 수 없게 함 |
| `radius` 가 0 이하 | 보내지 않음 |
| `size` 가 1 미만이거나 100 초과 · `petIds` 가 100 초과 | 해당 없음 |

| code | 문구 (안) |
|---|---|
| `PLACE_UNAVAILABLE` 502 · `VERDICT_UNAVAILABLE` 502 | 검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요. |

---

**탐색 현황 제목**은 (안) 「{판정 기준 이름}의 맞춤 "{고른 종류 또는 검색어}" 탐색 현황」 입니다. 「모두 함께」 이면 「우리 아이들의 맞춤 …」, 종류도 검색어도 없으면 「… 맞춤 동반 장소 탐색 현황」 입니다. 반려동물이 없으면 건수 4칸을 숨기고 (안) 「반려동물을 등록하면 동반 가능 여부를 함께 보여 드립니다」 를 둡니다.

<br><br>

---

### 2-3. 8장 장소 상세

개선안 그대로 만듭니다. 사진 · 장소명과 [정보가 틀렸어요] · 위치와 전화번호 · 상단 배지 · 탭 3개(시설 안내 · 규정 · 방문 후기) · 편의제공 사항 · 장소 소개 · 확인 사항과 [근거 원문 전체 보기] · 오른쪽 「일정 추가」 와 「상세 위치 지도」 · 아래 「전체 후기」 입니다.

| 영역 | 명세서 | 실물 | 화면이 할 일 |
|---|---|---|---|
| ① | `GET /api/v1/places/{placeId}` | 같음 · `PlaceDetailOutput` 19칸 (아래) | 404 `PLACE_NOT_FOUND` 면 (안) 「찾을 수 없는 장소입니다」 와 [돌아가기] |
| ② | `GET /places/{placeId}/verdict` | `GET /api/v1/places/{placeId}/verdict?petIds=` · `petIds ●` (1~100) → `PlaceVerdictOutput` | 상단 배지 — 아래 |
| ⑤ | (위 응답의 reasons) | `verdicts[].reasons[]` | 확인 사항 줄 — 아래 |
| ⑥ | `GET /places/{placeId}/documents` | `GET /api/v1/places/{placeId}/documents` → `{documents: [{source, sourceLabel, title, body, sourceModifiedAt, fetchedAt}]}` | [근거 원문 전체 보기] 를 누를 때 불러 창으로 보임 |
| ⑦ | `POST /api/v1/itineraries` | 같음 · `{placeId ●, visitAt ● (날짜와 시각 · 지난 시각도 됨), petId ○, memo ○ (200자)}` → `{stopId}` | 「일정 추가」 카드 — 아래 |
| ⑧ | 길찾기 (카카오맵 SDK) | 서버 호출 없음 | (안) 카카오맵 길찾기 주소 `https://map.kakao.com/link/to/{이름},{lat},{lon}` — 키 없이 열림 |
| ⑩ | `GET /places/{placeId}/reviews` | 서버 없음 | 브라우저 저장소 (2-4) |
| ⑪ | 후기 작성하기 (화면 이동) | — | 9장으로 |
| ⑫ | `GET /places/{placeId}/conflicts` | `GET /api/v1/places/{placeId}/conflicts` (policy) → `[{fieldName, label, conflictType (CROSS_SOURCE · INTRA_SOURCE), sourceValues: [{source, origin, value}]}]` | (안) 판정 응답의 `hasConflict` 가 참일 때만 불러 「규정」 구역에 표로 |
| ⑩ | 후기 좋아요 · 수정 · 삭제 | 서버 없음 | 브라우저 저장소 (2-4) |
| ⑬ | `POST /api/v1/reports` | 같음 · 유형별 칸 규칙 (아래) → **201** `{reportId}` | [정보가 틀렸어요] 창 · 후기 [신고] |
| — | — | `POST /api/v1/users/me/recent-places` `{placeId ●}` | ⚠**새로 찾은 호출.** 상세를 열 때 부름. 안 부르면 6장 「최근 확인해본」 이 비어 있음 |
| — | — | `POST /api/v1/search/trending/views` `{placeId ●}` → **204** | ⚠**새로 찾은 호출.** 상세를 열 때 부름. 인기 급상승의 점수가 이것으로 쌓임 |

---

**`PlaceDetailOutput`** 은 19칸입니다.

```
placeId · name · placeType · address · lat · lon · tel · telSource · homepage · reservationUrl
imageUrl · overview · businessHours · closedDays · facilities [] · supplyPoint · status (ACTIVE · CLOSED · UNKNOWN)
sources [{source, sourceLabel}] · dataBaseDate
```

| 그림 | 칸 | 화면이 할 일 |
|---|---|---|
| 사진 3장 | `imageUrl` 1개 | ⚠사진이 1장뿐 — (안) 1장을 사진 자리 전체에 넓게 · 없으면 종류별 바탕 |
| 「위치 \ 전화번호」 | `address` · `tel` | 전화는 하이픈을 넣어 보임 (서버는 `02-381-5052` 와 `0222377582` 를 섞어 보냄) |
| 편의제공 사항 칩 | `facilities` | 1/4 1-8 의 문구 · 그림의 안내대로 코드에 있는 것만 |
| 장소 소개 | `overview` | 출처 줄은 `sources[].sourceLabel` |
| (그림에 없음) | `businessHours` · `closedDays` · `homepage` · `reservationUrl` | (안) 장소 소개 아래 한 줄씩 · 값이 없으면 줄을 뺌 |
| (그림에 없음) | `status` | (안) `CLOSED` 면 사진 위에 「폐업으로 확인된 장소입니다」 |
| 지도 아래 「홍대입구역 6번 출구에서 250m」 | 없음 | ⚠가까운 역 데이터가 없음 — (안) 주소를 적음 |

---

**상단 배지와 확인 사항은 판정 상세 `PlaceVerdictOutput` 으로 그립니다.**

```
PlaceVerdictOutput   placeId · hasConflict · correctionSource (관리자 정정의 출처 · 없으면 null)
                     · requiredItems [] · verdicts [{petId, verdict, reasons []}]
ReasonOutput         field · label · status (NOT_MET · MISSING · CONDITION · MET · INFO) · message
                     · evidence [{source, originField, text, extractionMethod}]
```

그림의 상단 배지 3개(「소형견 동반 가능 · 중형견 동반 가능 · 반려동물 입장 가능」)는 크기별 허용처럼 보이지만, 판정 서버는 **반려동물마다 판정 1개**를 줍니다. (안) 판정 기준의 반려동물마다 배지 1개(「몽이 · 조건부 가능」)와 `requiredItems` 준비물 태그를 둡니다.

확인 사항은 판정 기준 반려동물의 `reasons` 를 한 줄씩 적습니다. 상태 기호와 색은 1/4 1-8 을 따르고, 오른쪽 「출처」 는 `evidence[].text` 를, 읽은 방식은 `extractionMethod` 의 화면 문구(1/4 1-8)를 씁니다. 「모두 함께」 이면 (안) 반려동물마다 묶어 적습니다. `correctionSource` 가 있으면 (안) 「관리자가 확인한 정보」 표시를 붙입니다.

---

**탭 3개**는 (안) 같은 페이지 안의 구역으로 옮겨 가는 이동 표시입니다. 시설 안내는 편의 · 소개 · 확인 사항으로, 규정은 반려동물별 판정 이유 전체와 조건 충돌 표로, 방문 후기는 「전체 후기」 로 갑니다. 「방문 후기(N개)」 의 N 은 브라우저 저장소의 후기 수입니다.

---

**「일정 추가」 카드**입니다.

| 칸 | 보내는 값 |
|---|---|
| 방문 예정 일자 · 방문 예상 시간 | 합쳐서 `visitAt` — 시간대 없이 `2026-10-15T13:00:00` |
| 방문 예정 동물 | `petId` — 드롭다운 문구는 그림대로 「{breedName} {이름} ({weightKg}kg)」 |
| (그림에 없음) | `memo` 는 보내지 않음 |

| code | 문구 (안) |
|---|---|
| `ITINERARY_DUPLICATE` 400 | 같은 시각에 이미 담아 둔 장소입니다. |
| `PET_NOT_FOUND` 404 | 반려동물 정보를 다시 불러와 주세요. |
| 성공 200 | 「내 일정에 추가했습니다」 와 (안) [일정 보기] (10장) |

---

**[정보가 틀렸어요] 와 후기 [신고]** 는 같은 `POST /api/v1/reports` 입니다. `content` (●, 1000자)는 모든 유형에 필요하고, 나머지 칸은 유형마다 규칙이 다릅니다. ✗ 칸을 보내도 400 입니다.

| `reportType` | 문구 | `fieldName` (40자) | `reportedValue` (500자) | `visitedAt` (오늘까지) | `targetReviewId` |
|---|---|---|---|---|---|
| `INFO_WRONG` | 정보 오류 | ● | ○ | ○ | ✗ |
| `CONDITION_WRONG` | 조건 오류 | ○ | ○ | ○ | ✗ |
| `PLACE_MERGED_WRONG` | 잘못 병합됨 | ✗ | ● | ✗ | ✗ |
| `CLOSED` | 폐업 | ✗ | ✗ | ○ | ✗ |
| `REVIEW_ABUSE` | 후기 신고 | ✗ | ✗ | ✗ | ● |

| code | 문구 (안) |
|---|---|
| `VALIDATION_FAILED` 400 · `data: null` | 유형별 칸 규칙에 어긋남 — 화면이 만들지 않게 막음 |
| `REPORT_ALREADY_PENDING` 409 | 같은 내용으로 보낸 제보가 아직 처리 중입니다. |
| `REPORT_DAILY_LIMIT` 429 | 오늘 보낼 수 있는 제보를 모두 보냈습니다. 내일 다시 보내 주세요. |

`INFO_WRONG` 의 `fieldName` 에는 장소 응답의 칸 이름을 보냅니다 — `name` · `address` · `tel` · `businessHours` · `closedDays` · `homepage` · `overview` · `imageUrl` (화면에는 「장소 이름」 · 「주소」 처럼 보임). `CONDITION_WRONG` 은 판정 이유의 `field` 를 보냅니다. 17장이 이 값으로 정정할 칸을 찾습니다.

후기 신고의 `targetReviewId` 는 브라우저 저장소 후기의 id 입니다. report 는 후기가 있는지 확인하지 않으므로 그대로 받습니다.

<br><br>

---

### 2-4. 후기 목록 — 브라우저 저장소 계약

> ⚠ 2026년 9월 23일 — 후기는 review v0.1.0 에 붙었습니다. 아래 「서버 없음 · 브라우저 저장소」 서술은 그때까지의 것이며, 지금 계약은 레포 README 0-3 · 11장과 review-service README 를 봅니다.

**review 서버가 없어, 명세서 8장 ⑩ `GET /api/v1/places/{placeId}/reviews` 의 응답 모양을 브라우저 저장소의 계약으로 씁니다.** 그 뒤 review v0.1.0 이 나와 실제 API 로 바뀌었고, 반려동물이 여러 마리가 되면서 요청 · 응답 모양도 달라졌습니다 (레포 README 11장).

```
content [{
  reviewId · rating (1~5) · facilityScore · ruleScore · moodScore (각 1~5)
  · content (1000자) · photos [] · tags [] · likeCount · likedByMe · isMine · canDelete
  · visitedAt (날짜만) · author {nickname, profileImageUrl} · petSummary {breedName, weightKg, breedSize}
}]
page {number, size, totalElements, totalPages}
```

| 칸 | 브라우저 저장소에서 |
|---|---|
| `isMine` | 저장할 때 적어 둔 `accountId` 가 지금 로그인한 계정과 같은가 |
| `likedByMe` | 좋아요를 누른 `accountId` 모음에 지금 계정이 있는가 |
| `canDelete` | `isMine` 이거나 지금 계정의 `role` 이 `ADMIN` |
| `author` | 쓸 때의 `nickname` · 프로필 사진은 서명 주소라 (안) 넣지 않음 |
| `petSummary` | 쓸 때의 반려동물 스냅샷 |

| 그림 | 계산 |
|---|---|
| 전체 평점 「4.8」 · 별 · 「총 142개의 솔직한 평가」 | `rating` 평균 (소수 첫째 자리) · 개수 |
| 반려동물 동반 만족도 상세 3줄 | `facilityScore` · `ruleScore` · `moodScore` 평균 — 「시설이 작성된 것과 같았나요」 · 「규정이 같았나요」 · 「분위기가 생각과 같았나요」 |
| 정렬 칩 | 최신순(쓴 시각 · 저장소만 가진 칸) · 평점 높은순 · 평점 낮은순 · 사진 후기만 보기(`photos` 가 있는 것) |
| 쪽 | 10개씩 |

저장소 열쇠는 `pawtrail.reviews.v1` (`localStorage`) 이고, 응답 모양에 더해 저장소에만 있는 칸이 있습니다.

| 칸 | 쓰는 곳 |
|---|---|
| `accountId` | `isMine` · `canDelete` 계산 |
| `likedBy` | `likeCount` (개수) · `likedByMe` 계산 |
| `createdAt` | 최신순 정렬 |
| `placeName` · `placeType` · `petId` | 16장 「작성한 후기」 목록 |

카드의 평점(1-2)과 마이페이지의 후기 수(1/4 2-1)도 같은 저장소에서 셉니다. 사진을 담는 방식은 9장과 함께 3/4 에서 정합니다.

<br><br>

---

## 3. 명세서와 실물이 다른 것 — 이 판에서 찾은 것

| 자리 | 명세서 | 실물 |
|---|---|---|
| 즐겨찾기 빼기 | `DELETE /api/v1/favorites` | `DELETE /api/v1/favorites/{placeId}` |
| 지역 목록 | 없음 | `GET /api/v1/search/regions` |
| 날씨 띠 | 없음 · 그림은 「이번 주말」 | `GET /api/v1/weather` · 오늘 남은 시간만 |
| 상세를 열 때 | 없음 | `POST /api/v1/users/me/recent-places` · `POST /api/v1/search/trending/views` |
| 인기 급상승 거리 | 카드마다 거리 | `distanceM` 늘 `null` |
| 탐색 카운트 | 판정별 건수 | `petIds` 가 없으면 400 |
| 장소 카드 | 시군구 · 하트 · 출처 문장 | 시군구 칸 없음 · `isFavorite` 없음 · 한 줄 근거(`evidenceSummary`)만 |
| 최근 본 장소 카드 | 인기 급상승과 같은 카드 | 8칸 · 대표 반려동물 기준 판정 1개 |
| 판정 배지 문구 | 정보 없음 | `UNKNOWN` → 확인 필요 |
| 검색 칩 | 야외석 보유 · 무료주차 지원 | 야외석 데이터 없음 · `PARKING` 은 주차 가능 여부만 |
| 인기 지역 칩 | 양평 · 가평 · 남양주 · 춘천 · 강릉 | 주는 API 없음 |
| 상세 사진 | 3장 | `imageUrl` 1개 |
| 상세 상단 배지 | 크기별 동반 가능 3개 | 반려동물마다 판정 1개 |
| 판정 상세 | `petIds` 없이 부름 | `petIds` ● (1~100) |
| 가까운 역 | 「홍대입구역 6번 출구에서 250m」 | 데이터 없음 |
| 후기 | review 서버 | 서버 없음 — 브라우저 저장소 |

<br><br>

---

## 4. 정할 것 — 이 판의 (안)

| 번호 | 정할 것 | (안) |
|---|---|---|
| 1 | 인기 지역 칩 | A — 그림의 5개를 고정으로 두고 지역 목록에 있는 것만 |
| 2 | 검색 칩 「야외석 보유」 · 「무료주차 지원」 | 야외석은 빼고, 무료주차는 「주차 가능」 으로 |
| 3 | 카드 아래 출처 줄 | 「출처: 공공데이터 · {dataBaseDate} 기준」 |
| 4 | 카드 평점 | 브라우저 저장소의 후기 평균 |
| 5 | 최근 본 장소 카드 · 「전체보기」 | 본문 자리에 준비물 · 전체보기는 20곳 격자 |
| 6 | 상세 사진 | 1장을 넓게 · 없으면 종류별 기본 그림 |
| 7 | 상세 상단 배지 | 반려동물마다 판정 배지 + 준비물 태그 |
| 8 | 가까운 역 | 주소로 대신 |
| 9 | 탭 3개 | 같은 페이지 안의 구역 이동 |
| 10 | 날씨 띠 | 오늘 비 · 눈이 있을 때만 · 없으면 숨김 |
| 11 | 종류를 안 골랐을 때 | 동물병원을 뺀 8종 |
| 12 | 후기 시연 데이터 | 미리 넣지 않음 — 시연에서 9장으로 직접 씀 |

<br><br>

---

## 5. 다음 판에 들어갈 것

| 판 | 장 |
|---|---|
| 3/4 | 9 후기 작성 · 10 일정 확인 · 11 안내 시작 · 12~16 마이페이지 |
| 4/4 | 17~21 관리자 · 그림이 없는 화면 (알림 목록 · 계정 관리 · 알림 설정 · 문의 내역) · 명세와 실물이 다른 것 총목록 |
