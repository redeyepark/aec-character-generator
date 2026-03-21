---
id: SPEC-INVENTORY-001
version: "1.0.0"
status: Draft
created: 2026-02-18
updated: 2026-02-18
author: MoAI
priority: Medium
---

# SPEC-INVENTORY-001 인수 테스트: 아이템 인벤토리 (옷장) 페이지

## 1. 인증 및 접근 제어

### ACC-INV-01: 인증된 사용자만 접근 가능 (REQ-INV-U01)

```gherkin
Scenario: 인증된 사용자의 인벤토리 페이지 접근
  Given 사용자가 Firebase Authentication으로 로그인되어 있다
  When 사용자가 /inventory/ 경로에 접근한다
  Then 인벤토리 페이지가 정상적으로 표시된다
  And 페이지 제목 "내 옷장"이 표시된다
```

### ACC-INV-10: 미인증 사용자 리다이렉트 (REQ-INV-S01)

```gherkin
Scenario: 미인증 사용자의 인벤토리 페이지 접근
  Given 사용자가 로그인되어 있지 않다
  When 사용자가 /inventory/ 경로에 접근한다
  Then 로그인 페이지(/login/)로 리다이렉트된다
```

---

## 2. NavBar 통합

### ACC-INV-02: NavBar에 옷장 링크 표시 (REQ-INV-U02)

```gherkin
Scenario: NavBar에 옷장 링크가 포함되어 있다
  Given 사용자가 로그인되어 있다
  When 아무 인증 페이지에서 NavBar를 확인한다
  Then "옷장" 링크가 "오늘의 기분"과 "다이어리" 사이에 표시된다
  And 해당 링크의 href가 "/inventory/"이다
```

```gherkin
Scenario: 인벤토리 페이지에서 NavBar 활성 상태 표시
  Given 사용자가 /inventory/ 페이지에 있다
  When NavBar를 확인한다
  Then "옷장" 링크가 활성(active) 스타일로 표시된다
```

---

## 3. 반응형 레이아웃

### ACC-INV-03: 모바일/데스크톱 반응형 표시 (REQ-INV-U03)

```gherkin
Scenario: 모바일 뷰포트에서 그리드 레이아웃
  Given 사용자가 모바일 디바이스(320px~767px)에서 인벤토리 페이지를 본다
  When 의상 탭이 활성화되어 있다
  Then 아이템 그리드가 3~4열로 표시된다
  And 탭 네비게이션이 가로 스크롤 없이 표시된다
```

```gherkin
Scenario: 데스크톱 뷰포트에서 그리드 레이아웃
  Given 사용자가 데스크톱(768px 이상)에서 인벤토리 페이지를 본다
  When 의상 탭이 활성화되어 있다
  Then 아이템 그리드가 5~6열로 표시된다
```

---

## 4. 읽기 전용 보장

### ACC-INV-04: Firestore 쓰기 작업 없음 (REQ-INV-U04)

```gherkin
Scenario: 인벤토리 페이지에서 Firestore 쓰기 미발생
  Given 사용자가 인벤토리 페이지에 접근한다
  When 모든 탭을 전환하고 필터를 변경한다
  Then Firestore에 setDoc, updateDoc, addDoc, deleteDoc 호출이 발생하지 않는다
  And 페이지의 모든 동작이 읽기 전용이다
```

### ACC-INV-18: 아이템 선택/착용 기능 미제공 (REQ-INV-N01)

```gherkin
Scenario: 인벤토리 페이지에 아이템 착용 버튼이 없다
  Given 사용자가 인벤토리 페이지에 있다
  When 아이템 카드를 확인한다
  Then "선택", "착용", "장착" 등의 액션 버튼이 존재하지 않는다
  And 아이템을 클릭해도 상태 변경이 발생하지 않는다
```

### ACC-INV-19: Firestore 쓰기 금지 확인 (REQ-INV-N02)

```gherkin
Scenario: inventory/page.tsx에 Firestore 쓰기 코드가 없다
  Given inventory/page.tsx 소스 코드를 검사한다
  When setDoc, updateDoc, addDoc, deleteDoc 함수 호출을 검색한다
  Then 해당 함수 호출이 존재하지 않는다
```

### ACC-INV-20: 신규 Firestore 컬렉션 미생성 (REQ-INV-N03)

```gherkin
Scenario: 인벤토리 기능이 새로운 Firestore 컬렉션을 사용하지 않는다
  Given SPEC-INVENTORY-001의 구현 코드를 검사한다
  When Firestore 컬렉션 참조를 확인한다
  Then "rewards"와 "event_rewards" 컬렉션만 참조된다
  And 새로운 컬렉션 이름은 사용되지 않는다
```

---

## 5. 데이터 로드 및 표시

### ACC-INV-05: 페이지 접근 시 보유 아이템 로드 (REQ-INV-E01)

```gherkin
Scenario: 인벤토리 페이지 진입 시 데이터 로드
  Given 사용자가 로그인되어 있다
  And rewards/{userId} 문서에 7일 스트릭 보상이 해금되어 있다
  And event_rewards/{userId}에 body_item 3개, hand_item 2개가 수령되어 있다
  When 사용자가 /inventory/ 페이지에 접근한다
  Then useRewards의 fetchRewards가 호출된다
  And useDailyReward의 fetchEventReward가 호출된다
  And 보유 아이템 카운트가 "보유 아이템: X/Y개" 형식으로 표시된다
```

### ACC-INV-09: 로딩 중 스켈레톤 UI 표시 (REQ-INV-E05)

```gherkin
Scenario: 데이터 로딩 중 스켈레톤 표시
  Given 사용자가 인벤토리 페이지에 접근한다
  When Firestore 데이터가 아직 로드되지 않았다
  Then 스켈레톤 UI 또는 로딩 인디케이터가 표시된다
  And 데이터 로드 완료 후 실제 아이템 그리드로 교체된다
```

---

## 6. 탭 전환

### ACC-INV-06: 탭 전환 시 해당 카테고리 표시 (REQ-INV-E02)

```gherkin
Scenario: 의상 탭 활성화
  Given 사용자가 인벤토리 페이지에 있다
  When "의상" 탭을 클릭한다
  Then 전체 의상 목록이 그리드로 표시된다 (PNG 143종 + SVG 13종)
  And 하위 필터 옵션이 표시된다 (전체, 캐주얼, 포멀, 스포티, 아우터, 보타이, SVG)
```

```gherkin
Scenario: 착용 소품 탭 활성화
  Given 사용자가 인벤토리 페이지에 있다
  And 7일 스트릭으로 bodyItemCount가 60이다
  And 일일 보상으로 body_item 3개를 추가로 보유한다
  When "착용 소품" 탭을 클릭한다
  Then 해금된 착용 소품이 정상 썸네일로 표시된다
  And 잠기지 않은 아이템 수가 정확히 표시된다 (중복 제거 후)
  And 잠긴 아이템은 grayscale 처리로 표시된다
```

```gherkin
Scenario: 손 아이템 탭 활성화
  Given 사용자가 인벤토리 페이지에 있다
  And 14일 스트릭으로 handItemCount가 86이다
  And 일일 보상으로 hand_item 5개를 추가로 보유한다
  When "손 아이템" 탭을 클릭한다
  Then 해금된 손 아이템이 정상 썸네일로 표시된다
  And 해금된 아이템 수가 정확히 표시된다 (중복 제거 후)
  And 잠긴 아이템은 grayscale 처리로 표시된다
```

---

## 7. 의상 하위 필터

### ACC-INV-07: 의상 카테고리별 필터링 (REQ-INV-E03)

```gherkin
Scenario: 캐주얼 의상만 필터링
  Given 사용자가 의상 탭에 있다
  When "캐주얼" 하위 필터를 선택한다
  Then 캐주얼 카테고리의 의상만 표시된다
  And 다른 카테고리의 의상은 숨겨진다
```

```gherkin
Scenario: SVG 의상만 필터링
  Given 사용자가 의상 탭에 있다
  When "SVG" 하위 필터를 선택한다
  Then SVG 의상 13종만 표시된다
  And PNG 의상은 숨겨진다
```

```gherkin
Scenario: 전체 의상 표시
  Given 사용자가 의상 탭에서 "캐주얼" 필터를 선택한 상태이다
  When "전체" 하위 필터를 선택한다
  Then 모든 카테고리의 의상이 표시된다 (PNG 143종 + SVG 13종)
```

---

## 8. 정렬

### ACC-INV-08: 정렬 옵션 변경 (REQ-INV-E04)

```gherkin
Scenario: 이름순 정렬 (기본)
  Given 사용자가 착용 소품 탭에 있다
  When 정렬 옵션이 "이름순"이다
  Then 아이템이 파일명 알파벳순으로 정렬되어 표시된다
```

```gherkin
Scenario: 획득순 정렬
  Given 사용자가 착용 소품 탭에 있다
  When 정렬 옵션을 "획득순"으로 변경한다
  Then 출석 보상 아이템이 먼저 표시된다
  And 그 다음 일일 보상 아이템이 표시된다
  And 마지막으로 잠긴 아이템이 표시된다
```

---

## 9. 의상 탭 상태

### ACC-INV-11: 전체 의상 표시 (REQ-INV-S02)

```gherkin
Scenario: 의상 탭에서 전체 의상 표시
  Given 사용자가 인벤토리 페이지에 있다
  When 의상 탭이 활성화되어 있다
  Then PNG 의상 143종이 표시된다
  And SVG 의상 13종이 표시된다
  And 잠금 상태 없이 모든 의상이 활성 상태로 표시된다
  And 각 의상에 "기본 의상" 라벨이 표시된다
```

---

## 10. 해금 상태 표시

### ACC-INV-12: 착용 소품 해금/잠금 구분 (REQ-INV-S03)

```gherkin
Scenario: 착용 소품의 해금/잠금 구분 표시
  Given 사용자의 bodyItemCount가 15이다 (3일 스트릭)
  And 일일 보상으로 body_item 2개를 추가로 보유한다
  When 착용 소품 탭을 확인한다
  Then 해금된 아이템(최대 17개, 중복 제거 후)은 정상 색상으로 표시된다
  And 해금되지 않은 아이템(나머지)은 grayscale + 반투명 오버레이로 표시된다
```

### ACC-INV-13: 손 아이템 해금/잠금 구분 (REQ-INV-S04)

```gherkin
Scenario: 손 아이템의 해금/잠금 구분 표시
  Given 사용자의 handItemCount가 30이다 (7일 스트릭)
  And 일일 보상으로 hand_item 4개를 추가로 보유한다
  When 손 아이템 탭을 확인한다
  Then 해금된 아이템(최대 34개, 중복 제거 후)은 정상 색상으로 표시된다
  And 해금되지 않은 아이템(나머지)은 grayscale + 반투명 오버레이로 표시된다
```

---

## 11. 획득 경로 라벨

### ACC-INV-14: 출석 보상 라벨 표시 (REQ-INV-S05)

```gherkin
Scenario: 출석 보상으로 해금된 아이템 라벨
  Given 사용자가 3일 스트릭으로 body_item 15개가 해금되었다
  When 착용 소품 탭에서 해금된 아이템을 확인한다
  Then 해당 아이템에 "출석 보상" 라벨이 표시된다
```

### ACC-INV-15: 일일 보상 라벨 표시 (REQ-INV-S06)

```gherkin
Scenario: 일일 보상으로 해금된 아이템 라벨
  Given 사용자가 일일 보상으로만 hand_item "coffee_cup.png"를 보유한다
  And 해당 아이템이 스트릭 기반 해금 범위에 포함되지 않는다
  When 손 아이템 탭에서 해당 아이템을 확인한다
  Then 해당 아이템에 "일일 보상" 라벨이 표시된다
```

### ACC-INV-16: 기본 의상 라벨 표시 (REQ-INV-S07)

```gherkin
Scenario: 기본 의상 라벨 표시
  Given 사용자가 의상 탭에 있다
  When 아이템 카드를 확인한다
  Then 모든 의상에 "기본 의상" 라벨이 표시된다
```

### ACC-INV-17: SVG 의상 기본 색상 렌더링 (REQ-INV-S08)

```gherkin
Scenario: SVG 의상 썸네일 기본 색상 표시
  Given 사용자가 의상 탭에서 SVG 필터를 선택한다
  When SVG 의상 썸네일을 확인한다
  Then SVG 의상이 기본 색상으로 표시된다
  And mainColor는 #919191, subColor는 #C6C6C6이 적용된다
```

---

## 12. 엣지 케이스

### ACC-INV-21: 보상 데이터가 없는 신규 사용자

```gherkin
Scenario: 보상 기록이 없는 사용자의 인벤토리
  Given 사용자가 처음 가입하여 rewards 문서가 없다
  And event_rewards 문서도 없다
  When 인벤토리 페이지에 접근한다
  Then 의상 탭: 전체 156종이 정상 표시된다
  And 착용 소품 탭: 전체 60종이 모두 잠긴 상태로 표시된다
  And 손 아이템 탭: 전체 116종이 모두 잠긴 상태로 표시된다
  And 보유 아이템 카운트: "보유 아이템: 156/332개" (의상만 해금)
```

### ACC-INV-22: 30일 스트릭 달성 사용자

```gherkin
Scenario: 모든 아이템이 해금된 사용자
  Given 사용자가 30일 스트릭을 달성했다 (bodyItemCount: 60, handItemCount: 116)
  When 인벤토리 페이지에 접근한다
  Then 착용 소품 탭: 전체 60종이 모두 해금 상태로 표시된다
  And 손 아이템 탭: 전체 116종이 모두 해금 상태로 표시된다
  And 잠긴 아이템이 없다
  And 보유 아이템 카운트: "보유 아이템: 332/332개"
```

### ACC-INV-23: 양쪽 경로 모두에서 해금된 아이템

```gherkin
Scenario: 출석 보상과 일일 보상 모두에서 해금된 아이템
  Given "accessory_01.png"가 스트릭 기반 해금(3일 티어)에 포함된다
  And "accessory_01.png"가 일일 보상으로도 수령되었다
  When 착용 소품 탭에서 해당 아이템을 확인한다
  Then 아이템이 1개만 표시된다 (중복 없음)
  And "출석 보상" 라벨이 표시된다 (출석 보상 우선)
```

---

## 13. Quality Gate (완료 기준)

### 기능 완료 기준

- [ ] 인벤토리 페이지(/inventory/)가 정상 접근 가능
- [ ] 3개 탭(의상/착용 소품/손 아이템) 전환 정상 동작
- [ ] 의상 탭: 하위 카테고리 필터링 정상 동작
- [ ] 정렬(이름순/획득순) 정상 동작
- [ ] 해금/잠금 아이템 시각적 구분 정상
- [ ] 획득 경로 라벨(기본 의상/출석 보상/일일 보상) 정상 표시
- [ ] NavBar에 "옷장" 링크 추가 및 활성 상태 표시
- [ ] 모바일/데스크톱 반응형 레이아웃 정상

### 기술 완료 기준

- [ ] `npm run build` 성공 (Static Export 호환)
- [ ] TypeScript 타입 에러 0건 (`npx tsc --noEmit`)
- [ ] ESLint 에러 0건 (`npm run lint`)
- [ ] Firestore 쓰기 코드가 inventory 관련 파일에 존재하지 않음
- [ ] `"use client"` 디렉티브 포함 확인
- [ ] 이미지 lazy loading 적용 확인

### Definition of Done

- 모든 기능 완료 기준 항목 충족
- 모든 기술 완료 기준 항목 충족
- 빌드 성공 및 Cloudflare Pages 배포 가능 상태
