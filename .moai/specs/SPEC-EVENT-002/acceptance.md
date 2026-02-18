---
id: SPEC-EVENT-002
type: acceptance
related-spec: SPEC-EVENT-002
created: "2026-02-18"
---

# SPEC-EVENT-002 수락 기준

## 시나리오 1: 첫 출석 시 일일 보상 수령

```gherkin
Feature: 일일 아이템 보상 최초 수령

  Scenario: 이벤트 보상 기록이 없는 사용자의 첫 출석
    Given 사용자가 로그인한 상태이다
    And event_rewards/{userId} 문서가 존재하지 않는다
    When 사용자가 오늘의 무드를 저장한다
    Then 출석이 기록된다
    And event_rewards/{userId} 문서가 생성된다
    And cycleNumber가 1로 설정된다
    And cycleStartDate가 오늘 날짜로 설정된다
    And dailyClaims에 dayNumber 1의 아이템이 추가된다
    And allClaimedItems에 해당 아이템이 추가된다
    And 토스트에 수령한 아이템 정보가 표시된다
    And 토스트에 "1/14일 완료" 메시지가 표시된다
```

## 시나리오 2: 연속 출석 시 일일 보상 누적

```gherkin
Feature: 일일 아이템 보상 누적 수령

  Scenario: 주기 진행 중 출석
    Given 사용자가 로그인한 상태이다
    And 현재 주기에서 5일 차까지 보상을 수령했다
    When 사용자가 오늘의 무드를 저장한다
    Then dailyClaims에 dayNumber 6의 아이템이 추가된다
    And 지급된 아이템은 현재 주기에서 이미 지급된 5개 아이템과 중복되지 않는다
    And allClaimedItems에 해당 아이템이 추가된다
    And 토스트에 "6/14일 완료" 메시지가 표시된다
```

## 시나리오 3: 같은 날 중복 저장 시 보상 미지급

```gherkin
Feature: 일일 보상 멱등성

  Scenario: 같은 날 무드를 수정하여 재저장
    Given 사용자가 로그인한 상태이다
    And 오늘 이미 일일 보상을 수령했다
    When 사용자가 오늘의 무드를 수정하여 다시 저장한다
    Then 출석은 중복 처리되지 않는다 (기존 동작)
    And 일일 보상은 추가로 지급되지 않는다
    And dailyClaims에 오늘 날짜의 기록이 1개만 존재한다
```

## 시나리오 4: 주기 완주 및 보너스 지급

```gherkin
Feature: 주기 완주 보너스

  Scenario: 14일 주기의 마지막 날 보상 수령
    Given 사용자가 로그인한 상태이다
    And 현재 주기에서 13일 차까지 보상을 수령했다
    When 사용자가 오늘의 무드를 저장한다
    Then dailyClaims에 dayNumber 14의 아이템이 추가된다
    And cycleCompleted가 true로 설정된다
    And completionBonusClaimed가 true로 설정된다
    And completedCycles가 1 증가한다
    And 보너스 아이템 3개(body_item 1 + hand_item 2)가 allClaimedItems에 추가된다
    And 축하 토스트에 보너스 아이템 정보가 표시된다
```

## 시나리오 5: 완주 후 새 주기 시작

```gherkin
Feature: 주기 자동 갱신

  Scenario: 완주 후 다음 출석 시 새 주기 시작
    Given 사용자가 로그인한 상태이다
    And 이전 주기를 완주했다 (completedCycles = 1)
    When 사용자가 다음 날 무드를 저장한다
    Then cycleNumber가 2로 증가한다
    And cycleStartDate가 오늘 날짜로 갱신된다
    And dailyClaims가 새 주기 기록으로 초기화된다 (dayNumber 1부터)
    And cycleCompleted가 false로 설정된다
    And completionBonusClaimed가 false로 설정된다
    And allClaimedItems의 이전 주기 아이템은 유지된다
```

## 시나리오 6: 비연속 출석 시 주기 유지

```gherkin
Feature: 비연속 출석 허용

  Scenario: 중간에 하루를 건너뛴 경우
    Given 사용자가 로그인한 상태이다
    And 현재 주기에서 3일 차까지 보상을 수령했다
    And 어제는 출석하지 않았다
    When 사용자가 오늘의 무드를 저장한다
    Then 주기는 리셋되지 않는다
    And dailyClaims에 dayNumber 4의 아이템이 추가된다
    And 토스트에 "4/14일 완료" 메시지가 표시된다
```

## 시나리오 7: 일일 보상 아이템 캐릭터 적용

```gherkin
Feature: 일일 보상 아이템 사용

  Scenario: 수령한 아이템이 커스터마이징에 반영
    Given 사용자가 일일 보상으로 body_item "hipbag_01.png"를 수령했다
    When 사용자가 무드 페이지에 접속한다
    Then 착용 소품 풀에 "hipbag_01.png"가 포함된다
    And 해당 아이템을 착용한 캐릭터 미리보기가 가능하다
```

## 시나리오 8: 주기 진행 현황 카드 표시

```gherkin
Feature: 주기 진행 현황 UI

  Scenario: 메인 페이지에서 현황 카드 확인
    Given 사용자가 로그인한 상태이다
    And 현재 주기에서 7일 차까지 보상을 수령했다
    When 사용자가 메인 페이지에 접속한다
    Then DailyRewardCard에 "주기 1 - 7/14일" 진행도가 표시된다
    And 14개 원형 아이콘 중 7개가 수령 완료 상태로 표시된다
    And "완주까지 7일 남음" 메시지가 표시된다
    And 완주 보너스 미리보기가 표시된다
```

## 시나리오 9: 아이템 풀 소진 시 중복 허용

```gherkin
Feature: 아이템 풀 소진 대비

  Scenario: 현재 주기에서 사용 가능한 고유 아이템이 소진된 경우
    Given 사용자가 로그인한 상태이다
    And 현재 주기에서 이미 지급된 아이템이 전체 풀(176개)과 동일하다
    When 사용자가 오늘의 무드를 저장한다
    Then 전체 풀에서 무작위 아이템이 선택된다 (중복 허용)
    And 정상적으로 일일 보상이 지급된다
```

## 시나리오 10: 이전 주기 아이템 영구 보존

```gherkin
Feature: 아이템 영구 보존

  Scenario: 새 주기 시작 후 이전 아이템 유지
    Given 사용자가 첫 번째 주기를 완주하여 14개 아이템을 수령했다
    And 완주 보너스 3개 아이템을 수령했다
    And 두 번째 주기가 시작되었다
    When 사용자가 무드 페이지에 접속한다
    Then 첫 번째 주기의 14개 아이템이 모두 사용 가능하다
    And 완주 보너스 3개 아이템이 사용 가능하다
    And 두 번째 주기의 새로운 일일 보상도 누적된다
```

## 시나리오 11: 완주 보너스 중복 방지

```gherkin
Feature: 완주 보너스 1회 제한

  Scenario: 두 번째 주기 완주 시 보너스 중복 확인
    Given 사용자가 첫 번째 주기를 완주하고 보너스를 수령했다
    And 두 번째 주기에서 14일 차까지 보상을 수령했다
    When 두 번째 주기가 완주된다
    Then 완주 보너스 아이템은 추가로 지급되지 않는다
    And completedCycles가 2로 증가한다
    And 축하 메시지는 표시된다 (보너스 아이템 없이)
```

## 품질 게이트

### 테스트 커버리지

| 영역 | 최소 커버리지 | 테스트 유형 |
|------|-------------|------------|
| daily-reward-utils.ts | 90% | 단위 테스트 |
| useDailyReward.ts | 주요 플로우 | 통합 테스트 (수동) |
| DailyRewardCard.tsx | 렌더링 확인 | 컴포넌트 테스트 (선택) |

### 검증 항목

- [ ] 순수 함수 단위 테스트 전체 통과
- [ ] TypeScript 타입 검사 통과 (tsc --noEmit)
- [ ] ESLint 경고/에러 0건
- [ ] Static Export 빌드 성공 (next build)
- [ ] 기존 63개 attendance-utils 테스트 회귀 없음
- [ ] Firestore 보안 규칙 적용 확인
- [ ] 일일 보상 수령 플로우 동작 확인 (수동 테스트)
- [ ] 주기 완주 보너스 지급 동작 확인 (수동 테스트)
- [ ] 일일 보상 아이템 캐릭터 착용 동작 확인 (수동 테스트)
- [ ] 기존 마일스톤 보상 시스템 정상 동작 확인 (회귀 테스트)

### Definition of Done

1. 모든 EARS 요구사항(REQ-EVENT-002-01 ~ REQ-EVENT-002-26)이 구현되었다.
2. 순수 함수 단위 테스트가 40개 이상 작성되고 전체 통과한다.
3. TypeScript 컴파일, ESLint, Static Export 빌드가 모두 성공한다.
4. 기존 출석/보상 시스템(SPEC-EVENT-001)이 정상 동작한다 (회귀 없음).
5. 일일 보상 아이템이 캐릭터 커스터마이징에 반영된다.
6. DailyRewardCard가 주기 진행 현황을 정확히 표시한다.
7. 토스트에 일일 보상 및 주기 완주 정보가 표시된다.
