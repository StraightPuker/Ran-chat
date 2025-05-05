// const socket = io(`${location.protocol}//${location.hostname}:3000`); // App 서버 주소 (Reverse Proxy 설정 시 변경 가능)

// 채팅 관련 DOM 요소들
const input = document.getElementById("msg");
const btn = document.getElementById("sendBtn");
const chat = document.getElementById("chat");
const randomBtn = document.getElementById("random-btn");
const leaveBtn = document.getElementById("leave-btn");
const titleEl = document.getElementById("chat-mode-title");
const userCountEl = document.getElementById("user-count");
const myNicknameEl = document.getElementById("my-nickname");
const statusBox = document.getElementById("status-message");

let nickname = null;
let lastRenderedDate = null;
let currentRoom = "default"; // 자유 채팅방 기본값

// HTML에서 직접 호출되는 함수
function checkInput(inputElement) {
  if (!inputElement || !btn) return;
  btn.disabled = !inputElement.value.trim();
}

function clearChat() {
  if (!chat) return;
  while (chat.firstChild) {
    chat.removeChild(chat.firstChild);
  }
}

function formatEnglishDate(isoDate) {
  const date = new Date(isoDate);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function sendMessage() {
  if (!input || !window.socket) return;
  const text = input.value.trim();
  if (!text) return;

  window.socket.emit("message", { text, room: currentRoom });
  input.value = "";
  checkInput(input);
}

function addMessage(msg) {
  if (!chat) return;

  const msgDate = msg.date || new Date().toISOString().split("T")[0];
  const time = msg.time || "";
  const user = msg.user || "System";
  const text = msg.text || "";

  // [DATE-LABEL] → 날짜 라벨을 무조건 append (무조건 출력)
  if (text === "[DATE-LABEL]") {
    const dateLi = document.createElement("li");
    dateLi.textContent = `📅 ${formatEnglishDate(msgDate)}`;
    dateLi.style.textAlign = "center";
    dateLi.dataset.dateLabel = msgDate; // 중복 체크용
    chat.appendChild(dateLi);
    return;
  }

  // 중복 라벨 방지: 채팅 내에 이미 같은 날짜 라벨이 없다면 출력
  const existingDateLabel = Array.from(chat.children).find(
    el => el.dataset?.dateLabel === msgDate
  );

  if (!existingDateLabel) {
    const dateLi = document.createElement("li");
    dateLi.textContent = `📅 ${formatEnglishDate(msgDate)}`;
    dateLi.style.textAlign = "center";
    dateLi.dataset.dateLabel = msgDate;
    chat.appendChild(dateLi);
  }

  // 메시지 출력
  const li = document.createElement("li");
  li.textContent = `[${time}] ${user}: ${text}`;
  chat.appendChild(li);

  scrollToBottom();
}

function showStatus(msg, duration = 0) {
  if (!statusBox) return;
  statusBox.textContent = msg;
  statusBox.style.display = "block";

  if (duration > 0) {
    setTimeout(() => {
      statusBox.style.display = "none";
    }, duration);
  }
}

function scrollToBottom() {
  const container = document.getElementById("chat-container");
  if (!container) return;
  container.scrollTop = container.scrollHeight;
}

// 채팅 페이지 초기화
function initializeChatPage() {
  if (!input || !btn || !chat || !window.socket) return;

  // 이벤트 리스너 등록
  input.addEventListener("input", () => checkInput(input));
  btn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // 랜덤 매칭 요청
  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      window.socket.emit("join-random");
      randomBtn.disabled = true;
    });
  }

  // 랜덤 매칭 나가기
  if (leaveBtn) {
    leaveBtn.addEventListener("click", () => {
      window.socket.emit("leave-random");
      currentRoom = "default";
      lastRenderedDate = null;
      leaveBtn.style.display = "none";
      randomBtn.style.display = "inline-block";
      randomBtn.disabled = false;
      if (titleEl) titleEl.textContent = "💬 Free chat";
    });
  }

  // Socket.IO 이벤트 리스너 설정
  window.socket.on("connect", () => {
    if (currentRoom === "default") {
      window.socket.emit("requestHistory", "default");
    }
  });

  window.socket.on("setNickname", (name) => {
    nickname = name;
    if (myNicknameEl) {
      myNicknameEl.textContent = `My nickname: ${nickname}`;
    }
    if (input) {
      input.disabled = false;
      input.focus();
    }
    if (btn) {
      btn.disabled = true;
    }
  });

  window.socket.on("loadHistory", (history) => {
    clearChat();
    history.forEach(addMessage);
  });

  window.socket.on("message", (msg) => {
    if (msg.room === currentRoom || (!msg.room && currentRoom === "default")) {
      addMessage(msg);
    }
  });

  window.socket.on("userCount", (count) => {
    if (userCountEl) {
      userCountEl.textContent = `${count}`;
    }
  });

  window.socket.on("random-wait", () => {
    showStatus("🔎 Finding a random chat partner...");
  });

  window.socket.on("random-start", ({ room }) => {
    showStatus("✅ Match found! Entering the room...");
    setTimeout(() => {
      currentRoom = room;
      lastRenderedDate = null;

      if (randomBtn) randomBtn.disabled = true;
      if (leaveBtn) leaveBtn.style.display = "inline-block";
      if (randomBtn) randomBtn.style.display = "none";
      if (statusBox) statusBox.style.display = "none";
      if (titleEl) titleEl.textContent = "💬 Ran-chat";
    }, 1000);
  });

  // 초기 상태 설정
  checkInput(input);
}

// 페이지 로드 완료 후 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeChatPage);
} else {
  initializeChatPage();
}