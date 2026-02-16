# SPEC-FIREBASE-001: Supabase to Firebase 마이그레이션

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-FIREBASE-001 |
| 제목 | Supabase to Firebase Migration |
| 생성일 | 2026-02-15 |
| 상태 | Completed |
| 우선순위 | High |
| 라이프사이클 | spec-first |
| 담당 | expert-frontend, expert-backend |

---

## 1. Environment (환경)

### 1.1 현재 시스템 환경

| 항목 | 현재 값 |
|------|---------|
| 프레임워크 | Next.js 15, React 19, TypeScript 5 |
| CSS | Tailwind CSS 4 |
| 백엔드 | Supabase (PostgreSQL + Auth) |
| 배포 | Cloudflare Pages (static export, `output: 'export'`) |
| SDK | `@supabase/supabase-js ^2.95.3` |

### 1.2 마이그레이션 목표 환경

| 항목 | 목표 값 |
|------|---------|
| 인증 | Firebase Authentication (Email/Password) |
| 데이터베이스 | Cloud Firestore |
| SDK | Firebase JS SDK (modular v10+) |
| 배포 | Cloudflare Pages (static export 유지) |
| 서버 SDK | 사용하지 않음 (Firebase Admin SDK 금지) |

### 1.3 영향 범위

마이그레이션 대상 파일 (5개):

| 파일 경로 | 역할 | 변경 유형 |
|-----------|------|----------|
| `src/app/lib/supabase.ts` | Supabase 클라이언트 초기화 | 삭제 후 Firebase 초기화 파일로 교체 |
| `src/app/contexts/AuthContext.tsx` | 인증 상태 관리 (세션, 리스너) | Firebase Auth API로 전면 재작성 |
| `src/app/hooks/useCharacter.ts` | 캐릭터 CRUD (SELECT/INSERT/UPDATE) | Firestore API로 전면 재작성 |
| `src/app/hooks/useMoodEntries.ts` | 무드 다이어리 CRUD (SELECT/UPSERT) | Firestore API로 전면 재작성 |
| `src/app/components/AuthForm.tsx` | 로그인/회원가입 UI | 인증 함수 호출부만 변경 (최소 수정) |

추가 생성 파일:

| 파일 경로 | 역할 |
|-----------|------|
| `src/app/lib/firebase.ts` | Firebase 앱 초기화 및 서비스 인스턴스 내보내기 |
| `src/app/lib/firestore.types.ts` | Firestore 컬렉션/문서 타입 정의 |
| `firestore.rules` | Firestore 보안 규칙 (RLS 대체) |
| `.firebaserc` | Firebase 프로젝트 설정 |

삭제 파일:

| 파일 경로 | 사유 |
|-----------|------|
| `src/app/lib/supabase.ts` | Supabase 클라이언트 제거 |
| `src/app/lib/database.types.ts` | Supabase 전용 타입 제거 |

타입 파일 유지:

| 파일 경로 | 사유 |
|-----------|------|
| `src/app/lib/types.ts` | 도메인 타입 (BaseCharacter, MoodEntry 등)은 백엔드 무관, 유지 |

### 1.4 환경변수 변경

현재 환경변수 (삭제 대상):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

새 환경변수 (추가 대상):

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## 2. Assumptions (가정)

### 2.1 기술적 가정

- **A-TECH-01**: Firebase 프로젝트가 이미 생성되어 있고, Email/Password 인증이 활성화되어 있다.
- **A-TECH-02**: Firestore 데이터베이스가 프로덕션 모드로 생성되어 있다.
- **A-TECH-03**: Firebase JS SDK v10+(modular)은 `output: 'export'` 정적 빌드와 완전히 호환된다.
- **A-TECH-04**: Firestore 클라이언트 SDK만으로 모든 CRUD 연산을 수행할 수 있다 (Admin SDK 불필요).
- **A-TECH-05**: 기존 Supabase의 데이터(사용자 계정, 캐릭터, 무드 항목)는 마이그레이션하지 않는다 (신규 시작).

### 2.2 비즈니스 가정

- **A-BIZ-01**: UI/UX 동작은 현재와 동일하게 유지한다 (사용자가 차이를 느끼지 못해야 한다).
- **A-BIZ-02**: 이메일/비밀번호 인증만 지원하며, OAuth 등 추가 인증 방식은 이 SPEC 범위 밖이다.
- **A-BIZ-03**: 회원가입 시 이메일 인증(verification) 처리는 Firebase 기본 동작을 따른다.

### 2.3 리스크 가정

- **A-RISK-01**: Firebase SDK 번들 크기가 Supabase보다 클 수 있으나, tree-shaking으로 최소화할 수 있다.
- **A-RISK-02**: Firestore의 NoSQL 구조 특성상, 관계형 쿼리(JOIN)가 필요 없는 현재 스키마에 적합하다.
- **A-RISK-03**: Cloudflare Pages의 정적 호스팅에서 Firebase 클라이언트 SDK가 정상 동작한다.

---

## 3. Requirements (요구사항)

### 3.1 Firebase 초기화 요구사항

**REQ-INIT-01** [Ubiquitous]
시스템은 **항상** Firebase 앱을 단일 인스턴스로 초기화하고, Auth와 Firestore 서비스 객체를 내보내야 한다.

**REQ-INIT-02** [Event-Driven]
**WHEN** 환경변수가 누락되었을 때 **THEN** 콘솔에 명확한 오류 메시지를 출력하고, 앱이 크래시하지 않아야 한다.

**REQ-INIT-03** [Unwanted]
시스템은 Firebase Admin SDK를 **사용하지 않아야 한다** (서버사이드 코드 금지).

### 3.2 인증 요구사항

**REQ-AUTH-01** [Event-Driven]
**WHEN** 사용자가 이메일과 비밀번호로 회원가입을 요청하면 **THEN** `createUserWithEmailAndPassword`를 호출하고, Firestore `profiles` 컬렉션에 프로필 문서를 생성해야 한다.

**REQ-AUTH-02** [Event-Driven]
**WHEN** 사용자가 이메일과 비밀번호로 로그인을 요청하면 **THEN** `signInWithEmailAndPassword`를 호출하고, 성공 시 인증 상태를 업데이트해야 한다.

**REQ-AUTH-03** [Event-Driven]
**WHEN** 사용자가 로그아웃을 요청하면 **THEN** Firebase `signOut`을 호출하고, 모든 인증 관련 상태를 초기화해야 한다.

**REQ-AUTH-04** [Ubiquitous]
시스템은 **항상** `onAuthStateChanged` 리스너를 통해 인증 상태 변경을 실시간으로 감지해야 한다.

**REQ-AUTH-05** [State-Driven]
**IF** 앱이 초기 로드되는 중이면 **THEN** `onAuthStateChanged`의 첫 번째 콜백이 호출될 때까지 로딩 상태를 유지해야 한다.

**REQ-AUTH-06** [Unwanted]
시스템은 `getSession()` 같은 Supabase 전용 API를 **호출하지 않아야 한다**.

**REQ-AUTH-07** [Event-Driven]
**WHEN** 인증 연결이 실패하면 **THEN** 사용자에게 명확한 한국어 오류 메시지를 표시하고, 10초 타임아웃 안전장치를 유지해야 한다.

### 3.3 Firestore 데이터 구조 요구사항

**REQ-DATA-01** [Ubiquitous]
시스템은 **항상** 다음의 Firestore 컬렉션 구조를 사용해야 한다:

#### profiles 컬렉션

```
/profiles/{userId}
{
  userId: string,          // Firebase Auth UID
  displayName: string | null,
  createdAt: Timestamp
}
```

문서 ID = Firebase Auth UID (사용자당 1개)

#### characters 컬렉션

```
/characters/{autoId}
{
  userId: string,          // Firebase Auth UID (인덱스)
  face: string,
  hair: string,
  mustache: string | null,
  glasses: string | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

문서 ID = Firestore 자동 생성 ID, `userId`에 단일 필드 인덱스 설정

#### mood_entries 컬렉션

```
/mood_entries/{autoId}
{
  userId: string,          // Firebase Auth UID (인덱스)
  characterId: string,     // characters 문서 ID 참조
  date: string,            // "YYYY-MM-DD" 형식
  moodCategory: string,
  outfitFile: string,
  expressionFile: string,
  compositeImageUrl: string | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

문서 ID = Firestore 자동 생성 ID, 복합 인덱스: `(userId, date)`

**REQ-DATA-02** [Ubiquitous]
시스템은 **항상** Firestore 필드 이름으로 camelCase를 사용해야 한다 (Supabase의 snake_case에서 변환).

**REQ-DATA-03** [State-Driven]
**IF** 캐릭터 조회 결과가 없으면 **THEN** `null`을 반환하고, `hasCharacter` 상태를 `false`로 설정해야 한다.

### 3.4 캐릭터 CRUD 요구사항

**REQ-CHAR-01** [Event-Driven]
**WHEN** 캐릭터 조회가 요청되면 **THEN** `where("userId", "==", uid)` 쿼리로 사용자의 캐릭터를 조회하고, 첫 번째 결과를 반환해야 한다.

**REQ-CHAR-02** [Event-Driven]
**WHEN** 캐릭터 생성이 요청되면 **THEN** `addDoc`으로 `characters` 컬렉션에 문서를 추가하고, 생성된 문서를 반환해야 한다.

**REQ-CHAR-03** [Event-Driven]
**WHEN** 캐릭터 수정이 요청되면 **THEN** `updateDoc`으로 해당 문서를 업데이트하되, `userId`가 현재 사용자와 일치하는지 확인해야 한다.

**REQ-CHAR-04** [Ubiquitous]
시스템은 **항상** 캐릭터 생성/수정 시 `updatedAt` 필드에 `serverTimestamp()`를 사용해야 한다.

### 3.5 무드 다이어리 CRUD 요구사항

**REQ-MOOD-01** [Event-Driven]
**WHEN** 오늘의 무드 항목 조회가 요청되면 **THEN** `where("userId", "==", uid)`, `where("date", "==", today)` 쿼리로 항목을 조회해야 한다.

**REQ-MOOD-02** [Event-Driven]
**WHEN** 월별 무드 항목 조회가 요청되면 **THEN** `where("userId", "==", uid)`, `where("date", ">=", start)`, `where("date", "<=", end)`, `orderBy("date")` 쿼리로 항목을 조회해야 한다.

**REQ-MOOD-03** [Event-Driven]
**WHEN** 무드 항목 저장(upsert)이 요청되면 **THEN** 먼저 해당 날짜의 기존 항목을 조회하여, 존재하면 `updateDoc`, 없으면 `addDoc`으로 처리해야 한다.

**REQ-MOOD-04** [Ubiquitous]
시스템은 **항상** 무드 항목 생성/수정 시 `updatedAt`에 `serverTimestamp()`를 사용해야 한다.

### 3.6 보안 규칙 요구사항

**REQ-SEC-01** [Ubiquitous]
시스템은 **항상** 인증된 사용자만 자신의 데이터를 읽고 쓸 수 있도록 Firestore 보안 규칙을 적용해야 한다.

**REQ-SEC-02** [Ubiquitous]
Firestore 보안 규칙은 다음의 원칙을 **항상** 따라야 한다:
- `profiles`: 본인 문서만 읽기/쓰기 가능 (`request.auth.uid == resource.data.userId`)
- `characters`: 본인 문서만 읽기/쓰기 가능 (`request.auth.uid == resource.data.userId`)
- `mood_entries`: 본인 문서만 읽기/쓰기 가능 (`request.auth.uid == resource.data.userId`)

**REQ-SEC-03** [Unwanted]
시스템은 비인증 사용자가 어떤 컬렉션에도 접근할 수 **없어야 한다**.

### 3.7 호환성 요구사항

**REQ-COMPAT-01** [Ubiquitous]
시스템은 **항상** Next.js `output: 'export'` 정적 빌드와 호환되어야 한다.

**REQ-COMPAT-02** [Unwanted]
시스템은 서버 사이드 렌더링(SSR) 또는 서버 컴포넌트에서 Firebase SDK를 **호출하지 않아야 한다**.

**REQ-COMPAT-03** [Ubiquitous]
시스템은 **항상** `"use client"` 지시어가 필요한 파일에 올바르게 선언되어야 한다.

**REQ-COMPAT-04** [Ubiquitous]
시스템은 **항상** Firebase SDK의 modular(tree-shakable) import 방식을 사용해야 한다.

---

## 4. Specifications (명세)

### 4.1 Firebase 초기화 명세 (`src/app/lib/firebase.ts`)

```typescript
// Firebase 앱 초기화 - 클라이언트 전용
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 중복 초기화 방지
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 4.2 인증 컨텍스트 명세 (`src/app/contexts/AuthContext.tsx`)

주요 변경 사항:

| Supabase 코드 | Firebase 대체 코드 |
|---------------|-------------------|
| `import { supabase }` | `import { auth, db }` from firebase.ts |
| `import type { User, Session }` from supabase-js | `import type { User }` from firebase/auth |
| `supabase.auth.getSession()` | `onAuthStateChanged(auth, callback)` (초기 세션 + 리스너 통합) |
| `supabase.auth.onAuthStateChange()` | `onAuthStateChanged(auth, callback)` |
| `supabase.auth.signUp()` | `createUserWithEmailAndPassword(auth, email, password)` |
| `supabase.auth.signInWithPassword()` | `signInWithEmailAndPassword(auth, email, password)` |
| `supabase.auth.signOut()` | `signOut(auth)` |
| `Session` 타입 | 제거 (Firebase는 `User` 객체만 사용) |

AuthContextType 인터페이스 변경:

```typescript
export interface AuthContextType {
  user: User | null;          // firebase/auth의 User 타입
  // session 제거 - Firebase는 Session 개념이 없음
  loading: boolean;
  hasCharacter: boolean;
  authError: string | null;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshHasCharacter: () => Promise<void>;
}
```

### 4.3 캐릭터 훅 명세 (`src/app/hooks/useCharacter.ts`)

주요 변경 사항:

| Supabase 코드 | Firestore 대체 코드 |
|---------------|---------------------|
| `supabase.from("characters").select("*").eq("user_id", userId).maybeSingle()` | `query(collection(db, "characters"), where("userId", "==", userId))` + `getDocs` |
| `supabase.from("characters").insert({...}).select().single()` | `addDoc(collection(db, "characters"), {...})` + `getDoc` |
| `supabase.from("characters").update({...}).eq("id", id).eq("user_id", userId)` | `updateDoc(doc(db, "characters", id), {...})` (보안 규칙이 userId 검증) |

### 4.4 무드 다이어리 훅 명세 (`src/app/hooks/useMoodEntries.ts`)

주요 변경 사항:

| Supabase 코드 | Firestore 대체 코드 |
|---------------|---------------------|
| `.from("mood_entries").select("*").eq("user_id", uid).eq("date", today).maybeSingle()` | `query(collection(db, "mood_entries"), where("userId", "==", uid), where("date", "==", today))` + `getDocs` |
| `.from("mood_entries").select("*").eq("user_id", uid).gte("date", start).lte("date", end).order("date")` | `query(collection(db, "mood_entries"), where("userId", "==", uid), where("date", ">=", start), where("date", "<=", end), orderBy("date"))` + `getDocs` |
| `.insert({...}).select().single()` | `addDoc(collection(db, "mood_entries"), {...})` |
| `.update({...}).eq("id", id).select().single()` | `updateDoc(doc(db, "mood_entries", id), {...})` |

### 4.5 Firestore 보안 규칙 명세 (`firestore.rules`)

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // 기본: 모든 접근 차단
    match /{document=**} {
      allow read, write: if false;
    }

    // profiles: 본인 문서만 읽기/쓰기
    match /profiles/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }

    // characters: 본인 문서만 읽기/쓰기
    match /characters/{characterId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null
                    && request.auth.uid == resource.data.userId
                    && request.auth.uid == request.resource.data.userId;
      allow delete: if false;
    }

    // mood_entries: 본인 문서만 읽기/쓰기
    match /mood_entries/{entryId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null
                    && request.auth.uid == resource.data.userId
                    && request.auth.uid == request.resource.data.userId;
      allow delete: if false;
    }
  }
}
```

### 4.6 패키지 변경 명세

삭제할 패키지:

```
@supabase/supabase-js
pg (devDependencies)
```

추가할 패키지:

```
firebase (v10+)
```

### 4.7 Firestore 인덱스 요구사항

Firestore 콘솔 또는 `firestore.indexes.json`에서 다음 복합 인덱스를 생성해야 한다:

| 컬렉션 | 필드 | 정렬 |
|--------|------|------|
| `mood_entries` | `userId` (Ascending), `date` (Ascending) | - |
| `mood_entries` | `userId` (Ascending), `date` (Descending) | - |

단일 필드 인덱스 (자동 생성):

| 컬렉션 | 필드 |
|--------|------|
| `characters` | `userId` |
| `mood_entries` | `userId` |
| `mood_entries` | `date` |

### 4.8 타입 매핑 명세 (`src/app/lib/firestore.types.ts`)

```typescript
import type { Timestamp } from "firebase/firestore";

// Firestore 문서 타입 (camelCase)
export interface FirestoreProfile {
  userId: string;
  displayName: string | null;
  createdAt: Timestamp;
}

export interface FirestoreCharacter {
  userId: string;
  face: string;
  hair: string;
  mustache: string | null;
  glasses: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreMoodEntry {
  userId: string;
  characterId: string;
  date: string;
  moodCategory: string;
  outfitFile: string;
  expressionFile: string;
  compositeImageUrl: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

도메인 타입 변환 유틸리티:

Firestore 문서(Timestamp 포함)를 기존 도메인 타입(`BaseCharacter`, `MoodEntry`)으로 변환하는 헬퍼 함수가 필요하다.
Timestamp를 ISO 8601 문자열로 변환하고, 문서 ID를 `id` 필드에 매핑한다.

---

## 5. 추적성 (Traceability)

| 요구사항 ID | 대상 파일 | 테스트 시나리오 |
|------------|-----------|---------------|
| REQ-INIT-01 | `src/app/lib/firebase.ts` | Firebase 앱 초기화 및 서비스 내보내기 확인 |
| REQ-INIT-02 | `src/app/lib/firebase.ts` | 환경변수 누락 시 콘솔 오류 메시지 출력 확인 |
| REQ-INIT-03 | 전체 코드베이스 | Firebase Admin SDK import 부재 확인 |
| REQ-AUTH-01 | `AuthContext.tsx` | 회원가입 + 프로필 생성 E2E 테스트 |
| REQ-AUTH-02 | `AuthContext.tsx` | 로그인 성공/실패 테스트 |
| REQ-AUTH-03 | `AuthContext.tsx` | 로그아웃 후 상태 초기화 테스트 |
| REQ-AUTH-04 | `AuthContext.tsx` | 인증 상태 변경 리스너 동작 확인 |
| REQ-AUTH-05 | `AuthContext.tsx` | 초기 로드 시 로딩 상태 확인 |
| REQ-AUTH-07 | `AuthContext.tsx` | 네트워크 오류 시 한국어 오류 메시지 표시 |
| REQ-DATA-01 | Firestore 컬렉션 | 컬렉션 구조 및 필드 타입 검증 |
| REQ-DATA-02 | 전체 Firestore 코드 | camelCase 필드명 사용 확인 |
| REQ-CHAR-01~04 | `useCharacter.ts` | 캐릭터 CRUD 기능 테스트 |
| REQ-MOOD-01~04 | `useMoodEntries.ts` | 무드 항목 CRUD 기능 테스트 |
| REQ-SEC-01~03 | `firestore.rules` | 보안 규칙 단위 테스트 |
| REQ-COMPAT-01~04 | 전체 빌드 | `next build` 정적 내보내기 성공 확인 |

---

## 6. 전문가 상담 권장

이 SPEC은 다음 도메인 전문가 상담을 권장한다:

### expert-frontend (권장)

- Firebase SDK modular import 최적화 및 tree-shaking 검증
- React 19 + Firebase onAuthStateChanged 리스너의 올바른 생명주기 관리
- Cloudflare Pages 정적 배포 환경에서 Firebase 클라이언트 동작 검증

### expert-security (선택)

- Firestore 보안 규칙의 완전성 검증
- Firebase Authentication 설정 보안 검토 (비밀번호 정책, 무차별 대입 방지 등)
