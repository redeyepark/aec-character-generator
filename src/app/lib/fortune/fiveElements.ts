// 오행 상생상극 엔진

import type { FiveElement, ElementRelation, FortuneLevel } from "./types";
import { ELEMENT_INFO } from "./types";

// 상생 관계: A가 B를 생한다 (목->화->토->금->수->목)
const GENERATION_MAP: Record<FiveElement, FiveElement> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

// 상극 관계: A가 B를 극한다 (목->토->수->화->금->목)
const OVERCOME_MAP: Record<FiveElement, FiveElement> = {
  wood: "earth",
  fire: "metal",
  earth: "water",
  metal: "wood",
  water: "fire",
};

/**
 * 두 오행 간의 관계 판정
 * - 오늘이 나를 생해주면: generated_by (대길)
 * - 내가 오늘을 생하면: generate (길)
 * - 오늘이 나를 극하면: overcome_by (주의)
 * - 내가 오늘을 극하면: overcome (보통 - 유리한 측)
 * - 같은 오행: same (보통)
 */
export function getElementRelation(
  userElement: FiveElement,
  todayElement: FiveElement
): ElementRelation {
  if (userElement === todayElement) {
    return "same";
  }

  // 오늘이 나를 생해주는 관계 (오늘 -> 나)
  if (GENERATION_MAP[todayElement] === userElement) {
    return "generated_by";
  }

  // 내가 오늘을 생하는 관계 (나 -> 오늘)
  if (GENERATION_MAP[userElement] === todayElement) {
    return "generate";
  }

  // 오늘이 나를 극하는 관계 (오늘 -> 나)
  if (OVERCOME_MAP[todayElement] === userElement) {
    return "overcome_by";
  }

  // 내가 오늘을 극하는 관계 (나 -> 오늘)
  if (OVERCOME_MAP[userElement] === todayElement) {
    return "overcome";
  }

  // 도달할 수 없지만 안전을 위해 기본값 반환
  return "same";
}

/**
 * 관계에서 운세 등급 결정
 */
export function getFortuneLevel(relation: ElementRelation): FortuneLevel {
  switch (relation) {
    case "generated_by":
      return "very_lucky";
    case "generate":
      return "lucky";
    case "overcome_by":
      return "caution";
    case "overcome":
    case "same":
      return "neutral";
  }
}

/**
 * 오행별 행운 색상 키워드 반환
 */
export function getLuckyColors(element: FiveElement): string[] {
  return ELEMENT_INFO[element].colorKeywords;
}

/**
 * 주의 등급 시 균형 오행 산출
 * 나를 생해주는 오행을 찾아 반환한다.
 * 예: 내가 목(wood)이면 -> 수(water)가 나를 생하므로 수 반환
 */
export function getBalancingElement(userElement: FiveElement): FiveElement {
  // 나를 생해주는 오행 = GENERATION_MAP에서 value가 userElement인 key
  const entries = Object.entries(GENERATION_MAP) as [FiveElement, FiveElement][];
  const generator = entries.find(([, generated]) => generated === userElement);
  return generator ? generator[0] : userElement;
}
