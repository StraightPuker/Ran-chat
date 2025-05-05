// 전역 소켓 인스턴스 관리
if (!window.socket) {
  window.socket = io();
  
  // 기본 이벤트 리스너 설정
  window.socket.on("connect", () => {
    console.log("Socket connected");
  });

  window.socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });
}

// 소켓 인스턴스 export
const socket = window.socket; 