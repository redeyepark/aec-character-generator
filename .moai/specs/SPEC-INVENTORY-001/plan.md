---
id: SPEC-INVENTORY-001
version: "1.0.0"
status: Draft
created: 2026-02-18
updated: 2026-02-18
author: MoAI
priority: Medium
---

# SPEC-INVENTORY-001 구현 계획: 아이템 인벤토리 (옷장) 페이지

## 1. 구현 전략

### 1.1 접근 방식

기존 코드베이스의 패턴과 컴포넌트를 최대한 재활용하는 방향으로 구현한다. 특히 `RewardInventoryPanel.tsx`의 아이템 그리드 UI 패턴과 기존 훅(`useRewards`, `useDailyReward`)의 데이터 흐름을 참고하여 일관성 있는 구현을 목표로 한다.

### 1.2 핵심 원칙

- **Read-Only**: Firestore 쓰기 작업 없이 기존 데이터만 읽기
- **기존 훅 재사용**: 새로운 Firestore 쿼리 훅 불필요
- **기존 assetManager 활용**: 에셋 경로 및 파일 목록 함수 재사용
- **Static Export 호환**: SSR 기능 사용 금지, `"use client"` 디렉티브 필수

---

## 2. 마일스톤

### Primary Goal: 핵심 페이지 구조 및 데이터 연동

구현 파일:
- `src/app/inventory/page.tsx` (NEW)
- `src/app/components/InventoryGrid.tsx` (NEW)

구현 내용:
1. 인벤토리 페이지 기본 구조 생성
2. 인증 확인 및 미인증 시 리다이렉트
3. 3개 탭(의상/착용 소품/손 아이템) UI
4. 기존 훅으로 데이터 로드 (`useRewards`, `useDailyReward`)
5. 아이템 그리드 컴포넌트 구현 (썸네일 + 이름 표시)
6. 보유 아이템 카운트 표시 ("보유 아이템: X/Y개")
7. 로딩 상태 처리 (스켈레톤 UI)

완료 기준:
- 3개 탭 전환 가능
- 각 탭에서 해당 카테고리의 아이템이 정상 표시
- 의상 탭: 전체 156종 표시 (PNG 143 + SVG 13)
- 착용 소품/손 아이템 탭: 해금된 아이템과 잠긴 아이템 구분 표시

### Secondary Goal: 필터, 정렬, 획득 경로 표시

구현 내용:
1. 의상 탭 하위 필터 (casual, formal, sporty, outerwear, bowtie, SVG, 전체)
2. 정렬 옵션 (이름순/획득순)
3. 획득 경로 라벨 ("기본 의상" / "출석 보상" / "일일 보상")
4. 잠긴 아이템 grayscale + 반투명 오버레이 처리
5. SVG 의상 기본 색상 썸네일 렌더링

완료 기준:
- 의상 탭에서 카테고리별 필터링 정상 동작
- 정렬 전환 시 아이템 순서 변경 확인
- 획득 경로 라벨이 정확히 표시됨

### Final Goal: NavBar 통합 및 반응형 최적화

구현 파일:
- `src/app/components/NavBar.tsx` (MODIFY)

구현 내용:
1. NavBar에 "옷장" 링크 추가 (`/inventory/`)
2. 모바일 반응형 그리드 최적화 (3열 -> 4열 -> 5열)
3. 활성 탭/링크 하이라이트 스타일링
4. 접근성 속성 추가 (aria-label, role 등)

완료 기준:
- NavBar에서 "옷장" 링크 클릭 시 인벤토리 페이지 이동
- 모바일/태블릿/데스크톱에서 그리드 레이아웃 정상 표시
- 현재 페이지의 NavBar 링크가 활성 상태로 표시

### Optional Goal: 향상된 UX

구현 내용:
1. 아이템 호버 시 툴팁 표시
2. 잠긴 아이템에 해금 조건 표시 ("3일 연속 출석 필요" 등)
3. 아이템 카운트 애니메이션 효과
4. 빈 상태 UI (아이템이 하나도 없는 경우)

---

## 3. 기술적 접근

### 3.1 페이지 컴포넌트 설계

```
inventory/page.tsx (메인 컨테이너)
├── 인증 체크 (useAuth)
├── 데이터 로드 (useRewards, useDailyReward)
├── 탭 상태 관리 (useState)
├── 아이템 목록 계산 (useMemo)
│   ├── 의상: getBodyAssets + getBodySvgAssets
│   ├── 착용 소품: getUnlockedBodyItemAssets + getDailyRewardItems
│   └── 손 아이템: getUnlockedHandItemAssets + getDailyRewardItems
└── InventoryGrid (아이템 그리드 렌더링)
    ├── 필터 바 (하위 카테고리, 정렬)
    └── 아이템 카드 배열
```

### 3.2 InventoryGrid 컴포넌트 인터페이스

```typescript
interface InventoryGridProps {
  /** 표시할 아이템 목록 */
  items: InventoryItem[];
  /** 총 아이템 수 (해금 + 잠금 포함) */
  totalCount: number;
  /** 아이템 타입 */
  itemType: "body" | "body_item" | "hand_item";
  /** 하위 필터 옵션 (의상 탭에서만) */
  subFilters?: { id: string; label: string }[];
  /** 로딩 상태 */
  loading: boolean;
}

interface InventoryItem {
  /** 파일명 */
  filename: string;
  /** 에셋 경로 */
  assetPath: string;
  /** 해금 여부 */
  unlocked: boolean;
  /** 획득 경로 */
  source: "default" | "attendance" | "daily" | "locked";
  /** 카테고리 (의상용) */
  category?: string;
  /** SVG 여부 */
  isSvg?: boolean;
}
```

### 3.3 아이템 해금 상태 계산 로직

```typescript
// 착용 소품 해금 계산
const bodyItemData = useMemo(() => {
  const { bodyItemCount } = getUnlockedItemCounts();
  const tierItems = getUnlockedBodyItemAssets(bodyItemCount);
  const dailyItems = getDailyRewardItems("body_item");
  const unlockedSet = new Set([...tierItems, ...dailyItems]);

  const allItems = getBodyItemAssets(); // 전체 60종
  return allItems.map(filename => ({
    filename,
    unlocked: unlockedSet.has(filename),
    source: getItemSource(filename, tierItems, dailyItems),
  }));
}, [rewards, eventReward]);
```

### 3.4 획득 경로 판별 함수

```typescript
function getItemSource(
  filename: string,
  tierItems: string[],
  dailyItems: string[]
): "default" | "attendance" | "daily" | "locked" {
  const inTier = tierItems.includes(filename);
  const inDaily = dailyItems.includes(filename);

  if (inTier) return "attendance";   // 출석 보상 (우선)
  if (inDaily) return "daily";       // 일일 보상
  return "locked";                   // 잠김
}
```

---

## 4. 아키텍처 설계 방향

### 4.1 컴포넌트 계층

```
inventory/page.tsx
├── NavBar (기존)
├── PageHeader (제목, 카운트)
├── TabNav (의상/착용 소품/손 아이템)
└── InventoryGrid
    ├── FilterBar (하위 필터 + 정렬)
    └── ItemGrid
        └── ItemCard[] (썸네일 + 이름 + 라벨)
```

### 4.2 상태 관리

| 상태 | 타입 | 초기값 | 설명 |
|------|------|--------|------|
| activeTab | `"body" \| "body_item" \| "hand_item"` | `"body"` | 활성 탭 |
| subFilter | `string` | `"all"` | 의상 하위 필터 |
| sortBy | `"name" \| "source"` | `"name"` | 정렬 기준 |

- 모든 상태는 `useState`로 관리 (전역 상태 불필요)
- Firestore 데이터는 기존 훅의 로컬 캐시 사용

### 4.3 성능 최적화

- `useMemo`로 아이템 목록 재계산 최소화
- `next/image`의 `loading="lazy"` 속성으로 이미지 지연 로딩
- 탭별 컴포넌트 조건부 렌더링 (비활성 탭 DOM 미생성)

---

## 5. 위험 요소 및 대응

### 5.1 이미지 로딩 성능

- **위험**: 최대 156종 의상을 한 번에 렌더링 시 성능 저하 가능
- **대응**: `loading="lazy"` 속성 사용, 뷰포트 밖 이미지 지연 로딩
- **추가 대응**: 필요 시 가상 스크롤(Virtual Scroll) 도입 검토

### 5.2 Static Export 호환성

- **위험**: 서버 사이드 렌더링 기능 사용 시 빌드 실패
- **대응**: 모든 페이지에 `"use client"` 디렉티브 적용, `useEffect`로 클라이언트 사이드 데이터 로드

### 5.3 SVG 의상 썸네일 렌더링

- **위험**: SVG 파일은 `next/image`로 직접 렌더링 시 색상 커스터마이징 불가
- **대응**: SVG 의상은 기본 색상으로 `<img>` 또는 `next/image` 컴포넌트로 표시. 색상 커스터마이징은 인벤토리에서 제공하지 않음 (기존 mood 페이지 담당).

### 5.4 데이터 일관성

- **위험**: 인벤토리 페이지 방문 중 다른 탭에서 보상을 받으면 데이터 불일치 가능
- **대응**: 페이지 마운트 시 1회 데이터 로드. 실시간 동기화는 범위 외. 필요 시 페이지 새로고침으로 최신 데이터 반영.

---

## 6. 의존성

### 6.1 기존 코드 의존성

| 모듈 | 용도 | 수정 여부 |
|------|------|----------|
| `useAuth` | 인증 상태 확인 | 수정 없음 |
| `useRewards` | 마일스톤 보상 데이터 | 수정 없음 |
| `useDailyReward` | 일일 보상 데이터 | 수정 없음 |
| `assetManager.ts` | 에셋 파일 목록/경로 | 수정 없음 |
| `types.ts` | 도메인 타입, ITEM_UNLOCK_TIERS | 수정 없음 |
| `NavBar.tsx` | 네비게이션 바 | NAV_LINKS 배열에 1개 항목 추가 |

### 6.2 신규 코드

| 파일 | 설명 |
|------|------|
| `src/app/inventory/page.tsx` | 인벤토리 페이지 메인 컴포넌트 |
| `src/app/components/InventoryGrid.tsx` | 재사용 가능한 아이템 그리드 컴포넌트 |

---

## 7. 추적성 태그

- SPEC-INVENTORY-001
- SPEC-EVENT-001 (출석 보상 해금 데이터 의존)
- SPEC-EVENT-002 (일일 보상 해금 데이터 의존)
- SPEC-OUTFIT-001 (SVG 의상 색상 렌더링 참조)
