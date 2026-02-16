---
id: SPEC-UX-001
title: "Phase 1 UX/UI Improvements - Calendar Visualization, Mood Simplification, Onboarding"
version: 1.0.0
status: completed
created: 2026-02-17
updated: 2026-02-17
author: MoAI
priority: high
lifecycle: spec-anchored
tags: ux, ui, calendar, mood, onboarding, phase-1
related_specs:
  - SPEC-UI-001
  - SPEC-UPDATE-001
---

# SPEC-UX-001: Phase 1 UX/UI 개선

## 1. 개요

AEC Character Generator 앱의 사용자 경험을 경쟁 앱(Daylio, Finch, Pixels, Zepeto) 수준으로 개선하기 위한 Phase 1 UX/UI 개선 명세이다. 세 가지 P0 개선 사항을 포함한다.

### 1.1 배경

현재 앱은 기능적으로 동작하지만, 경쟁 앱 대비 다음과 같은 UX 격차가 존재한다:

- **달력**: 회색 그리드에 작은 이모지만 표시되어 감정 패턴을 한눈에 파악하기 어렵다
- **기분 기록**: 자동 랜덤 선택 후 저장하는 흐름이지만, 저장 버튼의 시각적 강조가 부족하고 부가 옵션이 동일 비중으로 표시된다
- **온보딩**: 회원가입 후 설명 없이 캐릭터 생성 위자드로 진입하여 앱의 핵심 가치를 전달하지 못한다

### 1.2 목표

| 목표 | 측정 기준 |
|------|----------|
| 감정 패턴 시각화 | 달력에서 월별 감정 분포를 색상으로 즉시 파악 가능 |
| 기분 기록 간소화 | 기분 선택 후 1-tap으로 저장 가능한 흐름 |
| 첫 사용자 이해도 향상 | 3-slide 온보딩으로 앱 핵심 가치 전달 |

---

## 2. 환경 (Environment)

### 2.1 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js | 15.1+ |
| UI Library | React | 19.0+ |
| Styling | Tailwind CSS | 4.0+ |
| Backend | Firebase | 12.9+ |
| Language | TypeScript | 5.0+ |

### 2.2 영향 범위

| 개선 항목 | 영향 파일 | 변경 유형 |
|-----------|-----------|-----------|
| 달력 색상 시각화 | `src/app/components/DiaryCalendar.tsx` | 수정 |
| 달력 색상 시각화 | `src/app/lib/types.ts` | 수정 (색상 상수 추가) |
| 기분 기록 간소화 | `src/app/mood/page.tsx` | 수정 |
| 온보딩 플로우 | `src/app/components/OnboardingSlides.tsx` | 신규 |
| 온보딩 플로우 | `src/app/create/page.tsx` | 수정 |

### 2.3 제약 사항

- 새로운 외부 라이브러리를 추가하지 않는다 (기존 Tailwind CSS + React만 사용)
- Firebase 데이터 스키마를 변경하지 않는다
- 기존 7개 MoodCategory 타입과 MOOD_CATEGORIES 상수를 유지한다
- 모바일 우선(Mobile-first) 반응형 디자인을 준수한다

---

## 3. 가정 (Assumptions)

| ID | 가정 | 신뢰도 | 근거 | 오류 시 위험 |
|----|------|--------|------|-------------|
| A1 | 7개 기분 카테고리 각각에 고유한 색상을 할당할 수 있다 | 높음 | Pixels 앱에서 검증된 패턴 | 색상 충돌 시 접근성 문제 발생 |
| A2 | 사용자는 기분 선택 시 자동 생성된 표정/의상을 대부분 수용한다 | 중간 | Daylio의 2-tap 철학이 높은 완료율 달성 | 커스터마이징 요구가 높으면 UI 재설계 필요 |
| A3 | 3-slide 온보딩이 사용자 이탈을 증가시키지 않는다 | 중간 | Finch의 부드러운 온보딩이 호평 | Skip 옵션 필수 |
| A4 | localStorage로 온보딩 완료 상태를 관리할 수 있다 | 높음 | 기존 앱에서 클라이언트 상태 관리 패턴 사용 중 | Firebase에 저장 시 추가 스키마 변경 필요 |

---

## 4. 요구사항 (Requirements)

### 4.1 모듈 1: 달력 색상 시각화 (Calendar Color Visualization)

**REQ-UX-001-01** [Ubiquitous]
시스템은 **항상** 각 MoodCategory에 대해 고유한 배경색을 매핑해야 한다.

| MoodCategory | 색상명 | Tailwind 클래스 | HEX |
|-------------|--------|----------------|-----|
| happy | Yellow | `bg-yellow-300` | #FDE047 |
| confident | Orange | `bg-orange-300` | #FDBA74 |
| calm | Blue | `bg-blue-300` | #93C5FD |
| surprised | Purple | `bg-purple-300` | #D8B4FE |
| thoughtful | Indigo | `bg-indigo-300` | #A5B4FC |
| playful | Pink | `bg-pink-300` | #F9A8D4 |
| determined | Red | `bg-red-300` | #FCA5A5 |

**REQ-UX-001-02** [Event-Driven]
**WHEN** DiaryCalendar 컴포넌트가 렌더링될 때, **THEN** 무드 기록이 있는 날짜 셀의 배경색을 해당 MoodCategory의 매핑 색상으로 표시해야 한다.

**REQ-UX-001-03** [State-Driven]
**IF** 달력 셀이 선택된 상태(isSelected === true)이면, **THEN** 배경색 대신 진한 파란색(`bg-blue-500 text-white`)을 유지하고, 무드 색상은 셀 내부의 작은 색상 도트(dot)로 표시해야 한다.

**REQ-UX-001-04** [Unwanted Behavior]
시스템은 무드 기록이 없는 날짜에 색상 배경을 적용**하지 않아야 한다**. 기록이 없는 날짜는 기존과 동일하게 흰색/투명 배경을 유지한다.

**REQ-UX-001-05** [Event-Driven]
**WHEN** 사용자가 색상이 적용된 달력 셀을 클릭하면, **THEN** 기존과 동일하게 해당 날짜의 상세 정보가 오른쪽 패널에 표시되어야 한다.

---

### 4.2 모듈 2: 기분 기록 간소화 (Mood Recording Simplification)

**REQ-UX-001-06** [Event-Driven]
**WHEN** 사용자가 기분 카테고리를 선택하면, **THEN** 표정과 의상이 자동으로 랜덤 생성되고, 저장 버튼이 즉시 활성화 상태로 표시되어야 한다.

**REQ-UX-001-07** [Ubiquitous]
시스템은 **항상** 저장 버튼을 주요 액션(Primary CTA)으로 시각적으로 강조해야 한다. 구체적으로:
- 높이: 최소 `py-4` (기존 `py-3`에서 확대)
- 글꼴 크기: `text-lg font-bold` (기존 `font-medium`에서 강화)
- 색상: `bg-blue-600` (기존 `bg-blue-500`에서 진하게)
- 전체 너비: `w-full` (flex-1 대신)

**REQ-UX-001-08** [State-Driven]
**IF** 기분 카테고리가 선택된 상태이면, **THEN** 의상 선택 및 "다시 뽑기" 버튼은 접힌 상태(collapsed)의 "세부 조정" 섹션으로 그룹화되어 표시해야 한다. 사용자가 해당 섹션을 펼치면(expand) 기존 의상 선택 UI가 표시된다.

**REQ-UX-001-09** [Unwanted Behavior]
시스템은 저장 버튼과 다운로드 버튼을 동일한 시각적 비중으로 표시**하지 않아야 한다**. 다운로드 버튼은 보조 액션(Secondary)으로 outline 스타일을 적용한다.

**REQ-UX-001-10** [Optional]
**가능하면** 기분 선택 시 부드러운 전환 애니메이션(scale + opacity transition)을 제공한다.

---

### 4.3 모듈 3: 온보딩 플로우 (Onboarding Flow)

**REQ-UX-001-11** [Event-Driven]
**WHEN** 새로운 사용자가 처음으로 캐릭터 생성 페이지(`/create`)에 진입하면, **THEN** 3-slide 온보딩 시퀀스가 캐릭터 위자드 이전에 표시되어야 한다.

**REQ-UX-001-12** [Ubiquitous]
시스템은 **항상** 온보딩 슬라이드를 다음 순서와 내용으로 구성해야 한다:

| Slide | 제목 | 설명 | 아이콘/비주얼 |
|-------|------|------|-------------|
| 1 | 나만의 캐릭터 만들기 | 498개 에셋으로 세상에 하나뿐인 캐릭터를 만들어보세요 | 캐릭터 아이콘 (SVG) |
| 2 | 매일 기분 기록하기 | 오늘의 기분을 선택하면 캐릭터가 표정과 의상을 바꿔요 | 달력 아이콘 (SVG) |
| 3 | 감정 패턴 발견하기 | 색상 달력에서 나의 감정 변화를 한눈에 확인하세요 | 차트 아이콘 (SVG) |

**REQ-UX-001-13** [Event-Driven]
**WHEN** 사용자가 온보딩의 마지막 슬라이드에서 "시작하기" 버튼을 클릭하면, **THEN** 온보딩 완료 상태가 localStorage에 저장되고, 캐릭터 생성 위자드가 표시되어야 한다.

**REQ-UX-001-14** [Ubiquitous]
시스템은 **항상** 온보딩 슬라이드에 "건너뛰기"(Skip) 버튼을 제공해야 한다. Skip 클릭 시 온보딩 완료로 처리하고 즉시 캐릭터 위자드로 진입한다.

**REQ-UX-001-15** [State-Driven]
**IF** localStorage에 온보딩 완료 키(`aec_onboarding_done`)가 존재하면, **THEN** 온보딩 슬라이드를 표시하지 않고 즉시 캐릭터 위자드를 표시해야 한다.

---

### 4.4 모듈 4: 접근성 (Accessibility)

**REQ-UX-001-16** [Ubiquitous]
시스템은 **항상** 달력 색상 셀에 `aria-label`로 기분 카테고리명을 포함해야 한다. 색맹 사용자를 위해 색상만으로 정보를 전달하지 않고, 이모지도 함께 표시한다.

**REQ-UX-001-17** [Ubiquitous]
시스템은 **항상** 온보딩 슬라이드에서 키보드 내비게이션(Tab, Enter, Escape)을 지원해야 한다.

---

## 5. 명세 (Specifications)

### 5.1 MOOD_COLOR_MAP 상수 정의

```typescript
// src/app/lib/types.ts에 추가
export const MOOD_COLOR_MAP: Record<MoodCategory, { bg: string; text: string; dot: string }> = {
  happy:      { bg: "bg-yellow-200", text: "text-yellow-900", dot: "bg-yellow-400" },
  confident:  { bg: "bg-orange-200", text: "text-orange-900", dot: "bg-orange-400" },
  calm:       { bg: "bg-blue-200",   text: "text-blue-900",   dot: "bg-blue-400" },
  surprised:  { bg: "bg-purple-200", text: "text-purple-900", dot: "bg-purple-400" },
  thoughtful: { bg: "bg-indigo-200", text: "text-indigo-900", dot: "bg-indigo-400" },
  playful:    { bg: "bg-pink-200",   text: "text-pink-900",   dot: "bg-pink-400" },
  determined: { bg: "bg-red-200",    text: "text-red-900",    dot: "bg-red-400" },
};
```

### 5.2 DiaryCalendar 색상 적용 로직

```
IF cell has MoodEntry:
  IF cell is selected:
    background = blue-500 (기존 선택 스타일 유지)
    show mood color as small dot indicator
  ELSE:
    background = MOOD_COLOR_MAP[entry.mood_category].bg
    text color = MOOD_COLOR_MAP[entry.mood_category].text
    emoji overlay maintained
ELSE:
  background = default (white/transparent)
```

### 5.3 OnboardingSlides 컴포넌트 구조

```
OnboardingSlides
  Props:
    onComplete: () => void  // 완료/건너뛰기 시 호출
  State:
    currentSlide: number (0-2)
  Behavior:
    - 좌우 스와이프 또는 버튼으로 슬라이드 이동
    - 하단 인디케이터 도트 표시
    - 마지막 슬라이드에서 "시작하기" CTA 버튼
    - 모든 슬라이드에서 "건너뛰기" 링크
```

### 5.4 localStorage 키

| 키 | 값 | 용도 |
|----|-----|------|
| `aec_onboarding_done` | `"true"` | 온보딩 완료 여부 |

---

## 6. 추적성 (Traceability)

| 요구사항 ID | 모듈 | EARS 유형 | 우선순위 |
|------------|------|----------|---------|
| REQ-UX-001-01 | 달력 색상 | Ubiquitous | High |
| REQ-UX-001-02 | 달력 색상 | Event-Driven | High |
| REQ-UX-001-03 | 달력 색상 | State-Driven | High |
| REQ-UX-001-04 | 달력 색상 | Unwanted | High |
| REQ-UX-001-05 | 달력 색상 | Event-Driven | High |
| REQ-UX-001-06 | 기분 간소화 | Event-Driven | High |
| REQ-UX-001-07 | 기분 간소화 | Ubiquitous | High |
| REQ-UX-001-08 | 기분 간소화 | State-Driven | Medium |
| REQ-UX-001-09 | 기분 간소화 | Unwanted | Medium |
| REQ-UX-001-10 | 기분 간소화 | Optional | Low |
| REQ-UX-001-11 | 온보딩 | Event-Driven | High |
| REQ-UX-001-12 | 온보딩 | Ubiquitous | High |
| REQ-UX-001-13 | 온보딩 | Event-Driven | High |
| REQ-UX-001-14 | 온보딩 | Ubiquitous | High |
| REQ-UX-001-15 | 온보딩 | State-Driven | High |
| REQ-UX-001-16 | 접근성 | Ubiquitous | Medium |
| REQ-UX-001-17 | 접근성 | Ubiquitous | Medium |
