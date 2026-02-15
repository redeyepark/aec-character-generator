# AEC Character Generator

웹 기반 아바타 캐릭터 생성기 겸 일일 무드 다이어리 애플리케이션입니다. 493개의 PNG 에셋을 활용하여 나만의 캐릭터를 만들고, 매일의 기분을 의상과 표정으로 기록할 수 있습니다.

**배포 URL**: https://aec-character.pages.dev

---

## 주요 기능

### 캐릭터 생성 위자드

4단계 위자드를 통해 베이스 캐릭터를 생성합니다.

1. 얼굴형 선택 (5종: heart, oval, round, round square jaw, square jaw)
2. 헤어스타일 선택 (214종)
3. 수염 선택 (51종, 얼굴형 호환성 자동 필터링)
4. 안경 선택 (39종)

실시간 Canvas 미리보기를 통해 선택 결과를 즉시 확인할 수 있습니다.

### 일일 무드 기록

카테고리 기반 자동 랜덤 방식으로 간편하게 무드를 기록합니다.

- **7가지 기분 카테고리**: 행복/쾌활, 자신감/쿨, 차분/편안, 놀람/흥분, 사려깊음/진지, 유쾌/재미, 결연/강인
- **6가지 의상 카테고리**: 캐주얼, 포멀, 스포티, 아우터, 보타이, 전체
- **자동 랜덤 생성**: 카테고리 선택 시 해당 카테고리 내에서 자동으로 랜덤 선택
- **다시 뽑기**: 표정과 의상 각각에 다시 뽑기 버튼 제공

### 6층 레이어 이미지 합성

Canvas API를 사용하여 6개 레이어를 순서대로 합성합니다.

```
body(의상) -> face(얼굴) -> expression(표정) -> mustache(수염) -> hair(헤어) -> glasses(안경)
```

### 무드 다이어리

캘린더 형태로 과거 무드 기록을 조회하고, 해당 날짜의 캐릭터 이미지를 확인할 수 있습니다.

### 인증 및 데이터 관리

- 이메일/비밀번호 기반 로그인/회원가입 (Supabase Auth)
- 사용자별 캐릭터 및 무드 데이터 자동 저장
- Row Level Security(RLS)로 데이터 격리
- 자동 리다이렉트: 랜딩 -> 로그인 -> 캐릭터 생성(최초) 또는 무드 선택(재방문)

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
| 백엔드/인증 | Supabase (Auth + PostgreSQL) |
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

### 화면 구성 (5개)

| 화면 | 경로 | 설명 |
|------|------|------|
| 랜딩 | `/` | Hero + 기능 소개 + CTA |
| 로그인 | `/login` | 브랜드 패널 + 인증 폼 |
| 캐릭터 생성 | `/create` | 4단계 위자드 + 실시간 미리보기 |
| 무드 선택 | `/mood` | 기분/의상 카테고리 선택 |
| 무드 다이어리 | `/diary` | 캘린더 + 상세 기록 카드 |

---

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Supabase 프로젝트 (무료 티어 가능)

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성합니다.

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 데이터베이스 설정

Supabase SQL Editor에서 `supabase/schema.sql` 파일의 내용을 실행하여 테이블과 RLS 정책을 생성합니다.

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
│   ├── create/page.tsx            # 4단계 캐릭터 생성 위자드
│   ├── mood/page.tsx              # 일일 무드 선택
│   ├── diary/page.tsx             # 무드 다이어리 캘린더
│   ├── components/                # UI 컴포넌트
│   │   ├── AssetPicker.tsx        # 에셋 선택 그리드
│   │   ├── AuthForm.tsx           # 로그인/회원가입 폼
│   │   ├── AuthGuard.tsx          # 인증 보호 래퍼
│   │   ├── CharacterCanvas.tsx    # Canvas 기반 캐릭터 미리보기
│   │   ├── ClientLayout.tsx       # 클라이언트 레이아웃 래퍼
│   │   ├── DiaryCalendar.tsx      # 캘린더 뷰
│   │   ├── DiaryEntryCard.tsx     # 다이어리 항목 카드
│   │   ├── GenerateButton.tsx     # 생성/다운로드 버튼
│   │   ├── MoodSelector.tsx       # 기분 카테고리 선택기
│   │   ├── NavBar.tsx             # 내비게이션 바
│   │   ├── OutfitSelector.tsx     # 의상 카테고리 선택기
│   │   └── WizardStep.tsx         # 위자드 단계 래퍼
│   ├── contexts/
│   │   └── AuthContext.tsx        # 인증 상태 Context Provider
│   ├── hooks/
│   │   ├── useAuth.ts             # 인증 상태 관리 훅
│   │   ├── useCharacter.ts        # 캐릭터 CRUD 훅
│   │   └── useMoodEntries.ts      # 무드 항목 CRUD 훅
│   ├── lib/
│   │   ├── assetManager.ts        # 에셋 로딩/인덱싱/분류
│   │   ├── database.types.ts      # Supabase 생성 타입
│   │   ├── imageCompositor.ts     # Canvas 6층 레이어 이미지 합성
│   │   ├── randomEngine.ts        # 랜덤 조합 알고리즘
│   │   ├── supabase.ts            # Supabase 클라이언트 초기화
│   │   └── types.ts               # TypeScript 타입 정의
│   └── data/
│       └── assetIndex.json        # 사전 빌드된 에셋 인덱스
├── public/assets/                 # 정적 에셋 서빙 디렉토리
├── scripts/
│   ├── copyAssets.ts              # _AEC 에셋 복사 스크립트
│   └── buildAssetIndex.ts         # 에셋 인덱스 JSON 빌드 스크립트
├── supabase/schema.sql            # DB 스키마 (profiles, characters, mood_entries)
├── next.config.ts                 # 정적 내보내기 설정
├── package.json                   # 의존성 관리
└── tsconfig.json                  # TypeScript 설정
```

---

## 데이터베이스 스키마

Supabase PostgreSQL에 3개의 테이블을 사용하며, 모든 테이블에 Row Level Security(RLS)가 적용되어 있습니다.

| 테이블 | 용도 | 제약조건 |
|--------|------|----------|
| `profiles` | 사용자 프로필 (display_name) | 사용자당 1개 |
| `characters` | 베이스 캐릭터 (face, hair, mustache, glasses) | 사용자당 1개 |
| `mood_entries` | 일일 무드 기록 (mood_category, outfit_file, expression_file) | 사용자당 하루 1개 |

---

## 에셋 카테고리

### 기분 카테고리 (7종)

| 카테고리 | 한국어 | 표정 그룹 |
|----------|--------|-----------|
| happy | 행복/쾌활 | 그룹 1 |
| confident | 자신감/쿨 | 그룹 2 |
| calm | 차분/편안 | 그룹 3 |
| surprised | 놀람/흥분 | 그룹 4 |
| thoughtful | 사려깊음/진지 | 그룹 5 |
| playful | 유쾌/재미 | 그룹 6 |
| determined | 결연/강인 | 그룹 7 |

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
