> ⚠️ 본 프로젝트는 현재 개발 중입니다. 기능 및 UI는 예고 없이 변경될 수 있습니다.

# 🎲 Ran-chat - 실시간 랜덤 채팅 & 커뮤니티 웹 애플리케이션

> 낯선 사용자와 1:1로 실시간 연결되는 랜덤 채팅 서비스와 누구나 참여할 수 있는 자유 채팅 채널  
> 일본식 스레드형 구조의 익명 커뮤니티 게시판 기능을 통합한 웹 애플리케이션입니다.  
> 프론트엔드, 백엔드, 데이터베이스, 인프라까지 전반적인 구조를 단독 설계 및 구현했습니다.

---

## 🌐 배포 주소

📍 http://210.109.54.76/ (현재 도메인 설정 안 되어 있음.)  
📁 GitHub: [https://github.com/StraightPuker/Ran-chat]

---

## 🛠 사용 기술 스택

| 구분       | 기술                                |
|------------|-------------------------------------|
| Frontend   | HTML, CSS, JavaScript (Vanilla)     |
| Backend    | Node.js, Express, Socket.IO         |
| Database   | MongoDB, Mongoose                   |
| Infra      | Docker, Docker Compose, Nginx       |
| 기타       | REST API, WebSocket, dotenv 등      |

---

## 🧩 주요 기능

### 랜덤 채팅 기능
- 사용자 대기열 기반 1:1 매칭 시스템
- 동일 유저 간 중복 매칭 방지
- 상대 퇴장 시 자동 방 제거 및 시스템 메시지 출력
- 날짜 라벨을 포함한 메시지 UI 구성
- 채팅 로그 MongoDB에 자동 저장

### 자유 채팅 기능
- 누구나 입장 가능한 공용 채팅 채널 (default room)
- 날짜 기준 메시지 구분 및 자동 스크롤 기능 제공

### 게시판(커뮤니티) 기능
- 일본 커뮤니티(예: 2ch) 스타일의 스레드형 익명 게시판
- 게시글(Post)과 댓글(Comment) Mongoose 모델로 분리 설계
- 댓글은 시간 순으로 스레드 형태로 이어짐
- 채팅창과 게시판을 화면 분할 레이아웃으로 동시에 출력

---

## 🧠 설계 및 개발 특징

- 채팅방 구분 구조 (기본 채널 vs 랜덤 매칭 채널) 및 상태 기반 Socket 이벤트 처리
- 클라이언트 측 dataset.dateLabel 활용으로 중복 날짜 라벨 제거 로직 구현
- 시스템 메시지와 사용자 메시지의 emit 타이밍 분리로 UX 향상
- 게시판 기능은 REST API 기반 비동기 처리, MongoDB와 연동하여 직접 CRUD 구현

---

## 🚀 인프라 및 배포 환경

- 카카오 클라우드의 Ubuntu 24.04 LTS 인스턴스에서 서비스 운영  
- 인스턴스 사양: t1.small (2 vCPU / 2 GiB 메모리)  
- 보안 그룹 설정으로 SSH(포트 22) 및 애플리케이션 포트 접근 제어  
- Docker Compose 기반 멀티 컨테이너 구성으로 웹/서버/DB를 분리하여 배포  
- Nginx 리버스 프록시를 통해 정적 리소스 및 API/Socket 요청을 효율적으로 분기 처리  
- 클라우드 환경에서도 빠른 유지보수 및 배포를 고려한 실무 수준 인프라 설계

---

## 📝 보조 도구 활용

- Cursor, ChatGPT 등의 개발 보조 도구를 활용하여 초기 코드 생성 및 구조 설계를 빠르게 수행
- 자동 생성된 코드는 프로젝트 구조에 맞게 직접 수정, 연결, 통합
- 특히 Socket 이벤트 설계, 상태 분기, 날짜 UI 처리 등의 로직은 직접 분석 후 자율적으로 구현
- 단순 사용을 넘어 이해 기반의 활용 및 실무 대응력 향상에 초점을 맞춤

---

## 📁 디렉토리 구조

```plaintext
CHAT-APP/
├── app/
│   ├── models/            # Mongoose 모델 (post.js, comment.js)
│   ├── routes/            # 게시판 라우터 (board.js)
│   ├── server.js          # Express + Socket.IO 서버
│   ├── package.json
│   └── Dockerfile
├── web/
│   ├── public/
│   │   ├── index.html     # 채팅 화면
│   │   ├── board.html     # 게시판 화면
│   │   ├── script.js      # 채팅 로직
│   │   ├── board.js       # 게시판 로직
│   │   ├── style.css
│   │   └── board.css
│   ├── nginx.conf         # Nginx 설정
│   └── Dockerfile
├── mongo/
│   └── Dockerfile         # MongoDB 컨테이너 설정
├── docker-compose.yml     # 전체 오케스트레이션 구성
└── README.md
