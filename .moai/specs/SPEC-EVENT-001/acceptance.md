---
id: SPEC-EVENT-001
type: acceptance
version: "1.0.0"
---

# SPEC-EVENT-001 인수 기준: 출석 체크 이벤트

## 시나리오 1: 이번 달 첫 무드 기록 시 스트릭 시작

```gherkin
Given 사용자가 로그인되어 있고
  And 이번 달(2026-02)에 무드 기록이 없으며
  And attendance 문서가 존재하지 않을 때
When 사용자가 오늘의 기분을 선택하고 "오늘의 기분 저장" 버튼을 누르면
Then mood_entries에 오늘 날짜의 항목이 생성되고
  And attendance 문서가 { currentStreak: 1, maxStreak: 1, totalDays: 1 }로 생성되고
  And 출석 인정 토스트 메시지에 "1일 연속 출석" 정보가 표시된다
```

## 시나리오 2: 연속 출석 시 스트릭 증가

```gherkin
Given 사용자가 로그인되어 있고
  And 어제(2026-02-04) 출석 기록이 있으며
  And 현재 스트릭이 3일일 때
When 사용자가 오늘(2026-02-05) 무드를 저장하면
Then attendance 문서의 currentStreak이 4로 증가하고
  And attendedDates 배열에 "2026-02-05"가 추가되고
  And totalDays가 1 증가하고
  And 토스트에 "4일 연속 출석" 정보가 표시된다
```

## 시나리오 3: 하루 건너뛰기 시 스트릭 초기화

```gherkin
Given 사용자가 로그인되어 있고
  And 마지막 출석이 그저께(2026-02-03)이며
  And 어제(2026-02-04) 출석 기록이 없을 때
When 사용자가 오늘(2026-02-05) 무드를 저장하면
Then attendance 문서의 currentStreak이 1로 초기화되고
  And attendedDates 배열에 "2026-02-05"가 추가되고
  And totalDays가 1 증가하고
  And 토스트에 "1일 연속 출석 (다시 시작)" 정보가 표시된다
```

## 시나리오 4: 마일스톤 도달 시 보상 해금

```gherkin
Given 사용자가 로그인되어 있고
  And 현재 스트릭이 2일이며
  And 3일 마일스톤 보상이 아직 해금되지 않았을 때
When 사용자가 오늘 무드를 저장하여 스트릭이 3일에 도달하면
Then attendance 문서의 currentStreak이 3으로 업데이트되고
  And rewards 문서에 3일 마일스톤 보상(특별 표정 1개)이 추가되고
  And 토스트에 "3일 연속 출석 달성! 특별 표정이 해금되었습니다" 메시지가 표시되고
  And 해금된 표정이 MoodExpressionPicker에 즉시 노출된다
```

## 시나리오 5: 월 변경 시 스트릭 초기화 및 이력 보존

```gherkin
Given 사용자가 로그인되어 있고
  And 1월(2026-01) attendance 문서에 { currentStreak: 15, maxStreak: 20, totalDays: 25 }가 기록되어 있으며
  And 2월 1일(2026-02-01)에 접속할 때
When 사용자가 2월 1일에 무드를 저장하면
Then 새로운 attendance 문서(userId_2026-02)가 { currentStreak: 1, maxStreak: 1, totalDays: 1 }로 생성되고
  And 1월 attendance 문서는 변경되지 않고 보존되며
  And 1월에 해금된 보상은 여전히 유효하다
```

## 시나리오 6: 같은 날 무드 중복 수정 시 출석 중복 방지

```gherkin
Given 사용자가 로그인되어 있고
  And 오늘 이미 무드를 기록하여 출석이 인정된 상태일 때
When 사용자가 오늘의 무드를 다시 수정(upsert)하면
Then mood_entries의 오늘 항목이 업데이트되고
  And attendance 문서의 attendedDates에 오늘 날짜가 중복 추가되지 않고
  And currentStreak 및 totalDays 값이 변경되지 않고
  And 토스트에 "오늘의 기분이 수정되었습니다" 메시지가 표시된다 (출석 관련 메시지 없음)
```

## 시나리오 7: 다이어리 페이지에서 출석 현황 확인

```gherkin
Given 사용자가 로그인되어 있고
  And 이번 달 { currentStreak: 5, maxStreak: 7, totalDays: 12 } 출석 기록이 있을 때
When 사용자가 다이어리 페이지에 접속하면
Then AttendanceCard에 다음 정보가 표시된다:
  | 항목 | 값 |
  | 현재 연속 출석 | 5일 |
  | 이번 달 총 출석 | 12일 |
  | 다음 마일스톤 | 7일 (2일 남음) |
  And MilestoneProgress에 3일 마일스톤이 달성 표시되고
  And 7일, 14일, 30일 마일스톤은 미달성으로 표시된다
```

## 시나리오 8: 이미 해금된 마일스톤 중복 해금 방지

```gherkin
Given 사용자가 로그인되어 있고
  And 3일 마일스톤 보상이 이미 해금된 상태이며
  And 이번 달 스트릭이 초기화되어 다시 3일에 도달할 때
When 스트릭이 3일에 도달하면
Then 3일 마일스톤 보상이 중복 추가되지 않고
  And 기존 해금된 보상이 그대로 유지되고
  And 토스트에는 "3일 연속 출석" 정보만 표시된다 (보상 해금 메시지 없음)
```

## 엣지 케이스

### EC-1: 자정 직전/직후 무드 저장

```gherkin
Given 사용자가 23:59에 무드 페이지를 열어두고 있을 때
When 00:01(다음 날)에 "오늘의 기분 저장" 버튼을 누르면
Then 저장 시점의 날짜(다음 날)로 출석이 기록된다
  And getTodayDateString()이 호출 시점의 날짜를 반환하므로 정확한 날짜가 적용된다
```

### EC-2: 네트워크 오류 시 출석 기록 실패

```gherkin
Given 사용자가 무드를 저장 성공했으나
  And attendance 문서 쓰기 시 네트워크 오류가 발생할 때
Then mood_entries는 정상 저장되고
  And 출석 기록 실패 에러가 콘솔에 기록되되 사용자에게 치명적 에러로 표시하지 않고
  And 다음 접속 시 출석 기록이 누락된 상태로 표시된다
```

### EC-3: 31일까지 있는 달의 마지막 날 출석

```gherkin
Given 1월(31일)의 30일째 연속 출석하여 30일 마일스톤을 달성한 상태에서
When 31일에도 무드를 저장하면
Then currentStreak이 31로 업데이트되고
  And 추가 보상은 없지만 기록은 정상 유지되고
  And totalDays가 31로 업데이트된다
```

### EC-4: 새 사용자의 첫 출석

```gherkin
Given 사용자가 방금 회원가입하고 캐릭터를 생성한 직후
  And attendance 문서와 rewards 문서가 모두 존재하지 않을 때
When 첫 무드를 저장하면
Then attendance 문서와 rewards 문서가 새로 생성되고
  And currentStreak이 1로 설정되고
  And 보상 해금은 발생하지 않는다
```

### EC-5: 2월 28/29일 처리

```gherkin
Given 2월이 28일까지인 해에
  And 사용자가 2월 28일에 28일 연속 출석 중일 때
When 3월 1일에 무드를 저장하면
Then 2월 attendance 문서는 { currentStreak: 28, maxStreak: 28, totalDays: 28 }로 보존되고
  And 3월 attendance 문서가 { currentStreak: 1, maxStreak: 1, totalDays: 1 }로 새로 생성된다
```

## 품질 게이트

### 성능 기준

| 지표 | 기준값 |
|------|--------|
| 무드 저장 + 출석 기록 총 소요 시간 | 2초 이내 |
| 다이어리 페이지 AttendanceCard 로딩 | 1초 이내 |
| 보상 해금 판정 및 저장 | 1초 이내 |
| Firestore 읽기/쓰기 추가 횟수 (무드 저장 시) | 최대 4회 (attendance 읽기+쓰기, rewards 읽기+쓰기) |

### 접근성 기준

| 항목 | 기준 |
|------|------|
| 키보드 탐색 | AttendanceCard, MilestoneProgress 내 모든 요소가 키보드로 접근 가능 |
| 스크린 리더 | 스트릭 정보, 마일스톤 달성 상태가 aria-label로 제공 |
| 색상 대비 | 프로그레스 바, 배지의 색상 대비 WCAG 2.1 AA 이상 |
| 토스트 접근성 | role="status" 및 aria-live="polite" 적용 |

### 코드 품질 기준

| 항목 | 기준 |
|------|------|
| TypeScript strict mode | 모든 신규 파일에 적용 |
| 타입 안전성 | any 타입 사용 금지 |
| Hook 패턴 일관성 | 기존 useMoodEntries 패턴(loading/error/반환값 구조)을 준수 |
| 에러 핸들링 | 모든 Firestore 호출에 try-catch 적용 |
| 컴포넌트 접근성 | 모든 버튼에 aria-label, 의미 있는 role 속성 사용 |

## Definition of Done

- [ ] 모든 신규 Hook(useAttendance, useRewards)이 구현되었다
- [ ] 모든 신규 UI 컴포넌트(AttendanceCard, MilestoneProgress, AttendanceToast, RewardBadge)가 구현되었다
- [ ] 무드 저장 시 자동 출석 기록이 정상 동작한다
- [ ] 연속 출석 스트릭이 정확히 계산된다 (증가/초기화/월 리셋)
- [ ] 마일스톤(3/7/14/30일) 도달 시 보상이 자동 해금된다
- [ ] 해금된 보상이 의상/표정 선택기에 표시된다
- [ ] 같은 날 중복 출석이 방지된다
- [ ] 월 변경 시 스트릭이 초기화되고 이전 달 데이터가 보존된다
- [ ] Firestore 보안 규칙이 적용되어 타 사용자 데이터 접근이 차단된다
- [ ] 다이어리 페이지에 출석 현황 카드가 표시된다
- [ ] 성능 기준(무드 저장 2초 이내)을 충족한다
- [ ] 접근성 기준(키보드 탐색, 스크린 리더, 색상 대비)을 충족한다
- [ ] TypeScript strict mode에서 타입 에러가 없다
