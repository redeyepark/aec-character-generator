---
id: SPEC-UI-001
version: "1.0.0"
status: Planned
created: "2026-02-15"
updated: "2026-02-15"
author: manager-spec
priority: High
title: AEC Character Generator - 인수 기준서
related-spec: SPEC-UI-001/spec.md
---

## HISTORY

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2026-02-15 | 1.0.0 | 최초 인수 기준서 작성 | manager-spec |

---

# AEC Character Generator - 인수 기준 (Acceptance Criteria)

## 1. 에셋 관리 시스템 테스트 시나리오

### AC-AM-001: 에셋 인덱싱 및 분류

```gherkin
Feature: 에셋 인덱싱 시스템
  _AEC 폴더의 모든 PNG 에셋을 카테고리별로 올바르게 인덱싱한다.

  Scenario: 전체 에셋 로드 및 카운트 검증
    Given 빌드 스크립트가 _AEC 폴더를 스캔한다
    When 에셋 인덱스가 생성되면
    Then 01_Body 카테고리에 143개 에셋이 등록되어야 한다
    And 03_Face 카테고리에 5개 에셋이 등록되어야 한다
    And 04_Facial_Expression 카테고리에 41개 에셋이 등록되어야 한다
    And 05_Mustache 카테고리에 51개 에셋이 등록되어야 한다
    And 07_Hair 카테고리에 214개 에셋이 등록되어야 한다
    And 08_Glasses 카테고리에 39개 에셋이 등록되어야 한다

  Scenario: 의상 카테고리 자동 분류
    Given 에셋 인덱스가 생성되어 있다
    When "casual" 카테고리를 조회하면
    Then "T shirt black.png" 파일이 포함되어야 한다
    And "sweatshirt logo grey.png" 파일이 포함되어야 한다
    And "raglan black + blue tshirt.png" 파일이 포함되어야 한다
    And "hood T shirt black.png" 파일이 포함되어야 한다

  Scenario: 의상 카테고리 분류 정확성
    Given 에셋 인덱스가 생성되어 있다
    When "formal" 카테고리를 조회하면
    Then "black suit black tie.png" 파일이 포함되어야 한다
    And "european suit dark blue.png" 파일이 포함되어야 한다
    And "T shirt black.png" 파일이 포함되지 않아야 한다

  Scenario: 표정 그룹 번호 추출
    Given 에셋 인덱스가 생성되어 있다
    When 표정 그룹 1을 조회하면
    Then "facial expression11.png"부터 "facial expression16.png"까지의 파일이 포함되어야 한다
    And "facial expression14.png"는 존재하지 않으므로 포함되지 않아야 한다
    And 그룹 2의 파일("facial expression21.png" 등)은 포함되지 않아야 한다
```

### AC-AM-002: 수염 얼굴형 호환성 매핑

```gherkin
Feature: 수염-얼굴형 호환성
  얼굴형에 맞는 수염 에셋만 후보로 제공한다.

  Scenario: round 얼굴형의 호환 수염 필터링
    Given 선택된 얼굴형이 "round"이다
    When 호환되는 수염 에셋을 조회하면
    Then "common" 접두사 에셋이 포함되어야 한다
    And "round" 접두사 에셋이 포함되어야 한다
    And "slim" 접두사 에셋은 포함되지 않아야 한다
    And "square" 접두사 에셋은 포함되지 않아야 한다
    And 특수 에셋("chick bandate.png", "nose bandate.png", "two bandate.png")이 포함되어야 한다

  Scenario: square jaw 얼굴형의 호환 수염 필터링
    Given 선택된 얼굴형이 "square jaw"이다
    When 호환되는 수염 에셋을 조회하면
    Then "common" 접두사 에셋이 포함되어야 한다
    And "square" 접두사 에셋이 포함되어야 한다
    And "round" 접두사 에셋은 포함되지 않아야 한다
    And "slim" 접두사 에셋은 포함되지 않아야 한다

  Scenario: heart 얼굴형의 호환 수염 필터링
    Given 선택된 얼굴형이 "heart"이다
    When 호환되는 수염 에셋을 조회하면
    Then "common" 접두사 에셋만 포함되어야 한다
    And 특수 에셋("chick bandate.png" 등)이 포함되어야 한다
    And "round", "slim", "square" 접두사 에셋은 포함되지 않아야 한다
```

---

## 2. 기분/의상 선택 UI 테스트 시나리오

### AC-SI-001: 기분 선택 인터페이스

```gherkin
Feature: 기분 카테고리 선택
  사용자가 7개 기분 카테고리 중 하나를 선택할 수 있다.

  Scenario: 기분 카테고리 전체 표시
    Given 캐릭터 생성 페이지에 접속한다
    When 페이지가 로드되면
    Then 7개 기분 카테고리가 표시되어야 한다:
      | 기분명 | 영문명 |
      | 행복/쾌활 | Happy/Cheerful |
      | 자신감/쿨 | Confident/Cool |
      | 차분/편안 | Calm/Relaxed |
      | 놀람/흥분 | Surprised/Excited |
      | 사려깊음/진지 | Thoughtful/Serious |
      | 유쾌/재미 | Playful/Fun |
      | 결연/강인 | Determined/Strong |

  Scenario: 기분 카테고리 단일 선택
    Given 캐릭터 생성 페이지가 로드되어 있다
    When 사용자가 "행복/쾌활" 카테고리를 클릭하면
    Then "행복/쾌활" 카테고리가 선택 상태로 표시되어야 한다
    And 다른 6개 카테고리는 비선택 상태여야 한다

  Scenario: 기분 카테고리 변경
    Given "행복/쾌활" 카테고리가 선택된 상태이다
    When 사용자가 "자신감/쿨" 카테고리를 클릭하면
    Then "자신감/쿨" 카테고리가 선택 상태로 표시되어야 한다
    And "행복/쾌활" 카테고리는 비선택 상태로 변경되어야 한다
```

### AC-SI-002: 의상 선택 인터페이스

```gherkin
Feature: 의상 카테고리 선택
  사용자가 6개 의상 카테고리 중 하나를 선택할 수 있다.

  Scenario: 의상 카테고리 전체 표시
    Given 캐릭터 생성 페이지에 접속한다
    When 페이지가 로드되면
    Then 6개 의상 카테고리가 표시되어야 한다:
      | 카테고리 | 설명 |
      | 캐주얼 | T-shirt, 스웨트셔츠, 후드 등 |
      | 포멀 | 정장, 셔츠+넥타이 등 |
      | 스포티 | 야구 재킷, 셰리프 등 |
      | 아우터 | 레더 재킷, 라이더 재킷 등 |
      | 보타이 | 보타이 시리즈 |
      | 전체 | 모든 의상 |
```

### AC-SI-003: 생성 버튼 활성화 조건

```gherkin
Feature: 생성 버튼 상태 관리
  기분과 의상을 모두 선택해야 생성 버튼이 활성화된다.

  Scenario: 초기 상태 - 생성 버튼 비활성화
    Given 캐릭터 생성 페이지에 접속한다
    When 아무 카테고리도 선택하지 않은 상태이면
    Then "생성" 버튼은 비활성화(disabled) 상태여야 한다

  Scenario: 기분만 선택 - 생성 버튼 비활성화
    Given 사용자가 "행복/쾌활" 기분을 선택했다
    And 의상 카테고리는 선택하지 않았다
    When 생성 버튼 상태를 확인하면
    Then "생성" 버튼은 비활성화(disabled) 상태여야 한다

  Scenario: 기분과 의상 모두 선택 - 생성 버튼 활성화
    Given 사용자가 "행복/쾌활" 기분을 선택했다
    And 사용자가 "캐주얼" 의상을 선택했다
    When 생성 버튼 상태를 확인하면
    Then "생성" 버튼은 활성화(enabled) 상태여야 한다
```

---

## 3. 랜덤 조합 엔진 테스트 시나리오

### AC-RE-001: 캐릭터 랜덤 생성

```gherkin
Feature: 랜덤 캐릭터 조합 생성
  선택된 기분/의상 범위 내에서 6개 레이어의 랜덤 조합을 생성한다.

  Scenario: 기분 필터링이 적용된 랜덤 생성
    Given 기분 카테고리 "happy" (Group 1)가 선택되었다
    And 의상 카테고리 "all"이 선택되었다
    When 캐릭터 생성을 요청하면
    Then 표정 에셋은 Group 1 (facial expression11~16) 범위에서만 선택되어야 한다
    And 의상 에셋은 01_Body의 전체 143개에서 선택되어야 한다
    And 얼굴형은 5개 중 하나가 랜덤 선택되어야 한다
    And 헤어는 214개 중 하나가 랜덤 선택되어야 한다

  Scenario: 의상 필터링이 적용된 랜덤 생성
    Given 기분 카테고리 "confident" (Group 2)가 선택되었다
    And 의상 카테고리 "formal"이 선택되었다
    When 캐릭터 생성을 요청하면
    Then 표정 에셋은 Group 2 (facial expression21~26) 범위에서만 선택되어야 한다
    And 의상 에셋은 "formal" 카테고리(정장, 셔츠+넥타이)에서만 선택되어야 한다

  Scenario: 수염과 안경의 "없음" 옵션 확률
    Given 캐릭터 생성을 100회 수행한다
    When 수염과 안경의 "없음" 선택 비율을 집계하면
    Then 수염 "없음" 비율은 약 25%~35% 범위여야 한다
    And 안경 "없음" 비율은 약 25%~35% 범위여야 한다

  Scenario: 연속 생성 시 서로 다른 결과
    Given 동일한 기분("happy")과 의상("casual")이 선택되었다
    When 캐릭터를 10회 연속 생성하면
    Then 최소 8회 이상은 서로 다른 조합이 생성되어야 한다
```

### AC-RE-002: 얼굴형-수염 호환성 적용

```gherkin
Feature: 얼굴형 기반 수염 호환성
  랜덤 선택된 얼굴형에 호환되는 수염만 선택된다.

  Scenario: round 얼굴형 선택 시 수염 호환성
    Given 랜덤으로 "round" 얼굴형이 선택되었다
    When 수염 에셋이 랜덤 선택되면
    Then 선택된 수염은 "common" 또는 "round" 접두사를 가져야 한다
    Or 선택된 수염은 특수 에셋(bandate 시리즈)이어야 한다
    Or "없음"이 선택되어야 한다
```

---

## 4. 이미지 합성 엔진 테스트 시나리오

### AC-IC-001: 레이어 합성 순서

```gherkin
Feature: Canvas 레이어 합성
  6개 레이어를 올바른 순서로 합성하여 단일 이미지를 생성한다.

  Scenario: 6개 레이어 전체 합성 (수염 + 안경 포함)
    Given 다음 에셋이 선택되었다:
      | 레이어 | 에셋 |
      | Body | T shirt black.png |
      | Face | round 4.png |
      | Expression | facial expression11.png |
      | Mustache | common beard_balbo black.png |
      | Hair | buzz cut 1.png |
      | Glasses | aviator brown.png |
    When 이미지 합성을 수행하면
    Then Canvas에 6개 이미지가 순서대로 drawImage로 그려져야 한다
    And 최종 결과는 투명 배경의 합성 이미지여야 한다
    And 합성 완료까지 3초 이내여야 한다

  Scenario: 선택적 레이어 생략 (수염 없음, 안경 없음)
    Given 수염 선택이 "없음"이고 안경 선택이 "없음"이다
    When 이미지 합성을 수행하면
    Then Body, Face, Expression, Hair 4개 레이어만 합성되어야 한다
    And 수염과 안경 레이어의 drawImage 호출이 생략되어야 한다
```

### AC-IC-002: PNG 다운로드

```gherkin
Feature: 합성 이미지 PNG 다운로드
  합성된 캐릭터를 PNG 파일로 다운로드할 수 있다.

  Scenario: PNG 파일 다운로드
    Given 캐릭터 합성이 완료되어 미리보기가 표시된 상태이다
    When 사용자가 "다운로드" 버튼을 클릭하면
    Then PNG 형식의 파일이 다운로드되어야 한다
    And 파일명은 "aec-character-{timestamp}.png" 형식이어야 한다
    And 다운로드된 파일은 투명 배경이 유지되어야 한다
```

---

## 5. 사용자 경험 테스트 시나리오

### AC-UX-001: 반응형 레이아웃

```gherkin
Feature: 반응형 디자인
  다양한 화면 크기에서 올바르게 표시된다.

  Scenario: 데스크톱 레이아웃 (1024px+)
    Given 화면 너비가 1024px 이상이다
    When 캐릭터 생성 페이지를 표시하면
    Then 선택 패널과 미리보기가 좌우 2열로 배치되어야 한다

  Scenario: 모바일 레이아웃 (375px~767px)
    Given 화면 너비가 375px이다
    When 캐릭터 생성 페이지를 표시하면
    Then 선택 패널과 미리보기가 상하 1열로 배치되어야 한다
    And 모든 버튼이 터치 가능한 크기(최소 44px)여야 한다
```

### AC-UX-002: 다시 생성 기능

```gherkin
Feature: 카테고리 유지 재생성
  현재 선택된 카테고리를 유지한 채 새로운 조합을 생성한다.

  Scenario: 다시 생성 버튼 동작
    Given 기분 "행복/쾌활"과 의상 "캐주얼"이 선택되어 있다
    And 캐릭터가 생성되어 미리보기가 표시된 상태이다
    When 사용자가 "다시 생성" 버튼을 클릭하면
    Then 기분 "행복/쾌활" 선택이 유지되어야 한다
    And 의상 "캐주얼" 선택이 유지되어야 한다
    And 새로운 랜덤 조합의 캐릭터가 생성되어야 한다
```

### AC-UX-003: 로딩 상태 및 중복 방지

```gherkin
Feature: 로딩 상태 관리 및 중복 요청 방지
  이미지 합성 중 적절한 피드백을 제공하고 중복 요청을 방지한다.

  Scenario: 합성 중 로딩 인디케이터 표시
    Given 사용자가 "생성" 버튼을 클릭했다
    When 이미지 합성이 진행 중이면
    Then 로딩 인디케이터가 화면에 표시되어야 한다
    And "생성" 버튼은 비활성화되어야 한다

  Scenario: 중복 생성 요청 방지 (debounce)
    Given 이미지 합성이 진행 중이다
    When 사용자가 "생성" 버튼을 연속 3회 빠르게 클릭하면
    Then 합성 요청은 1회만 처리되어야 한다
    And 추가 클릭은 무시되어야 한다
```

---

## 6. 품질 게이트 기준

### QG-001: 코드 품질

| 항목 | 기준 | 검증 방법 |
|------|------|----------|
| 테스트 커버리지 | 85% 이상 | Vitest coverage report |
| TypeScript 에러 | 0건 | `tsc --noEmit` |
| ESLint 경고 | 0건 | `eslint --max-warnings 0` |
| 빌드 성공 | 에러 없음 | `next build` |

### QG-002: 성능 기준

| 항목 | 기준 | 검증 방법 |
|------|------|----------|
| 이미지 합성 시간 | 3초 이내 | Performance API 측정 |
| 초기 페이지 로드 | LCP 2.5초 이내 | Lighthouse |
| 번들 사이즈 | 에셋 제외 500KB 이내 | `next build` 분석 |

### QG-003: 접근성 기준

| 항목 | 기준 | 검증 방법 |
|------|------|----------|
| 키보드 네비게이션 | 전체 기능 사용 가능 | 수동 테스트 |
| 색상 대비 | WCAG AA 충족 | axe-core |
| aria-label | 모든 인터랙티브 요소 적용 | axe-core |

---

## 7. 완료 정의 (Definition of Done)

- [ ] 모든 인수 기준(AC-*) 시나리오가 통과한다
- [ ] 품질 게이트(QG-*) 기준을 모두 충족한다
- [ ] 493개 에셋이 올바르게 인덱싱되고 분류된다
- [ ] 7개 기분 x 6개 의상 = 42개 조합 모두에서 캐릭터가 정상 생성된다
- [ ] PNG 다운로드가 모든 지원 브라우저에서 동작한다
- [ ] 모바일(375px)과 데스크톱(1024px+)에서 레이아웃이 올바르게 표시된다
- [ ] TypeScript strict 모드에서 에러 0건이다
- [ ] 코드 리뷰가 완료되었다
