// const socket = io(`${location.protocol}//${location.hostname}:3000`); // App 서버 주소 (Reverse Proxy 설정 시 변경 가능)
const socket = io(); 
const input = document.getElementById("msg");
const btn = document.getElementById("sendBtn");
const chat = document.getElementById("chat");
const randomBtn = document.getElementById("random-btn");
const leaveBtn = document.getElementById("leave-btn");
const titleEl = document.getElementById("chat-mode-title");

let nickname = null;
let lastRenderedDate = null;
let currentRoom = "default"; // 자유 채팅방 기본값

window.addEventListener("DOMContentLoaded", () => {
  checkInput();
});

function checkInput() {
  const isValid = input.value.trim() !== "";
  btn.disabled = !isValid;
  btn.classList.toggle("active", isValid);
}

function clearChat() {
  while (chat.firstChild) {
    chat.removeChild(chat.firstChild);
  }
}

btn.addEventListener("click", sendMessage);
input.addEventListener("input", checkInput);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

function formatEnglishDate(isoDate) {
  const date = new Date(isoDate);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  socket.emit("message", { text, room: currentRoom });
  input.value = "";
  checkInput();
}

function addMessage(msg) {
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

// reconnect 이후 기본방이면 히스토리 다시 요청
socket.on("connect", () => {
  if (currentRoom === "default") {
    socket.emit("requestHistory", "default");
  }
});

socket.on("setNickname", (name) => {
  nickname = name;
  document.getElementById("my-nickname").textContent = `My nickname: ${nickname}`;
  input.disabled = false;
  btn.disabled = true;
  input.focus();
});

socket.on("loadHistory", (history) => {
  clearChat();
  history.forEach(addMessage);
});

socket.on("message", (msg) => {
  if (msg.room === currentRoom || (!msg.room && currentRoom === "default")) {
    addMessage(msg);
  }
});

socket.on("userCount", (count) => {
  document.getElementById("user-count").textContent = `${count}`;
});

// 랜덤 매칭 요청
randomBtn.addEventListener("click", () => {
  socket.emit("join-random");
  randomBtn.disabled = true; // 매칭 요청 중엔 중복 매칭 요청 방지
});

// 랜덤 매칭 나가기
leaveBtn.addEventListener("click", () => {
  socket.emit("leave-random");
  currentRoom = "default";
  lastRenderedDate = null;
  leaveBtn.style.display = "none";
  randomBtn.style.display = "inline-block";
  randomBtn.disabled = false;
  titleEl.textContent = "💬 Free chat";
});

const statusBox = document.getElementById("status-message");

function showStatus(msg, duration = 0) {
  statusBox.textContent = msg;
  statusBox.style.display = "block";

  if (duration > 0) {
    setTimeout(() => {
      statusBox.style.display = "none";
    }, duration);
  }
}

// 랜덤 매칭 대기
socket.on("random-wait", () => {
  showStatus("🔎 Finding a random chat partner...");
});

socket.on("random-start", ({ room }) => {
  showStatus("✅ Match found! Entering the room...");
  setTimeout(() => {
    currentRoom = room; // 현재 방 이름 갱신
    lastRenderedDate = null; // 날짜 초기화!

    randomBtn.disabled = true;
    leaveBtn.style.display = "inline-block";
    randomBtn.style.display = "none";
    
    statusBox.style.display = "none";

    titleEl.textContent = "💬 Ran-chat";
  }, 1000); // 들어가기 전 1초 딜레이이
});

function scrollToBottom() {
  const container = document.getElementById("chat-container");
  container.scrollTop = container.scrollHeight;
}