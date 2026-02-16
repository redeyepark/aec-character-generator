// 의상 색상 매칭 엔진

import type { FiveElement, OutfitColorMatch } from "./types";
import { ELEMENT_INFO } from "./types";

/**
 * 모든 오행의 색상 키워드를 길이 내림차순으로 정렬하여 반환
 * 긴 키워드가 먼저 매칭되어야 "dark blue"가 "blue"보다 우선한다.
 */
function getAllColorKeywordsSorted(): {
  keyword: string;
  element: FiveElement;
}[] {
  const allKeywords: { keyword: string; element: FiveElement }[] = [];

  for (const [element, info] of Object.entries(ELEMENT_INFO)) {
    for (const keyword of info.colorKeywords) {
      allKeywords.push({ keyword, element: element as FiveElement });
    }
  }

  // 길이 내림차순 정렬 (긴 키워드가 먼저 매칭)
  allKeywords.sort((a, b) => b.keyword.length - a.keyword.length);

  return allKeywords;
}

// 정렬된 키워드 목록을 캐싱
const SORTED_COLOR_KEYWORDS = getAllColorKeywordsSorted();

/**
 * 파일명에서 색상 키워드를 추출하고 오행으로 매핑
 */
export function matchOutfitColor(filename: string): OutfitColorMatch {
  const lowerFilename = filename.toLowerCase();
  const matchedColors: string[] = [];
  const matchedElements: FiveElement[] = [];

  for (const { keyword, element } of SORTED_COLOR_KEYWORDS) {
    if (lowerFilename.includes(keyword)) {
      if (!matchedColors.includes(keyword)) {
        matchedColors.push(keyword);
      }
      if (!matchedElements.includes(element)) {
        matchedElements.push(element);
      }
    }
  }

  return {
    filename,
    matchedColors,
    matchedElements,
    isLucky: false, // 기본값, filterLuckyOutfits에서 결정
  };
}

/**
 * 행운 색상에 해당하는 의상 필터링
 * 파일명에 행운 색상 키워드가 포함된 의상만 반환한다.
 */
export function filterLuckyOutfits(
  outfits: string[],
  luckyColors: string[]
): string[] {
  if (luckyColors.length === 0) return [];

  return outfits.filter((filename) => {
    const lowerFilename = filename.toLowerCase();
    return luckyColors.some((color) => lowerFilename.includes(color));
  });
}
