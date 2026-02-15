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
}

// 에셋 인덱스 구조 (assetIndex.json 의 타입)
export interface AssetIndex {
  body: Record<OutfitCategory, string[]>;
  face: string[];
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

// ============================================
// 이하 SPEC-UPDATE-001에서 추가된 타입
// ============================================

// 사용자 프로필
export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
}

// 베이스 캐릭터 (고정 레이어: 얼굴, 헤어, 수염, 안경)
export interface BaseCharacter {
  id: string;
  user_id: string;
  face: string;
  hair: string;
  mustache: string | null;
  glasses: string | null;
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
  step: 1 | 2 | 3 | 4;
  face: string | null;
  hair: string | null;
  mustache: string | null;
  glasses: string | null;
}

// 일일 무드 선택 상태
export interface DailyMoodState {
  moodCategory: MoodCategory | null;
  expressionFile: string | null;
  outfitCategory: OutfitCategory | null;
  outfitFile: string | null;
}
