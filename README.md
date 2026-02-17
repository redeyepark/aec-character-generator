# AEC Character Generator

웹 기반 아바타 캐릭터 생성기 겸 일일 무드 다이어리 애플리케이션입니다. 493개의 PNG 에셋을 활용하여 나만의 캐릭터를 만들고, 매일의 기분을 의상과 표정으로 기록할 수 있습니다.

**배포 URL**: https://aec-character.pages.dev

---

## 주요 기능

### 캐릭터 생성 위자드

5단계 위자드를 통해 베이스 캐릭터를 생성합니다.

1. 얼굴형 및 피부색 선택 (SVG 얼굴 5종 + 8종 프리셋 피부색 팔레트)
2. 헤어스타일 선택 (214종)
3. 수염 선택 (51종, 얼굴형 호환성 자동 필터링)
4. 안경 선택 (39종)
5. 사주 정보 입력 (생년월일 + 음력/양력 선택, 선택 사항)

실시간 Canvas 미리보기를 통해 선택 결과를 즉시 확인할 수 있습니다.

### 일일 무드 기록

카테고리 기반 자동 랜덤 방식으로 간편하게 무드를 기록합니다.

- **7가지 기분 카테고리**: 행복/쾌활, 자신감/쿨, 차분/편안, 놀람/흥분, 사려깊음/진지, 유쾌/재미, 결연/강인
- **6가지 의상 카테고리**: 캐주얼, 포멀, 스포티, 아우터, 보타이, 전체
- **자동 랜덤 생성**: 카테고리 선택 시 해당 카테고리 내에서 자동으로 랜덤 선택
- **다시 뽑기**: 표정과 의상 각각에 다시 뽑기 버튼 제공
- **간소화된 저장 흐름**: 기분 선택 후 1-tap 저장, 의상 옵션은 접이식 "세부 조정" 섹션으로 분리

### 6층 레이어 이미지 합성

Canvas API를 사용하여 6개 레이어를 순서대로 합성합니다. 얼굴 레이어는 SVG 에셋을 로드하여 선택된 피부색으로 치환한 뒤 Canvas에 렌더링합니다.

```
body(의상) -> face(SVG 얼굴 + 피부색) -> expression(표정) -> mustache(수염) -> hair(헤어) -> glasses(안경)
```

### 무드 다이어리

캘린더 형태로 과거 무드 기록을 조회하고, 해당 날짜의 캐릭터 이미지를 확인할 수 있습니다.
기분별 고유 색상이 달력 셀에 표시되어 월별 감정 패턴을 한눈에 파악할 수 있습니다.

### 인증 및 데이터 관리

- 이메일/비밀번호 기반 로그인/회원가입 (Firebase Authentication)
- 이메일 인증 (회원가입 시 인증 메일 자동 발송, 재발송 버튼 제공)
- 사용자별 캐릭터 및 무드 데이터 자동 저장
- Firestore 보안 규칙으로 데이터 격리
- 자동 리다이렉트: 랜딩 -> 로그인 -> 캐릭터 생성(최초 1회) 또는 무드 선택(재방문)
- 회원 탈퇴 (비밀번호 재인증 후 모든 데이터 및 계정 완전 삭제)

### 관리자 시스템

- admin role 기반 관리자 권한 관리
- 관리자 전용 캐릭터 편집 모드 (기존 캐릭터 수정 가능)
- 관리자 계정 생성 페이지 (`/admin-setup`)

### 오늘의 운세

사주(四柱)/오행(五行) 기반 운세 시스템으로 매일 맞춤형 추천을 제공합니다.

- **사주 계산 엔진**: 생년월일 기반 오행(목/화/토/금/수) 분석 (순수 TypeScript, 외부 의존성 없음)
- **행운의 색상 의상 자동 적용**: 오행 기반 행운의 색상에 맞는 의상이 무드 선택 시 자동 적용
- **생년월일 입력**: 캐릭터 생성 위자드 5단계 또는 설정 페이지에서 입력 (음력/양력 선택 지원)

### 출석 체크 이벤트

매일 기분을 기록하면 자동으로 출석이 인정되는 월간 이벤트 시스템입니다.

- **자동 출석 인정**: 무드 저장 시 별도 버튼 없이 출석 자동 기록
- **연속 출석 스트릭**: 연속 출석 일수 추적 (매월 1일 초기화)
- **마일스톤 보상**: 연속 출석 달성 시 특별 의상/표정 영구 해금
  - 3일 연속: 특별 표정 1개
  - 7일 연속: 특별 의상 1개
  - 14일 연속: 특별 의상 + 표정 각 1개
  - 30일 연속: 프리미엄 의상 세트 3개
- **출석 현황 카드**: 다이어리 페이지에서 월별 출석 통계 및 마일스톤 프로그레스 바 확인
- **출석 토스트 알림**: 무드 저장 후 연속 출석 일수 및 보상 해금 알림 표시

### 설정 및 계정 관리

설정 페이지에서 개인 정보 관리와 계정 관련 기능을 제공합니다.

- **사주 정보 관리**: 생년월일 입력 및 수정 (음력/양력 선택 지원)
- **회원 탈퇴**: 비밀번호 재인증 후 모든 데이터(mood_entries, characters, profiles) 및 Firebase Auth 계정 완전 삭제
- **경고 확인 다이얼로그**: 삭제 전 경고 메시지 및 최종 확인 절차

### PNG 다운로드

합성된 캐릭터 이미지를 PNG 파일로 다운로드할 수 있습니다.

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| UI 라이브러리 | React 19 |
| 언어 | TypeScript 5 |
| 스타일링 | Tailwind CSS 4 |
| 백엔드/인증 | Firebase (Authentication + Cloud Firestore) |
| 배포 | Cloudflare Pages |
| 빌드 모드 | Static Export (`output: 'export'`) |

---

## 디자인 시스템

Pencil MCP 기반의 통합 디자인 시스템을 사용합니다.

| 속성 | 값 |
|------|-----|
| 폰트 | Outfit (Google Fonts) |
| 배경색 | Warm Cream (#F5F4F1) |
| 주 강조색 | Forest Green (#3D8A5A) |
| 보조 강조색 | Terracotta (#D89575) |
| 정보색 | Blue (#4A90D9) |
| 모서리 반경 | 12-16px |
| 스타일 | Clean, Minimal, 따뜻한 유기적 느낌 |

### 화면 구성 (7개)

| 화면 | 경로 | 설명 |
|------|------|------|
| 랜딩 | `/` | Hero + 기능 소개 + CTA |
| 로그인 | `/login` | 브랜드 패널 + 인증 폼 |
| 캐릭터 생성 | `/create` | 5단계 위자드 + 실시간 미리보기 (신규 사용자 온보딩 포함) |
| 무드 선택 | `/mood` | 기분 선택 + 행운 의상 자동 적용 + 출석 자동 기록 + 1-tap 저장 |
| 무드 다이어리 | `/diary` | 색상 달력 + 상세 기록 카드 + 출석 현황 카드 |
| 설정 | `/settings` | 사주 정보 입력 + 회원 탈퇴 |
| 관리자 설정 | `/admin-setup` | 관리자 계정 생성 |

---

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Firebase 프로젝트 (무료 Spark 플랜 가능)

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성합니다.

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 데이터베이스 설정

Firebase 프로젝트에서 Cloud Firestore 데이터베이스를 생성한 후, Firestore 보안 규칙과 인덱스를 배포합니다.

```bash
# Firestore 보안 규칙 및 인덱스 배포
npx firebase-tools deploy --only firestore
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 에셋 복사 및 인덱스 빌드 (최초 1회)
npm run setup

# 개발 서버 실행
npm run dev
```

개발 서버가 실행되면 http://localhost:3000 에서 애플리케이션을 확인할 수 있습니다.

### 개별 스크립트

```bash
# _AEC/ 원본 에셋을 public/assets/로 복사
npm run copy-assets

# 에셋 인덱스 JSON 빌드
npm run build-index

# 프로덕션 빌드 (정적 내보내기)
npm run build

# 린트 검사
npm run lint
```

---

## 배포

### Cloudflare Pages 배포

```bash
# 프로덕션 빌드
npm run build

# Cloudflare Pages 배포
npx wrangler pages deploy out/ --project-name aec-character --branch main --commit-dirty=true
```

---

## 프로젝트 구조

```
AEC_today01/
├── _AEC/                          # 원본 PNG 에셋 493개 (읽기 전용)
│   ├── 01_Body 1/                 # 의상 143개
│   ├── 03_Face/                   # 얼굴형 5개
│   ├── 04_Facial_Expression/      # 표정 41개 (7개 기분 그룹)
│   ├── 05_Mustache/               # 수염 51개
│   ├── 07_Hair/                   # 헤어스타일 214개
│   └── 08_Glasses/                # 안경/선글라스 39개
├── src/app/
│   ├── page.tsx                   # 랜딩 페이지 (자동 리다이렉트)
│   ├── layout.tsx                 # 루트 레이아웃 + AuthProvider
│   ├── login/page.tsx             # 로그인/회원가입
│   ├── create/page.tsx            # 5단계 캐릭터 생성 위자드
│   ├── mood/page.tsx              # 일일 무드 선택
│   ├── diary/page.tsx             # 무드 다이어리 캘린더
│   ├── admin-setup/page.tsx       # 관리자 계정 생성
│   ├── settings/page.tsx          # 설정 페이지 (사주 정보 + 회원 탈퇴)
│   ├── components/                # UI 컴포넌트
│   │   ├── AssetPicker.tsx        # 에셋 선택 그리드
│   │   ├── AttendanceCard.tsx     # 출석 현황 카드
│   │   ├── AttendanceToast.tsx    # 출석 인정 토스트 알림
│   │   ├── AuthForm.tsx           # 로그인/회원가입 폼
│   │   ├── AuthGuard.tsx          # 인증 보호 래퍼
│   │   ├── BirthInfoForm.tsx      # 생년월일 입력 폼 (음력/양력 선택 지원)
│   │   ├── CharacterCanvas.tsx    # Canvas 기반 캐릭터 미리보기
│   │   ├── ClientLayout.tsx       # 클라이언트 레이아웃 래퍼
│   │   ├── DiaryCalendar.tsx      # 캘린더 뷰
│   │   ├── DiaryEntryCard.tsx     # 다이어리 항목 카드
│   │   ├── OnboardingSlides.tsx   # 3-slide 온보딩 컴포넌트
│   │   ├── GenerateButton.tsx     # 생성/다운로드 버튼
│   │   ├── MilestoneProgress.tsx  # 마일스톤 진행도 프로그레스 바
│   │   ├── MoodSelector.tsx       # 기분 카테고리 선택기
│   │   ├── NavBar.tsx             # 내비게이션 바
│   │   ├── OutfitSelector.tsx     # 의상 카테고리 선택기
│   │   ├── RewardBadge.tsx        # 보상 해금 배지
│   │   ├── SkinTonePicker.tsx     # 피부색 프리셋 선택기 (8종)
│   │   └── WizardStep.tsx         # 위자드 단계 래퍼
│   ├── contexts/
│   │   └── AuthContext.tsx        # 인증 상태 Context Provider
│   ├── hooks/
│   │   ├── useAttendance.ts       # 출석 기록 및 스트릭 관리 훅
│   │   ├── useAuth.ts             # 인증 상태 관리 훅
│   │   ├── useBirthInfo.ts        # 생년월일 정보 관리 훅
│   │   ├── useCharacter.ts        # 캐릭터 CRUD 훅
│   │   ├── useFortune.ts          # 운세 계산 및 조회 훅
│   │   ├── useMoodEntries.ts      # 무드 항목 CRUD 훅
│   │   └── useRewards.ts          # 보상 해금 관리 훅
│   ├── lib/
│   │   ├── assetManager.ts        # 에셋 로딩/인덱싱/분류
│   │   ├── firebase.ts             # Firebase 앱 초기화 및 서비스 내보내기
│   │   ├── firestore.types.ts     # Firestore 컬렉션 타입 정의
│   │   ├── fortune/               # 사주/오행 계산 엔진 (순수 TypeScript)
│   │   ├── imageCompositor.ts     # Canvas 6층 레이어 이미지 합성
│   │   ├── randomEngine.ts        # 랜덤 조합 알고리즘
│   │   ├── svgProcessor.ts        # SVG 로드/피부색 치환/Canvas Image 변환
│   │   └── types.ts               # TypeScript 타입 정의
│   └── data/
│       └── assetIndex.json        # 사전 빌드된 에셋 인덱스
├── public/assets/                 # 정적 에셋 서빙 디렉토리
│   └── face-svg/                  # SVG 얼굴 에셋 5종 (피부색 치환용)
├── scripts/
│   ├── copyAssets.ts              # _AEC 에셋 복사 스크립트
│   └── buildAssetIndex.ts         # 에셋 인덱스 JSON 빌드 스크립트
├── firestore.rules               # Firestore 보안 규칙
├── firestore.indexes.json        # Firestore 복합 인덱스 정의
├── firebase.json                 # Firebase 프로젝트 설정
├── next.config.ts                 # 정적 내보내기 설정
├── package.json                   # 의존성 관리
└── tsconfig.json                  # TypeScript 설정
```

---

## 데이터베이스 스키마

Cloud Firestore에 5개의 컬렉션을 사용하며, Firestore 보안 규칙이 적용되어 있습니다.

| 컬렉션 | 용도 | 제약조건 |
|--------|------|----------|
| `profiles` | 사용자 프로필 (display_name, role, birthYear, birthMonth, birthDay, birthHour, isLunar) | 사용자당 1개 |
| `characters` | 베이스 캐릭터 (face, hair, mustache, glasses, skinTone) | 사용자당 1개 |
| `mood_entries` | 일일 무드 기록 (mood_category, outfit_file, expression_file) | 사용자당 하루 1개 |
| `attendance` | 월별 출석 기록 (attendedDates, currentStreak, maxStreak, totalDays) | 사용자당 월 1개 |
| `rewards` | 보상 해금 기록 (unlockedRewards 배열) | 사용자당 1개 |

---

## 에셋 카테고리

### 기분 카테고리 (7종)

| 카테고리 | 한국어 | 표정 그룹 | 달력 색상 |
|----------|--------|-----------|----------|
| happy | 행복/쾌활 | 그룹 1 | Yellow |
| confident | 자신감/쿨 | 그룹 2 | Orange |
| calm | 차분/편안 | 그룹 3 | Blue |
| surprised | 놀람/흥분 | 그룹 4 | Purple |
| thoughtful | 사려깊음/진지 | 그룹 5 | Indigo |
| playful | 유쾌/재미 | 그룹 6 | Pink |
| determined | 결연/강인 | 그룹 7 | Red |

### 의상 카테고리 (6종)

| 카테고리 | 한국어 |
|----------|--------|
| casual | 캐주얼 |
| formal | 포멀 |
| sporty | 스포티 |
| outerwear | 아우터 |
| bowtie | 보타이 |
| all | 전체 |

---

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.
