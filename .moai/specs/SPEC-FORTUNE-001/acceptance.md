# SPEC-FORTUNE-001: 수락 기준

---
id: SPEC-FORTUNE-001
title: Fortune-Based Daily Recommendation System - Acceptance Criteria
created: 2026-02-17
status: completed
tags: [fortune, saju, acceptance-criteria, gherkin]
---

## 모듈 1: 사주 정보 입력 (Birth Info Input)

### AC-FORTUNE-001: 생년월일 입력 폼

```gherkin
Feature: 생년월일 입력 폼
  사용자는 자신의 생년월일을 입력하여 사주 운세 기능을 활성화할 수 있다.

  Scenario: 유효한 생년월일 입력
    Given 로그인한 사용자가 설정 페이지에 접근한다
    When 출생 연도에 "1990"을 입력하고
    And 출생 월에 "5"을 입력하고
    And 출생 일에 "15"을 입력하고
    And "저장" 버튼을 클릭한다
    Then 생년월일이 성공적으로 저장된다
    And 성공 알림이 표시된다
    And 기분 페이지에서 운세 카드가 표시된다

  Scenario: 존재하지 않는 날짜 입력 시도
    Given 로그인한 사용자가 설정 페이지에 접근한다
    When 출생 연도에 "1990"을 입력하고
    And 출생 월에 "2"을 입력하고
    And 출생 일에 "30"을 입력한다
    Then "유효하지 않은 날짜입니다" 오류 메시지가 표시된다
    And 저장 버튼이 비활성화 상태이다

  Scenario: 범위를 벗어난 연도 입력
    Given 로그인한 사용자가 설정 페이지에 접근한다
    When 출생 연도에 "1899"를 입력한다
    Then "1900년 이후의 날짜를 입력해주세요" 오류 메시지가 표시된다

  Scenario: 선택적 출생 시간 입력
    Given 로그인한 사용자가 설정 페이지에 접근한다
    When 유효한 생년월일을 입력하고
    And 출생 시간으로 "오전 5시-7시 (인시/寅時)"를 선택한다
    Then 출생 시간이 포함된 생년월일 정보가 저장된다
```

### AC-FORTUNE-002: 생년월일 Firestore 저장

```gherkin
Feature: 생년월일 Firestore 저장
  생년월일 정보는 Firestore profiles 컬렉션에 안전하게 저장된다.

  Scenario: Firestore에 생년월일 저장
    Given 로그인한 사용자(uid: "user123")가 생년월일을 입력한다
    When 생년월일 "1990-05-15"를 저장한다
    Then Firestore의 "profiles" 컬렉션에서 해당 사용자 문서에
    And birthYear 필드가 1990으로 저장되고
    And birthMonth 필드가 5로 저장되고
    And birthDay 필드가 15로 저장된다
    And 기존 displayName, role, createdAt 필드는 변경되지 않는다

  Scenario: 기존 생년월일 수정
    Given 사용자가 이미 생년월일 "1990-05-15"가 저장되어 있다
    When 생년월일을 "1990-06-20"으로 수정하여 저장한다
    Then Firestore의 birthYear는 1990, birthMonth는 6, birthDay는 20으로 업데이트된다
    And 기존 다른 필드는 변경되지 않는다

  Scenario: 다른 사용자의 생년월일 접근 차단
    Given 사용자 "user123"이 로그인한 상태이다
    When "user456"의 생년월일 데이터에 접근을 시도한다
    Then Firestore Security Rules에 의해 접근이 거부된다
```

### AC-FORTUNE-003: 생년월일 미입력 사용자 처리

```gherkin
Feature: 생년월일 미입력 사용자
  생년월일을 입력하지 않은 사용자는 기존 기능을 그대로 사용한다.

  Scenario: 생년월일 미입력 시 기분 페이지
    Given 생년월일이 등록되지 않은 로그인 사용자이다
    When 기분 페이지에 접근한다
    Then 운세 카드가 표시되지 않는다
    And "운세 추천을 받아보시겠어요?" 안내 배너가 표시된다
    And 안내 배너에 설정 페이지 링크가 포함된다
    And 기존 기분/의상 선택 기능이 그대로 동작한다
    And pickRandom() 기반 랜덤 선택이 정상 작동한다

  Scenario: 안내 배너에서 설정 이동
    Given 생년월일 미입력 사용자가 기분 페이지에 있다
    When 안내 배너의 "설정하기" 링크를 클릭한다
    Then 설정 페이지의 생년월일 입력 섹션으로 이동한다
```

## 모듈 2: 오늘의 운세 계산 (Daily Fortune Calculation)

### AC-FORTUNE-010: 천간지지 일진 계산 엔진

```gherkin
Feature: 천간지지 일진 계산
  시스템은 양력 날짜를 입력받아 정확한 천간지지 일진을 계산한다.

  Scenario Outline: 알려진 간지일 검증
    Given 양력 날짜 "<date>"가 주어진다
    When 천간지지 일진을 계산한다
    Then 천간은 "<stem>"이고 지지는 "<branch>"이다

    Examples:
      | date       | stem | branch | 간지 |
      | 1900-01-01 | 경(庚) | 자(子) | 경자 |
      | 2000-01-01 | 갑(甲) | 진(辰) | 갑진 |
      | 2024-02-10 | 갑(甲) | 진(辰) | 갑진 |
      | 2026-02-17 | 검증필요 | 검증필요 | 검증필요 |

  Scenario: 60간지 순환 검증
    Given 임의의 날짜가 주어진다
    When 연속 60일의 간지를 계산한다
    Then 60개의 서로 다른 간지 조합이 나타난다
    And 61일째에 첫 번째 간지와 동일한 결과가 나온다

  Scenario: 순수 클라이언트 계산 확인
    Given 네트워크 연결이 없는 상태이다
    When 천간지지 일진을 계산한다
    Then 정상적으로 계산이 완료된다
    And 외부 API 호출이 발생하지 않는다
```

### AC-FORTUNE-011: 사용자 일간(日干) 산출

```gherkin
Feature: 사용자 일간 산출
  사용자의 생년월일로부터 일간(日干) 오행을 결정한다.

  Scenario: 일간 오행 산출
    Given 사용자의 생년월일이 "1990-05-15"이다
    When 사용자의 일간을 계산한다
    Then 해당 날짜의 천간이 결정되고
    And 천간에 대응하는 오행이 결정된다

  Scenario: 천간-오행 매핑 정확성
    Given 천간 "갑(甲)"이 주어진다
    When 오행으로 변환한다
    Then 결과는 "목(木/Wood)"이다

    Given 천간 "병(丙)"이 주어진다
    When 오행으로 변환한다
    Then 결과는 "화(火/Fire)"이다

    Given 천간 "무(戊)"가 주어진다
    When 오행으로 변환한다
    Then 결과는 "토(土/Earth)"이다

    Given 천간 "경(庚)"이 주어진다
    When 오행으로 변환한다
    Then 결과는 "금(金/Metal)"이다

    Given 천간 "임(壬)"이 주어진다
    When 오행으로 변환한다
    Then 결과는 "수(水/Water)"이다
```

### AC-FORTUNE-012: 오행 상생/상극 관계 판정

```gherkin
Feature: 오행 관계 판정
  두 오행 간의 상생/상극/중립 관계를 판정한다.

  Scenario: 상생 관계 - 생해주는 경우 (대길)
    Given 사용자 오행이 "화(火)"이고 오늘의 오행이 "목(木)"이다
    When 오행 관계를 판정한다
    Then 관계는 "generated_by" (생을 받음)이다
    And 운세 등급은 "대길(Very Lucky)"이다

  Scenario: 상생 관계 - 생해주는 경우 (길)
    Given 사용자 오행이 "목(木)"이고 오늘의 오행이 "화(火)"이다
    When 오행 관계를 판정한다
    Then 관계는 "generate" (생을 줌)이다
    And 운세 등급은 "길(Lucky)"이다

  Scenario: 상극 관계 - 극을 당하는 경우 (주의)
    Given 사용자 오행이 "목(木)"이고 오늘의 오행이 "금(金)"이다
    When 오행 관계를 판정한다
    Then 관계는 "overcome_by" (극을 당함)이다
    And 운세 등급은 "주의(Caution)"이다

  Scenario: 동일 오행 (보통)
    Given 사용자 오행이 "수(水)"이고 오늘의 오행이 "수(水)"이다
    When 오행 관계를 판정한다
    Then 관계는 "same" (동일)이다
    And 운세 등급은 "보통(Neutral)"이다

  Scenario: 직접 관계 없음 (보통)
    Given 사용자 오행이 "목(木)"이고 오늘의 오행이 "수(水)"의 상생이 아닌 조합이다
    When 오행 관계를 판정한다
    Then 운세 등급은 적절한 등급이 결정된다

  Scenario: 상생 순환 완전성 검증
    Given 오행 상생 순환은 "목->화->토->금->수->목"이다
    When 각 연결 쌍의 관계를 판정한다
    Then 모든 쌍이 "generate/generated_by" 관계로 판정된다

  Scenario: 상극 순환 완전성 검증
    Given 오행 상극 순환은 "목->토, 토->수, 수->화, 화->금, 금->목"이다
    When 각 연결 쌍의 관계를 판정한다
    Then 모든 쌍이 "overcome/overcome_by" 관계로 판정된다
```

### AC-FORTUNE-013: 행운 색상 산출

```gherkin
Feature: 행운 색상 산출
  오행에 따라 행운 색상 키워드를 산출한다.

  Scenario Outline: 오행별 행운 색상
    Given 행운의 오행이 "<element>"이다
    When 행운 색상을 산출한다
    Then 색상 키워드 목록에 "<colors>"가 포함된다

    Examples:
      | element | colors                          |
      | wood    | green, emerald, teal            |
      | fire    | red, rose, orange, pink         |
      | earth   | yellow, amber, brown            |
      | metal   | white, grey, gray, silver       |
      | water   | blue, dark blue, navy, black, indigo |

  Scenario: 주의 등급 시 균형 색상 추천
    Given 사용자 오행이 "목(木)"이고 오늘 오행이 "금(金)"으로 상극이다
    When 추천 색상을 산출한다
    Then 금(金)의 극을 완화하는 수(水)의 색상이 균형 색상으로 추천된다
    And 추천 색상에 "blue, dark blue, navy" 등이 포함된다
```

## 모듈 3: 의상 색상 추천 (Outfit Color Recommendation)

### AC-FORTUNE-020: 의상 파일명 기반 색상 필터링

```gherkin
Feature: 의상 색상 필터링
  의상 에셋 파일명에서 색상 정보를 추출하여 오행별로 분류한다.

  Scenario: 단일 색상 의상 매칭
    Given 의상 파일명이 "T shirt blue.png"이다
    When 색상을 분석한다
    Then 매칭된 색상은 ["blue"]이다
    And 매칭된 오행은 ["water"]이다

  Scenario: 복수 색상 의상 매칭
    Given 의상 파일명이 "raglan white + blue tshirt.png"이다
    When 색상을 분석한다
    Then 매칭된 색상은 ["white", "blue"]이다
    And 매칭된 오행은 ["metal", "water"]이다

  Scenario: 색상 키워드 없는 의상
    Given 의상 파일명이 "fancy euroupean suit.png"이다
    When 색상을 분석한다
    Then 매칭된 색상은 비어있다
    And 해당 의상은 "보통" 카테고리로 분류된다

  Scenario: dark blue와 blue 구분
    Given 의상 파일명이 "T shirt dark blue.png"이다
    When 색상을 분석한다
    Then "dark blue"가 우선 매칭되어 ["dark blue"]이다
    And 매칭된 오행은 ["water"]이다

  Scenario: 카테고리 내 행운 색상 필터링
    Given 행운 색상이 ["green", "emerald", "teal"]이다
    And casual 카테고리의 의상 목록이 주어진다
    When 행운 색상으로 필터링한다
    Then "T shirt green.png", "hood T shirt green.png" 등 녹색 의상이 반환된다
    And 기존 의상 목록은 변경되지 않는다
```

### AC-FORTUNE-021: 추천 의상 하이라이트

```gherkin
Feature: 추천 의상 하이라이트
  기분 페이지에서 행운 색상 의상이 시각적으로 강조된다.

  Scenario: 의상 카테고리에 추천 색상 뱃지 표시
    Given 행운 오행이 "목(木)"이고 행운 색상이 녹색 계열이다
    And 사용자가 기분 페이지에 있다
    When 의상 카테고리 목록을 표시한다
    Then 녹색 의상을 포함하는 카테고리에 색상 도트 뱃지가 표시된다

  Scenario: 행운 의상 버튼 표시
    Given 생년월일이 등록된 사용자이다
    When 기분 페이지의 세부 조정 영역을 열면
    Then "행운의 컬러로 입기" 버튼이 의상 카테고리 선택 영역에 표시된다
    And 버튼에 추천 색상 도트가 미리보기로 표시된다
```

### AC-FORTUNE-022: 행운 의상 자동 선택

```gherkin
Feature: 행운 의상 자동 선택
  사용자가 행운 의상 버튼을 누르면 추천 색상 의상이 선택된다.

  Scenario: 현재 카테고리 내 행운 색상 의상 존재
    Given 현재 의상 카테고리가 "casual"이다
    And casual 카테고리에 행운 색상 의상이 3개 존재한다
    When "행운의 컬러로 입기" 버튼을 클릭한다
    Then 3개 중 하나가 랜덤으로 선택된다
    And 캐릭터 미리보기가 선택된 의상으로 업데이트된다

  Scenario: 현재 카테고리에 행운 색상 의상 없음
    Given 현재 의상 카테고리가 "bowtie"이다
    And bowtie 카테고리에 행운 색상 의상이 없다
    When "행운의 컬러로 입기" 버튼을 클릭한다
    Then 전체 카테고리에서 행운 색상 의상을 찾아 랜덤 선택한다
    And 해당 의상의 카테고리로 자동 변경된다

  Scenario: 전체에 행운 색상 의상 없음 (폴백)
    Given 행운 색상에 해당하는 의상이 전혀 없다
    When "행운의 컬러로 입기" 버튼을 클릭한다
    Then 기존 랜덤 선택(pickRandom)으로 의상이 선택된다
    And 사용자에게 "추천 의상을 찾을 수 없어 랜덤으로 선택했습니다" 안내가 표시된다
```

## 모듈 4: 추천 UI (Recommendation Display)

### AC-FORTUNE-030: 오늘의 운세 카드

```gherkin
Feature: 오늘의 운세 카드
  생년월일 등록 사용자에게 운세 카드가 표시된다.

  Scenario: 운세 카드 정상 표시
    Given 생년월일이 "1990-05-15"로 등록된 사용자이다
    When 기분 페이지에 접근한다
    Then 캐릭터 미리보기 상단에 운세 카드가 표시된다
    And 오늘의 간지 정보가 표시된다 (예: "오늘은 갑자일(甲子日)")
    And 사용자의 오행 정보가 표시된다 (예: "나의 오행: 화(火)")
    And 오늘의 오행 정보가 표시된다 (예: "오늘의 오행: 목(木)")
    And 운세 등급이 표시된다 (예: "대길")
    And 추천 색상 도트가 표시된다
    And 한줄 운세 메시지가 표시된다

  Scenario: 운세 카드 접기/펼치기
    Given 운세 카드가 표시된 상태이다
    When 카드의 접기 토글을 클릭한다
    Then 카드 내용이 축소되어 운세 등급과 추천 색상만 한 줄로 표시된다
    When 다시 토글을 클릭한다
    Then 카드 전체 내용이 펼쳐진다

  Scenario: 모바일 반응형 표시
    Given 화면 너비가 375px인 모바일 기기이다
    When 기분 페이지에 접근한다
    Then 운세 카드가 전체 너비로 표시된다
    And 텍스트가 잘리지 않고 가독성이 유지된다
    And 색상 도트가 적절한 크기로 표시된다
```

### AC-FORTUNE-031: 운세 등급 시각화

```gherkin
Feature: 운세 등급 시각화
  운세 등급에 따라 차별화된 스타일이 적용된다.

  Scenario: 대길 등급 스타일
    Given 운세 등급이 "대길(Very Lucky)"이다
    When 운세 카드를 표시한다
    Then 카드 테두리가 금색(amber/yellow)이다
    And 별 아이콘이 표시된다
    And 배경에 축하 계열 밝은 색상이 적용된다

  Scenario: 길 등급 스타일
    Given 운세 등급이 "길(Lucky)"이다
    When 운세 카드를 표시한다
    Then 카드 테두리가 녹색(green)이다
    And 하트 아이콘이 표시된다

  Scenario: 보통 등급 스타일
    Given 운세 등급이 "보통(Neutral)"이다
    When 운세 카드를 표시한다
    Then 카드 테두리가 회색(gray)이다
    And 원형 아이콘이 표시된다

  Scenario: 주의 등급 스타일
    Given 운세 등급이 "주의(Caution)"이다
    When 운세 카드를 표시한다
    Then 카드 테두리가 주황색(orange)이다
    And 주의 아이콘이 표시된다
    And 균형 색상이 추천 색상으로 표시된다
```

### AC-FORTUNE-032: 운세 기록 표시 (선택적)

```gherkin
Feature: 달력 뷰 운세 표시 (Optional)
  달력 뷰에서 각 날짜의 운세 등급을 확인할 수 있다.

  Scenario: 달력에 운세 등급 아이콘 표시
    Given 생년월일이 등록된 사용자가 달력 뷰에 접근한다
    When 특정 월의 달력이 표시된다
    Then 각 날짜에 기분 일기 정보와 함께 운세 등급 소형 아이콘이 표시된다
    And 운세 등급은 실시간 계산이며 Firestore에 저장하지 않는다

  Scenario: 운세 등급 계산 성능
    Given 한 달(30일)의 운세 등급을 계산한다
    When 달력 뷰가 로드된다
    Then 모든 날짜의 운세 계산이 100ms 이내에 완료된다
```

## 비기능 요구사항 수락 기준

### AC-NFR-001: 기존 기능 회귀 방지

```gherkin
Feature: 기존 기능 회귀 방지
  운세 기능 추가 후에도 기존 기분/의상 시스템이 정상 동작한다.

  Scenario: 기분 선택 기존 동작 보존
    Given 운세 기능이 활성화된 상태이다
    When 사용자가 기분 카테고리 "행복/쾌활"을 선택한다
    Then 기존과 동일하게 해당 기분의 표정이 랜덤 선택된다
    And 캐릭터 미리보기가 업데이트된다

  Scenario: 의상 선택 기존 동작 보존
    Given 운세 기능이 활성화된 상태이다
    When 사용자가 세부 조정에서 의상 카테고리 "캐주얼"을 선택한다
    Then 기존과 동일하게 캐주얼 의상이 랜덤 선택된다
    And "의상 다시 뽑기" 버튼이 정상 동작한다

  Scenario: 저장 기능 기존 동작 보존
    Given 운세 기능이 활성화된 상태이다
    When 사용자가 기분/의상을 선택하고 "오늘의 기분 저장" 버튼을 누른다
    Then 기존과 동일하게 Firestore mood_entries에 저장된다
    And 운세 정보는 mood_entries에 저장되지 않는다
```

### AC-NFR-002: 성능 요구사항

```gherkin
Feature: 성능 요구사항
  운세 기능은 앱 성능에 미미한 영향만 미친다.

  Scenario: 운세 계산 성능
    Given 사용자의 생년월일이 등록되어 있다
    When 일일 운세를 계산한다
    Then 계산 시간이 1ms 미만이다

  Scenario: 의상 색상 필터링 성능
    Given 전체 의상 목록(138개)이 주어진다
    When 행운 색상으로 필터링한다
    Then 필터링 시간이 10ms 미만이다

  Scenario: 번들 사이즈 영향
    Given 운세 기능 추가 전 번들 사이즈를 측정한다
    When 운세 기능을 추가한다
    Then 번들 사이즈 증가량이 5KB 미만이다
```

### AC-NFR-003: 보안 요구사항

```gherkin
Feature: 보안 요구사항
  생년월일 데이터는 안전하게 보호된다.

  Scenario: Firestore Security Rules 적용
    Given Firestore Security Rules가 설정되어 있다
    When 사용자 "user123"이 자신의 생년월일을 읽는다
    Then 읽기가 허용된다

    When 사용자 "user123"이 "user456"의 생년월일을 읽으려 한다
    Then 읽기가 거부된다

  Scenario: 클라이언트 사이드 전용 계산
    Given 운세 계산을 수행한다
    When 네트워크 요청을 모니터링한다
    Then 운세 계산과 관련된 외부 API 호출이 발생하지 않는다
    And 모든 계산이 클라이언트 JavaScript에서 수행된다
```

### AC-NFR-004: 접근성 요구사항

```gherkin
Feature: 접근성 요구사항
  운세 UI는 모든 사용자가 접근 가능하다.

  Scenario: 색상 정보 텍스트 라벨
    Given 운세 카드에 추천 색상이 표시된다
    When 화면을 확인한다
    Then 색상 도트 옆에 한글 색상 이름이 텍스트로 표시된다
    And aria-label에 색상 정보가 포함된다

  Scenario: 키보드 네비게이션
    Given 운세 카드와 행운 의상 버튼이 표시된다
    When Tab 키로 네비게이션한다
    Then 운세 카드 접기/펼치기 토글에 포커스가 이동한다
    And "행운의 컬러로 입기" 버튼에 포커스가 이동한다
    And Enter 키로 각 기능을 활성화할 수 있다

  Scenario: 스크린 리더 호환성
    Given 운세 카드가 표시된다
    When 스크린 리더로 읽는다
    Then "오늘의 운세: 대길, 추천 색상: 녹색, 청색" 등 정보가 읽힌다
```

## Definition of Done

SPEC-FORTUNE-001의 구현이 완료된 것으로 간주되려면 다음 조건을 모두 충족해야 한다:

1. **기능 완성**: 모듈 1~4의 모든 [HARD] 요구사항이 구현되었다
2. **기존 동작 보존**: AC-NFR-001의 모든 시나리오가 통과한다
3. **성능 기준 충족**: AC-NFR-002의 모든 성능 기준을 충족한다
4. **보안 검증**: Firestore Security Rules가 적용되어 AC-NFR-003을 충족한다
5. **접근성 준수**: AC-NFR-004의 기본 접근성 요구사항을 충족한다
6. **코드 품질**: TypeScript 타입 에러 0개, ESLint 경고 0개
7. **빌드 성공**: `next build` (Static Export)가 오류 없이 완료된다
8. **수동 검증**: 크롬 브라우저 + 모바일 뷰에서 전체 플로우 수동 테스트 통과
