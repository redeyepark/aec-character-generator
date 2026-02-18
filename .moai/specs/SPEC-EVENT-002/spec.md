---
id: SPEC-EVENT-002
version: "1.0.0"
status: completed
created: "2026-02-18"
updated: "2026-02-18"
author: MoAI
priority: medium
related: SPEC-EVENT-001
---

# SPEC-EVENT-002: 일일 아이템 보상 이벤트

## 개요

기존 출석 체크 시스템(SPEC-EVENT-001)을 확장하여, 매일 출석 시 body_item 또는 hand_item 풀에서 랜덤 아이템 1개를 지급하는 이벤트 시스템을 추가한다. 고정 N일 주기(기본 14일)로 운영되며, 주기 내 모든 날을 채우면 추가 보너스 아이템을 지급한다. 기존 마일스톤 보상 시스템(3/7/14/30일 연속 출석)은 그대로 유지하며, 일일 보상 시스템이 독립적으로 병행 운영된다.

## 목표

1. 매일 출석할 때마다 즉각적인 보상(아이템 1개)을 제공하여 일일 참여 동기를 강화한다.
2. N일 주기를 완주하면 보너스를 지급하여 장기적인 참여를 유도한다.
3. 주기가 반복되므로, 연속 출석이 끊어져도 새 주기에서 다시 도전할 수 있다.
4. 기존 마일스톤 보상 시스템과 독립적으로 운영하여 이중 보상 구조를 형성한다.
5. Static Export 환경(클라이언트 전용)에서 완전히 동작하는 구조를 유지한다.

## 요구사항

### 모듈 1: 일일 아이템 보상 지급 (Event-Driven)

- REQ-EVENT-002-01: **WHEN** 사용자가 오늘의 무드를 저장하여 출석이 기록되면 **THEN** 시스템은 body_item 또는 hand_item 풀에서 랜덤 아이템 1개를 자동으로 지급해야 한다.
- REQ-EVENT-002-02: **WHEN** 사용자가 같은 날 무드를 여러 번 수정하면 **THEN** 시스템은 해당 날짜에 대한 일일 보상을 1회만 지급해야 한다 (멱등성 보장).
- REQ-EVENT-002-03: **WHEN** 일일 보상이 지급되면 **THEN** 시스템은 지급된 아이템의 유형(body_item/hand_item)과 파일명을 Firestore에 기록해야 한다.
- REQ-EVENT-002-04: 시스템은 **항상** 현재 주기 내에서 이미 지급된 아이템과 중복되지 않는 아이템을 선택해야 한다.
- REQ-EVENT-002-05: **IF** 해당 아이템 풀의 모든 아이템이 이미 지급된 상태이면 **THEN** 시스템은 다른 아이템 풀에서 선택하거나, 풀 전체가 소진되면 중복을 허용해야 한다.

### 모듈 2: 이벤트 주기 관리 (State-Driven)

- REQ-EVENT-002-06: 시스템은 **항상** 고정 N일 주기(기본값: 14일)로 이벤트를 운영해야 한다.
- REQ-EVENT-002-07: **WHEN** 사용자가 첫 출석을 기록하면 **THEN** 시스템은 새로운 이벤트 주기를 자동으로 시작해야 한다 (주기 시작일 = 첫 출석일).
- REQ-EVENT-002-08: **IF** 현재 주기의 모든 날이 채워지면 **THEN** 시스템은 주기 완주로 판정하고, 완주 횟수를 1 증가시켜야 한다.
- REQ-EVENT-002-09: **WHEN** 주기가 완주되고 보너스가 지급되면 **THEN** 시스템은 새로운 주기를 자동으로 시작해야 한다 (이전 주기의 일일 보상 기록은 초기화).
- REQ-EVENT-002-10: 시스템은 **항상** 주기 진행도를 `claimedDays.length / cycleLength` 비율로 추적해야 한다.
- REQ-EVENT-002-11: **IF** 사용자가 주기 중간에 출석을 하루 이상 건너뛰더라도 **THEN** 주기는 리셋되지 않으며, 남은 일수만 채우면 완주로 인정해야 한다 (연속 출석 불요).

### 모듈 3: 주기 완주 보너스 (Event-Driven)

- REQ-EVENT-002-12: **WHEN** 사용자가 주기의 마지막 날 보상을 수령하면 **THEN** 시스템은 주기 완주 보너스 아이템을 추가로 지급해야 한다.
- REQ-EVENT-002-13: 시스템은 **항상** 주기 완주 보너스로 다음을 지급해야 한다:
  - 14일 주기 완주: 특별 body_item 1개 + 특별 hand_item 2개 (전용 에셋)
- REQ-EVENT-002-14: **WHEN** 주기 완주 보너스가 지급되면 **THEN** 해당 보너스 아이템은 영구적으로 사용자의 컬렉션에 추가되어야 한다.
- REQ-EVENT-002-15: 시스템은 매 주기 완주 시 **항상** 동일한 보너스 아이템을 지급해야 한다 (1회 완주 후 재완주 시에는 보너스 중복 지급하지 않음).

### 모듈 4: 일일 보상 아이템 사용 (State-Driven)

- REQ-EVENT-002-16: **IF** 사용자가 일일 보상으로 아이템을 수령하면 **THEN** 해당 아이템은 즉시 캐릭터 커스터마이징에서 사용 가능해야 한다.
- REQ-EVENT-002-17: 시스템은 **항상** 일일 보상 아이템과 기존 티어 해금 아이템을 병합하여 사용 가능한 아이템 목록을 구성해야 한다.
- REQ-EVENT-002-18: **IF** 새 주기가 시작되어 일일 보상 기록이 초기화되더라도 **THEN** 이전 주기에서 수령한 아이템은 영구적으로 유지되어야 한다.

### 모듈 5: 일일 보상 현황 UI (State-Driven)

- REQ-EVENT-002-19: **IF** 사용자가 메인 페이지 또는 다이어리 페이지에 접속하면 **THEN** 시스템은 현재 주기의 진행 현황 카드를 표시해야 한다 (현재 일차/총 일수, 수령 아이템 목록).
- REQ-EVENT-002-20: **WHEN** 일일 보상이 지급되면 **THEN** 시스템은 토스트 메시지로 수령한 아이템 정보와 주기 진행 현황을 표시해야 한다.
- REQ-EVENT-002-21: 시스템은 **항상** 주기 완주까지 남은 일수와 완주 보너스 미리보기를 표시해야 한다.
- REQ-EVENT-002-22: **WHEN** 주기가 완주되면 **THEN** 시스템은 축하 메시지와 보너스 아이템 정보를 특별 토스트로 표시해야 한다.

### 모듈 6: 데이터 무결성 (Unwanted Behavior)

- REQ-EVENT-002-23: 시스템은 같은 날짜에 대한 일일 보상을 중복 지급**하지 않아야 한다**.
- REQ-EVENT-002-24: 시스템은 주기 완주 보너스를 같은 주기에서 중복 지급**하지 않아야 한다**.
- REQ-EVENT-002-25: 시스템은 Firestore 보안 규칙을 통해 다른 사용자의 이벤트 보상 데이터에 접근**하지 못하게 해야 한다**.
- REQ-EVENT-002-26: 시스템은 미래 날짜에 대한 일일 보상을 지급**하지 않아야 한다**.

## 기술 설계

### 신규 Firestore 컬렉션

#### `event_rewards/{userId}`

사용자별 이벤트 보상 진행 상태를 저장한다.

```typescript
interface FirestoreEventReward {
  userId: string;
  cycleLength: number;              // 주기 길이 (기본 14)
  cycleNumber: number;              // 현재 주기 번호 (1, 2, 3...)
  cycleStartDate: string;           // 현재 주기 시작일 (YYYY-MM-DD)
  dailyClaims: {
    dayNumber: number;              // 주기 내 일차 (1~cycleLength)
    claimedDate: string;            // 실제 수령 날짜 (YYYY-MM-DD)
    itemType: "body_item" | "hand_item";
    itemFile: string;               // 지급된 아이템 파일명
    claimedAt: Timestamp;
  }[];
  cycleCompleted: boolean;          // 현재 주기 완주 여부
  completionBonusClaimed: boolean;  // 완주 보너스 수령 여부
  completedCycles: number;          // 총 완주 횟수
  // 영구 보관: 모든 주기에서 수령한 아이템 파일명 (주기 초기화 시에도 유지)
  allClaimedItems: {
    itemType: "body_item" | "hand_item";
    itemFile: string;
  }[];
  updatedAt: Timestamp;
}
```

설계 근거:
- 사용자당 단일 문서로 읽기/쓰기 횟수를 최소화한다.
- `dailyClaims` 배열은 최대 cycleLength(14)개이므로 문서 크기 제한 내에서 충분하다.
- `allClaimedItems` 배열로 주기 초기화 후에도 수령 아이템을 영구적으로 추적한다.
- 주기가 반복되어도 단일 문서 내에서 상태를 관리하여 추가 컬렉션을 방지한다.

### Firestore 보안 규칙 추가

```
match /event_rewards/{userId} {
  allow read: if request.auth != null && userId == request.auth.uid;
  allow create: if request.auth != null && userId == request.auth.uid;
  allow update: if request.auth != null && userId == request.auth.uid;
  allow delete: if false;
}
```

### 주기 완주 보너스 아이템 설정

```typescript
/** 주기 완주 보너스 설정 */
interface CycleCompletionBonus {
  cycleLength: number;
  bonusItems: {
    itemType: "body_item" | "hand_item";
    itemFile: string;
  }[];
  label: string;
}

const CYCLE_COMPLETION_BONUS: CycleCompletionBonus = {
  cycleLength: 14,
  bonusItems: [
    { itemType: "body_item", itemFile: "event_bonus_body_01.png" },
    { itemType: "hand_item", itemFile: "event_bonus_hand_01.png" },
    { itemType: "hand_item", itemFile: "event_bonus_hand_02.png" },
  ],
  label: "14일 완주 보너스",
};
```

### 일일 보상 아이템 선택 알고리즘

```
함수 selectDailyRewardItem(allClaimedItems, currentCycleClaims):
  1. body_item 풀(60개)과 hand_item 풀(116개)을 합산한 전체 풀 구성
  2. 현재 주기에서 이미 지급된 아이템 파일명을 제외 목록으로 구성
  3. 전체 풀에서 제외 목록에 없는 아이템을 필터링
  4. IF 필터링된 풀이 비어있으면:
       전체 풀에서 무작위 선택 (중복 허용)
  5. ELSE:
       필터링된 풀에서 무작위 1개 선택
  6. 선택된 아이템의 type과 file을 반환
```

### 신규 파일

#### `src/app/lib/daily-reward-utils.ts`

순수 비즈니스 로직 (Firebase/React 의존성 없음, 테스트 가능):

```typescript
// 주요 함수:
export function isAlreadyClaimedToday(dailyClaims, today): boolean;
export function selectRandomItem(pool, excludeFiles): { itemType, itemFile };
export function isCycleComplete(dailyClaims, cycleLength): boolean;
export function getNextDayNumber(dailyClaims): number;
export function getCycleProgress(dailyClaims, cycleLength): { current, total, percentage };
export function buildAvailableItemPool(bodyItems, handItems, excludeFiles): ItemPoolEntry[];
export function getAllClaimedItemFiles(allClaimedItems, itemType): string[];
```

#### `src/app/hooks/useDailyReward.ts`

```typescript
interface UseDailyRewardReturn {
  loading: boolean;
  error: string | null;
  eventReward: EventRewardData | null;
  /** 일일 보상 수령 (출석 기록 후 호출) */
  claimDailyReward: () => Promise<DailyClaimResult | null>;
  /** 이벤트 보상 데이터 조회 */
  fetchEventReward: () => Promise<EventRewardData | null>;
  /** 일일 보상으로 수령한 아이템 파일 목록 (영구) */
  getDailyRewardItems: (itemType: "body_item" | "hand_item") => string[];
  /** 주기 진행 현황 */
  getCycleProgress: () => { current: number; total: number; percentage: number };
}
```

위치: `src/app/hooks/useDailyReward.ts`

#### `src/app/components/DailyRewardCard.tsx`

주기 진행 현황 카드:
- 현재 주기 번호, 진행도 (X/14일)
- 날짜별 수령 상태 그리드 (원형 아이콘)
- 오늘 수령한 아이템 미리보기
- 완주 보너스 미리보기
- 완주까지 남은 일수

위치: `src/app/components/DailyRewardCard.tsx`

### 기존 코드 수정 포인트

| 파일 | 수정 내용 |
|------|----------|
| `src/app/lib/types.ts` | `EventRewardData`, `DailyClaimResult`, `DailyRewardClaim`, `CycleCompletionBonus` 타입 추가 |
| `src/app/lib/firestore.types.ts` | `FirestoreEventReward` 인터페이스 추가 |
| `src/app/mood/page.tsx` | handleSave에서 출석 기록 후 `claimDailyReward()` 호출, 토스트에 일일 보상 정보 포함 |
| `src/app/components/AttendanceToast.tsx` | 일일 보상 아이템 정보 표시 영역 추가 |
| `src/app/lib/assetManager.ts` | `getDailyRewardBodyItems()`, `getDailyRewardHandItems()` 함수 추가 (일일 보상 아이템을 사용 가능 목록에 병합) |
| `src/app/page.tsx` 또는 `src/app/diary/page.tsx` | `DailyRewardCard` 컴포넌트 배치 |

### 아이템 통합 전략

캐릭터 커스터마이징 시 사용 가능한 아이템 목록은 다음 3개 소스를 병합한다:

```
사용 가능한 아이템 =
  (1) 스트릭 기반 티어 해금 아이템 (ITEM_UNLOCK_TIERS)
  + (2) 일일 보상 수령 아이템 (allClaimedItems)
  + (3) 주기 완주 보너스 아이템
```

병합 시 파일명 기준으로 중복을 제거한다.

## 제약사항

1. **Static Export 전용**: 모든 로직은 클라이언트 사이드에서 실행된다. Server Actions, API Routes 사용 불가.
2. **Firestore 의존**: 이벤트 보상 데이터 저장/조회는 Firestore SDK를 직접 사용한다.
3. **에셋 사전 준비 필요**: 주기 완주 보너스 아이템 이미지(`event_bonus_body_01.png`, `event_bonus_hand_01.png`, `event_bonus_hand_02.png`)는 구현 전에 `public/assets/` 하위에 배치되어야 한다.
4. **아이템 풀 크기 의존**: body_item 60개 + hand_item 116개 = 총 176개 풀에서 선택한다. 14일 주기 내 중복 방지가 가능하다.
5. **단일 문서 제한**: event_rewards 문서의 allClaimedItems 배열은 주기가 반복될수록 증가하므로, 장기적으로 문서 크기를 모니터링해야 한다 (176개 아이템 전체 수령 시 약 10KB 수준).
6. **주기 길이 변경**: 주기 길이(cycleLength)는 상수로 정의하며, 변경 시 진행 중인 주기에는 영향을 주지 않는다 (새 주기부터 적용).

## 범위 외

1. 관리자 설정을 통한 주기 길이 동적 변경
2. 일일 보상 아이템의 사전 확정 (매일 무작위 선택만 지원)
3. 보상 아이템 교환/거래 시스템
4. 주기별 보상 이력 조회 UI (과거 주기 상세)
5. 푸시 알림 (일일 보상 리마인더)
6. 주기 완주 보너스의 주기별 차등 지급 (2회차, 3회차 별도 보너스)
7. 오프라인 상태에서의 보상 수령

## 기존 시스템과의 관계

### SPEC-EVENT-001 (출석 체크 이벤트)과의 관계

| 구분 | SPEC-EVENT-001 | SPEC-EVENT-002 |
|------|---------------|---------------|
| 트리거 | 무드 저장 시 출석 기록 | 출석 기록 후 일일 보상 수령 |
| 보상 조건 | 연속 출석 마일스톤 (3/7/14/30일) | 매일 출석 + 주기 완주 |
| 보상 내용 | 표정/의상/의상세트 해금 | body_item/hand_item 개별 지급 |
| 보상 유형 | 영구 해금 (티어 기반) | 영구 소유 (개별 아이템) |
| 연속성 요구 | 연속 출석 필수 | 연속 출석 불요 (주기 내 총 일수) |
| 실행 순서 | 먼저 실행 | 출석 기록 이후 실행 |

두 시스템은 독립적으로 운영되며, 사용자는 매일 출석 시 마일스톤 보상과 일일 아이템 보상을 동시에 받을 수 있다.

## 추적성

- 선행 SPEC: SPEC-EVENT-001 (출석 체크 이벤트, 완료됨)
- 관련 SPEC: SPEC-UX-001 (무드 페이지 UX), SPEC-FIREBASE-001 (Firestore 패턴)
- 영향 페이지: `/mood`, `/diary`, `/` (메인)
- 신규 Hook: `useDailyReward`
- 신규 컴포넌트: `DailyRewardCard`
- 수정 Hook: 없음 (기존 Hook은 변경하지 않음)
- 수정 컴포넌트: `AttendanceToast` (일일 보상 정보 표시 추가)
