# SPEC-FORTUNE-001: 구현 계획

---
id: SPEC-FORTUNE-001
title: Fortune-Based Daily Recommendation System - Implementation Plan
created: 2026-02-17
status: Planned
tags: [fortune, saju, implementation-plan]
---

## 1. 구현 전략 개요

### 접근 방식
DDD(Domain-Driven Development) ANALYZE-PRESERVE-IMPROVE 사이클을 적용한다.
기존 기분/의상 시스템의 동작을 보존하면서 사주 추천 기능을 점진적으로 통합한다.

### 핵심 원칙
- **기존 동작 보존**: 운세 기능 추가 전후로 기존 mood 페이지의 동작이 동일해야 한다
- **점진적 통합**: 독립 모듈로 먼저 개발한 후 UI에 통합
- **Additive 변경**: Firestore 스키마는 필드 추가만 허용, 기존 필드 절대 미변경
- **선택적 기능**: 생년월일 미입력 사용자에게 기존 경험 100% 유지

## 2. 마일스톤

### Primary Goal: 사주 계산 엔진 (핵심 도메인 로직)

외부 의존성 없는 순수 TypeScript 사주 계산 엔진을 구축한다.

**태스크 목록:**

1. **타입 정의** (`src/app/lib/fortune/types.ts`)
   - FiveElement, HeavenlyStem, EarthlyBranch, FortuneLevel 타입
   - DailyFortune, BirthInfo, OutfitColorMatch 인터페이스
   - 상수 매핑 테이블 (천간-오행, 지지-오행, 오행-색상)

2. **천간지지 계산 엔진** (`src/app/lib/fortune/stemBranch.ts`)
   - `getJulianDayNumber(year, month, day)`: 줄리안 일수 계산
   - `getDailyStemBranch(date)`: 특정 날짜의 천간지지 반환
   - `getStemElement(stem)`: 천간 -> 오행 변환
   - 기준일: 1900-01-01 = 경자일(庚子日)
   - 검증: 알려진 간지일 다수와 대조 확인

3. **오행 관계 엔진** (`src/app/lib/fortune/fiveElements.ts`)
   - `getElementRelation(userElement, todayElement)`: 두 오행 간 관계 판정
   - `getFortuneLevel(relation)`: 관계 -> 운세 등급 변환
   - `getLuckyColors(element)`: 오행 -> 행운 색상 키워드 목록
   - `getBalancingElement(userElement, todayElement)`: 주의 등급 시 균형 오행 산출
   - 상생/상극 순환 테이블 정의

4. **일일 운세 산출** (`src/app/lib/fortune/dailyFortune.ts`)
   - `calculateDailyFortune(birthInfo, date?)`: 메인 운세 계산 함수
   - `generateFortuneMessage(fortune)`: 오행 관계 기반 한줄 메시지 생성
   - 오늘 날짜 기본값, 특정 날짜 지정 가능

5. **모듈 배럴 export** (`src/app/lib/fortune/index.ts`)
   - 공개 API만 re-export

**의존성**: 없음 (순수 로직 모듈)
**검증 기준**: 알려진 간지일 10개 이상과 대조하여 100% 일치

---

### Secondary Goal: 의상 색상 매칭 시스템

기존 의상 에셋 파일명에서 색상 정보를 추출하고 오행과 매핑한다.

**태스크 목록:**

1. **의상 색상 매처** (`src/app/lib/fortune/outfitColorMatcher.ts`)
   - `COLOR_KEYWORDS`: 색상 키워드 -> 오행 매핑 사전
     ```
     {
       "green": "wood", "emerald": "wood", "teal": "wood",
       "red": "fire", "rose": "fire", "orange": "fire", "pink": "fire",
       "yellow": "earth", "amber": "earth", "brown": "earth",
       "white": "metal", "grey": "metal", "gray": "metal", "silver": "metal",
       "blue": "water", "dark blue": "water", "navy": "water",
       "black": "water", "indigo": "water"
     }
     ```
   - `matchOutfitColor(filename)`: 파일명에서 색상 키워드 추출 및 오행 매핑
   - `filterOutfitsByElement(outfits, element)`: 특정 오행 색상의 의상 필터링
   - `getLuckyOutfits(category, luckyColors)`: 카테고리 내 행운 색상 의상 목록

2. **기존 assetManager 연동**
   - `getBodyAssets()` 반환값을 `outfitColorMatcher`에 전달
   - 기존 함수 시그니처 변경 없음

**의존성**: Primary Goal 완료 필요 (오행 색상 매핑 참조)
**검증 기준**: 전체 138개 의상 에셋에 대해 색상 분류 정확도 90% 이상

---

### Tertiary Goal: Firestore 연동 및 React 훅

생년월일 데이터 CRUD 및 운세 계산 React 훅을 구현한다.

**태스크 목록:**

1. **생년월일 CRUD 훅** (`src/app/hooks/useBirthInfo.ts`)
   - `useBirthInfo()` 훅:
     - `birthInfo`: 현재 사용자의 생년월일 (null 가능)
     - `saveBirthInfo(info)`: Firestore profiles에 저장
     - `loading`, `error` 상태
   - Firestore `profiles` 컬렉션 직접 접근
   - `useAuth` 훅 활용하여 현재 사용자 ID 획득

2. **운세 계산 훅** (`src/app/hooks/useFortune.ts`)
   - `useFortune(birthInfo)` 훅:
     - `fortune`: DailyFortune 객체 (null 가능)
     - `luckyOutfits`: 현재 카테고리의 행운 의상 목록
     - `pickLuckyOutfit(category)`: 행운 의상 랜덤 선택
   - 날짜 변경 시 자동 재계산 (자정 기준)
   - `useMemo`로 불필요한 재계산 방지

3. **Profile 타입 확장** (`src/app/lib/types.ts`)
   - 기존 `Profile` 인터페이스에 BirthInfo 필드 추가 (모두 optional)
   - 타입 변경이 기존 코드에 영향 없음 확인

**의존성**: Primary Goal + Secondary Goal 완료 필요
**검증 기준**: Firestore 읽기/쓰기 동작, 운세 훅 반환값 정확성

---

### Final Goal: UI 통합

기분 페이지에 운세 카드와 추천 의상 기능을 통합한다.

**태스크 목록:**

1. **생년월일 입력 폼** (`src/app/components/BirthInfoForm.tsx`)
   - 연, 월, 일 입력 필드 (숫자 입력)
   - 선택적: 태어난 시간 (12지지 시간대 드롭다운)
   - 유효성 검증 (날짜 존재 여부, 범위 확인)
   - 저장/취소 버튼
   - Tailwind CSS 스타일링, 모바일 반응형

2. **오늘의 운세 카드** (`src/app/components/FortuneCard.tsx`)
   - DailyFortune 데이터 시각화
   - 운세 등급별 스타일 (배경색, 테두리, 아이콘)
   - 오행 색상 도트 표시
   - 한줄 운세 메시지
   - 접기/펼치기 토글 (기본: 펼침)
   - 반응형 카드 디자인

3. **행운 의상 선택 버튼** (`src/app/components/LuckyOutfitButton.tsx`)
   - "행운의 컬러로 입기" 버튼
   - 추천 색상 미리보기 도트
   - 클릭 시 행운 색상 의상 랜덤 선택 트리거
   - 행운 의상이 없을 때 비활성화 + 툴팁

4. **기분 페이지 통합** (`src/app/mood/page.tsx`)
   - FortuneCard를 캐릭터 미리보기 상단에 배치
   - LuckyOutfitButton을 의상 카테고리 선택 영역에 배치
   - 생년월일 미등록 시: FortuneCard 대신 "운세 활성화" 안내 배너
   - 기존 기분/의상 선택 플로우 완전 보존

5. **설정 페이지** (`src/app/settings/page.tsx`)
   - 생년월일 입력/수정 섹션 추가
   - 기존 설정 항목 유지

**의존성**: 모든 이전 Goal 완료 필요
**검증 기준**: 수동 시각 검증 + 기존 기능 회귀 테스트

---

### Optional Goal: 확장 기능

사용자 경험 향상을 위한 부가 기능이다.

**태스크 목록:**

1. **달력 뷰 운세 표시**
   - 기존 기분 일기 달력에 운세 등급 소형 아이콘 추가
   - 실시간 계산 (저장 불필요)

2. **운세 공유 기능**
   - 오늘의 운세 카드를 이미지로 다운로드
   - 기존 `downloadAsPNG` 유틸리티 활용

3. **애니메이션 강화**
   - 대길 등급일 때 축하 파티클 애니메이션
   - Tailwind CSS 애니메이션으로 구현 (라이브러리 추가 없음)

**의존성**: Final Goal 완료 필요

## 3. 아키텍처 설계

### 모듈 의존성 그래프

```
[UI Layer]
  mood/page.tsx
    ├── FortuneCard.tsx
    ├── LuckyOutfitButton.tsx
    └── BirthInfoForm.tsx

[Hook Layer]
  useFortune.ts ──────┐
  useBirthInfo.ts ────┤
                      ↓
[Domain Layer]
  fortune/
    ├── dailyFortune.ts ──→ stemBranch.ts
    │                   ──→ fiveElements.ts
    ├── outfitColorMatcher.ts ──→ fiveElements.ts
    ├── stemBranch.ts (순수 함수)
    ├── fiveElements.ts (순수 함수)
    └── types.ts

[Existing Layer - 변경 최소화]
  assetManager.ts (변경 없음)
  randomEngine.ts (변경 없음)
  types.ts (Profile 인터페이스 확장만)
```

### 데이터 흐름

```
1. 사용자 생년월일 입력
   BirthInfoForm → useBirthInfo.saveBirthInfo() → Firestore profiles 업데이트

2. 일일 운세 계산 (페이지 로드 시)
   useBirthInfo.birthInfo → useFortune(birthInfo)
     → calculateDailyFortune(birthInfo, today)
       → getDailyStemBranch(today) → 오늘의 천간지지
       → getDailyStemBranch(birthDate) → 사용자 일간
       → getElementRelation() → 오행 관계
       → getFortuneLevel() → 운세 등급
       → getLuckyColors() → 행운 색상
     → DailyFortune 객체 반환

3. 행운 의상 추천
   DailyFortune.luckyColors → filterOutfitsByElement(category, colors)
     → 행운 색상 의상 목록 → LuckyOutfitButton에 전달
```

## 4. 리스크 및 대응

### 기술적 리스크

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| 천간지지 계산 오류 | 높음 | 알려진 간지일 테스트 데이터로 검증, 위키백과 등 참조 |
| 의상 파일명 색상 매칭 부정확 | 중간 | 전체 138개 파일명 수동 검증, 매칭 실패 시 "보통" 분류 |
| Firestore 스키마 변경 호환성 | 높음 | Additive 변경만 적용, 기존 쿼리 영향 없음 확인 |
| 번들 사이즈 증가 | 낮음 | 순수 TS 코드만 사용, tree-shaking 적용 |

### 사용자 경험 리스크

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| 생년월일 입력 거부감 | 중간 | 선택적 기능으로 제공, 미입력 시 기존 경험 완전 유지 |
| 운세 결과에 대한 불만 | 낮음 | "참고용" 명시, 기존 수동 선택 항상 가능 |
| UI 복잡도 증가 | 중간 | 접기/펼치기 토글, 점진적 공개 패턴 적용 |

## 5. 파일 변경 영향 분석

### 신규 파일 (11개)
- `src/app/lib/fortune/types.ts`
- `src/app/lib/fortune/stemBranch.ts`
- `src/app/lib/fortune/fiveElements.ts`
- `src/app/lib/fortune/dailyFortune.ts`
- `src/app/lib/fortune/outfitColorMatcher.ts`
- `src/app/lib/fortune/index.ts`
- `src/app/hooks/useFortune.ts`
- `src/app/hooks/useBirthInfo.ts`
- `src/app/components/FortuneCard.tsx`
- `src/app/components/BirthInfoForm.tsx`
- `src/app/components/LuckyOutfitButton.tsx`

### 수정 파일 (3개)
- `src/app/lib/types.ts` - Profile 인터페이스에 4개 optional 필드 추가
- `src/app/mood/page.tsx` - FortuneCard, LuckyOutfitButton 통합
- `src/app/settings/page.tsx` - 생년월일 입력 섹션 추가 (신규 또는 수정)

### 변경 없는 파일 (기존 동작 보존)
- `src/app/lib/assetManager.ts` - 변경 없음
- `src/app/lib/randomEngine.ts` - 변경 없음
- `src/app/hooks/useMoodEntries.ts` - 변경 없음
- `src/app/hooks/useAuth.ts` - 변경 없음
- `src/app/hooks/useCharacter.ts` - 변경 없음
- `src/app/lib/firebase.ts` - 변경 없음

## 6. 전문가 상담 권장

### Frontend Expert (expert-frontend)
- FortuneCard, BirthInfoForm, LuckyOutfitButton 컴포넌트 설계 검토
- 기분 페이지 통합 시 UI/UX 레이아웃 최적화
- 반응형 디자인 패턴 자문

### Backend Expert (expert-backend)
- Firestore Security Rules 설계 검토
- profiles 컬렉션 스키마 확장 호환성 확인
- 쿼리 성능 영향 분석

## 7. 다음 단계

SPEC 승인 후:
1. `/moai run SPEC-FORTUNE-001` 실행하여 DDD 구현 시작
2. Primary Goal (사주 계산 엔진)부터 순차 구현
3. 각 Goal 완료 시 기존 기능 회귀 테스트 수행
4. Final Goal 완료 후 `/moai sync SPEC-FORTUNE-001`으로 문서화
