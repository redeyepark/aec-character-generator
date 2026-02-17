// 운세 시스템 타입 정의

// 오행 (Five Elements)
export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";

// 천간 (Heavenly Stems) - 10간
export type HeavenlyStem =
  | "gap"
  | "eul"
  | "byeong"
  | "jeong"
  | "mu"
  | "gi"
  | "gyeong"
  | "sin"
  | "im"
  | "gye";

// 지지 (Earthly Branches) - 12지
export type EarthlyBranch =
  | "ja"
  | "chuk"
  | "in"
  | "myo"
  | "jin"
  | "sa"
  | "o"
  | "mi"
  | "sinBranch"
  | "yu"
  | "sul"
  | "hae";

// 운세 등급
export type FortuneLevel = "very_lucky" | "lucky" | "neutral" | "caution";

// 오행 관계
export type ElementRelation =
  | "generate"
  | "generated_by"
  | "overcome"
  | "overcome_by"
  | "same";

// 일일 운세 결과
export interface DailyFortune {
  date: string;
  todayStem: HeavenlyStem;
  todayBranch: EarthlyBranch;
  todayElement: FiveElement;
  userElement: FiveElement;
  relation: ElementRelation;
  fortuneLevel: FortuneLevel;
  luckyColors: string[];
  luckyElement: FiveElement;
  message: string;
}

// 사용자 사주 정보
export interface BirthInfo {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number; // 하위 호환용 (UI에서 더 이상 수집하지 않음)
  isLunar?: boolean; // true = 음력, false/undefined = 양력
}

// 의상 색상 매칭 결과
export interface OutfitColorMatch {
  filename: string;
  matchedColors: string[];
  matchedElements: FiveElement[];
  isLucky: boolean;
}

// --- 상수 매핑 ---

// 천간 정보 배열 (갑을병정무기경신임계)
export const HEAVENLY_STEMS: {
  id: HeavenlyStem;
  nameKo: string;
  nameHanja: string;
  element: FiveElement;
}[] = [
  { id: "gap", nameKo: "갑", nameHanja: "甲", element: "wood" },
  { id: "eul", nameKo: "을", nameHanja: "乙", element: "wood" },
  { id: "byeong", nameKo: "병", nameHanja: "丙", element: "fire" },
  { id: "jeong", nameKo: "정", nameHanja: "丁", element: "fire" },
  { id: "mu", nameKo: "무", nameHanja: "戊", element: "earth" },
  { id: "gi", nameKo: "기", nameHanja: "己", element: "earth" },
  { id: "gyeong", nameKo: "경", nameHanja: "庚", element: "metal" },
  { id: "sin", nameKo: "신", nameHanja: "辛", element: "metal" },
  { id: "im", nameKo: "임", nameHanja: "壬", element: "water" },
  { id: "gye", nameKo: "계", nameHanja: "癸", element: "water" },
];

// 지지 정보 배열 (자축인묘진사오미신유술해)
export const EARTHLY_BRANCHES: {
  id: EarthlyBranch;
  nameKo: string;
  nameHanja: string;
}[] = [
  { id: "ja", nameKo: "자", nameHanja: "子" },
  { id: "chuk", nameKo: "축", nameHanja: "丑" },
  { id: "in", nameKo: "인", nameHanja: "寅" },
  { id: "myo", nameKo: "묘", nameHanja: "卯" },
  { id: "jin", nameKo: "진", nameHanja: "辰" },
  { id: "sa", nameKo: "사", nameHanja: "巳" },
  { id: "o", nameKo: "오", nameHanja: "午" },
  { id: "mi", nameKo: "미", nameHanja: "未" },
  { id: "sinBranch", nameKo: "신", nameHanja: "申" },
  { id: "yu", nameKo: "유", nameHanja: "酉" },
  { id: "sul", nameKo: "술", nameHanja: "戌" },
  { id: "hae", nameKo: "해", nameHanja: "亥" },
];

// 오행 상세 정보 (색상 키워드 포함)
export const ELEMENT_INFO: Record<
  FiveElement,
  {
    nameKo: string;
    nameHanja: string;
    colors: string[];
    colorKeywords: string[];
  }
> = {
  wood: {
    nameKo: "목",
    nameHanja: "木",
    colors: ["청색", "녹색"],
    colorKeywords: ["green", "emerald", "teal"],
  },
  fire: {
    nameKo: "화",
    nameHanja: "火",
    colors: ["적색", "자색"],
    colorKeywords: ["red", "rose", "orange", "pink"],
  },
  earth: {
    nameKo: "토",
    nameHanja: "土",
    colors: ["황색", "갈색"],
    colorKeywords: ["yellow", "amber", "brown", "beige"],
  },
  metal: {
    nameKo: "금",
    nameHanja: "金",
    colors: ["백색", "금색"],
    colorKeywords: ["white", "grey", "gray", "silver"],
  },
  water: {
    nameKo: "수",
    nameHanja: "水",
    colors: ["흑색", "남색"],
    colorKeywords: ["blue", "navy", "black", "indigo", "dark"],
  },
};

// 운세 등급 정보
export const FORTUNE_LEVEL_INFO: Record<
  FortuneLevel,
  { nameKo: string; description: string }
> = {
  very_lucky: {
    nameKo: "대길",
    description: "오늘의 기운이 나를 돕습니다",
  },
  lucky: {
    nameKo: "길",
    description: "좋은 기운이 함께합니다",
  },
  neutral: {
    nameKo: "보통",
    description: "평온한 하루가 될 것입니다",
  },
  caution: {
    nameKo: "주의",
    description: "색상으로 균형을 맞춰보세요",
  },
};
