// 천간지지 계산 엔진

import type { HeavenlyStem, EarthlyBranch, FiveElement } from "./types";
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from "./types";

/**
 * 줄리안 일수(Julian Day Number) 계산
 * 그레고리력 날짜를 줄리안 일수로 변환한다.
 */
export function getJulianDayNumber(
  year: number,
  month: number,
  day: number
): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * 특정 날짜의 천간지지 반환
 * 기준점(Epoch): 1900-01-01 = 경자일(庚子日)
 * - stemIndex = 6 (경)
 * - branchIndex = 0 (자)
 */
export function getDailyStemBranch(
  year: number,
  month: number,
  day: number
): { stem: HeavenlyStem; branch: EarthlyBranch } {
  // 기준일: 1900-01-01의 줄리안 일수
  const epochJDN = getJulianDayNumber(1900, 1, 1);
  const targetJDN = getJulianDayNumber(year, month, day);

  const dayOffset = targetJDN - epochJDN;

  // 음수 처리를 위한 모듈러 연산
  const stemIndex = ((6 + dayOffset) % 10 + 10) % 10;
  const branchIndex = ((0 + dayOffset) % 12 + 12) % 12;

  return {
    stem: HEAVENLY_STEMS[stemIndex].id,
    branch: EARTHLY_BRANCHES[branchIndex].id,
  };
}

/**
 * 천간 -> 오행 변환
 * 천간 인덱스를 2로 나눈 몫으로 오행을 결정한다.
 * 0,1 -> 목(wood), 2,3 -> 화(fire), 4,5 -> 토(earth), 6,7 -> 금(metal), 8,9 -> 수(water)
 */
export function getStemElement(stem: HeavenlyStem): FiveElement {
  const stemIndex = HEAVENLY_STEMS.findIndex((s) => s.id === stem);
  if (stemIndex === -1) {
    // 유효하지 않은 천간의 경우 기본값 반환
    return "wood";
  }

  const elements: FiveElement[] = ["wood", "fire", "earth", "metal", "water"];
  return elements[Math.floor(stemIndex / 2)];
}
