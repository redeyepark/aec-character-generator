---
id: SPEC-EVENT-001
type: plan
version: "1.0.0"
---

# SPEC-EVENT-001 구현 계획: 출석 체크 이벤트

## 구현 전략

기존 무드 기록 플로우(useMoodEntries + mood/page.tsx)를 변경하지 않고, 출석 기록 로직을 독립적인 Hook으로 분리하여 무드 저장 성공 후 연동하는 전략을 채택한다. Static Export 제약에 따라 모든 로직은 클라이언트 사이드에서 실행된다.

## 마일스톤

### Primary Goal: 데이터 레이어 구축

**목표**: Firestore 컬렉션 설계 및 핵심 Hook 구현

파일 변경 목록:

| 작업 | 파일 | 유형 |
|------|------|------|
| Firestore 타입 추가 | `src/app/lib/firestore.types.ts` | 수정 |
| 도메인 타입 추가 | `src/app/lib/types.ts` | 수정 |
| 출석 Hook 구현 | `src/app/hooks/useAttendance.ts` | 신규 |
| 보상 Hook 구현 | `src/app/hooks/useRewards.ts` | 신규 |
| Firestore 보안 규칙 | `firestore.rules` | 수정 |

핵심 구현 사항:

1. `FirestoreAttendance`, `FirestoreReward` 인터페이스를 `firestore.types.ts`에 추가
2. `AttendanceData`, `RewardData`, `UnlockedReward`, `MilestoneConfig` 도메인 타입을 `types.ts`에 추가
3. `useAttendance` Hook: 월별 출석 문서 CRUD, 스트릭 계산 로직 포함
4. `useRewards` Hook: 보상 해금 판정, 해금 파일 목록 반환
5. 보안 규칙에 attendance, rewards 컬렉션 접근 제어 추가

### Secondary Goal: 핵심 UI 컴포넌트 구현

**목표**: 출석 현황 표시 및 보상 해금 알림 UI

파일 변경 목록:

| 작업 | 파일 | 유형 |
|------|------|------|
| 출석 현황 카드 | `src/app/components/AttendanceCard.tsx` | 신규 |
| 마일스톤 프로그레스 | `src/app/components/MilestoneProgress.tsx` | 신규 |
| 출석 토스트 | `src/app/components/AttendanceToast.tsx` | 신규 |
| 보상 배지 | `src/app/components/RewardBadge.tsx` | 신규 |

핵심 구현 사항:

1. `AttendanceCard`: 현재 스트릭, 총 출석 일수, 다음 마일스톤까지 남은 일수 표시
2. `MilestoneProgress`: 4단계(3/7/14/30) 프로그레스 바, 달성 마일스톤 하이라이트
3. `AttendanceToast`: 무드 저장 성공 시 출석 인정 + 스트릭 정보 표시, 3초 후 자동 숨김
4. `RewardBadge`: 해금된 보상 아이템 시각적 표시 (잠금/해금 상태 아이콘)

### Tertiary Goal: 기존 코드 통합

**목표**: 무드 기록 플로우와 다이어리 페이지에 출석 시스템 통합

파일 변경 목록:

| 작업 | 파일 | 유형 |
|------|------|------|
| 무드 페이지 연동 | `src/app/mood/page.tsx` | 수정 |
| 다이어리 페이지 연동 | `src/app/diary/page.tsx` | 수정 |
| 의상 선택기 보상 통합 | `src/app/components/OutfitPicker.tsx` | 수정 |
| 표정 선택기 보상 통합 | `src/app/components/MoodExpressionPicker.tsx` | 수정 |

핵심 구현 사항:

1. `mood/page.tsx`: handleSave 성공 콜백에서 `recordAttendance()` 호출, `AttendanceToast` 렌더링
2. `diary/page.tsx`: 기존 "이번 달 기록" 통계 섹션을 `AttendanceCard`로 대체/보강
3. `OutfitPicker.tsx`: `useRewards`에서 해금된 의상 파일을 가져와 선택 목록에 추가
4. `MoodExpressionPicker.tsx`: `useRewards`에서 해금된 표정 파일을 가져와 선택 목록에 추가

### Optional Goal: 이력 및 에셋 관리

**목표**: 과거 월 출석 이력 조회 및 보상 에셋 준비

파일 변경 목록:

| 작업 | 파일 | 유형 |
|------|------|------|
| 보상 에셋 이미지 배치 | `public/assets/special/` | 신규 |
| 월별 이력 조회 UI | `src/app/diary/page.tsx` | 수정 |
| 에셋 인덱스 업데이트 | `public/assets/assetIndex.json` | 수정 |

핵심 구현 사항:

1. 보상 표정/의상 이미지 파일을 `public/assets/special/` 디렉토리에 배치
2. 다이어리 페이지에서 월 이동 시 해당 월의 출석 이력도 함께 표시
3. `assetIndex.json`에 special 카테고리 항목 추가

## 의존성 분석

```
useAttendance ──── Firestore (attendance 컬렉션)
      │
      ├── useMoodEntries.upsertEntry() 성공 후 호출
      │
      └── useRewards ──── Firestore (rewards 컬렉션)
            │
            ├── OutfitPicker (해금 의상 표시)
            └── MoodExpressionPicker (해금 표정 표시)
```

핵심 의존 관계:

1. `useAttendance`는 `useMoodEntries`의 upsertEntry 성공을 트리거로 동작한다.
2. `useRewards`는 `useAttendance`의 스트릭 값을 입력으로 보상 해금을 판정한다.
3. UI 컴포넌트는 두 Hook의 반환값에 의존한다.

## 위험 요소 및 대응

### 위험 1: 타임존 불일치

- **설명**: 사용자가 여행 중 타임존이 변경되면 출석 날짜 판별이 부정확해질 수 있다.
- **대응**: 브라우저 로컬 타임존을 일관되게 사용하며, 날짜 문자열(YYYY-MM-DD)을 기준으로 중복 체크한다. getTodayDateString() 유틸리티를 공유하여 일관성을 확보한다.

### 위험 2: Firestore 동시 쓰기 충돌

- **설명**: 사용자가 여러 탭/기기에서 동시에 무드를 저장하면 출석 데이터 경합이 발생할 수 있다.
- **대응**: attendedDates 배열에 `arrayUnion`을 사용하여 중복 없이 날짜를 추가한다. currentStreak 계산은 읽기 후 쓰기 패턴을 사용하되, 같은 날 중복 쓰기는 idempotent하게 처리한다.

### 위험 3: 월 경계 스트릭 초기화

- **설명**: 월이 바뀌는 자정에 사용자가 접속해 있으면 이전 달 스트릭으로 잘못 계산될 수 있다.
- **대응**: recordAttendance() 호출 시 현재 yearMonth를 실시간으로 계산하고, 기존 attendance 문서의 yearMonth와 비교하여 불일치하면 새 문서를 생성한다.

### 위험 4: 보상 에셋 미준비

- **설명**: 보상 표정/의상 이미지 파일이 없으면 해금 후 표시할 에셋이 없다.
- **대응**: 보상 파일 존재 여부를 런타임에 확인하고, 없으면 placeholder 이미지를 표시한다. Optional Goal에서 에셋 준비를 명시한다.

## 기술 제약 사항

### Static Export 제약

- Server Actions, API Routes 사용 불가
- 모든 데이터 조작은 Firestore Client SDK를 직접 사용
- SSR/ISR 미지원 - 모든 데이터는 클라이언트 사이드에서 fetch

### Firestore 쿼리 최적화

- attendance 문서는 `{userId}_{YYYY-MM}` 형식의 documentId로 직접 접근 (쿼리 불필요)
- rewards 문서는 `{userId}` documentId로 직접 접근
- 인덱스 추가 불필요 (documentId 기반 직접 접근)

### 성능 고려

- 무드 저장 시 추가 Firestore 읽기 1회 + 쓰기 1회 (attendance 문서)
- 보상 해금 시 추가 Firestore 읽기 1회 + 쓰기 1회 (rewards 문서)
- 다이어리 페이지 로드 시 추가 Firestore 읽기 1회 (attendance 문서)

## 파일 변경 요약

| 유형 | 파일 수 |
|------|---------|
| 신규 파일 | 6개 (Hook 2개 + 컴포넌트 4개) |
| 수정 파일 | 6개 (타입 2개 + 페이지 2개 + 선택기 2개) |
| 에셋 파일 | 8개 (보상 이미지, Optional Goal) |
| **총 변경** | **12개 코드 파일 + 에셋** |
