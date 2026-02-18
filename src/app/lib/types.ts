// 기분 카테고리
export type MoodCategory =
  | "happy"
  | "confident"
  | "calm"
  | "surprised"
  | "thoughtful"
  | "playful"
  | "determined";

// 의상 카테고리
export type OutfitCategory =
  | "casual"
  | "formal"
  | "sporty"
  | "outerwear"
  | "bowtie"
  | "all";

// 얼굴형
export type FaceShape =
  | "heart"
  | "oval"
  | "round"
  | "round_square_jaw"
  | "square_jaw";

// 에셋 레이어 종류
export type LayerType =
  | "body"
  | "bodyItem"
  | "face"
  | "expression"
  | "mustache"
  | "hair"
  | "glasses"
  | "handItem";

// 캐릭터 조합 (각 레이어별 선택된 파일명)
export interface CharacterCombination {
  body: string;
  bodyItem: string | null; // 착용 소품 (힙색, 망토, 가디건 등)
  face: string;
  expression: string;
  mustache: string | null; // null = 수염 없음
  hair: string;
  glasses: string | null; // null = 안경 없음
  handItem: string | null; // 손 아이템 (음료, 꽃, 운동기구 등)
  skinTone?: SkinTone;
  outfitMainColor?: string;  // 의상 메인 색상 hex (SPEC-OUTFIT-001)
  outfitSubColor?: string;   // 의상 서브 색상 hex (SPEC-OUTFIT-001)
}

// 에셋 인덱스 구조 (assetIndex.json 의 타입)
export interface AssetIndex {
  body: Record<OutfitCategory, string[]>;
  face: string[];
  "face-svg"?: string[];
  "body-svg"?: string[];  // SVG 의상 파일 목록 (SPEC-OUTFIT-001)
  expression: Record<string, string[]>; // 그룹 번호 → 파일명 배열
  mustache: {
    common: string[];
    round: string[];
    slim: string[];
    square: string[];
    special: string[];
  };
  hair: string[];
  glasses: string[];
  "body-item"?: string[]; // 착용 소품 (힙색, 망토 등)
  "hand-item"?: string[]; // 손 아이템 (음료, 꽃 등)
}

// 기분 카테고리 정보
export interface MoodInfo {
  id: MoodCategory;
  nameKo: string;
  nameEn: string;
  expressionGroup: number;
}

// 의상 카테고리 정보
export interface OutfitInfo {
  id: OutfitCategory;
  nameKo: string;
  nameEn: string;
}

// 기분 카테고리 매핑 상수
export const MOOD_CATEGORIES: MoodInfo[] = [
  { id: "happy", nameKo: "행복/쾌활", nameEn: "Happy/Cheerful", expressionGroup: 1 },
  { id: "confident", nameKo: "자신감/쿨", nameEn: "Confident/Cool", expressionGroup: 2 },
  { id: "calm", nameKo: "차분/편안", nameEn: "Calm/Relaxed", expressionGroup: 3 },
  { id: "surprised", nameKo: "놀람/흥분", nameEn: "Surprised/Excited", expressionGroup: 4 },
  { id: "thoughtful", nameKo: "사려깊음/진지", nameEn: "Thoughtful/Serious", expressionGroup: 5 },
  { id: "playful", nameKo: "유쾌/재미", nameEn: "Playful/Fun", expressionGroup: 6 },
  { id: "determined", nameKo: "결연/강인", nameEn: "Determined/Strong", expressionGroup: 7 },
];

// 기분별 색상 매핑 (달력 시각화용)
export const MOOD_COLOR_MAP: Record<MoodCategory, { bg: string; text: string; dot: string }> = {
  happy:      { bg: "bg-yellow-200", text: "text-yellow-900", dot: "bg-yellow-400" },
  confident:  { bg: "bg-orange-200", text: "text-orange-900", dot: "bg-orange-400" },
  calm:       { bg: "bg-blue-200",   text: "text-blue-900",   dot: "bg-blue-400" },
  surprised:  { bg: "bg-purple-200", text: "text-purple-900", dot: "bg-purple-400" },
  thoughtful: { bg: "bg-indigo-200", text: "text-indigo-900", dot: "bg-indigo-400" },
  playful:    { bg: "bg-pink-200",   text: "text-pink-900",   dot: "bg-pink-400" },
  determined: { bg: "bg-red-200",    text: "text-red-900",    dot: "bg-red-400" },
};

// 의상 카테고리 매핑 상수
export const OUTFIT_CATEGORIES: OutfitInfo[] = [
  { id: "casual", nameKo: "캐주얼", nameEn: "Casual" },
  { id: "formal", nameKo: "포멀", nameEn: "Formal" },
  { id: "sporty", nameKo: "스포티", nameEn: "Sporty" },
  { id: "outerwear", nameKo: "아우터", nameEn: "Outerwear" },
  { id: "bowtie", nameKo: "보타이", nameEn: "Bowtie" },
  { id: "all", nameKo: "전체", nameEn: "All" },
];

// 얼굴형-수염 호환성 매핑
export const FACE_MUSTACHE_COMPATIBILITY: Record<FaceShape, string[]> = {
  heart: ["common", "special"],
  oval: ["common", "special"],
  round: ["common", "round", "special"],
  round_square_jaw: ["common", "round", "square", "special"],
  square_jaw: ["common", "square", "special"],
};

// 파일명으로부터 얼굴형(FaceShape)을 추출하는 매핑
export const FACE_FILENAME_TO_SHAPE: Record<string, FaceShape> = {
  "heart 4.png": "heart",
  "oval 4.png": "oval",
  "round 4.png": "round",
  "round square jaw 4.png": "round_square_jaw",
  "square jaw 4.png": "square_jaw",
};

// 피부톤
export type SkinTone = "fair" | "light" | "medium" | "warm" | "tan" | "brown" | "dark" | "deep";

// 피부톤 정보
export interface SkinToneInfo {
  id: SkinTone;
  nameKo: string;
  hex: string;
}

// 피부톤 색상 상수 (8가지)
export const SKIN_TONE_COLORS: SkinToneInfo[] = [
  { id: "fair", nameKo: "밝은 살색", hex: "#FDEBD0" },
  { id: "light", nameKo: "연한 살색", hex: "#F5CBA7" },
  { id: "medium", nameKo: "중간 살색", hex: "#E0A96D" },
  { id: "warm", nameKo: "따뜻한 살색", hex: "#C68642" },
  { id: "tan", nameKo: "구릿빛", hex: "#8D5524" },
  { id: "brown", nameKo: "갈색", hex: "#6B3A2A" },
  { id: "dark", nameKo: "진한 갈색", hex: "#4A2511" },
  { id: "deep", nameKo: "짙은 갈색", hex: "#2C1608" },
];

// 기본 피부톤
export const DEFAULT_SKIN_TONE: SkinTone = "medium";

// SVG 얼굴 파일명 → 얼굴형 매핑
export const SVG_FACE_FILENAME_TO_SHAPE: Record<string, FaceShape> = {
  "heart 0.svg": "heart",
  "oval 0.svg": "oval",
  "round 0.svg": "round",
  "round square jaw 0.svg": "round_square_jaw",
  "square jaw 0.svg": "square_jaw",
};

// ============================================
// 이하 SPEC-UPDATE-001에서 추가된 타입
// ============================================

// 사용자 프로필
export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  role?: string; // 사용자 역할 (예: 'admin', 'user'). 없으면 기본 'user'
  created_at: string;
  birthYear?: number; // 출생 연도 (운세 계산용)
  birthMonth?: number; // 출생 월
  birthDay?: number; // 출생 일
  birthHour?: number; // 출생 시 (선택사항)
  isLunar?: boolean; // true = 음력, false/undefined = 양력
}

// 베이스 캐릭터 (고정 레이어: 얼굴, 헤어, 수염, 안경)
export interface BaseCharacter {
  id: string;
  user_id: string;
  face: string;
  hair: string;
  mustache: string | null;
  glasses: string | null;
  skinTone: string;
  created_at: string;
  updated_at: string;
}

// 무드 다이어리 항목
export interface MoodEntry {
  id: string;
  user_id: string;
  character_id: string;
  date: string;
  mood_category: MoodCategory;
  outfit_file: string;
  expression_file: string;
  composite_image_url: string | null;
  outfit_main_color?: string;  // 의상 메인 색상 hex (SPEC-OUTFIT-001)
  outfit_sub_color?: string;   // 의상 서브 색상 hex (SPEC-OUTFIT-001)
  created_at: string;
  updated_at: string;
}

// 캐릭터 생성 위자드 상태
export interface WizardState {
  step: 1 | 2 | 3 | 4 | 5;
  face: string | null;
  hair: string | null;
  mustache: string | null;
  glasses: string | null;
  skinTone: SkinTone;
}

// 일일 무드 선택 상태
export interface DailyMoodState {
  moodCategory: MoodCategory | null;
  expressionFile: string | null;
  outfitCategory: OutfitCategory | null;
  outfitFile: string | null;
  outfitMainColor?: string;  // 의상 메인 색상 hex (SPEC-OUTFIT-001)
  outfitSubColor?: string;   // 의상 서브 색상 hex (SPEC-OUTFIT-001)
}

// ============================================
// 이하 SPEC-EVENT-001에서 추가된 타입
// ============================================

/** 출석 데이터 (UI용 도메인 타입) */
export interface AttendanceData {
  yearMonth: string;
  attendedDates: string[];
  currentStreak: number;
  maxStreak: number;
  totalDays: number;
}

/** 보상 데이터 (UI용 도메인 타입) */
export interface RewardData {
  unlockedRewards: UnlockedReward[];
}

/** 개별 해금 보상 */
export interface UnlockedReward {
  milestone: number;
  rewardType: "expression" | "outfit" | "outfit_set" | "body_item" | "hand_item";
  rewardFiles: string[];
  unlockedAt: Date;
  unlockedMonth: string;
}

/** 마일스톤 설정 */
export interface MilestoneConfig {
  days: number;
  rewardType: "expression" | "outfit" | "outfit_set";
  rewardFiles: string[];
  label: string;
  rewardCount?: number;
}

/** 아이템 해금 티어 설정 */
export interface ItemUnlockTier {
  streakDays: number;
  bodyItemCount: number; // 누적 해금 개수
  handItemCount: number; // 누적 해금 개수
  label: string;
}

/** 출석 스트릭 기반 아이템 해금 티어 매핑 */
export const ITEM_UNLOCK_TIERS: ItemUnlockTier[] = [
  { streakDays: 3, bodyItemCount: 15, handItemCount: 0, label: "3일 연속" },
  { streakDays: 7, bodyItemCount: 60, handItemCount: 30, label: "7일 연속" },
  { streakDays: 14, bodyItemCount: 60, handItemCount: 86, label: "14일 연속" },
  { streakDays: 30, bodyItemCount: 60, handItemCount: 116, label: "30일 연속" },
];

/** 마일스톤 매핑 테이블 */
export const MILESTONES: MilestoneConfig[] = [
  { days: 3, rewardType: "expression", rewardFiles: ["special_exp_streak3.png"], label: "3일 연속" },
  { days: 7, rewardType: "outfit", rewardFiles: ["special_outfit_streak7.png"], label: "7일 연속" },
  { days: 14, rewardType: "outfit", rewardFiles: ["special_outfit_streak14.png", "special_exp_streak14.png"], label: "14일 연속" },
  { days: 30, rewardType: "outfit_set", rewardFiles: ["premium_outfit_30_1.png", "premium_outfit_30_2.png", "premium_outfit_30_3.png"], label: "30일 연속" },
];

// ============================================
// 이하 SPEC-EVENT-002에서 추가된 타입
// ============================================

/** 일일 보상 수령 기록 */
export interface DailyRewardClaim {
  dayNumber: number;        // 주기 내 일차 (1~cycleLength)
  claimedDate: string;      // 실제 수령 날짜 (YYYY-MM-DD)
  itemType: "body_item" | "hand_item";
  itemFile: string;         // 지급된 아이템 파일명
}

/** 이벤트 보상 데이터 (UI용 도메인 타입) */
export interface EventRewardData {
  cycleLength: number;              // 주기 길이 (기본 14)
  cycleNumber: number;              // 현재 주기 번호 (1, 2, 3...)
  cycleStartDate: string;           // 현재 주기 시작일 (YYYY-MM-DD)
  dailyClaims: DailyRewardClaim[];  // 현재 주기의 수령 기록
  cycleCompleted: boolean;          // 현재 주기 완주 여부
  completionBonusClaimed: boolean;  // 완주 보너스 수령 여부
  completedCycles: number;          // 총 완주 횟수
  allClaimedItems: {                // 영구 보관: 모든 주기의 수령 아이템
    itemType: "body_item" | "hand_item";
    itemFile: string;
  }[];
}

/** 일일 보상 수령 결과 */
export interface DailyClaimResult {
  claimed: boolean;
  dayNumber: number;
  itemType: "body_item" | "hand_item";
  itemFile: string;
  isCycleComplete: boolean;
  bonusItems: { itemType: "body_item" | "hand_item"; itemFile: string }[] | null;
}

/** 아이템 풀 항목 */
export interface ItemPoolEntry {
  itemType: "body_item" | "hand_item";
  itemFile: string;
}

/** 주기 완주 보너스 설정 */
export interface CycleCompletionBonus {
  cycleLength: number;
  bonusItems: ItemPoolEntry[];
  label: string;
}

/** 기본 주기 길이 */
export const DEFAULT_CYCLE_LENGTH = 14;

// ============================================
// 이하 SPEC-OUTFIT-001에서 추가된 타입
// ============================================

// 의상 색상 정보
export interface OutfitColorInfo {
  id: string;
  nameKo: string;
  hex: string;
}

// 의상 색상 프리셋 팔레트 (16색)
export const OUTFIT_COLOR_PRESETS: OutfitColorInfo[] = [
  { id: "red", nameKo: "빨강", hex: "#E74C3C" },
  { id: "coral", nameKo: "코랄", hex: "#FF6B6B" },
  { id: "orange", nameKo: "주황", hex: "#F39C12" },
  { id: "yellow", nameKo: "노랑", hex: "#F1C40F" },
  { id: "green", nameKo: "초록", hex: "#27AE60" },
  { id: "teal", nameKo: "청록", hex: "#1ABC9C" },
  { id: "blue", nameKo: "파랑", hex: "#3498DB" },
  { id: "navy", nameKo: "네이비", hex: "#2C3E50" },
  { id: "purple", nameKo: "보라", hex: "#9B59B6" },
  { id: "pink", nameKo: "핑크", hex: "#E91E8F" },
  { id: "white", nameKo: "하양", hex: "#FFFFFF" },
  { id: "lightgray", nameKo: "밝은 회색", hex: "#BDC3C7" },
  { id: "gray", nameKo: "회색", hex: "#919191" },
  { id: "darkgray", nameKo: "진한 회색", hex: "#555555" },
  { id: "black", nameKo: "검정", hex: "#2C2C2C" },
  { id: "brown", nameKo: "갈색", hex: "#8B4513" },
];

// 기본 의상 색상
export const DEFAULT_OUTFIT_MAIN_COLOR = "#919191";
export const DEFAULT_OUTFIT_SUB_COLOR = "#C6C6C6";

/** 주기 완주 보너스 설정 */
export const CYCLE_COMPLETION_BONUS: CycleCompletionBonus = {
  cycleLength: 14,
  bonusItems: [
    { itemType: "body_item", itemFile: "event_bonus_body_01.png" },
    { itemType: "hand_item", itemFile: "event_bonus_hand_01.png" },
    { itemType: "hand_item", itemFile: "event_bonus_hand_02.png" },
  ],
  label: "14일 완주 보너스",
};
