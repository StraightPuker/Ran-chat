# Real-time Chat & Community Application

실시간 채팅과 게시판 기능이 통합된 웹 애플리케이션입니다. Socket.IO를 활용한 실시간 통신으로 즉각적인 사용자 상호작용을 제공합니다.

## 🌐 배포 정보
- **서비스 URL**: http://43.200.170.238/
- **상태**: 활성화 (도메인 설정 예정)

## 주요 기능

### 💬 채팅 시스템
- 자유 채팅방: 모든 사용자가 참여할 수 있는 공개 채팅
- 랜덤 채팅: 1:1 랜덤 매칭을 통한 익명 채팅
- 실시간 사용자 수 표시
- 자동 닉네임 생성
- 채팅 히스토리 저장 및 불러오기
- 날짜별 메시지 구분

### 🧾 커뮤니티 게시판
- 실시간 게시글 목록 업데이트
- 인기 게시글(Hot Posts) 섹션
- 댓글 시스템
- 게시글 조회수 기반 인기도 측정
- 실시간 댓글 업데이트

## 기술 스택

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Socket.IO Client

### Backend
- Node.js
- Express
- Socket.IO
- MongoDB

### 인프라
- Nginx (리버스 프록시)
- Docker & Docker Compose

## 프로젝트 구조

```
web/
├── public/
│   ├── index.html      # 메인 페이지 (채팅 + 게시판)
│   ├── board.html      # 게시판 페이지
│   ├── style.css       # 메인 스타일
│   ├── board.css       # 게시판 스타일
│   ├── script.js       # 채팅 관련 스크립트
│   ├── board.js        # 게시판 관련 스크립트
│   └── socket-manager.js # 소켓 연결 관리
├── nginx.conf          # Nginx 설정
└── README.md

app/
├── server.js           # 메인 서버
├── routes/
│   └── board.js        # 게시판 라우터
├── models/
│   ├── post.js         # 게시글 모델
│   └── comment.js      # 댓글 모델
└── package.json

docker/
├── docker-compose.yml  # 컨테이너 구성
├── web.Dockerfile     # 웹 서버 컨테이너
├── app.Dockerfile     # 애플리케이션 서버 컨테이너
└── mongo.Dockerfile   # MongoDB 컨테이너
```

## 주요 기능 설명

### 실시간 통신 구조
- 단일 Socket.IO 연결을 통한 효율적인 실시간 통신
- iframe을 통해 게시판과 채팅 시스템 간의 소켓 공유
- 이벤트 기반 실시간 업데이트

### 채팅 시스템
1. 자유 채팅
   - 모든 사용자가 참여 가능한 공개 채팅방
   - 실시간 사용자 수 표시
   - 메시지 히스토리 저장

2. 랜덤 채팅
   - 1:1 익명 채팅 매칭 시스템
   - 자동 매칭 및 방 생성
   - 채팅방 나가기 기능

### 게시판 시스템
1. 게시글 관리
   - CRUD 작업의 실시간 반영
   - 조회수 기반 인기 게시글 선정
   - 실시간 목록 업데이트

2. 댓글 시스템
   - 실시간 댓글 업데이트
   - 댓글 작성 시 게시글 인기도 반영

## 배포 환경

### 컨테이너 구성
- 웹 서버 (Nginx)
- 애플리케이션 서버 (Node.js)
- 데이터베이스 (MongoDB)

### 배포 프로세스
1. Docker Compose를 통한 컨테이너 오케스트레이션
2. Nginx 리버스 프록시를 통한 요청 분배

## 설치 및 실행

1. 저장소 클론
```bash
git clone [repository-url]
```

2. 의존성 설치
```bash
# 백엔드 의존성 설치
cd app
npm install

# 프론트엔드는 별도의 설치 불필요
```

3. 환경 설정
- MongoDB 연결 설정
- Nginx 설정 적용

4. Docker Compose로 실행
```bash
docker-compose up -d
```

5. 접속
- 개발 환경: `http://localhost:80`
- EC2 프로덕션 환경: http://43.200.170.238/
- BCS 프로덕션 환경: http://210.109.54.76/

📌 기술 참고
이 애플리케이션의 설계와 구현에는 OpenAI의 [ChatGPT](https://chat.openai.com/)와 AI 기반 개발 환경인 [Cursor](https://www.cursor.so/)가 적극 활용되었습니다.