# SPEC-FIREBASE-001: 구현 계획

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-FIREBASE-001 |
| 제목 | Supabase to Firebase Migration - 구현 계획 |
| 생성일 | 2026-02-15 |

---

## 1. 마일스톤 개요

### Primary Goal (최우선 목표): Firebase 기반 인증 전환

대상 파일: `firebase.ts` (신규), `AuthContext.tsx`, `AuthForm.tsx`

작업 목록:
1. Firebase SDK 패키지 설치 (`firebase` v10+)
2. `src/app/lib/firebase.ts` 생성 - Firebase 앱 초기화
3. `src/app/lib/firestore.types.ts` 생성 - Firestore 문서 타입 정의
4. `src/app/contexts/AuthContext.tsx` 재작성 - Firebase Auth API 사용
5. `src/app/components/AuthForm.tsx` 수정 - 최소 변경 (signUp/signIn 호출부만)
6. `.env.local` 업데이트 - Firebase 환경변수 추가, Supabase 환경변수 제거
7. 인증 플로우 수동 테스트 (회원가입 -> 로그인 -> 로그아웃)

완료 기준:
- Firebase Auth를 통한 회원가입/로그인/로그아웃이 정상 동작
- `onAuthStateChanged` 리스너가 인증 상태를 올바르게 추적
- 초기 로드 시 로딩 -> 인증 상태 표시 전환이 자연스럽게 동작
- 에러 상태(잘못된 비밀번호, 네트워크 오류 등)가 한국어로 표시

### Secondary Goal (2차 목표): Firestore 데이터 CRUD 전환

대상 파일: `useCharacter.ts`, `useMoodEntries.ts`

작업 목록:
1. `src/app/hooks/useCharacter.ts` 재작성 - Firestore 쿼리 사용
2. `src/app/hooks/useMoodEntries.ts` 재작성 - Firestore 쿼리 사용
3. Firestore 복합 인덱스 생성 (Firebase 콘솔)
4. 캐릭터 CRUD 수동 테스트 (생성 -> 조회 -> 수정)
5. 무드 다이어리 CRUD 수동 테스트 (생성 -> 오늘 조회 -> 월별 조회 -> 수정)

완료 기준:
- 캐릭터 생성/조회/수정이 Firestore에서 정상 동작
- 무드 항목 생성/조회(일별, 월별)/수정이 정상 동작
- 데이터 격리가 올바르게 작동 (다른 사용자 데이터 접근 불가)

### Final Goal (최종 목표): 정리 및 보안 규칙 적용

대상 파일: `firestore.rules`, `package.json`, 삭제 파일

작업 목록:
1. `firestore.rules` 작성 및 Firebase 콘솔에 배포
2. `src/app/lib/supabase.ts` 삭제
3. `src/app/lib/database.types.ts` 삭제
4. `package.json`에서 `@supabase/supabase-js`, `pg` 제거
5. `npm install` 실행하여 lock 파일 정리
6. 전체 빌드 테스트 (`npm run build`)
7. Cloudflare Pages 배포 확인

완료 기준:
- Supabase 관련 코드가 코드베이스에서 완전히 제거
- `npm run build` (정적 내보내기)가 오류 없이 성공
- Firestore 보안 규칙이 적용되어 비인증 접근이 차단
- Cloudflare Pages에서 정상 배포 및 동작 확인

### Optional Goal (선택 목표): 최적화 및 개선

작업 목록:
1. Firebase SDK 번들 크기 분석 및 최적화
2. Firestore 오프라인 캐시 활성화 검토
3. Firebase Auth 이메일 인증 플로우 커스터마이징
4. 에러 메시지 국제화 개선

---

## 2. 기술적 접근 방식

### 2.1 마이그레이션 전략: Big Bang (일괄 전환)

이 프로젝트는 다음 이유로 점진적 마이그레이션이 아닌 일괄 전환 방식을 채택한다:

- 영향 파일이 5개로 제한적 (소규모 코드베이스)
- Supabase와 Firebase를 동시에 유지할 필요가 없음 (기존 데이터 마이그레이션 불필요)
- 인증과 데이터베이스가 밀접하게 결합되어 부분 전환이 복잡

### 2.2 의존성 관계

```
firebase.ts (신규)
  |
  +-- AuthContext.tsx (인증)
  |     |
  |     +-- useAuth.ts (변경 없음, 인터페이스 유지)
  |     |     |
  |     |     +-- AuthForm.tsx (최소 변경)
  |     |     +-- useCharacter.ts
  |     |     +-- useMoodEntries.ts
  |     |
  |     +-- checkHasCharacter --> Firestore 쿼리 사용
  |
  +-- useCharacter.ts (Firestore CRUD)
  |
  +-- useMoodEntries.ts (Firestore CRUD)
```

### 2.3 인터페이스 호환성 전략

**useAuth 훅은 변경하지 않는다.** `useAuth`는 `AuthContext`의 단순 래퍼이므로, `AuthContext`의 내부 구현만 Firebase로 교체하면 된다.

**AuthContextType 인터페이스 변경 최소화:**
- `session` 필드 제거 (Firebase는 Session 개념 없음)
- `user` 타입이 Supabase User에서 Firebase User로 변경
- 나머지 메서드 시그니처는 동일 유지

**영향도 분석:**
- `session` 필드를 직접 사용하는 컴포넌트가 있다면 수정 필요
- `user.id` 접근은 Firebase에서 `user.uid`로 변경되므로, `AuthContext` 내부에서만 처리

### 2.4 Firebase SDK Import 전략

Firebase SDK modular import를 사용하여 tree-shaking을 극대화한다:

```typescript
// 올바른 import (modular, tree-shakable)
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

// 잘못된 import (compat, tree-shaking 불가)
// import firebase from "firebase/compat/app";
```

### 2.5 Supabase -> Firestore 필드명 변환 규칙

| Supabase (snake_case) | Firestore (camelCase) |
|-----------------------|-----------------------|
| `user_id` | `userId` |
| `display_name` | `displayName` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| `character_id` | `characterId` |
| `mood_category` | `moodCategory` |
| `outfit_file` | `outfitFile` |
| `expression_file` | `expressionFile` |
| `composite_image_url` | `compositeImageUrl` |

기존 도메인 타입(`types.ts`)은 snake_case 필드명을 유지한다.
Firestore 문서 -> 도메인 타입 변환 시 camelCase -> snake_case 매핑을 수행하는 변환 함수를 작성한다.

---

## 3. 아키텍처 설계 방향

### 3.1 레이어 구조 (변경 전후 비교)

**변경 전 (Supabase):**

```
UI 컴포넌트 (AuthForm, 페이지)
     |
  Hooks (useAuth, useCharacter, useMoodEntries)
     |
  Context (AuthContext - Supabase Auth)
     |
  Client (supabase.ts - Supabase Client)
     |
  External (Supabase Cloud - PostgreSQL + Auth)
```

**변경 후 (Firebase):**

```
UI 컴포넌트 (AuthForm, 페이지) -- 변경 최소
     |
  Hooks (useAuth 변경 없음, useCharacter/useMoodEntries 재작성)
     |
  Context (AuthContext - Firebase Auth)
     |
  Client (firebase.ts - Firebase App + Auth + Firestore)
     |
  External (Firebase Cloud - Firestore + Authentication)
```

### 3.2 데이터 흐름

**인증 흐름 (Firebase):**

1. 앱 시작 -> `onAuthStateChanged` 리스너 등록
2. Firebase가 로컬 토큰 확인 -> 콜백 호출 (User 또는 null)
3. User가 있으면 -> Firestore에서 캐릭터 존재 여부 확인
4. 상태 업데이트: `user`, `loading`, `hasCharacter`

**CRUD 흐름 (Firestore):**

1. Hook에서 `user.uid` 획득 (AuthContext에서)
2. Firestore `query` + `where("userId", "==", uid)` 실행
3. `getDocs` 결과를 도메인 타입으로 변환
4. 상태 업데이트 및 반환

---

## 4. 리스크 및 대응 계획

### RISK-01: Firebase SDK 번들 크기 증가

- 가능성: Medium
- 영향: 초기 로드 시간 증가
- 대응: modular import 사용으로 tree-shaking 극대화, 빌드 후 번들 크기 비교 수행

### RISK-02: Firestore 쿼리 제한

- 가능성: Low
- 영향: 복잡한 쿼리가 불가능할 수 있음
- 대응: 현재 쿼리 패턴은 단순 equality + range 쿼리뿐이므로 Firestore에서 완전히 지원됨

### RISK-03: onAuthStateChanged 초기 호출 지연

- 가능성: Low
- 영향: 인증 상태 확인까지 빈 화면 표시
- 대응: 기존 10초 타임아웃 안전장치를 유지하고, Firebase의 `setPersistence`로 로컬 지속성 설정

### RISK-04: Cloudflare Pages와 Firebase SDK 호환성

- 가능성: Low
- 영향: 빌드 실패 또는 런타임 오류
- 대응: Firebase 클라이언트 SDK는 순수 JavaScript이므로 정적 호스팅에서 문제없이 동작. 빌드 테스트로 사전 확인

### RISK-05: user.id -> user.uid 프로퍼티 변경

- 가능성: High (반드시 발생)
- 영향: uid 참조 방식 차이로 인한 런타임 오류
- 대응: `AuthContext` 내부에서 통일, Hooks에서는 `user.uid` 직접 사용으로 변경

---

## 5. 구현 순서 상세

### Step 1: 기반 설정

1. `npm uninstall @supabase/supabase-js` (의존성 제거 먼저)
2. `npm install firebase` (Firebase SDK 설치)
3. `src/app/lib/firebase.ts` 생성
4. `src/app/lib/firestore.types.ts` 생성
5. `.env.local` 업데이트

### Step 2: 인증 전환

1. `src/app/contexts/AuthContext.tsx` 재작성
   - Supabase import 제거
   - Firebase Auth import 추가
   - `onAuthStateChanged` 기반 리스너 구현
   - `signUp`, `signIn`, `signOut` 함수 Firebase API로 교체
   - `checkHasCharacter`를 Firestore 쿼리로 변경
2. `src/app/components/AuthForm.tsx` 수정 (필요시)
   - AuthContext 인터페이스 변경에 따른 최소 수정

### Step 3: 데이터 CRUD 전환

1. `src/app/hooks/useCharacter.ts` 재작성
   - Firestore 쿼리 기반 CRUD 구현
   - Timestamp -> string 변환 로직 추가
2. `src/app/hooks/useMoodEntries.ts` 재작성
   - Firestore 쿼리 기반 CRUD 구현
   - 복합 쿼리 (userId + date range) 구현

### Step 4: 정리

1. `firestore.rules` 작성
2. `src/app/lib/supabase.ts` 삭제
3. `src/app/lib/database.types.ts` 삭제
4. `package.json`에서 `pg` devDependency 제거
5. `npm run build` 전체 빌드 테스트
6. 수동 E2E 테스트

---

## 6. 연관 SPEC

| SPEC ID | 관계 | 설명 |
|---------|------|------|
| SPEC-UPDATE-001 | 선행 | 현재 Supabase 기반 데이터 모델을 정의한 원본 SPEC |
| SPEC-UI-001 | 병렬 | UI 컴포넌트 - 인증 관련 UI는 최소 변경으로 영향 제한 |
