# SPEC-FIREBASE-001: 인수 기준

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-FIREBASE-001 |
| 제목 | Supabase to Firebase Migration - 인수 기준 |
| 생성일 | 2026-02-15 |

---

## 1. Firebase 초기화 테스트 시나리오

### TC-INIT-01: Firebase 앱 정상 초기화

**Given** 모든 Firebase 환경변수가 `.env.local`에 올바르게 설정되어 있을 때
**When** 앱이 브라우저에서 로드되면
**Then** Firebase 앱이 단일 인스턴스로 초기화되고, `auth`와 `db` 객체가 유효해야 한다

검증 방법:
- 브라우저 콘솔에 Firebase 초기화 관련 오류가 없는지 확인
- `auth`와 `db` 객체가 `undefined`가 아닌지 확인

### TC-INIT-02: 환경변수 누락 시 안전한 처리

**Given** `NEXT_PUBLIC_FIREBASE_API_KEY` 환경변수가 누락되어 있을 때
**When** 앱이 로드되면
**Then** 콘솔에 한국어 오류 메시지가 출력되고, 앱이 크래시하지 않아야 한다

검증 방법:
- 환경변수 제거 후 앱 로드
- 콘솔 오류 메시지 확인
- 앱이 빈 화면이 아닌 오류 상태를 표시하는지 확인

### TC-INIT-03: 중복 초기화 방지

**Given** Firebase 앱이 이미 초기화된 상태일 때
**When** 코드에서 `firebase.ts`가 다시 import되면
**Then** 기존 앱 인스턴스를 재사용하고, 새 인스턴스를 생성하지 않아야 한다

검증 방법:
- `getApps().length`가 항상 1인지 확인

---

## 2. 인증 테스트 시나리오

### TC-AUTH-01: 이메일/비밀번호 회원가입 성공

**Given** 유효한 이메일과 6자 이상의 비밀번호가 입력된 상태에서
**When** 회원가입 버튼을 클릭하면
**Then** Firebase Auth에 사용자가 생성되고, Firestore `profiles` 컬렉션에 프로필 문서가 생성되어야 한다

검증 방법:
- Firebase 콘솔 Authentication 탭에서 사용자 확인
- Firebase 콘솔 Firestore `profiles` 컬렉션에서 문서 확인
- UI에 회원가입 성공 메시지 표시 확인

### TC-AUTH-02: 이메일/비밀번호 로그인 성공

**Given** 등록된 이메일과 올바른 비밀번호가 입력된 상태에서
**When** 로그인 버튼을 클릭하면
**Then** 인증 상태가 `user: User` 로 업데이트되고, 캐릭터 유무에 따라 `/mood/` 또는 `/create/`로 리다이렉트되어야 한다

검증 방법:
- 로그인 후 URL 확인
- `user` 상태가 null이 아닌지 확인
- `loading` 상태가 false인지 확인

### TC-AUTH-03: 잘못된 비밀번호로 로그인 실패

**Given** 등록된 이메일과 잘못된 비밀번호가 입력된 상태에서
**When** 로그인 버튼을 클릭하면
**Then** 한국어 오류 메시지가 표시되고, `user` 상태는 null을 유지해야 한다

검증 방법:
- 오류 메시지가 빨간 배경으로 표시되는지 확인
- 인증 상태가 변경되지 않았는지 확인

### TC-AUTH-04: 존재하지 않는 이메일로 로그인 실패

**Given** 미등록 이메일이 입력된 상태에서
**When** 로그인 버튼을 클릭하면
**Then** 적절한 오류 메시지가 표시되어야 한다

### TC-AUTH-05: 로그아웃

**Given** 사용자가 로그인된 상태에서
**When** 로그아웃을 수행하면
**Then** `user`가 null로, `hasCharacter`가 false로 초기화되어야 한다

검증 방법:
- 로그아웃 후 인증 폼 화면으로 돌아가는지 확인
- 브라우저 새로고침 후 로그인 상태가 유지되지 않는지 확인

### TC-AUTH-06: 인증 상태 실시간 추적

**Given** 앱이 로드된 상태에서
**When** `onAuthStateChanged` 콜백이 호출되면
**Then** `user`, `loading`, `hasCharacter` 상태가 즉시 업데이트되어야 한다

검증 방법:
- 브라우저 탭을 닫았다 열었을 때 로그인 상태가 유지되는지 확인
- 다른 탭에서 로그아웃 시 현재 탭에도 반영되는지 확인

### TC-AUTH-07: 초기 로드 시 로딩 상태

**Given** 앱이 처음 로드될 때
**When** Firebase Auth가 로컬 토큰을 확인하는 중이면
**Then** `loading`이 `true`이고, `onAuthStateChanged` 첫 콜백 후 `false`로 전환되어야 한다

검증 방법:
- 초기 로드 시 로딩 인디케이터가 표시되는지 확인
- 인증 확인 완료 후 적절한 화면이 표시되는지 확인

### TC-AUTH-08: 네트워크 오류 시 타임아웃

**Given** 네트워크 연결이 없는 상태에서
**When** 앱이 로드되면
**Then** 10초 후 로딩 상태가 종료되고, 한국어 오류 메시지가 표시되어야 한다

---

## 3. 캐릭터 CRUD 테스트 시나리오

### TC-CHAR-01: 캐릭터 조회 (존재하는 경우)

**Given** 현재 사용자가 캐릭터를 보유한 상태에서
**When** `fetchCharacter()`가 호출되면
**Then** Firestore에서 해당 사용자의 캐릭터 문서를 조회하여 `BaseCharacter` 타입으로 반환해야 한다

검증 방법:
- 반환된 객체에 `id`, `user_id`, `face`, `hair`, `created_at`, `updated_at` 필드가 존재하는지 확인
- `user_id`가 현재 사용자의 UID와 일치하는지 확인

### TC-CHAR-02: 캐릭터 조회 (존재하지 않는 경우)

**Given** 현재 사용자가 캐릭터를 보유하지 않은 상태에서
**When** `fetchCharacter()`가 호출되면
**Then** `null`을 반환하고, `hasCharacter`가 `false`로 설정되어야 한다

### TC-CHAR-03: 캐릭터 생성

**Given** 유효한 얼굴, 헤어, 수염(선택), 안경(선택) 데이터가 준비된 상태에서
**When** `createCharacter(data)`가 호출되면
**Then** Firestore `characters` 컬렉션에 문서가 생성되고, 생성된 캐릭터를 `BaseCharacter` 타입으로 반환해야 한다

검증 방법:
- Firebase 콘솔에서 `characters` 컬렉션에 문서가 생성되었는지 확인
- `createdAt`과 `updatedAt`이 서버 타임스탬프로 설정되었는지 확인
- `hasCharacter`가 `true`로 업데이트되었는지 확인

### TC-CHAR-04: 캐릭터 수정

**Given** 기존 캐릭터가 존재하는 상태에서
**When** `updateCharacter(id, newData)`가 호출되면
**Then** 해당 문서가 업데이트되고, `updatedAt`이 갱신된 캐릭터를 반환해야 한다

검증 방법:
- 수정된 필드 값이 반영되었는지 확인
- `updatedAt`이 이전 값보다 최신인지 확인

### TC-CHAR-05: 다른 사용자의 캐릭터 접근 차단

**Given** 사용자 A가 로그인한 상태에서
**When** 사용자 B의 캐릭터 문서 ID로 수정을 시도하면
**Then** Firestore 보안 규칙에 의해 요청이 거부되어야 한다

---

## 4. 무드 다이어리 CRUD 테스트 시나리오

### TC-MOOD-01: 오늘의 무드 항목 조회 (존재하는 경우)

**Given** 오늘 날짜의 무드 항목이 존재하는 상태에서
**When** `fetchTodayEntry()`가 호출되면
**Then** 해당 항목을 `MoodEntry` 타입으로 반환해야 한다

### TC-MOOD-02: 오늘의 무드 항목 조회 (존재하지 않는 경우)

**Given** 오늘 날짜의 무드 항목이 없는 상태에서
**When** `fetchTodayEntry()`가 호출되면
**Then** `null`을 반환해야 한다

### TC-MOOD-03: 월별 무드 항목 조회

**Given** 2026년 2월에 5개의 무드 항목이 존재하는 상태에서
**When** `fetchEntriesByMonth(2026, 2)`가 호출되면
**Then** 5개의 항목을 날짜 오름차순으로 정렬하여 배열로 반환해야 한다

검증 방법:
- 반환된 배열의 길이가 5인지 확인
- 배열이 날짜 오름차순으로 정렬되어 있는지 확인
- 모든 항목의 `date`가 2026-02-01 ~ 2026-02-28 범위인지 확인

### TC-MOOD-04: 무드 항목 신규 생성

**Given** 오늘 날짜의 무드 항목이 없는 상태에서
**When** `upsertEntry(data)`가 호출되면
**Then** Firestore `mood_entries` 컬렉션에 새 문서가 생성되고, `MoodEntry` 타입으로 반환해야 한다

검증 방법:
- Firebase 콘솔에서 새 문서가 생성되었는지 확인
- `createdAt`과 `updatedAt`이 서버 타임스탬프로 설정되었는지 확인

### TC-MOOD-05: 무드 항목 수정 (같은 날짜 항목 이미 존재)

**Given** 오늘 날짜의 무드 항목이 이미 존재하는 상태에서
**When** `upsertEntry(newData)`가 호출되면
**Then** 기존 문서가 업데이트되고(새 문서 생성 아님), `updatedAt`이 갱신되어야 한다

검증 방법:
- `mood_entries` 컬렉션에서 해당 날짜의 문서가 1개만 존재하는지 확인
- 문서 ID가 변경되지 않았는지 확인

### TC-MOOD-06: 빈 월 조회

**Given** 2024년 1월에 무드 항목이 없는 상태에서
**When** `fetchEntriesByMonth(2024, 1)`가 호출되면
**Then** 빈 배열 `[]`을 반환해야 한다

---

## 5. 보안 규칙 테스트 시나리오

### TC-SEC-01: 비인증 사용자 접근 차단

**Given** 로그인하지 않은 상태에서
**When** Firestore `characters` 컬렉션을 읽기 시도하면
**Then** 권한 오류가 발생해야 한다

### TC-SEC-02: 본인 데이터만 읽기 가능

**Given** 사용자 A가 로그인한 상태에서
**When** `userId == A.uid` 조건으로 `characters`를 쿼리하면
**Then** 사용자 A의 캐릭터만 반환되어야 한다

### TC-SEC-03: 타인 데이터 쓰기 차단

**Given** 사용자 A가 로그인한 상태에서
**When** `userId`를 사용자 B의 UID로 설정하여 `characters`에 문서 생성을 시도하면
**Then** Firestore 보안 규칙에 의해 거부되어야 한다

### TC-SEC-04: 삭제 작업 차단

**Given** 사용자가 로그인한 상태에서
**When** `characters` 또는 `mood_entries` 문서 삭제를 시도하면
**Then** 보안 규칙에 의해 거부되어야 한다 (삭제 기능은 현재 지원하지 않음)

---

## 6. 호환성 테스트 시나리오

### TC-COMPAT-01: 정적 빌드 성공

**Given** 모든 마이그레이션 코드가 적용된 상태에서
**When** `npm run build`를 실행하면
**Then** 오류 없이 `output: 'export'` 정적 빌드가 완료되어야 한다

검증 방법:
- 빌드 로그에 오류 또는 경고가 없는지 확인
- `out/` 디렉토리에 정적 파일이 정상 생성되었는지 확인

### TC-COMPAT-02: Cloudflare Pages 배포

**Given** 정적 빌드가 성공한 상태에서
**When** Cloudflare Pages에 배포하면
**Then** 모든 페이지가 정상 로드되고, Firebase 연결이 동작해야 한다

### TC-COMPAT-03: Supabase 코드 완전 제거 확인

**Given** 마이그레이션이 완료된 상태에서
**When** 코드베이스에서 `supabase` 키워드를 검색하면
**Then** 실행 코드에서 Supabase 관련 import나 호출이 없어야 한다 (SPEC 문서 제외)

검증 방법:
- `grep -r "supabase" src/` 실행 결과가 비어 있는지 확인
- `node_modules/@supabase` 디렉토리가 존재하지 않는지 확인

### TC-COMPAT-04: Firebase SDK modular import 확인

**Given** 모든 Firebase 관련 코드가 작성된 상태에서
**When** import 구문을 확인하면
**Then** 모든 Firebase import가 modular 방식(`firebase/auth`, `firebase/firestore`)을 사용해야 한다

검증 방법:
- `grep -r "firebase/compat" src/` 결과가 비어 있는지 확인

---

## 7. 품질 게이트 기준

### Definition of Done

- [ ] 모든 Firebase 환경변수가 설정되고 앱이 정상 초기화됨
- [ ] 회원가입/로그인/로그아웃이 Firebase Auth를 통해 정상 동작
- [ ] 캐릭터 생성/조회/수정이 Firestore를 통해 정상 동작
- [ ] 무드 항목 생성/조회(일별,월별)/수정이 Firestore를 통해 정상 동작
- [ ] Firestore 보안 규칙이 적용되어 데이터 격리가 동작
- [ ] `npm run build` 정적 내보내기 성공 (오류 0개)
- [ ] Supabase 관련 코드 및 패키지가 완전히 제거됨
- [ ] 기존 UI/UX 동작이 변경 없이 유지됨
- [ ] 한국어 오류 메시지가 정상 표시됨
- [ ] Firebase Admin SDK가 코드베이스에 포함되지 않음
