---
id: SPEC-EVENT-001
version: "1.0.0"
status: approved
created: "2026-02-17"
updated: "2026-02-17"
author: MoAI
priority: medium
---

# SPEC-EVENT-001: 출석 체크 이벤트

## 개요

사용자가 매일 기분을 기록(mood_entry 생성/수정)하면 자동으로 출석이 인정되는 월간 이벤트 시스템이다. 연속 출석 마일스톤(3일, 7일, 14일, 30일)에 도달하면 특별한 표정/의상 보상을 영구적으로 해금한다. 별도의 출석 버튼 없이 기존 무드 기록 플로우에 자연스럽게 통합된다.

## 목표

1. 사용자의 일일 무드 기록 습관을 형성하여 리텐션을 향상시킨다.
2. 연속 출석 보상을 통해 지속적인 참여 동기를 부여한다.
3. 기존 무드 기록 플로우를 변경하지 않고 출석을 자동 인식한다.
4. Static Export 환경(클라이언트 전용)에서 완전히 동작하는 구조를 설계한다.

## 요구사항

### 모듈 1: 출석 자동 인식 (Event-Driven)

- REQ-EVENT-001-01: **WHEN** 사용자가 오늘의 무드를 저장(upsertEntry 성공)하면 **THEN** 시스템은 해당 날짜를 출석으로 자동 기록해야 한다.
- REQ-EVENT-001-02: **WHEN** 사용자가 같은 날 무드를 여러 번 수정하면 **THEN** 시스템은 해당 날짜를 1회 출석으로만 처리해야 한다.
- REQ-EVENT-001-03: 시스템은 **항상** 사용자의 로컬 타임존(브라우저) 기준으로 날짜를 판별해야 한다.

### 모듈 2: 연속 출석 스트릭 계산 (State-Driven)

- REQ-EVENT-001-04: **IF** 사용자가 전날(D-1)에 출석 기록이 있고 오늘(D) 출석하면 **THEN** 연속 출석 일수(currentStreak)를 1 증가시켜야 한다.
- REQ-EVENT-001-05: **IF** 사용자가 전날(D-1)에 출석 기록이 없는 상태에서 오늘(D) 출석하면 **THEN** 연속 출석 일수를 1로 초기화해야 한다.
- REQ-EVENT-001-06: **IF** 새로운 달(매월 1일)이 시작되면 **THEN** 해당 월의 연속 출석 일수를 0으로 초기화해야 한다.
- REQ-EVENT-001-07: 시스템은 **항상** 월별 총 출석 일수(totalDays)와 최대 연속 출석 일수(maxStreak)를 추적해야 한다.

### 모듈 3: 보상 해금 (Event-Driven)

- REQ-EVENT-001-08: **WHEN** 연속 출석 일수가 마일스톤(3, 7, 14, 30)에 도달하면 **THEN** 시스템은 해당 마일스톤의 보상을 자동으로 해금해야 한다.
- REQ-EVENT-001-09: 시스템은 **항상** 한번 해금된 보상을 영구적으로 유지해야 한다 (월 초기화와 무관).
- REQ-EVENT-001-10: **WHEN** 보상이 해금되면 **THEN** 해금된 표정/의상은 기존 OutfitPicker 및 MoodExpressionPicker UI에 노출되어야 한다.

### 모듈 4: 출석 현황 UI (State-Driven)

- REQ-EVENT-001-11: **IF** 사용자가 다이어리 페이지에 접속하면 **THEN** 시스템은 현재 월의 출석 현황 카드(연속 출석 일수, 총 출석 일수, 다음 마일스톤까지 남은 일수)를 표시해야 한다.
- REQ-EVENT-001-12: **IF** 사용자가 무드 저장에 성공하면 **THEN** 시스템은 출석 인정 토스트 메시지와 현재 스트릭 정보를 표시해야 한다.
- REQ-EVENT-001-13: 시스템은 **항상** 마일스톤 진행도를 시각적 프로그레스 바로 표시해야 한다.

### 모듈 5: 데이터 무결성 (Unwanted Behavior)

- REQ-EVENT-001-14: 시스템은 미래 날짜에 대한 출석 기록을 **허용하지 않아야 한다**.
- REQ-EVENT-001-15: 시스템은 이전 달의 스트릭 데이터를 수정하거나 삭제**하지 않아야 한다** (이력 보존).
- REQ-EVENT-001-16: 시스템은 Firestore 보안 규칙을 통해 다른 사용자의 출석 데이터에 접근**하지 못하게 해야 한다**.

## 기술 설계

### 신규 Firestore 컬렉션

#### `attendance/{docId}`

사용자별 월간 출석 기록을 저장한다. docId 형식: `{userId}_{YYYY-MM}`

```typescript
interface FirestoreAttendance {
  userId: string;                // 사용자 UID
  yearMonth: string;             // "YYYY-MM" 형식
  attendedDates: string[];       // 출석한 날짜 배열 ["2026-02-01", "2026-02-02", ...]
  currentStreak: number;         // 현재 연속 출석 일수
  maxStreak: number;             // 이번 달 최대 연속 출석 일수
  totalDays: number;             // 이번 달 총 출석 일수
  updatedAt: Timestamp;          // 마지막 업데이트
}
```

설계 근거: 월별로 단일 문서에 출석 데이터를 집약하여 읽기/쓰기 횟수를 최소화한다. 배열(attendedDates) 기반으로 중복 출석을 클라이언트에서 방지할 수 있다.

#### `rewards/{userId}`

사용자별 영구 보상 해금 기록을 저장한다.

```typescript
interface FirestoreReward {
  userId: string;
  unlockedRewards: {
    milestone: number;           // 3, 7, 14, 30
    rewardType: "expression" | "outfit" | "outfit_set";
    rewardFiles: string[];       // 해금된 파일명 배열
    unlockedAt: Timestamp;       // 해금 시점
    unlockedMonth: string;       // 해금된 월 "YYYY-MM"
  }[];
  updatedAt: Timestamp;
}
```

설계 근거: 보상은 월 초기화와 무관하게 영구 유지되므로 별도 컬렉션으로 분리한다. 단일 문서(userId 기준)에 모든 보상을 배열로 저장하여 읽기 비용을 최소화한다.

### Firestore 보안 규칙 추가

```
match /attendance/{docId} {
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow update: if request.auth != null && resource.data.userId == request.auth.uid;
  allow delete: if false;
}

match /rewards/{userId} {
  allow read: if request.auth != null && userId == request.auth.uid;
  allow write: if request.auth != null && userId == request.auth.uid;
  allow delete: if false;
}
```

### 신규 Hook

#### `useAttendance()`

```typescript
interface UseAttendanceReturn {
  loading: boolean;
  error: string | null;
  attendance: AttendanceData | null;     // 현재 월 출석 현황
  recordAttendance: () => Promise<void>; // 출석 기록 (upsertEntry 성공 후 호출)
  fetchAttendance: (yearMonth: string) => Promise<AttendanceData | null>;
}
```

위치: `src/app/hooks/useAttendance.ts`

#### `useRewards()`

```typescript
interface UseRewardsReturn {
  loading: boolean;
  error: string | null;
  rewards: RewardData | null;            // 해금된 보상 목록
  checkAndUnlockReward: (streak: number) => Promise<UnlockedReward | null>;
  getUnlockedFiles: (type: "expression" | "outfit") => string[];
}
```

위치: `src/app/hooks/useRewards.ts`

### 신규 컴포넌트

| 컴포넌트 | 위치 | 설명 |
|---------|------|------|
| `AttendanceCard` | `src/app/components/AttendanceCard.tsx` | 출석 현황 카드 (스트릭, 총 출석, 프로그레스 바) |
| `AttendanceToast` | `src/app/components/AttendanceToast.tsx` | 출석 인정 토스트 메시지 |
| `MilestoneProgress` | `src/app/components/MilestoneProgress.tsx` | 마일스톤 진행도 표시 (3/7/14/30일) |
| `RewardBadge` | `src/app/components/RewardBadge.tsx` | 해금된 보상 배지 표시 |

### 기존 코드 수정 포인트

| 파일 | 수정 내용 |
|------|----------|
| `src/app/mood/page.tsx` | handleSave 성공 후 `recordAttendance()` 호출 추가, `AttendanceToast` 표시 |
| `src/app/diary/page.tsx` | `AttendanceCard` 컴포넌트 추가 (월별 통계 섹션 대체/보강) |
| `src/app/lib/types.ts` | `AttendanceData`, `RewardData`, `UnlockedReward` 타입 추가 |
| `src/app/lib/firestore.types.ts` | `FirestoreAttendance`, `FirestoreReward` 인터페이스 추가 |
| `src/app/components/OutfitPicker.tsx` | 보상 의상 목록 통합 표시 |
| `src/app/components/MoodExpressionPicker.tsx` | 보상 표정 목록 통합 표시 |

### 스트릭 계산 알고리즘

```
함수 calculateStreak(attendedDates, today):
  1. attendedDates를 날짜 내림차순 정렬
  2. today가 attendedDates에 이미 존재하면 -> 중복 출석, 기존 스트릭 유지
  3. yesterday = today - 1일
  4. IF yesterday가 attendedDates에 존재:
       streak = 기존 currentStreak + 1
  5. ELSE:
       streak = 1
  6. attendedDates에 today 추가
  7. maxStreak = max(기존 maxStreak, streak)
  8. 반환: { currentStreak: streak, maxStreak, totalDays: attendedDates.length }
```

### 보상 매핑 테이블

| 마일스톤 | 보상 유형 | 보상 내용 | 비고 |
|---------|----------|----------|------|
| 3일 연속 | expression | 특별 표정 1개 | special_exp_streak3.png |
| 7일 연속 | outfit | 특별 의상 1개 | special_outfit_streak7.png |
| 14일 연속 | outfit + expression | 특별 의상 1개 + 특별 표정 1개 | special_outfit_streak14.png, special_exp_streak14.png |
| 30일 연속 | outfit_set | 프리미엄 의상 세트 3개 | premium_outfit_30_1/2/3.png |

## 제약사항

1. **Static Export 전용**: 모든 로직은 클라이언트 사이드에서 실행된다. Server Actions, API Routes 사용 불가.
2. **Firestore 의존**: 출석 데이터 저장/조회는 Firestore SDK를 직접 사용한다.
3. **타임존 의존**: 날짜 판별은 사용자 브라우저의 로컬 타임존을 기준으로 한다. 서버 사이드 검증은 불가능하다.
4. **에셋 사전 준비 필요**: 보상 표정/의상 이미지 파일은 구현 전에 `public/assets/` 하위에 배치되어야 한다.
5. **Firestore 문서 크기 제한**: attendance 문서의 attendedDates 배열은 최대 31개 항목(한 달 최대 일수)이므로 1MB 제한 내에서 충분하다.
6. **오프라인 미지원**: 오프라인 상태에서의 출석 기록은 이 SPEC 범위에서 지원하지 않는다.

## 범위 외

1. 과거 날짜에 대한 소급 출석 처리
2. 관리자 대시보드에서의 출석 통계 조회
3. 푸시 알림 연동 (출석 리마인더)
4. 연간 누적 출석 통계
5. 보상 커스터마이징 (관리자 설정)
6. 다른 사용자와의 출석 랭킹 비교
7. 오프라인 출석 기록 및 동기화

## 추적성

- 관련 SPEC: SPEC-UX-001 (무드 페이지 UX), SPEC-FIREBASE-001 (Firestore 패턴)
- 영향 페이지: `/mood`, `/diary`
- 영향 Hook: `useMoodEntries` (연동), `useAttendance` (신규), `useRewards` (신규)
