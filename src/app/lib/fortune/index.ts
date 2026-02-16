// 운세 모듈 공개 API

// 타입 재내보내기
export type {
  FiveElement,
  HeavenlyStem,
  EarthlyBranch,
  FortuneLevel,
  ElementRelation,
  DailyFortune,
  BirthInfo,
  OutfitColorMatch,
} from "./types";

// 상수 재내보내기
export {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  ELEMENT_INFO,
  FORTUNE_LEVEL_INFO,
} from "./types";

// 천간지지 엔진
export {
  getJulianDayNumber,
  getDailyStemBranch,
  getStemElement,
} from "./stemBranch";

// 오행 엔진
export {
  getElementRelation,
  getFortuneLevel,
  getLuckyColors,
  getBalancingElement,
} from "./fiveElements";

// 일일 운세 계산기
export {
  calculateDailyFortune,
  generateFortuneMessage,
} from "./dailyFortune";

// 의상 색상 매칭
export {
  matchOutfitColor,
  filterLuckyOutfits,
} from "./outfitColorMatcher";
