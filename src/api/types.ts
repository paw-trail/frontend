// 레포 실물 DTO 를 옮긴 타입. 칸 이름은 응답 JSON 그대로다.

export type Role = 'USER' | 'ADMIN';
export type AuthProvider = 'LOCAL' | 'GOOGLE';
export type BreedSize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type Species = 'DOG' | 'CAT' | 'ETC';
export type Verdict = 'ALLOWED' | 'CONDITIONAL' | 'NOT_ALLOWED' | 'UNKNOWN';
export type PlaceType = 'PARK' | 'CAMPING' | 'CAFE' | 'STAY' | 'CULTURE' | 'LEISURE' | 'RESTAURANT' | 'ETC' | 'VET';
export type FacilityCode = 'PARKING' | 'WALKING_TRAIL' | 'PLAYGROUND' | 'RESERVATION';
export type ReasonStatus = 'NOT_MET' | 'MISSING' | 'CONDITION' | 'MET' | 'INFO';
export type ReportType = 'INFO_WRONG' | 'CONDITION_WRONG' | 'PLACE_MERGED_WRONG' | 'CLOSED' | 'REVIEW_ABUSE';
export type ReportStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type NotifType = 'POLICY_CHANGED' | 'REPORT_RESOLVED';

export type PageResponse<T> = {
  content: T[];
  page: { number: number; size: number; totalElements: number; totalPages: number };
};

/** auth AccountOutput */
export type Account = {
  accountId: string;
  email: string;
  role: Role;
  authProvider: AuthProvider;
};

/** user ProfileOutput — reviewCount 는 review 를 못 부르면 null */
export type Profile = {
  accountId: string;
  nickname: string | null;
  profileImageUrl: string | null;
  defaultPetId: string | null;
  stats: { visitCount: number; reviewCount: number | null; favoriteCount: number };
};

/** pet PetOutput — photoUrl 은 서명 붙은 주소 (1시간 뒤 만료) */
export type Pet = {
  petId: string;
  name: string;
  weightKg: number;
  breedSize: BreedSize | null;
  hasCarrier: boolean;
  hasStroller: boolean;
  vaccineCompleted: boolean;
  vaccineProofAvailable: boolean;
  photoUrl: string | null;
  note: string | null;
  breedCode: string;
  breedName: string;
  species: Species;
  isDangerousBreed: boolean;
};

export type Breed = { code: string; nameKo: string };

export type UploadUrl = { uploadUrl: string; fileUrl: string; expiresIn: number };

// ---- 6~8장 (대조표 2/4) ----

export type PrecipitationType = 'NONE' | 'RAIN' | 'RAIN_SNOW' | 'SNOW' | 'SHOWER';
export type SkyCondition = 'CLEAR' | 'MOSTLY_CLOUDY' | 'CLOUDY';

export type PetVerdict = { petId: string; verdict: Verdict | null };

/** search SearchCardOutput — 검색 · 인기 급상승 카드 */
export type SearchCard = {
  placeId: string;
  name: string;
  placeType: PlaceType;
  address: string | null;
  imageUrl: string | null;
  distanceM: number | null;
  verdicts: PetVerdict[];
  hasConflict: boolean;
  evidenceSummary: string | null;
  requiredItems: string[];
  ratingAvg: number | null;
  reviewCount: number;
  dataBaseDate: string | null;
  /** 장소 좌표 — 브라우저가 내 위치와의 거리를 계산하는 데 씀 (search 가 카드에 싣기 전에는 오지 않음) */
  lat?: number | null;
  lon?: number | null;
};

export type SearchSummary = { total: number; allowed: number; conditional: number; notAllowed: number; unknown: number };

export type Suggestion = { placeId: string; name: string; placeType: PlaceType; sigunguName: string | null };

export type Region = {
  sidoCode: string;
  sidoName: string;
  placeCount: number;
  sigungus: { name: string; placeCount: number }[];
};

/** weather WeatherOutput */
export type Weather = {
  baseAt: string;
  stale: boolean;
  at: string;
  tmp: number | null;
  sky: SkyCondition | null;
  pty: PrecipitationType | null;
  pop: number | null;
  rainToday: { firstAt: string; type: PrecipitationType } | null;
  region: { sidoCode: string; sigunguName: string | null; matched: 'SIGUNGU' | 'SIDO' } | null;
};

/** user FavoriteCardOutput — verdict 는 대표 반려동물 기준 */
export type FavoriteCard = {
  placeId: string;
  name: string;
  placeType: PlaceType;
  imageUrl: string | null;
  verdict: Verdict | null;
  requiredItems: string[];
  ratingAvg: number | null;
  memo: string | null;
  createdAt: string;
};

/** user RecentPlaceCardOutput — 8칸 · verdict 는 대표 반려동물 기준 */
export type RecentPlaceCard = {
  placeId: string;
  name: string;
  placeType: PlaceType;
  imageUrl: string | null;
  verdict: Verdict | null;
  requiredItems: string[];
  ratingAvg: number | null;
  isFavorite: boolean;
};

/** place PlaceDetailOutput — 19칸 */
export type PlaceDetail = {
  placeId: string;
  name: string;
  placeType: PlaceType;
  address: string | null;
  lat: number | null;
  lon: number | null;
  tel: string | null;
  telSource: string | null;
  homepage: string | null;
  reservationUrl: string | null;
  imageUrl: string | null;
  overview: string | null;
  businessHours: string | null;
  closedDays: string | null;
  facilities: FacilityCode[];
  supplyPoint: boolean;
  status: 'ACTIVE' | 'CLOSED' | 'UNKNOWN';
  sources: { source: string; sourceLabel: string }[];
  dataBaseDate: string | null;
};

export type PlaceDocument = {
  source: string;
  sourceLabel: string;
  title: string | null;
  body: string | null;
  sourceModifiedAt: string | null;
  fetchedAt: string | null;
};

export type Evidence = { source: string; originField: string | null; text: string; extractionMethod: string | null };

export type Reason = { field: string; label: string; status: ReasonStatus; message: string; evidence: Evidence[] };

/** verdict PlaceVerdictOutput — 반려동물마다 판정 1개 */
export type PlaceVerdictDetail = {
  placeId: string;
  hasConflict: boolean;
  correctionSource: string | null;
  requiredItems: string[];
  verdicts: { petId: string; verdict: Verdict; reasons: Reason[] }[];
};

/** policy ConflictOutput */
export type Conflict = {
  fieldName: string;
  label: string;
  conflictType: 'CROSS_SOURCE' | 'INTRA_SOURCE';
  sourceValues: { source: string; origin: string | null; value: string | null }[];
};

/** user ItineraryCardOutput — 17칸 · 끝나는 시각은 없음 */
export type ItineraryCard = {
  stopId: string;
  placeId: string;
  name: string;
  imageUrl: string | null;
  lat: number | null;
  lon: number | null;
  placeType: PlaceType;
  supplyPoint: boolean;
  visitAt: string;
  petId: string | null;
  visitOrder: number | null;
  memo: string | null;
  verdict: Verdict | null;
  requiredItems: string[];
  ratingAvg: number | null;
  visited: boolean;
  visitId: string | null;
};

/** user VisitCardOutput — 13칸 · summary 는 그날 요약이 하루에 한 카드에만 실림 */
export type VisitCard = {
  visitId: string;
  placeId: string;
  name: string;
  placeType: PlaceType;
  imageUrl: string | null;
  requiredItems: string[];
  ratingAvg: number | null;
  visitedAt: string;
  petId: string | null;
  verdictAtVisit: Verdict | null;
  memo: string | null;
  summary: string | null;
  isFavorite: boolean;
};

export type DailySummary = { visitDate: string; summary: string; generatedAt: string };

/** notification NotificationCardOutput — readAt 이 null 이면 안 읽음 */
export type NotificationCard = {
  notificationId: string;
  notifType: NotifType;
  placeId: string | null;
  placeName: string | null;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type NotificationSettings = { policyChanged: boolean; reportResolved: boolean };

/** report ReportCardOutput — 13칸 · 처리되면 memo · reviewedAt 이 채워짐 */
export type ReportCard = {
  reportId: string;
  reportType: ReportType;
  placeId: string;
  placeName: string | null;
  targetReviewId: string | null;
  fieldName: string | null;
  reportedValue: string | null;
  content: string;
  visitedAt: string | null;
  status: ReportStatus;
  memo: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

// ---- 17~21장 관리자 (대조표 4/4 3장) ----

/** report AdminReportCardOutput — 사용자 문의 내역 칸 + 보낸 사람 · 처리한 사람 */
export type AdminReportCard = ReportCard & {
  reporter: { accountId: string; nickname: string | null; profileImageUrl: string | null };
  reviewedBy: string | null;
};

export type PlacePending = {
  pendingId: string;
  placeId: string;
  placeName: string;
  fieldName: string;
  currentValue: string | null;
  newValue: string | null;
  source: string;
  detectedAt: string;
};

export type OutboxMessage = {
  id: string;
  eventId: string;
  topic: string;
  aggregateType: string;
  aggregateId: string;
  createdAt: string;
  retryCount: number;
  lastError: string | null;
};

export type PolicyScope = 'ALL_AREA' | 'PARTIAL' | 'NONE' | 'UNKNOWN';
export type SizeRule = 'SMALL_ONLY' | 'SMALL_MEDIUM' | 'ALL';
export type BreedRule = 'NONE' | 'DANGEROUS_MUZZLE' | 'DANGEROUS_BANNED';
export type ExtraFeeUnit = 'PER_DOG' | 'PER_NIGHT' | 'PER_VISIT';

/** policy 조건 20칸 — 순서는 DB 컬럼 순서 (policy README 2-4) · null 은 모름 */
export type PolicyFields = {
  scope: PolicyScope | null;
  guideDogOnly: boolean | null;
  petOnly: boolean | null;
  indoorAllowed: boolean | null;
  outdoorAllowed: boolean | null;
  maxWeightKg: number | null;
  weightInclusive: boolean | null;
  maxCount: number | null;
  sizeRule: SizeRule | null;
  breedRule: BreedRule | null;
  carrierRequired: boolean | null;
  leashRequired: boolean | null;
  excludedZones: string[] | null;
  allowedZonesOnly: string[] | null;
  excludedDays: string[] | null;
  extraFeeAmount: number | null;
  extraFeeUnit: ExtraFeeUnit | null;
  requiredItems: string[] | null;
  vaccineProof: boolean | null;
  advanceInquiry: boolean | null;
};

export type PolicyAdmin = {
  placeId: string;
  fields: PolicyFields;
  correction: { source: 'MANUAL' | 'OWNER'; reason: string; correctedAt: string } | null;
};

/*
 * 후기 — review v0.1.0.
 * 장소 후기와 내 후기가 담는 칸이 다르다 (내 후기는 작성자가 나라서 체중을 다시 보이지 않는다).
 */

/** 후기에 남은 반려동물 스냅샷 — 쓸 때 복사한 그날 값이라 지금 값과 다를 수 있다 */
export type ReviewPet = { breedName: string | null; weightKg: number | null; breedSize: BreedSize | null };
export type MyReviewPet = { breedName: string | null; breedSize: BreedSize | null };

export type PlaceReview = {
  reviewId: string;
  rating: number;
  facilityScore: number;
  ruleScore: number;
  moodScore: number;
  content: string;
  /** 서명된 보기 주소 (1시간) · 수정할 때 그대로 돌려보내면 서버가 키만 뽑는다 */
  photos: string[];
  tags: string[];
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
  /** 내 후기이거나 내가 관리자일 때 참 */
  canDelete: boolean;
  visitedAt: string;
  author: { nickname: string | null; profileImageUrl: string | null };
  pets: ReviewPet[];
};

/** 평균 넷은 후기가 없으면 0.0 으로 온다 (null 아님) · 거르기 · 쪽과 무관한 장소 전체 값 */
export type ReviewSummary = {
  ratingAvg: number;
  facilityAvg: number;
  ruleAvg: number;
  moodAvg: number;
  reviewCount: number;
};

export type PlaceReviewList = PageResponse<PlaceReview> & { summary: ReviewSummary };

export type MyReview = {
  reviewId: string;
  placeId: string;
  /** place 를 못 불렀으면 null 로 온다 (목록은 그대로 나간다) */
  placeName: string | null;
  rating: number;
  content: string;
  photos: string[];
  tags: string[];
  likeCount: number;
  visitedAt: string;
  pets: MyReviewPet[];
};
