---
id: SPEC-EVENT-002
type: plan
related-spec: SPEC-EVENT-002
created: "2026-02-18"
---

# SPEC-EVENT-002 구현 계획

## 마일스톤

### 마일스톤 1: 데이터 레이어 구축 (Primary Goal)

순수 비즈니스 로직과 타입 정의를 먼저 구축한다.

**작업 목록:**

1. **타입 정의 추가** (`src/app/lib/types.ts`)
   - `DailyRewardClaim` 인터페이스 (dayNumber, claimedDate, itemType, itemFile)
   - `EventRewardData` 인터페이스 (cycleLength, cycleNumber, cycleStartDate, dailyClaims, cycleCompleted, completionBonusClaimed, completedCycles, allClaimedItems)
   - `DailyClaimResult` 인터페이스 (claimed, dayNumber, itemType, itemFile, isCycleComplete, bonusItems)
   - `CycleCompletionBonus` 인터페이스 및 상수
   - `DEFAULT_CYCLE_LENGTH` 상수 (14)

2. **Firestore 타입 추가** (`src/app/lib/firestore.types.ts`)
   - `FirestoreEventReward` 인터페이스

3. **순수 로직 구현** (`src/app/lib/daily-reward-utils.ts`)
   - `isAlreadyClaimedToday()`: 오늘 이미 수령했는지 확인
   - `selectRandomItem()`: 풀에서 랜덤 아이템 선택 (제외 목록 적용)
   - `isCycleComplete()`: 주기 완주 여부 판정
   - `getNextDayNumber()`: 다음 일차 번호 계산
   - `getCycleProgress()`: 주기 진행도 계산 (current/total/percentage)
   - `buildAvailableItemPool()`: body_item + hand_item 풀 구성 (제외 적용)
   - `getAllClaimedItemFiles()`: 영구 수령 아이템 파일 목록 반환

4. **단위 테스트 작성** (`src/app/lib/__tests__/daily-reward-utils.test.ts`)
   - 각 순수 함수에 대한 테스트 (기존 attendance-utils.test.ts 패턴 참조)
   - 목표: 40개 이상 테스트 케이스

**완료 기준:** 순수 함수 테스트 전체 통과, 타입 검사 통과

### 마일스톤 2: Firestore 통합 (Primary Goal)

Firestore CRUD 훅과 보안 규칙을 구현한다.

**작업 목록:**

1. **useDailyReward 훅 구현** (`src/app/hooks/useDailyReward.ts`)
   - `fetchEventReward()`: event_rewards/{userId} 문서 조회
   - `claimDailyReward()`: 일일 보상 수령 처리
     - 오늘 중복 수령 방지
     - 랜덤 아이템 선택 (주기 내 중복 제외)
     - Firestore 문서 업데이트
     - 주기 완주 시 보너스 처리 및 새 주기 시작
   - `getDailyRewardItems()`: 영구 수령 아이템 파일 목록
   - `getCycleProgress()`: 주기 진행 현황

2. **Firestore 보안 규칙 추가** (`firestore.rules`)
   - event_rewards 컬렉션에 대한 read/create/update 규칙
   - delete 차단

**완료 기준:** 훅이 정상적으로 Firestore와 통신, 보안 규칙 적용 확인

### 마일스톤 3: 아이템 통합 (Secondary Goal)

일일 보상 아이템을 기존 캐릭터 커스터마이징 시스템에 통합한다.

**작업 목록:**

1. **assetManager 확장** (`src/app/lib/assetManager.ts`)
   - 일일 보상 아이템을 사용 가능 목록에 병합하는 함수 추가
   - 기존 `getUnlockedBodyItemAssets()`, `getUnlockedHandItemAssets()`와 병합 로직

2. **mood/page.tsx 수정** (`src/app/mood/page.tsx`)
   - handleSave 플로우에 `claimDailyReward()` 호출 추가
   - 일일 보상 아이템을 착용 소품/손 아이템 풀에 반영
   - 토스트 데이터에 일일 보상 정보 추가

**완료 기준:** 일일 보상 아이템이 캐릭터 커스터마이징에 반영, 저장 플로우에서 보상 수령 동작

### 마일스톤 4: UI 컴포넌트 (Secondary Goal)

사용자에게 이벤트 현황을 표시하는 UI를 구현한다.

**작업 목록:**

1. **DailyRewardCard 컴포넌트** (`src/app/components/DailyRewardCard.tsx`)
   - 주기 진행도 시각화 (X/14일)
   - 날짜별 수령 상태 표시 (그리드)
   - 완주 보너스 미리보기
   - 남은 일수 표시

2. **AttendanceToast 확장** (`src/app/components/AttendanceToast.tsx`)
   - 일일 보상 아이템 정보 표시 영역 추가
   - 주기 완주 시 축하 메시지

3. **페이지 배치** (`src/app/page.tsx` 또는 `src/app/diary/page.tsx`)
   - DailyRewardCard 배치

**완료 기준:** UI가 정상적으로 주기 현황을 표시, 토스트에 보상 정보 포함

### 마일스톤 5: 에셋 준비 (Optional Goal)

주기 완주 보너스 아이템 에셋을 준비한다.

**작업 목록:**

1. **보너스 아이템 에셋 배치** (`public/assets/`)
   - `event_bonus_body_01.png`: 완주 보너스 body_item
   - `event_bonus_hand_01.png`: 완주 보너스 hand_item 1
   - `event_bonus_hand_02.png`: 완주 보너스 hand_item 2

2. **assetIndex 갱신** (`npm run build-index`)

**완료 기준:** 보너스 에셋이 정상적으로 로드되어 캐릭터에 렌더링

## 기술 접근 방식

### 아키텍처 방향

기존 SPEC-EVENT-001의 아키텍처 패턴을 그대로 따른다:
- **순수 함수 분리**: 비즈니스 로직을 `daily-reward-utils.ts`에 순수 함수로 추출하여 테스트 가능성 확보
- **Firestore 훅 패턴**: `useDailyReward`는 기존 `useAttendance`, `useRewards`와 동일한 패턴
- **클라이언트 전용**: Static Export 호환, 모든 로직은 브라우저에서 실행
- **멱등성 보장**: 같은 날 여러 번 호출해도 1회만 처리

### 데이터 플로우

```
사용자 → 무드 저장 (upsertEntry)
       → 출석 기록 (recordAttendance) [기존]
       → 마일스톤 보상 확인 (checkAndUnlockReward) [기존]
       → 아이템 티어 해금 (checkAndUnlockItemRewards) [기존]
       → [신규] 일일 보상 수령 (claimDailyReward)
           → 랜덤 아이템 선택
           → Firestore 저장
           → 주기 완주 확인 → 보너스 지급
       → 토스트 표시 (출석 + 마일스톤 + 일일 보상)
```

### 의존성 관계

```
useDailyReward (신규)
  ├── useAuth (기존)
  ├── daily-reward-utils.ts (신규, 순수 함수)
  ├── assetManager.ts (기존, 아이템 풀 조회)
  └── types.ts (기존+확장)

mood/page.tsx
  ├── useAttendance (기존)
  ├── useRewards (기존)
  └── useDailyReward (신규)
```

### 에러 처리 전략

- 일일 보상 수령 실패 시: 기존 출석/무드 저장에 영향 없음 (독립 실행)
- Firestore 쓰기 실패 시: 에러 로그만 기록, 다음 접속 시 재시도 가능
- 아이템 풀 소진 시: 중복 허용하여 보상 지급 (사용자 경험 우선)

## 리스크 및 대응

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| allClaimedItems 배열 무한 증가 | Firestore 문서 크기 증가 | 176개 아이템이 상한이므로 약 10KB 수준으로 안전. 모니터링 필요 |
| 동시 접속 시 race condition | 같은 아이템 중복 선택 가능 | 클라이언트 전용 앱이므로 단일 사용자 동시 접속 확률 낮음. 중복 발생 시에도 UX 영향 미미 |
| 보너스 에셋 미준비 | 주기 완주 보너스 렌더링 실패 | 에셋 없으면 기본 아이콘으로 대체, 에셋 준비를 Optional Goal로 분리 |
| 기존 useRewards 수정 시 회귀 버그 | 마일스톤 보상 오작동 | useRewards는 수정하지 않고, 별도 useDailyReward 훅으로 완전 분리 |
