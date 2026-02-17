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
  | "face"
  | "expression"
  | "mustache"
  | "hair"
  | "glasses";

// 캐릭터 조합 (각 레이어별 선택된 파일명)
export interface CharacterCombination {
  body: string;
  face: string;
  expression: string;
  mustache: string | null; // null = 수염 없음
  hair: string;
  glasses: string | null; // null = 안경 없음
  skinTone?: SkinTone;
}

// 에셋 인덱스 구조 (assetIndex.json 의 타입)
export interface AssetIndex {
  body: Record<OutfitCategory, string[]>;
  face: string[];
  "face-svg"?: string[];
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
}
