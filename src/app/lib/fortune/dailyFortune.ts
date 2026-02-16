// 일일 운세 계산기

import type {
  BirthInfo,
  DailyFortune,
  FiveElement,
  FortuneLevel,
  ElementRelation,
} from "./types";
import { ELEMENT_INFO, HEAVENLY_STEMS, EARTHLY_BRANCHES } from "./types";
import { getDailyStemBranch, getStemElement } from "./stemBranch";
import {
  getElementRelation,
  getFortuneLevel,
  getLuckyColors,
  getBalancingElement,
} from "./fiveElements";

/**
 * 출생연도로부터 사용자의 오행을 계산
 * 출생연도의 천간으로부터 오행을 결정한다.
 */
function getUserElement(birthYear: number): FiveElement {
  // 출생연도 1월 1일 기준으로 천간 계산
  const { stem } = getDailyStemBranch(birthYear, 1, 1);
  return getStemElement(stem);
}

/**
 * 행운의 오행 결정
 * - 대길/길: 오늘의 오행이 행운
 * - 주의: 나를 생해주는 오행이 행운 (균형)
 * - 보통/같음: 내 오행이 행운
 */
function determineLuckyElement(
  fortuneLevel: FortuneLevel,
  userElement: FiveElement,
  todayElement: FiveElement
): FiveElement {
  switch (fortuneLevel) {
    case "very_lucky":
    case "lucky":
      return todayElement;
    case "caution":
      return getBalancingElement(userElement);
    case "neutral":
      return userElement;
  }
}

/**
 * 운세 메시지 생성
 */
export function generateFortuneMessage(
  fortune: Pick<
    DailyFortune,
    "fortuneLevel" | "userElement" | "todayElement" | "relation"
  > & { luckyElement?: FiveElement }
): string {
  const userName = ELEMENT_INFO[fortune.userElement].nameKo;
  const todayName = ELEMENT_INFO[fortune.todayElement].nameKo;
  const luckyName = fortune.luckyElement
    ? ELEMENT_INFO[fortune.luckyElement].nameKo
    : "";

  switch (fortune.relation) {
    case "generated_by":
      return `오늘은 ${todayName}의 기운이 당신의 ${userName}를 돋워줍니다! 최고의 하루예요.`;
    case "generate":
      return `당신의 ${userName} 에너지가 오늘 ${todayName}와 조화를 이룹니다. 좋은 하루가 될 거예요.`;
    case "same":
      return `오늘은 ${userName}의 기운이 함께합니다. 평온한 하루를 보내세요.`;
    case "overcome":
      return `오늘의 ${todayName}를 당신의 ${userName}가 다스립니다. 안정적인 하루입니다.`;
    case "overcome_by":
      return `오늘은 ${todayName}의 기운이 강하니, ${luckyName} 색상으로 균형을 맞춰보세요.`;
  }
}

/**
 * 일일 운세 계산
 * 사용자의 출생 정보와 날짜를 기반으로 운세를 산출한다.
 */
export function calculateDailyFortune(
  birthInfo: BirthInfo,
  date?: Date
): DailyFortune {
  const targetDate = date ?? new Date();
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();

  // 날짜 문자열 생성 (YYYY-MM-DD)
  const dateString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // 오늘의 천간지지 계산
  const { stem: todayStem, branch: todayBranch } = getDailyStemBranch(
    year,
    month,
    day
  );

  // 오늘의 오행
  const todayElement = getStemElement(todayStem);

  // 사용자의 오행
  const userElement = getUserElement(birthInfo.birthYear);

  // 관계 판정
  const relation: ElementRelation = getElementRelation(
    userElement,
    todayElement
  );

  // 운세 등급
  const fortuneLevel: FortuneLevel = getFortuneLevel(relation);

  // 행운의 오행 결정
  const luckyElement = determineLuckyElement(
    fortuneLevel,
    userElement,
    todayElement
  );

  // 행운 색상 키워드
  const luckyColors = getLuckyColors(luckyElement);

  // 메시지 생성
  const message = generateFortuneMessage({
    fortuneLevel,
    userElement,
    todayElement,
    relation,
    luckyElement,
  });

  // 천간/지지 한국어 이름 조회 (로깅 및 디버깅용)
  const stemInfo = HEAVENLY_STEMS.find((s) => s.id === todayStem);
  const branchInfo = EARTHLY_BRANCHES.find((b) => b.id === todayBranch);
  if (stemInfo && branchInfo) {
    console.log(
      `[운세 계산] ${dateString}: ${stemInfo.nameHanja}${branchInfo.nameHanja}일 (${stemInfo.nameKo}${branchInfo.nameKo})`
    );
  }

  return {
    date: dateString,
    todayStem,
    todayBranch,
    todayElement,
    userElement,
    relation,
    fortuneLevel,
    luckyColors,
    luckyElement,
    message,
  };
}
