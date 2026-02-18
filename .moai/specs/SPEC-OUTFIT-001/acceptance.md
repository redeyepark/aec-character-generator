# SPEC-OUTFIT-001: 인수 기준

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-OUTFIT-001 |
| 제목 | SVG Outfit Color Customization |
| 생성일 | 2026-02-18 |

---

## 인수 기준 체크리스트

### SVG 의상 렌더링 (REQ-OUTFIT-01 ~ REQ-OUTFIT-05)

- [ ] SVG 의상 파일 18종이 `public/assets/body-svg/`에 존재한다
- [ ] `assetIndex.json`에 `body-svg` 키가 추가되어 파일 목록이 나열된다
- [ ] SVG 파일의 `fill="#919191"` 영역이 선택된 메인 색상으로 정확히 치환된다
- [ ] SVG 파일의 `fill="#C6C6C6"` 영역이 선택된 서브 색상으로 정확히 치환된다
- [ ] SVG 파일의 `fill="#FFFFFF"` / `fill="white"` 영역이 사용자 피부톤 색상으로 치환된다
- [ ] SVG 파일의 `fill="#000000"` 영역(디테일/윤곽)은 치환 영향을 받지 않는다
- [ ] 치환된 SVG가 Canvas에 정상 렌더링된다 (깨짐/누락 없음)
- [ ] body SVG의 피부 영역 색상과 face SVG의 피부톤 색상이 동일하다
- [ ] 기존 PNG 의상도 정상적으로 선택/렌더링된다 (하위 호환)

### 의상 색상 선택 UI (REQ-UI-01 ~ REQ-UI-04)

- [ ] SVG 의상 선택 시 메인/서브 색상 선택기(OutfitColorPicker)가 표시된다
- [ ] PNG 의상 선택 시 색상 선택기가 표시되지 않는다
- [ ] 메인 또는 서브 색상 변경 시 미리보기가 즉시 업데이트된다
- [ ] 색상 선택기에 16개 프리셋 색상이 표시된다
- [ ] 선택된 색상에 시각적 피드백(테두리/체크)이 표시된다
- [ ] 모바일 화면에서 색상 선택기가 정상 레이아웃으로 표시된다
- [ ] `role="radiogroup"` 및 `aria-label` 접근성 속성이 적용되어 있다

### 데이터 저장 (REQ-DATA-01 ~ REQ-DATA-03)

- [ ] 무드 다이어리 저장 시 Firestore `mood_entries`에 `outfitMainColor`, `outfitSubColor` 필드가 포함된다
- [ ] 무드 다이어리 로드 시 저장된 의상 색상 값이 정상적으로 읽힌다
- [ ] 의상 색상 필드가 없는 기존 무드 데이터 로드 시 기본값 적용
- [ ] `FirestoreMoodEntry` 타입에 의상 색상 필드가 정의되어 있다

### 호환성 (REQ-COMPAT-01 ~ REQ-COMPAT-02)

- [ ] 기존 PNG 의상(body 레이어)이 정상 동작한다
- [ ] SVG body와 PNG 레이어(bodyItem, expression, mustache, hair, glasses, handItem)의 혼합 합성이 정상이다
- [ ] `next build` 정적 내보내기가 성공한다
- [ ] Cloudflare Pages 배포 환경에서 정상 동작한다

---

## 테스트 시나리오

### TC-01: SVG 의상 메인 색상 교체

**Given** 사용자가 무드 선택 페이지에서 SVG 의상 "T shirt 0.svg"를 선택했을 때
**When** 메인 색상으로 "빨강" (#E74C3C)을 선택하면
**Then** 미리보기 Canvas에서 티셔츠의 주요 영역(몸통)이 빨간색으로 표시되고, 서브 영역은 기본 회색(#C6C6C6)으로 유지된다

### TC-02: SVG 의상 서브 색상 교체

**Given** SVG 의상 "baseball jacket 0.svg"가 선택되고 메인 색상이 "네이비"(#2C3E50)인 상태에서
**When** 서브 색상으로 "노랑" (#F1C40F)을 선택하면
**Then** 야구 재킷의 소매/트림 영역이 노란색으로 표시되고, 몸통 영역은 네이비색으로 유지된다

### TC-03: 피부톤 동기화 (body SVG + face SVG)

**Given** 사용자가 캐릭터 생성 시 피부톤 "구릿빛"(Tan, #8D5524)을 선택한 상태에서
**When** 무드 선택에서 SVG 의상 "hood T shirt 0.svg"를 선택하면
**Then** 의상 SVG의 피부 노출 영역(#FFFFFF)이 #8D5524로 표시되고, 얼굴 SVG의 피부색도 동일한 #8D5524로 표시되어 피부색이 일치한다

### TC-04: PNG 의상 선택 시 색상 선택기 미표시

**Given** 사용자가 무드 선택 페이지에서 의상을 선택하는 중일 때
**When** PNG 의상(예: "casual_01.png")을 선택하면
**Then** 색상 선택기(OutfitColorPicker)가 표시되지 않고, 기존 PNG 의상이 그대로 Canvas에 렌더링된다

### TC-05: SVG 의상으로 전환 시 색상 선택기 표시

**Given** 사용자가 PNG 의상을 선택한 상태에서
**When** SVG 의상 탭/섹션에서 SVG 의상을 선택하면
**Then** 색상 선택기(OutfitColorPicker)가 나타나고, 기본 메인 색상(#919191)과 서브 색상(#C6C6C6)이 선택되어 있다

### TC-06: 의상 색상 실시간 미리보기

**Given** SVG 의상이 선택되고 메인 색상이 "빨강"인 상태에서
**When** 메인 색상을 "파랑" (#3498DB)으로 변경하면
**Then** 미리보기가 500ms 이내에 파란색 의상으로 업데이트된다

### TC-07: 무드 다이어리 저장 시 색상 포함

**Given** 사용자가 SVG 의상 "shirt tie 0.svg", 메인 색상 "네이비"(#2C3E50), 서브 색상 "하양"(#FFFFFF)을 선택한 상태에서
**When** 무드 다이어리를 저장하면
**Then** Firestore `mood_entries` 문서에 `outfitFile: "shirt tie 0.svg"`, `outfitMainColor: "#2C3E50"`, `outfitSubColor: "#FFFFFF"` 필드가 저장된다

### TC-08: 기존 무드 데이터 하위 호환

**Given** Firestore에 `outfitMainColor`, `outfitSubColor` 필드가 없는 기존 무드 엔트리가 있을 때
**When** 다이어리에서 해당 엔트리를 로드하면
**Then** PNG 의상인 경우 기존대로 렌더링되고, SVG 의상이었다면 기본 색상(메인: #919191, 서브: #C6C6C6)이 적용된다

### TC-09: SVG 의상 3색 동시 치환 정확성

**Given** "leather jacket 0.svg" 파일이 `fill="#919191"` (메인), `fill="#C6C6C6"` (서브), `fill="#FFFFFF"` (피부), `fill="#000000"` (디테일)로 구성되었을 때
**When** 메인 색상 `#8B4513`, 서브 색상 `#F39C12`, 피부색 `#C68642`를 적용하면
**Then** `fill="#919191"`만 `fill="#8B4513"`로, `fill="#C6C6C6"`만 `fill="#F39C12"`로, `fill="#FFFFFF"`/`fill="white"`만 `fill="#C68642"`로 치환되고, `fill="#000000"`은 변경되지 않는다

### TC-10: 모든 SVG 의상에 색상 적용

**Given** 18종의 SVG 의상 파일이 모두 있을 때
**When** 각 의상에 임의의 메인/서브 색상 조합을 적용하면
**Then** 18개 의상 모두 정상 렌더링되고, 시각적 깨짐이 없다

### TC-11: Canvas 레이어 합성 순서 (SVG body 포함)

**Given** body(SVG, 색상 적용), bodyItem(PNG), face(SVG, 피부톤 적용), expression(PNG), hair(PNG)이 모두 선택된 상태에서
**When** 캐릭터를 합성하면
**Then** 레이어가 body -> bodyItem -> face -> expression -> hair 순서로 Canvas에 렌더링된다

### TC-12: 의상 색상 선택기 접근성

**Given** OutfitColorPicker 컴포넌트가 렌더링되었을 때
**When** 스크린 리더로 접근하면
**Then** "메인 색상" 및 "서브 색상" 각각에 `role="radiogroup"` 그룹이 인식되고, 각 색상 버튼의 `aria-label`(예: "빨강", "파랑")이 읽힌다

### TC-13: SVG 텍스트 캐싱 동작

**Given** SVG 의상 파일 "T shirt 0.svg"가 처음 로드될 때
**When** fetch로 SVG 텍스트를 가져온 후, 색상을 변경하여 다시 렌더링하면
**Then** SVG 텍스트는 캐시에서 즉시 반환되고 (네트워크 요청 없음), 색상 치환만 재수행된다

### TC-14: 다이어리 카드에서 저장된 색상 렌더링

**Given** Firestore에 `outfitFile: "puffer vest 0.svg"`, `outfitMainColor: "#27AE60"`, `outfitSubColor: "#1ABC9C"`가 저장된 무드 엔트리가 있을 때
**When** 다이어리 달력에서 해당 날짜의 카드를 표시하면
**Then** 패딩 조끼가 초록(메인)/청록(서브) 색상 조합으로 렌더링된다

---

## 엣지 케이스 테스트

### EC-01: 메인과 서브 색상이 동일

**Given** 사용자가 메인 색상과 서브 색상을 모두 "빨강" (#E74C3C)으로 선택했을 때
**When** SVG 의상을 렌더링하면
**Then** 의상 전체가 단색 빨강으로 표시되며, 렌더링 에러는 발생하지 않는다

### EC-02: 메인 색상을 흰색으로 선택

**Given** 사용자가 메인 색상으로 "하양" (#FFFFFF)을 선택했을 때
**When** SVG 의상을 렌더링하면
**Then** 메인 영역이 흰색으로 표시되고, 피부 영역은 사용자 피부톤으로 정상 표시된다 (교체 순서에 의해 충돌하지 않음)

### EC-03: 피부톤이 없는 기존 캐릭터

**Given** SPEC-SKIN-001 이전에 생성된 캐릭터(skinTone 필드 없음)로 SVG 의상을 선택했을 때
**When** 의상을 렌더링하면
**Then** 피부 영역에 기본 피부톤 Medium (#E0A96D)이 적용된다

### EC-04: 빈 SVG 파일 또는 로드 실패

**Given** SVG 의상 파일이 비어있거나 네트워크 오류로 로드 실패한 경우
**When** 해당 의상을 렌더링하려고 하면
**Then** 에러가 적절히 처리되고, 앱이 크래시되지 않으며, 사용자에게 로드 실패 피드백을 제공한다

---

## 성능 기준

| 항목 | 기준값 |
|------|--------|
| SVG 의상 최초 로드 시간 | 200ms 이내 (단일 파일) |
| 색상 변경 후 미리보기 업데이트 | 500ms 이내 |
| SVG 텍스트 캐시 히트 후 로드 | 50ms 이내 |
| Canvas 합성 시간 (8레이어) | 300ms 이내 |
| 빌드 시간 증가 | 기존 대비 10% 이내 |

---

## Quality Gate 기준

| 항목 | 기준 |
|------|------|
| TypeScript 타입 에러 | 0건 (`npx tsc --noEmit`) |
| ESLint 에러 | 0건 (`npm run lint`) |
| 빌드 성공 | `next build` 정적 내보내기 에러 없음 |
| 하위 호환성 | 기존 PNG 의상 및 피부톤 기능 정상 동작 |
| 접근성 | WCAG 2.1 AA 기준 충족 (색상 선택기) |
| 브라우저 호환 | Chrome, Safari, Firefox, Edge 최신 버전 |

---

## Definition of Done

1. 모든 인수 기준 체크리스트 항목이 통과한다
2. 14개 테스트 시나리오 + 4개 엣지 케이스가 모두 정상 동작한다
3. `next build` 정적 내보내기가 에러 없이 성공한다
4. 타입 에러(`npx tsc --noEmit`)가 0건이다
5. ESLint 에러(`npm run lint`)가 0건이다
6. 모바일/데스크톱 브라우저에서 시각적 확인이 완료된다
7. 기존 PNG 의상 및 피부톤 기능과의 하위 호환성이 검증된다
8. body SVG 피부 영역과 face SVG 피부톤이 동일한 색상으로 표시된다
9. 다이어리에서 저장된 의상 색상이 정확히 복원된다
