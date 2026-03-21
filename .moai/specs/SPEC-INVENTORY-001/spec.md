---
id: SPEC-INVENTORY-001
version: "1.0.0"
status: Completed
created: 2026-02-18
updated: 2026-02-18
author: MoAI
priority: Medium
---

## HISTORY

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2026-02-18 | 초안 작성 |
| 1.1.0 | 2026-03-21 | 구현 완료, 상태 Completed로 변경 |

---

# SPEC-INVENTORY-001: 아이템 인벤토리 (옷장) 페이지

## 1. 개요

사용자가 보유한 장비 아이템(의상, 착용 소품, 손 아이템)을 시각적 그리드로 확인할 수 있는 독립 페이지를 제공한다. 보기 전용(Read-Only) 페이지로, 아이템 선택/착용은 기존 `/mood` 페이지에서 수행한다.

### 1.1 범위

- **포함**: 의상(body), 착용 소품(body_item), 손 아이템(hand_item) 표시
- **제외**: 표정(expression)은 인벤토리 대상에서 제외
- **제외**: 아이템 선택/착용 기능 (기존 mood 페이지 담당)

### 1.2 관련 SPEC

- SPEC-EVENT-001: 출석 체크 및 마일스톤 보상 시스템
- SPEC-EVENT-002: 일일 아이템 보상 이벤트 시스템
- SPEC-OUTFIT-001: SVG 의상 색상 커스터마이징

---

## 2. 환경 (Environment)

### 2.1 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 15.1.x | Static Export 모드 프레임워크 |
| React | 19.0.x | UI 라이브러리 |
| TypeScript | 5.x | 정적 타입 시스템 |
| Tailwind CSS | 4.0.x | 스타일링 |
| Firebase | 12.9.x | Firestore (데이터 읽기), Auth (인증) |

### 2.2 기존 인프라

- **Firestore 컬렉션**: `rewards/{userId}`, `event_rewards/{userId}` (읽기 전용)
- **에셋 인덱스**: `src/app/data/assetIndex.json` (body, body-item, hand-item, body-svg)
- **기존 훅**: `useRewards`, `useDailyReward`, `useAuth`
- **기존 유틸**: `assetManager.ts` (getBodyAssets, getBodyItemAssets, getHandItemAssets, getBodySvgAssets, getUnlockedBodyItemAssets, getUnlockedHandItemAssets, getAssetPath)

### 2.3 아이템 수량

| 카테고리 | 총 수량 | 해금 조건 |
|----------|---------|-----------|
| 의상 PNG (body) | 143종 (6 카테고리) | 항상 사용 가능 |
| 의상 SVG (body-svg) | 13종 | 항상 사용 가능 (색상 커스터마이징 가능) |
| 착용 소품 (body_item) | 60종 | 출석 스트릭 티어 + 일일 보상 |
| 손 아이템 (hand_item) | 116종 | 출석 스트릭 티어 + 일일 보상 |

---

## 3. 가정 (Assumptions)

- A1: 사용자는 이미 Firebase Authentication으로 로그인된 상태에서 인벤토리 페이지에 접근한다.
- A2: 의상(body 카테고리)은 보상 시스템과 무관하게 항상 전체 사용 가능하다.
- A3: 착용 소품과 손 아이템의 해금 상태는 기존 `rewards/{userId}` 및 `event_rewards/{userId}` Firestore 문서에서 조회한다.
- A4: 아이템 해금 로직은 두 경로를 합산하여 중복 제거한다: `[...new Set([...tierItems, ...dailyItems])]`
- A5: `getUnlockedBodyItemAssets(count)` / `getUnlockedHandItemAssets(count)`는 assetIndex.json의 알파벳순으로 앞에서 count개를 반환한다.
- A6: SVG 의상은 기본 색상(mainColor: #919191, subColor: #C6C6C6)으로 썸네일을 표시한다.
- A7: 새로운 Firestore 컬렉션이나 쓰기 작업은 필요하지 않다.
- A8: Static Export(output: 'export') 모드와 호환되어야 한다.

---

## 4. 요구사항 (Requirements)

### 4.1 유비쿼터스 요구사항 (Ubiquitous)

- **REQ-INV-U01**: 시스템은 **항상** 인증된 사용자에게만 인벤토리 페이지를 표시해야 한다.
- **REQ-INV-U02**: 시스템은 **항상** NavBar에 인벤토리 페이지 링크를 포함해야 한다.
- **REQ-INV-U03**: 시스템은 **항상** 반응형 레이아웃을 제공하여 모바일과 데스크톱에서 모두 정상 표시되어야 한다.
- **REQ-INV-U04**: 시스템은 **항상** 인벤토리 페이지를 보기 전용(Read-Only)으로 운영해야 한다. Firestore 쓰기 작업이 발생하지 않아야 한다.

### 4.2 이벤트 기반 요구사항 (Event-Driven)

- **REQ-INV-E01**: **WHEN** 사용자가 인벤토리 페이지에 접근하면 **THEN** 보유 아이템 목록을 Firestore에서 조회하여 표시해야 한다.
- **REQ-INV-E02**: **WHEN** 사용자가 탭(의상/착용 소품/손 아이템)을 전환하면 **THEN** 해당 카테고리의 아이템 그리드가 표시되어야 한다.
- **REQ-INV-E03**: **WHEN** 사용자가 의상 탭에서 하위 필터(casual, formal, sporty, outerwear, bowtie, SVG)를 선택하면 **THEN** 해당 하위 카테고리의 의상만 필터링되어 표시되어야 한다.
- **REQ-INV-E04**: **WHEN** 사용자가 정렬 옵션(이름순/획득순)을 변경하면 **THEN** 아이템 목록이 선택된 기준으로 재정렬되어야 한다.
- **REQ-INV-E05**: **WHEN** 페이지 로딩 중일 때 **THEN** 스켈레톤 UI 또는 로딩 인디케이터를 표시해야 한다.

### 4.3 상태 기반 요구사항 (State-Driven)

- **REQ-INV-S01**: **IF** 사용자가 미인증 상태라면 **THEN** 인벤토리 페이지 접근 시 로그인 페이지로 리다이렉트해야 한다.
- **REQ-INV-S02**: **IF** 의상(body) 탭이 활성화 상태라면 **THEN** 전체 143종 PNG + 13종 SVG 의상을 표시해야 한다.
- **REQ-INV-S03**: **IF** 착용 소품(body_item) 탭이 활성화 상태라면 **THEN** 해금된 아이템만 표시하고, 잠긴 아이템은 회색 처리(grayed out)로 표시해야 한다.
- **REQ-INV-S04**: **IF** 손 아이템(hand_item) 탭이 활성화 상태라면 **THEN** 해금된 아이템만 표시하고, 잠긴 아이템은 회색 처리(grayed out)로 표시해야 한다.
- **REQ-INV-S05**: **IF** 아이템의 획득 경로가 출석 보상이라면 **THEN** "출석 보상" 라벨을 표시해야 한다.
- **REQ-INV-S06**: **IF** 아이템의 획득 경로가 일일 보상이라면 **THEN** "일일 보상" 라벨을 표시해야 한다.
- **REQ-INV-S07**: **IF** 아이템이 기본 의상(body 카테고리)이라면 **THEN** "기본 의상" 라벨을 표시해야 한다.
- **REQ-INV-S08**: **IF** SVG 의상 아이템이라면 **THEN** 기본 색상(mainColor: #919191, subColor: #C6C6C6)으로 썸네일을 렌더링해야 한다.

### 4.4 금지 요구사항 (Unwanted)

- **REQ-INV-N01**: 시스템은 인벤토리 페이지에서 아이템 선택/착용 기능을 제공**하지 않아야 한다**.
- **REQ-INV-N02**: 시스템은 인벤토리 페이지에서 Firestore에 데이터를 쓰**지 않아야 한다**.
- **REQ-INV-N03**: 시스템은 새로운 Firestore 컬렉션을 생성**하지 않아야 한다**.

### 4.5 선택 요구사항 (Optional)

- **REQ-INV-O01**: **가능하면** 아이템 썸네일에 마우스 호버 시 아이템 이름을 툴팁으로 표시한다.
- **REQ-INV-O02**: **가능하면** 잠긴 아이템에 해금 조건(필요 스트릭 일수)을 표시한다.

---

## 5. 명세 (Specifications)

### 5.1 페이지 구조

```
/inventory
├── NavBar (기존 컴포넌트, "옷장" 링크 추가)
├── 페이지 헤더
│   ├── 제목: "내 옷장"
│   └── 보유 아이템 카운트: "보유 아이템: X/Y개"
├── 탭 네비게이션
│   ├── [의상] (기본 활성)
│   ├── [착용 소품]
│   └── [손 아이템]
├── 필터/정렬 바
│   ├── 하위 필터 (의상 탭에서만: casual, formal, sporty, outerwear, bowtie, SVG, 전체)
│   └── 정렬 옵션 (이름순 | 획득순)
└── 아이템 그리드
    └── 아이템 카드 (썸네일 + 이름 + 획득 경로 라벨)
```

### 5.2 데이터 흐름

```
페이지 로드
  │
  ├── useAuth() → 인증 확인
  ├── useRewards().fetchRewards() → rewards 데이터 로드
  ├── useDailyReward().fetchEventReward() → event_rewards 데이터 로드
  │
  ├── [의상 탭]
  │   ├── getBodyAssets(category) → PNG 의상 파일 목록
  │   └── getBodySvgAssets() → SVG 의상 파일 목록
  │
  ├── [착용 소품 탭]
  │   ├── getUnlockedItemCounts() → { bodyItemCount }
  │   ├── getUnlockedBodyItemAssets(bodyItemCount) → 스트릭 기반 해금 아이템
  │   ├── getDailyRewardItems("body_item") → 일일 보상 해금 아이템
  │   └── [...new Set([...tierItems, ...dailyItems])] → 최종 보유 목록
  │
  └── [손 아이템 탭]
      ├── getUnlockedItemCounts() → { handItemCount }
      ├── getUnlockedHandItemAssets(handItemCount) → 스트릭 기반 해금 아이템
      ├── getDailyRewardItems("hand_item") → 일일 보상 해금 아이템
      └── [...new Set([...tierItems, ...dailyItems])] → 최종 보유 목록
```

### 5.3 아이템 카드 UI

각 아이템 카드는 다음 정보를 표시한다:

| 요소 | 설명 |
|------|------|
| 썸네일 | 아이템 이미지 (48x48 또는 64x64px) |
| 이름 | 파일명에서 확장자 제거 후 표시 |
| 획득 경로 라벨 | "기본 의상" / "출석 보상" / "일일 보상" 배지 |
| 잠금 상태 | 해금되지 않은 아이템은 grayscale + 반투명 오버레이 |

### 5.4 정렬 로직

- **이름순**: 파일명 알파벳순 정렬 (기본값)
- **획득순**: 기본 의상 먼저, 그 다음 출석 보상, 마지막으로 일일 보상 순서

### 5.5 획득 경로 판별 로직

```typescript
// 의상(body) → 항상 "기본 의상"
// 착용 소품/손 아이템:
//   tierItems에만 포함 → "출석 보상"
//   dailyItems에만 포함 → "일일 보상"
//   양쪽 모두 포함 → "출석 보상" (우선 표시)
```

### 5.6 NavBar 수정사항

```typescript
// 기존 NAV_LINKS에 옷장 링크 추가
const NAV_LINKS = [
  { href: "/mood/", label: "오늘의 기분" },
  { href: "/inventory/", label: "옷장" },  // 신규 추가
  { href: "/diary/", label: "다이어리" },
  { href: "/settings/", label: "설정" },
] as const;
```

### 5.7 파일 구조

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/app/inventory/page.tsx` | NEW | 인벤토리 페이지 (메인 컴포넌트) |
| `src/app/components/InventoryGrid.tsx` | NEW | 아이템 그리드 컴포넌트 (재사용 가능) |
| `src/app/components/NavBar.tsx` | MODIFY | "옷장" 링크 추가 |

### 5.8 기술적 제약사항

- Static Export 모드 호환 필요 (`output: 'export'`)
- `"use client"` 디렉티브 필수 (Firestore 호출, useState, useCallback 사용)
- 이미지 최적화 비활성 상태 (`images: { unoptimized: true }`)
- `next/image` 컴포넌트 사용 시 `width`, `height` 명시 필요
- `trailingSlash: true` 설정에 따라 경로 끝에 `/` 필요 (`/inventory/`)

---

## 6. 추적성 (Traceability)

| 요구사항 ID | 구현 파일 | 테스트 시나리오 |
|------------|----------|----------------|
| REQ-INV-U01 | inventory/page.tsx | ACC-INV-01 |
| REQ-INV-U02 | NavBar.tsx | ACC-INV-02 |
| REQ-INV-U03 | inventory/page.tsx, InventoryGrid.tsx | ACC-INV-03 |
| REQ-INV-U04 | inventory/page.tsx | ACC-INV-04 |
| REQ-INV-E01 | inventory/page.tsx | ACC-INV-05 |
| REQ-INV-E02 | inventory/page.tsx | ACC-INV-06 |
| REQ-INV-E03 | InventoryGrid.tsx | ACC-INV-07 |
| REQ-INV-E04 | InventoryGrid.tsx | ACC-INV-08 |
| REQ-INV-E05 | inventory/page.tsx | ACC-INV-09 |
| REQ-INV-S01 | inventory/page.tsx | ACC-INV-10 |
| REQ-INV-S02 | inventory/page.tsx | ACC-INV-11 |
| REQ-INV-S03 | inventory/page.tsx | ACC-INV-12 |
| REQ-INV-S04 | inventory/page.tsx | ACC-INV-13 |
| REQ-INV-S05 | InventoryGrid.tsx | ACC-INV-14 |
| REQ-INV-S06 | InventoryGrid.tsx | ACC-INV-15 |
| REQ-INV-S07 | InventoryGrid.tsx | ACC-INV-16 |
| REQ-INV-S08 | InventoryGrid.tsx | ACC-INV-17 |
| REQ-INV-N01 | inventory/page.tsx | ACC-INV-18 |
| REQ-INV-N02 | inventory/page.tsx | ACC-INV-19 |
| REQ-INV-N03 | - | ACC-INV-20 |
