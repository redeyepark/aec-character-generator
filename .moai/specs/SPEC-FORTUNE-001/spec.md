# SPEC-FORTUNE-001: 사주 기반 일일 운세 추천 시스템

---
id: SPEC-FORTUNE-001
title: Fortune-Based Daily Recommendation System
created: 2026-02-17
status: Planned
priority: High
lifecycle: spec-first
related-specs: [SPEC-UPDATE-001, SPEC-UX-001]
tags: [fortune, saju, five-elements, outfit-recommendation, client-side]
---

## 1. 개요 (Overview)

AEC 캐릭터 생성기 앱에 한국 전통 사주(四柱) 시스템 기반의 일일 운세 추천 기능을 도입한다.
사용자의 생년월일 정보와 당일 천간지지(天干地支) 조합을 활용하여 오행(五行) 기반의 행운 색상을 산출하고,
이를 기존 의상 선택 시스템과 연동하여 "오늘의 추천 의상 컬러"를 제공한다.

### 핵심 가치
- 기분 일기 시스템에 전통 운세 요소를 결합하여 사용자 참여도 향상
- 기존 랜덤 의상 선택에 의미 있는 추천 로직 추가
- 순수 클라이언트 사이드 계산으로 외부 의존성 없음

## 2. 환경 (Environment)

### 기술 스택
- **프레임워크**: Next.js 15.1+ / React 19 / TypeScript 5
- **스타일링**: Tailwind CSS 4
- **백엔드**: Firebase (Authentication + Firestore)
- **배포**: Cloudflare Pages (Static Export)
- **제약**: 서버 사이드 연산 불가 - 모든 로직 클라이언트 실행

### 기존 데이터 구조 (Firestore)
- `profiles`: { userId, displayName, role, createdAt } - 현재 생년월일 필드 없음
- `characters`: { userId, face, hair, mustache, glasses, skinTone, createdAt, updatedAt }
- `mood_entries`: { userId, characterId, date, moodCategory, outfitFile, expressionFile, compositeImageUrl, createdAt, updatedAt }

### 기존 의상 시스템
- 5개 카테고리: casual(52), formal(43), sporty(20), outerwear(13), bowtie(10)
- 파일명에 색상 정보 포함 (예: "T shirt blue.png", "black suit red tie.png")
- `pickRandom()` 기반 무작위 선택 + `getBodyAssets(category)` 필터링

### 기존 기분 시스템
- 7개 기분 카테고리: happy, confident, calm, surprised, thoughtful, playful, determined
- 각 기분별 표정 그룹(1-7) 및 색상 매핑 (yellow, orange, blue, purple, indigo, pink, red)

## 3. 가정 (Assumptions)

### 기술적 가정
- **[HIGH]** 천간지지 일진 계산은 순수 수학적 연산으로 외부 API 없이 클라이언트에서 수행 가능하다
- **[HIGH]** 의상 에셋 파일명에 포함된 색상 키워드(black, blue, red, green, yellow, white, grey 등)로 필터링이 가능하다
- **[MEDIUM]** 만세력(만년력) 기준 1900년~2100년 범위의 간지 계산이 충분하다
- **[MEDIUM]** 사주 간소화 버전(일주 기반)으로도 의미 있는 추천이 가능하다

### 비즈니스 가정
- **[HIGH]** 사용자들이 자발적으로 생년월일을 입력할 의향이 있다
- **[MEDIUM]** 운세 기능이 선택적(optional)이므로 미입력 사용자에게 기존 기능이 그대로 동작해야 한다
- **[LOW]** 사주 추천이 게임화 요소로 작용하여 일일 접속률을 높일 수 있다

### 위험 요소
- 생년월일은 민감한 개인정보이므로 Firestore Security Rules에서 본인만 읽기/쓰기 가능하도록 설정 필요
- 간지 계산의 정확도가 전문 만세력과 미세하게 다를 수 있으나, 추천 목적으로는 충분함

## 4. 요구사항 (Requirements)

### 4.1 모듈 1: 사주 정보 입력 (Birth Info Input)

#### R-FORTUNE-001: 생년월일 입력 폼
**WHEN** 사용자가 설정 페이지 또는 최초 운세 기능 접근 시
**THEN** 시스템은 생년월일(년, 월, 일) 입력 폼을 표시해야 한다

- 입력 필드: 출생 연도(1900~현재), 출생 월(1~12), 출생 일(1~31)
- 선택적 필드: 출생 시간(자시~해시, 12지지 시간대) - 더 정확한 계산용
- 유효성 검증: 실제 존재하는 날짜인지 검증 (예: 2월 30일 거부)
- 한국어 UI 제공

#### R-FORTUNE-002: 생년월일 Firestore 저장
**WHEN** 사용자가 유효한 생년월일을 입력하고 저장 버튼을 누르면
**THEN** 시스템은 Firestore `profiles` 컬렉션에 해당 정보를 추가 저장해야 한다

- 기존 `profiles` 스키마에 `birthYear`, `birthMonth`, `birthDay`, `birthHour`(optional) 필드 추가
- Additive 변경만 허용 - 기존 필드 절대 변경 금지
- Firestore Security Rules: 본인의 생년월일만 읽기/쓰기 가능

#### R-FORTUNE-003: 생년월일 미입력 사용자 처리
시스템은 **항상** 생년월일 미입력 사용자에게 기존 기분/의상 선택 기능을 그대로 제공해야 한다

- 운세 추천 UI가 표시되지 않음
- 기존 `pickRandom()` 기반 랜덤 선택 그대로 동작
- "운세 추천 활성화하기" 안내 배너 표시 (설정 페이지 링크)

### 4.2 모듈 2: 오늘의 운세 계산 (Daily Fortune Calculation)

#### R-FORTUNE-010: 천간지지 일진 계산 엔진
시스템은 **항상** 주어진 날짜(양력)에 대해 정확한 천간지지 일진을 계산할 수 있어야 한다

- 천간(天干) 10간: 갑(甲), 을(乙), 병(丙), 정(丁), 무(戊), 기(己), 경(庚), 신(辛), 임(壬), 계(癸)
- 지지(地支) 12지: 자(子), 축(丑), 인(寅), 묘(卯), 진(辰), 사(巳), 오(午), 미(未), 신(申), 유(酉), 술(戌), 해(亥)
- 60간지(六十甲子) 순환 주기 기반 계산
- 기준일(Epoch): 알려진 간지일 기준으로 일수 차이 계산
- 순수 클라이언트 사이드 연산, 외부 API/라이브러리 사용 금지

#### R-FORTUNE-011: 사용자 일간(日干) 산출
**WHEN** 사용자의 생년월일이 등록되어 있으면
**THEN** 시스템은 해당 생년월일의 천간(일간/日干)을 산출하고 오행 속성을 결정해야 한다

- 일간(日干) = 출생일의 천간
- 천간 -> 오행 매핑:
  - 갑(甲), 을(乙) -> 목(木/Wood)
  - 병(丙), 정(丁) -> 화(火/Fire)
  - 무(戊), 기(己) -> 토(土/Earth)
  - 경(庚), 신(辛) -> 금(金/Metal)
  - 임(壬), 계(癸) -> 수(水/Water)

#### R-FORTUNE-012: 오행 상생/상극 관계 판정
**WHEN** 사용자의 일간 오행과 오늘의 일간 오행이 결정되면
**THEN** 시스템은 두 오행 간의 관계를 판정하여 운세 등급을 결정해야 한다

- **상생(相生) 관계** (생성하는 순환):
  - 목(木) -> 화(火) -> 토(土) -> 금(金) -> 수(水) -> 목(木)
- **상극(相剋) 관계** (억제하는 순환):
  - 목(木) -> 토(土), 토(土) -> 수(水), 수(水) -> 화(火), 화(火) -> 금(金), 금(金) -> 목(木)
- 운세 등급 판정:
  - **대길(Very Lucky)**: 오늘의 오행이 사용자 오행을 생(生)하는 경우 (예: 사용자=火, 오늘=木)
  - **길(Lucky)**: 사용자 오행이 오늘의 오행을 생(生)하는 경우 (예: 사용자=木, 오늘=火)
  - **보통(Neutral)**: 동일 오행이거나 직접 관계 없는 경우
  - **주의(Caution)**: 오늘의 오행이 사용자 오행을 극(剋)하는 경우

#### R-FORTUNE-013: 행운 색상 산출
**WHEN** 운세 등급과 오행 관계가 결정되면
**THEN** 시스템은 오행별 행운 색상 목록을 산출해야 한다

- 오행 -> 색상 매핑:
  | 오행 | Element | 행운 색상 | 의상 파일명 키워드 |
  |------|---------|----------|-------------------|
  | 목(木) | Wood | 청색, 녹색 | green, emerald, teal |
  | 화(火) | Fire | 적색, 자색 | red, rose, orange, pink |
  | 토(土) | Earth | 황색, 갈색 | yellow, amber, brown |
  | 금(金) | Metal | 백색, 금색 | white, grey, gray, silver |
  | 수(水) | Water | 흑색, 남색 | blue, dark blue, navy, black, indigo |

- 대길/길 등급: 해당 오행 색상을 "추천 색상"으로 강조
- 주의 등급: 상극 오행의 색상 대신 "균형 색상"(상생 오행의 색상)을 추천

### 4.3 모듈 3: 의상 색상 추천 (Outfit Color Recommendation)

#### R-FORTUNE-020: 의상 파일명 기반 색상 필터링
시스템은 **항상** 의상 에셋 파일명에 포함된 색상 키워드를 분석하여 오행 색상별로 분류할 수 있어야 한다

- 파일명 파싱 로직: 파일명 문자열에서 색상 키워드 매칭
- 색상 키워드 사전: 각 오행에 해당하는 영문 색상 키워드 목록
- 하나의 의상이 복수 색상을 포함할 수 있음 (예: "raglan white + blue tshirt.png" -> 금+수)
- 매칭되지 않는 의상은 "보통" 카테고리로 분류

#### R-FORTUNE-021: 추천 의상 하이라이트
**WHEN** 사용자가 기분 페이지에서 의상 카테고리를 선택하면
**THEN** 시스템은 행운 색상에 해당하는 의상에 시각적 하이라이트를 표시해야 한다

- 추천 색상 뱃지: 의상 카테고리 버튼 옆에 오행 색상 도트 표시
- "행운의 컬러로 입기" 퀵 액션 버튼: 추천 색상 의상 중 랜덤 선택
- 기존 수동 선택 기능은 그대로 유지 (추천은 보조적)

#### R-FORTUNE-022: 행운 의상 자동 선택
**WHEN** 사용자가 "행운의 컬러로 입기" 버튼을 누르면
**THEN** 시스템은 현재 선택된 의상 카테고리 내에서 행운 색상에 해당하는 의상을 랜덤 선택해야 한다

- 현재 카테고리 내 행운 색상 의상이 있으면: 해당 의상 중 랜덤 선택
- 현재 카테고리 내 행운 색상 의상이 없으면: 전체 카테고리에서 행운 색상 의상 랜덤 선택 + 카테고리 자동 변경
- 행운 색상 의상이 전혀 없는 경우: 기존 랜덤 선택으로 폴백

### 4.4 모듈 4: 추천 UI (Recommendation Display)

#### R-FORTUNE-030: 오늘의 운세 카드
**WHEN** 생년월일이 등록된 사용자가 기분 페이지에 접근하면
**THEN** 시스템은 캐릭터 미리보기 상단에 "오늘의 운세" 카드를 표시해야 한다

- 표시 정보:
  - 오늘의 간지 (예: "갑자일(甲子日)")
  - 사용자의 일간 오행 (예: "나의 오행: 화(火)")
  - 오늘의 오행 (예: "오늘의 오행: 목(木)")
  - 운세 등급 (대길/길/보통/주의) + 등급별 배경색
  - 추천 색상 표시 (색상 도트 + 한글 이름)
  - 한줄 운세 메시지 (오행 관계 기반 자동 생성)
- 반응형 디자인: 모바일 우선, 카드 형태
- 접기/펼치기 토글 지원

#### R-FORTUNE-031: 운세 등급 시각화
시스템은 **항상** 운세 등급에 따라 차별화된 시각적 스타일을 적용해야 한다

- 대길(Very Lucky): 금색 테두리, 별 아이콘, 축하 애니메이션
- 길(Lucky): 녹색 테두리, 하트 아이콘
- 보통(Neutral): 회색 테두리, 원형 아이콘
- 주의(Caution): 주황색 테두리, 주의 아이콘

#### R-FORTUNE-032: 운세 기록 표시 (선택적)
**가능하면** 시스템은 달력 뷰(기존 기분 일기)에 운세 등급 정보도 함께 표시한다

- 기분 일기 달력의 각 날짜에 운세 등급 소형 아이콘 추가
- 운세 등급은 저장하지 않고 날짜 기준으로 실시간 계산 (Firestore 추가 비용 없음)

## 5. 사양 (Specifications)

### 5.1 신규 타입 정의

```typescript
// 오행 (Five Elements)
type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";

// 천간 (Heavenly Stems)
type HeavenlyStem = "gap" | "eul" | "byeong" | "jeong" | "mu" | "gi" | "gyeong" | "sin" | "im" | "gye";

// 지지 (Earthly Branches)
type EarthlyBranch = "ja" | "chuk" | "in" | "myo" | "jin" | "sa" | "o" | "mi" | "sin_branch" | "yu" | "sul" | "hae";

// 운세 등급
type FortuneLevel = "very_lucky" | "lucky" | "neutral" | "caution";

// 오행 관계
type ElementRelation = "generate" | "generated_by" | "overcome" | "overcome_by" | "same" | "neutral";

// 일일 운세 결과
interface DailyFortune {
  date: string;                    // YYYY-MM-DD
  todayStem: HeavenlyStem;         // 오늘의 천간
  todayBranch: EarthlyBranch;      // 오늘의 지지
  todayElement: FiveElement;       // 오늘의 오행
  userElement: FiveElement;        // 사용자의 오행 (일간 기준)
  relation: ElementRelation;       // 오행 관계
  fortuneLevel: FortuneLevel;      // 운세 등급
  luckyColors: string[];           // 행운 색상 키워드 목록
  luckyElement: FiveElement;       // 행운의 오행
  message: string;                 // 한줄 운세 메시지
}

// 사용자 사주 정보 (Profile 확장)
interface BirthInfo {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;              // 0-23, optional
}

// 의상 색상 분류 결과
interface OutfitColorMatch {
  filename: string;
  matchedColors: string[];
  matchedElements: FiveElement[];
  isLucky: boolean;
}
```

### 5.2 신규/변경 파일 목록

| 파일 경로 | 변경 유형 | 설명 |
|-----------|----------|------|
| `src/app/lib/fortune/` | 신규 디렉토리 | 사주 계산 엔진 모듈 |
| `src/app/lib/fortune/types.ts` | 신규 | 사주 관련 타입 정의 |
| `src/app/lib/fortune/stemBranch.ts` | 신규 | 천간지지 계산 엔진 |
| `src/app/lib/fortune/fiveElements.ts` | 신규 | 오행 관계 및 색상 매핑 |
| `src/app/lib/fortune/dailyFortune.ts` | 신규 | 일일 운세 산출 로직 |
| `src/app/lib/fortune/outfitColorMatcher.ts` | 신규 | 의상 파일명 색상 매칭 |
| `src/app/lib/fortune/index.ts` | 신규 | 모듈 배럴 export |
| `src/app/hooks/useFortune.ts` | 신규 | 운세 계산 React 훅 |
| `src/app/hooks/useBirthInfo.ts` | 신규 | 생년월일 CRUD 훅 |
| `src/app/components/FortuneCard.tsx` | 신규 | 오늘의 운세 카드 컴포넌트 |
| `src/app/components/BirthInfoForm.tsx` | 신규 | 생년월일 입력 폼 컴포넌트 |
| `src/app/components/LuckyOutfitButton.tsx` | 신규 | 행운 의상 선택 버튼 |
| `src/app/lib/types.ts` | 수정 | Profile 인터페이스에 birthInfo 필드 추가 |
| `src/app/mood/page.tsx` | 수정 | 운세 카드 및 추천 의상 버튼 통합 |
| `src/app/settings/page.tsx` | 신규 또는 수정 | 생년월일 입력 설정 페이지 |

### 5.3 Firestore 스키마 변경

```
profiles (기존 컬렉션 - Additive 변경만)
├── userId: string
├── displayName: string | null
├── role: string
├── createdAt: Timestamp
├── birthYear: number | null      ← 신규
├── birthMonth: number | null     ← 신규
├── birthDay: number | null       ← 신규
└── birthHour: number | null      ← 신규 (optional)
```

### 5.4 천간지지 계산 알고리즘 (핵심)

```
입력: 양력 날짜 (year, month, day)
기준일: 1900년 1월 1일 = 경자일(庚子日) (천간 index=6, 지지 index=0)

1. 줄리안 일수(Julian Day Number) 계산으로 기준일부터의 일수 차이(dayOffset) 산출
2. 천간 인덱스 = (6 + dayOffset) % 10
3. 지지 인덱스 = (0 + dayOffset) % 12
4. 천간 -> 오행 변환: index / 2 (정수 나눗셈)
   - 0,1 -> 목(Wood), 2,3 -> 화(Fire), 4,5 -> 토(Earth), 6,7 -> 금(Metal), 8,9 -> 수(Water)
```

## 6. 비기능 요구사항

### 성능
- 운세 계산 시간: 1ms 미만 (순수 수학 연산)
- 의상 색상 필터링: 10ms 미만 (문자열 매칭)
- 번들 크기 증가: 5KB 미만 (외부 라이브러리 없음)

### 접근성
- 색상 추천은 텍스트 라벨과 함께 제공 (색맹 사용자 배려)
- 운세 카드 키보드 네비게이션 지원
- ARIA 라벨 한국어 제공

### 보안
- 생년월일 데이터는 Firestore Security Rules로 본인만 접근 가능
- 클라이언트 사이드 계산이므로 서버 부하 없음

### 국제화
- 모든 UI 텍스트 한국어 기본
- 오행/간지 명칭은 한자 병기 (예: "목(木/Wood)")

## 7. 추적성 (Traceability)

| 요구사항 ID | 모듈 | 관련 파일 | 수락 기준 |
|------------|------|----------|----------|
| R-FORTUNE-001 | 모듈1 | BirthInfoForm.tsx, settings/page.tsx | AC-FORTUNE-001 |
| R-FORTUNE-002 | 모듈1 | useBirthInfo.ts, types.ts | AC-FORTUNE-002 |
| R-FORTUNE-003 | 모듈1 | mood/page.tsx | AC-FORTUNE-003 |
| R-FORTUNE-010 | 모듈2 | stemBranch.ts | AC-FORTUNE-010 |
| R-FORTUNE-011 | 모듈2 | dailyFortune.ts | AC-FORTUNE-011 |
| R-FORTUNE-012 | 모듈2 | fiveElements.ts | AC-FORTUNE-012 |
| R-FORTUNE-013 | 모듈2 | fiveElements.ts | AC-FORTUNE-013 |
| R-FORTUNE-020 | 모듈3 | outfitColorMatcher.ts | AC-FORTUNE-020 |
| R-FORTUNE-021 | 모듈3 | mood/page.tsx, LuckyOutfitButton.tsx | AC-FORTUNE-021 |
| R-FORTUNE-022 | 모듈3 | mood/page.tsx | AC-FORTUNE-022 |
| R-FORTUNE-030 | 모듈4 | FortuneCard.tsx | AC-FORTUNE-030 |
| R-FORTUNE-031 | 모듈4 | FortuneCard.tsx | AC-FORTUNE-031 |
| R-FORTUNE-032 | 모듈4 | diary 관련 컴포넌트 | AC-FORTUNE-032 |
