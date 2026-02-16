# SPEC-SKIN-001: 인수 기준

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-SKIN-001 |
| 제목 | SVG Face Skin Color Selection |
| 생성일 | 2026-02-16 |

---

## 인수 기준 체크리스트

### SVG 얼굴 렌더링 (REQ-SVG-01 ~ REQ-SVG-04)

- [ ] SVG 얼굴 파일 5종이 `public/assets/face-svg/`에 존재한다
- [ ] `assetIndex.json`에 `face-svg` 키가 추가되어 5종 파일이 나열된다
- [ ] SVG 파일의 `fill="white"` 영역이 선택된 피부색으로 정확히 치환된다
- [ ] `fill="black"` 영역(이목구비)은 치환 영향을 받지 않는다
- [ ] 치환된 SVG가 Canvas에 정상 렌더링된다 (깨짐/누락 없음)
- [ ] 8종 프리셋 피부색이 `SKIN_TONE_COLORS` 상수에 정의되어 있다
- [ ] Canvas 합성 시 레이어 순서 유지: body -> face(SVG) -> expression -> mustache -> hair -> glasses

### 데이터 저장 (REQ-SVG-05 ~ REQ-SVG-07)

- [ ] 캐릭터 저장 시 Firestore `characters` 컬렉션에 `skinTone` 필드가 포함된다
- [ ] 캐릭터 로드 시 저장된 `skinTone` 값이 정상적으로 읽힌다
- [ ] `skinTone` 필드가 없는 기존 캐릭터 데이터 로드 시 기본값 `"medium"` 적용
- [ ] `FirestoreCharacter` 타입에 `skinTone` 필드가 정의되어 있다

### UI (REQ-UI-01 ~ REQ-UI-02)

- [ ] 위자드 Step 1에 얼굴 선택과 피부색 선택이 함께 표시된다
- [ ] 피부색 변경 시 미리보기가 즉시(500ms 이내) 업데이트된다
- [ ] 피부색 선택기(SkinTonePicker)에 8개 색상 버튼이 표시된다
- [ ] 선택된 색상에 시각적 피드백(테두리 또는 체크)이 표시된다
- [ ] 모바일 화면에서 피부색 선택기가 정상 레이아웃으로 표시된다

### 호환성 (REQ-COMPAT-01)

- [ ] 기존 PNG 레이어(body, expression, mustache, hair, glasses)가 정상 동작한다
- [ ] SVG face와 PNG 레이어의 혼합 합성이 시각적으로 정상이다
- [ ] `next build` 정적 내보내기가 성공한다
- [ ] Cloudflare Pages 배포 환경에서 정상 동작한다

---

## 테스트 시나리오

### TC-01: 피부색 선택 및 미리보기

**Given** 사용자가 캐릭터 생성 위자드 Step 1에 있을 때
**When** 얼굴형(예: round)을 선택하고, 피부색(예: Warm)을 선택하면
**Then** 미리보기 Canvas에 Warm 색상(#C68642)이 적용된 round 얼굴이 표시된다

### TC-02: 피부색 실시간 변경

**Given** 얼굴형이 선택된 상태에서
**When** 피부색을 Fair에서 Dark로 변경하면
**Then** 미리보기가 500ms 이내에 Dark 색상(#4A2511)으로 업데이트된다

### TC-03: 기본 피부색 적용

**Given** 사용자가 캐릭터 생성 위자드에 처음 진입했을 때
**When** 아직 피부색을 선택하지 않은 상태라면
**Then** 기본 피부색 Medium(#E0A96D)이 적용되어 있다

### TC-04: 캐릭터 저장 시 피부색 포함

**Given** 사용자가 얼굴(round 0.svg), 헤어, 피부색(Tan)을 선택한 상태에서
**When** 캐릭터 저장을 완료하면
**Then** Firestore `characters` 문서에 `skinTone: "tan"` 필드가 저장된다

### TC-05: 기존 캐릭터 로드 시 피부색 적용

**Given** Firestore에 `skinTone: "brown"`이 저장된 캐릭터가 있을 때
**When** 무드 페이지에서 해당 캐릭터를 렌더링하면
**Then** 얼굴이 Brown 색상(#6B3A2A)으로 표시된다

### TC-06: skinTone 필드 미존재 하위 호환

**Given** Firestore에 `skinTone` 필드가 없는 기존 캐릭터가 있을 때
**When** 해당 캐릭터를 로드하면
**Then** 기본 피부색 Medium(#E0A96D)이 적용된다

### TC-07: SVG fill 치환 정확성

**Given** `round 0.svg` 파일이 `fill="white"` (피부)와 `fill="black"` (이목구비)로 구성되었을 때
**When** 피부색 `#C68642`를 적용하면
**Then** `fill="white"`만 `fill="#C68642"`로 치환되고, `fill="black"`은 변경되지 않는다

### TC-08: Canvas 레이어 합성 순서

**Given** body(PNG), face(SVG, 피부색 적용), expression(PNG), hair(PNG)이 모두 선택된 상태에서
**When** 캐릭터를 합성하면
**Then** 레이어가 body -> face -> expression -> hair 순서로 Canvas에 렌더링된다

### TC-09: 모든 얼굴형에 피부색 적용

**Given** 5종의 SVG 얼굴(heart, oval, round, round square jaw, square jaw)이 있을 때
**When** 각 얼굴에 8종 피부색을 각각 적용하면
**Then** 40가지 조합 모두 정상 렌더링된다 (총 40개 조합)

### TC-10: 피부색 선택기 접근성

**Given** 피부색 선택기(SkinTonePicker) 컴포넌트가 렌더링되었을 때
**When** 스크린 리더로 접근하면
**Then** `role="radiogroup"` 그룹이 인식되고, 각 색상 버튼의 `aria-label`(예: "밝은 살색")이 읽힌다

### TC-11: 위자드 플로우 정상 동작

**Given** 사용자가 Step 1에서 얼굴과 피부색을 선택한 후
**When** Step 2(헤어) -> Step 3(수염) -> Step 4(안경)를 거쳐 저장하면
**Then** 선택한 피부색이 최종 저장 데이터에 포함되며, 무드 페이지로 정상 리다이렉트된다

### TC-12: SVG 에셋 로딩 성능

**Given** SVG 얼굴 파일(~11KB)이 처음 로드될 때
**When** fetch로 SVG 텍스트를 가져오면
**Then** 두 번째 로드부터는 캐시에서 즉시 반환된다 (네트워크 요청 없음)

---

## Definition of Done

1. 모든 인수 기준 체크리스트 항목이 통과한다
2. 12개 테스트 시나리오가 모두 정상 동작한다
3. `next build` 정적 내보내기가 에러 없이 성공한다
4. 타입 에러(`npx tsc --noEmit`)가 0건이다
5. 모바일/데스크톱 브라우저에서 시각적 확인이 완료된다
6. 기존 캐릭터(skinTone 필드 없음)와의 하위 호환성이 검증된다
