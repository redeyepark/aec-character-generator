---
spec_id: SPEC-UX-001
type: acceptance-criteria
version: 1.0.0
created: 2026-02-17
updated: 2026-02-17
---

# SPEC-UX-001 수락 기준

## 1. 달력 색상 시각화 (Calendar Color Visualization)

### Scenario 1-1: 기분 기록이 있는 날짜에 색상 배경 표시

```gherkin
Given 사용자가 2026년 2월에 3일간의 기분을 기록했다:
  | 날짜       | 기분 카테고리 |
  | 2026-02-01 | happy        |
  | 2026-02-05 | calm         |
  | 2026-02-10 | determined   |
When 다이어리 달력 페이지(`/diary`)가 렌더링될 때
Then 2월 1일 셀의 배경색은 `bg-yellow-200` 클래스를 포함한다
And 2월 5일 셀의 배경색은 `bg-blue-200` 클래스를 포함한다
And 2월 10일 셀의 배경색은 `bg-red-200` 클래스를 포함한다
And 기록이 없는 날짜(예: 2월 3일)의 배경은 기본 흰색을 유지한다
```

### Scenario 1-2: 선택된 셀에서 무드 색상 도트 표시

```gherkin
Given 2026년 2월 1일에 "happy" 기분이 기록되어 있다
When 사용자가 2월 1일 날짜 셀을 클릭하면
Then 해당 셀의 배경색은 `bg-blue-500`(선택 상태)으로 변경된다
And 셀 내부에 `bg-yellow-400` 클래스를 가진 작은 도트가 표시된다
And 오른쪽 패널에 해당 날짜의 상세 기분 정보가 표시된다
```

### Scenario 1-3: 접근성 - aria-label에 기분명 포함

```gherkin
Given 2026년 2월 1일에 "happy" 기분이 기록되어 있다
When DiaryCalendar 컴포넌트가 렌더링될 때
Then 2월 1일 셀 버튼의 aria-label에 "happy" 또는 "행복" 기분명이 포함된다
And 기분 이모지가 함께 표시되어 색상 외에도 시각적 구분이 가능하다
```

### Scenario 1-4: 기분 기록이 없는 날짜의 동작 유지

```gherkin
Given 2026년 2월 15일에 기분 기록이 없다
When 다이어리 달력이 렌더링될 때
Then 2월 15일 셀의 배경은 흰색/투명(기본값)을 유지한다
And 이모지나 색상 도트가 표시되지 않는다
When 사용자가 2월 15일을 클릭하면
Then "이 날짜에는 기록이 없습니다" 메시지가 표시된다
```

---

## 2. 기분 기록 간소화 (Mood Recording Simplification)

### Scenario 2-1: 기분 선택 후 즉시 저장 가능

```gherkin
Given 사용자가 기분 기록 페이지(`/mood`)에 처음 진입했다
And 기분과 의상이 자동으로 랜덤 선택된 상태이다
When 사용자가 "행복/쾌활" 기분 카테고리를 클릭하면
Then 표정이 해당 기분에 맞는 표정으로 자동 변경된다
And 저장 버튼이 즉시 활성화 상태로 표시된다
And 저장 버튼의 크기가 전체 너비(`w-full`)이고, `py-4 text-lg font-bold`로 강조된다
```

### Scenario 2-2: 의상 선택이 접이식 섹션으로 제공

```gherkin
Given 사용자가 기분 카테고리를 선택한 상태이다
When 기분 기록 페이지의 레이아웃을 확인하면
Then "세부 조정" 섹션이 기본적으로 접힌(collapsed) 상태로 표시된다
When 사용자가 "세부 조정" 섹션을 펼치면(expand)
Then 의상 카테고리 선택 UI가 표시된다
And "표정 다시 뽑기", "의상 다시 뽑기" 버튼이 표시된다
```

### Scenario 2-3: 다운로드 버튼의 보조 액션 스타일

```gherkin
Given 캐릭터 미리보기가 생성된 상태이다
When 저장 버튼과 다운로드 버튼이 동시에 표시될 때
Then 저장 버튼은 `bg-blue-600 text-white font-bold` 스타일로 표시된다
And 다운로드 버튼은 `border border-gray-300 text-gray-600 bg-white` outline 스타일로 표시된다
And 저장 버튼이 다운로드 버튼보다 시각적으로 더 두드러진다
```

### Scenario 2-4: 오늘의 기분 수정 모드

```gherkin
Given 사용자가 이미 오늘의 기분을 저장한 상태이다
When 기분 기록 페이지에 다시 진입하면
Then 기존에 저장된 기분 카테고리가 선택된 상태로 표시된다
And "오늘의 기분을 수정할 수 있습니다" 안내 메시지가 표시된다
And 저장 버튼이 활성화 상태로 즉시 사용 가능하다
```

---

## 3. 온보딩 플로우 (Onboarding Flow)

### Scenario 3-1: 첫 방문 사용자에게 온보딩 표시

```gherkin
Given 새로운 사용자가 회원가입을 완료했다
And localStorage에 'aec_onboarding_done' 키가 존재하지 않는다
When 사용자가 캐릭터 생성 페이지(`/create`)에 진입하면
Then 3-slide 온보딩 시퀀스가 캐릭터 위자드 대신 표시된다
And 첫 번째 슬라이드에 "나만의 캐릭터 만들기" 제목이 표시된다
And 하단에 3개의 인디케이터 도트가 표시되고, 첫 번째 도트가 활성 상태이다
And "건너뛰기" 버튼이 표시된다
```

### Scenario 3-2: 온보딩 완료 후 위자드 진입

```gherkin
Given 사용자가 온보딩의 세 번째(마지막) 슬라이드에 있다
When 사용자가 "시작하기" 버튼을 클릭하면
Then localStorage에 'aec_onboarding_done' 키가 "true"로 저장된다
And 온보딩 슬라이드가 사라진다
And 캐릭터 생성 위자드가 표시된다
```

### Scenario 3-3: 온보딩 건너뛰기

```gherkin
Given 사용자가 온보딩의 첫 번째 슬라이드에 있다
When 사용자가 "건너뛰기" 버튼을 클릭하면
Then localStorage에 'aec_onboarding_done' 키가 "true"로 저장된다
And 온보딩 슬라이드가 즉시 사라진다
And 캐릭터 생성 위자드가 표시된다
```

### Scenario 3-4: 재방문 사용자는 온보딩 생략

```gherkin
Given localStorage에 'aec_onboarding_done' 키가 "true"로 존재한다
When 사용자가 캐릭터 생성 페이지(`/create`)에 진입하면
Then 온보딩 슬라이드가 표시되지 않는다
And 캐릭터 생성 위자드가 즉시 표시된다
```

### Scenario 3-5: 관리자는 온보딩 생략

```gherkin
Given 사용자가 관리자(admin) 역할이다
And localStorage에 'aec_onboarding_done' 키가 존재하지 않는다
When 관리자가 캐릭터 생성 페이지(`/create`)에 진입하면
Then 온보딩 슬라이드가 표시되지 않는다
And 캐릭터 수정 위자드가 즉시 표시된다
```

---

## 4. 엣지 케이스

### 4.1 달력 엣지 케이스

```gherkin
Scenario: 한 달의 모든 날에 기분 기록이 있는 경우
Given 2026년 2월의 모든 날(28일)에 다양한 기분이 기록되어 있다
When 달력이 렌더링될 때
Then 모든 날짜 셀에 각각의 기분 색상이 적용된다
And 달력이 "Year in Pixels" 스타일의 색상 모자이크를 형성한다
And 각 셀의 텍스트(날짜 숫자)가 배경색 위에서 명확히 읽힌다

Scenario: 월 이동 시 색상이 올바르게 업데이트
Given 2026년 2월의 달력이 색상과 함께 표시되어 있다
When 사용자가 "이전 월" 버튼을 클릭하여 1월로 이동하면
Then 1월의 기분 기록에 따른 색상이 새로 적용된다
And 2월의 색상이 남아있지 않는다
```

### 4.2 기분 기록 엣지 케이스

```gherkin
Scenario: 접이식 섹션 펼침 상태에서 저장
Given 사용자가 기분을 선택하고 "세부 조정" 섹션을 펼친 상태이다
And 의상 카테고리를 변경한 상태이다
When 사용자가 저장 버튼을 클릭하면
Then 변경된 의상이 포함된 기분 기록이 정상적으로 저장된다
And 성공 메시지가 표시된다

Scenario: 표정/의상 에셋이 비어있는 카테고리
Given 특정 기분 카테고리에 할당된 표정 에셋이 0개인 경우
When 사용자가 해당 기분 카테고리를 선택하면
Then 표정이 null로 설정되고, 기본 표정이 미리보기에 사용된다
And 저장 버튼은 비활성화 상태를 유지한다
```

### 4.3 온보딩 엣지 케이스

```gherkin
Scenario: localStorage가 비활성화된 환경
Given 브라우저의 localStorage가 비활성화되어 있거나 접근 불가하다
When 사용자가 캐릭터 생성 페이지에 진입하면
Then 온보딩이 표시된다 (기본값: 미완료 상태로 처리)
And 온보딩 완료 시 오류 없이 위자드로 전환된다
And localStorage 저장 실패는 조용히 처리한다 (try-catch)

Scenario: 빠른 슬라이드 전환
Given 사용자가 온보딩 슬라이드를 보고 있다
When 사용자가 빠르게 여러 번 "다음" 버튼을 클릭하면
Then 슬라이드 인덱스가 최대값(2)을 초과하지 않는다
And 마지막 슬라이드에서 "시작하기" 버튼이 정상 표시된다
```

---

## 5. 성능 기준

| 항목 | 기준 | 측정 방법 |
|------|------|----------|
| 달력 렌더링 시간 | 100ms 이내 (색상 적용 포함) | React DevTools Profiler |
| 기분 선택 후 미리보기 업데이트 | 200ms 이내 | 사용자 체감 테스트 |
| 온보딩 슬라이드 전환 | 60fps 유지 | Chrome Performance tab |
| 저장 버튼 클릭 후 응답 | 기존과 동일 (Firebase 의존) | Network tab |
| 초기 페이지 로드 크기 증가 | 5KB 이하 (gzip 기준) | Webpack Bundle Analyzer |

---

## 6. 품질 게이트 (Quality Gate)

### 6.1 코드 품질

| 기준 | 요구 수준 |
|------|----------|
| TypeScript 타입 오류 | 0개 |
| ESLint 경고/오류 | 0개 |
| 사용하지 않는 import | 0개 |
| 접근성 lint (jsx-a11y) | 경고 0개 |

### 6.2 기능 검증

| 검증 항목 | 방법 |
|----------|------|
| 7개 기분 색상이 달력에 정확히 매핑 | 수동 검증 - 각 기분별 기록 생성 후 달력 확인 |
| 저장 버튼이 기분 선택 후 즉시 활성화 | 수동 검증 - 기분 클릭 후 버튼 상태 확인 |
| 접이식 섹션 펼침/접힘 동작 | 수동 검증 - 반복 토글 테스트 |
| 온보딩 3-slide 순서 및 내용 | 수동 검증 - 신규 사용자 플로우 전체 진행 |
| localStorage 상태 관리 | 수동 검증 - 완료 후 재진입 시 온보딩 생략 확인 |
| 관리자 온보딩 건너뛰기 | 수동 검증 - admin 역할로 `/create` 접근 |
| 모바일 반응형 레이아웃 | 수동 검증 - 375px, 768px, 1024px 폭에서 확인 |

### 6.3 브라우저 호환성

| 브라우저 | 최소 버전 |
|---------|----------|
| Chrome | 90+ |
| Safari | 15+ |
| Firefox | 90+ |
| Edge | 90+ |
| Mobile Safari (iOS) | 15+ |
| Chrome (Android) | 90+ |

---

## 7. 완료 정의 (Definition of Done)

- [ ] 모든 17개 요구사항(REQ-UX-001-01 ~ REQ-UX-001-17)이 구현되었다
- [ ] 달력에서 7개 기분 카테고리의 색상이 정확히 표시된다
- [ ] 저장 버튼이 주요 액션으로 시각적으로 강조된다
- [ ] 의상 선택이 접이식 "세부 조정" 섹션으로 분리되었다
- [ ] 온보딩 3-slide가 첫 방문 사용자에게 정상 표시된다
- [ ] 온보딩 건너뛰기 및 완료 후 재표시되지 않는다
- [ ] 관리자는 온보딩을 건너뛴다
- [ ] TypeScript 타입 오류 0개
- [ ] ESLint 경고/오류 0개
- [ ] 모바일(375px) 및 데스크톱(1024px)에서 정상 동작
- [ ] 모든 수락 시나리오(Scenario 1-1 ~ 3-5)가 통과
