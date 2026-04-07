# Sweetbook: 나만의 추억을 담는 포토북 서비스

## 1. 서비스 소개

### 어떤 서비스인가요?
소중한 순간들을 기록하고 나만의 포토북으로 간직할 수 있는 맞춤형 포토북 제작 서비스입니다.

### 누구를 위한 서비스인가요? (타겟 고객)
일상의 소중한 순간들을 사진과 멘트로 기록하고 자신만의 특별한 책으로 만들고 싶은 개인 사용자.

### 주요 기능 목록
- **책 생성 및 관리**: 새로운 포토북을 생성하고 제목을 설정할 수 있습니다.
- **기록(페이지) 추가**: 책에 사진과 멘트로 구성된 기록을 추가할 수 있습니다.
- **드래그 앤 드롭 재정렬**: 추가된 기록들의 순서를 드래그 앤 드롭으로 자유롭게 변경할 수 있습니다.
- **기록 편집 및 삭제**: 개별 기록의 사진과 멘트를 수정하고, 필요 없는 기록은 삭제할 수 있습니다.
- **책 표지 설정**: 포토북의 표지 사진을 업로드하여 개성을 표현할 수 있습니다.
- **스타일(템플릿) 적용**: 다양한 내지 스타일을 선택하여 포토북에 적용할 수 있습니다.
- **주문 견적 확인**: 주문 전 예상 가격을 미리 확인할 수 있습니다.
- **주문 생성 및 관리**: 생성된 포토북을 실제 제품으로 주문하고 관리할 수 있습니다.
- **주문 상세 조회**: 주문 상태 및 배송지 정보를 확인하고 수정할 수 있습니다.

---

## 2. 실행 방법

터미널 2개를 열어 백엔드와 프론트엔드를 각각 실행합니다.

### 터미널 1 — 백엔드

```bash
# 1. 백엔드 디렉토리로 이동
cd backend

# 2. 의존성 설치
pip install -r requirements.txt

# 3. 환경변수 설정 (.env 파일 생성 후 API Key 입력)
cp .env.example .env

# 4. FastAPI 서버 실행
uvicorn main:app --reload
```

### 터미널 2 — 프론트엔드

```bash
# 1. 프론트엔드 디렉토리로 이동
cd frontend

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm start
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

"추가 사진은 dummy_data/ 폴더에 있습니다" 

---

## 3. 사용한 API 목록

### 3.1. 백엔드 내부 API 엔드포인트

| HTTP Method | Endpoint | 용도 |
|:---|:---|:---|
| `POST` | `/books/draft` | 새 포토북 초안 생성 |
| `GET` | `/books` | 모든 책 목록 조회 |
| `PATCH` | `/books/{bookId}/title` | 책 제목 수정 |
| `DELETE` | `/books/{bookId}` | 책 삭제 |
| `POST` | `/books/create` | Sweetbook API로 책 최종 생성 |
| `POST` | `/books/{bookId}/cover-photo` | 책 표지 사진 업로드 |
| `POST` | `/records` | 기록(사진+멘트) 추가 |
| `GET` | `/records/{book_id}` | 특정 책의 모든 기록 조회 |
| `PATCH` | `/records/{record_id}` | 개별 기록 수정 |
| `DELETE` | `/records/{record_id}` | 개별 기록 삭제 |
| `PATCH` | `/books/{book_id}/records/reorder` | 기록 순서 변경 |
| `GET` | `/templates/list` | 내지 템플릿 목록 조회 |
| `GET` | `/templates/detail/{template_uid}` | 템플릿 상세 조회 |
| `POST` | `/orders` | 주문 생성 |
| `GET` | `/orders` | 주문 목록 조회 |
| `GET` | `/orders/{orderUid}` | 주문 상세 조회 |
| `PATCH` | `/orders/{orderUid}/shipping` | 배송지 정보 수정 |
| `GET` | `/orders/estimate/{bookUid}` | 주문 견적 조회 |

### 3.2. 외부 Book Print API (api-sandbox.sweetbook.com)

| API | 용도 |
|:---|:---|
| `POST /v1/books` | 새 책 생성 |
| `POST /v1/books/{bookUid}/cover` | 책 표지 페이지 추가 |
| `POST /v1/books/{bookUid}/contents` | 책 내지 페이지 추가 |
| `POST /v1/books/{bookUid}/finalization` | 책 최종화 처리 |
| `GET /v1/templates` | 템플릿 목록 조회 |
| `GET /v1/templates/{templateUid}` | 템플릿 상세 조회 |
| `POST /v1/orders/estimate` | 주문 견적 조회 |
| `POST /v1/orders` | 주문 생성 |
| `GET /v1/orders/{orderUid}` | 주문 상세 조회 |
| `PATCH /v1/orders/{orderUid}/shipping` | 배송지 수정 |

---

## 4. AI 도구 사용 내역

| AI 도구 | 활용 내용 |
|:---|:---|
| Claude Code | 백엔드 API 라우팅 구조 설계, 데이터베이스 스키마 설계 및 마이그레이션, 버그 수정 |
| Google Gemini CLI Agent | 프론트엔드 드래그 앤 드롭 재정렬 기능 구현, 인라인 편집 기능 구현, 기록 추가 기능 구현 지원 |

---

## 5. 설계 의도

### 5.1. 왜 이 서비스를 선택했나요?
여행 사진, 맛집 탐방, 반려동물 성장 일기처럼 주제에 얽매이지 않고 내가 기억하고 싶은 순간을 자유롭게 분류해 책으로 만들 수 있는 서비스를 만들고 싶었습니다. 포토북이 특별한 날만을 위한 것이 아닌, 나만의 일상 아카이브로 기능할 수 있다는 점에서 이 서비스를 선택했습니다.

### 5.2. 이 서비스의 비즈니스 가능성을 어떻게 보나요?
실물 책 외에 PDF 다운로드처럼 가격 부담이 낮은 옵션을 추가하면 더 많은 사용자를 끌어들일 수 있다고 생각합니다. 또한 클릭 몇 번으로 자동 제작되는 간편 모드부터 레이아웃을 직접 편집하는 커스텀 모드까지, 사용자의 개입 수준을 선택할 수 있도록 확장하면 라이트 유저와 헤비 유저 모두를 만족시킬 수 있는 서비스가 될 것이라고 봅니다.

### 5.3. 더 시간이 있었다면 추가했을 기능
- **사용자 인증 및 계정 관리**: 로그인/회원가입, 사용자별 책·주문 내역 분리 관리 , JWT 인증 권한 관리
- **최종 인쇄 미리보기**: PDF 또는 이미지로 인쇄 레이아웃 시각적 확인
- **다양한 템플릿 및 커스터마이징**: 더 많은 내지/표지 템플릿, 직접 편집 기능
- **결제 시스템 연동**: PG사 연동으로 주문~결제 전체 자동화
