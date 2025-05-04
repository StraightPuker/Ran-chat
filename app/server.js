const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const waitingUsers = [];  // 대기 중인 소켓 ID 저장
const randomRooms = {};   // socket.id ↔ roomName 매핑


// ✅ 환경 설정
const app = express();
const boardRoutes = require('./routes/board'); // board.js 추가
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

app.use(express.static('web/public')); // 정적 파일 제공
app.use('/api', boardRoutes); // board.js - API 라우트 연결
console.log("✅ boardRoutes 로딩 테스트:", boardRoutes);

// ✅ MongoDB 연결
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/chatdb';

mongoose.connect(MONGO_URL)
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch(err => console.error("❌ MongoDB 연결 실패:", err));

// ✅ Mongo 스키마 정의
const Chat = mongoose.model('Chat', new mongoose.Schema({
  user: String,
  text: String,
  time: String,
  date: String,
  room: String  // 랜덤방 구분용
}));

const nicknames = ["Applepie", "Bananabread", "Chocolatecake", "Donut", "Eclair", "Frenchtoast", "Grapefruit", "Honeycrisp", "Icecream", "Jelly"];

io.on('connection', async (socket) => {
  setTimeout(() => {
    io.emit('userCount', io.engine.clientsCount);
  }, 200);

  socket.join("default");

  const nickname = nicknames[Math.floor(Math.random() * nicknames.length)] + Math.floor(Math.random() * 1000);
  socket.nickname = nickname;
  socket.emit('setNickname', nickname);

  const history = await Chat.find({ room: "default" }).sort({ _id: -1 }).limit(50).lean();

  history.reverse();

  socket.emit('loadHistory', history);

  // 자유 채팅 진입 후, 채팅 로그 불러오기
  socket.on("requestHistory", async (roomName) => {
    const history = await Chat.find({ room: roomName }).sort({ _id: -1 }).limit(50).lean();
    history.reverse();
    socket.emit("loadHistory", history);
  });

  // 랜덤 채팅
  socket.on("join-random", async () => {
    console.log("🔁 join-random 요청:", socket.id);

    if (waitingUsers.length > 0) {
      if (waitingUsers.includes(socket.id)) {
        // 이미 대기열에 있는 경우 무시
        return;
      }

      const now = new Date();
      const partnerSocketId = waitingUsers.pop();
      const roomName = `random-${socket.id}-${partnerSocketId}`;
      const date = now.toISOString().split("T")[0];
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Seoul'
      });
    
      console.log("✅ 매칭 성공:", socket.id, "<->", partnerSocketId);

      socket.join(roomName);
      io.to(partnerSocketId).socketsJoin(roomName);

      randomRooms[socket.id] = roomName;
      randomRooms[partnerSocketId] = roomName;

      // 히스토리 불러오기 (랜덤방용)
      const history = await Chat.find({ room: roomName }).sort({ _id: 1 }).limit(50);
      io.to(socket.id).emit("loadHistory", history);
      io.to(partnerSocketId).emit("loadHistory", history);

      // 먼저 날짜 라벨용 메시지 emit
      io.to(roomName).emit("message", {
        system: true,
        text: "[DATE-LABEL]",
        date,
      });

      // 입장 메시지 양쪽에게 전송
      const partnerSocket = io.sockets.sockets.get(partnerSocketId);
      setTimeout(() => {
        io.to(roomName).emit("message", {
          system: true,
          text: `${socket.nickname} is now chatting with ${partnerSocket.nickname}.`,
          time,
          date,
        });
      
        io.to(roomName).emit("random-start", { room: roomName });
      }, 50);
    } else {
      waitingUsers.push(socket.id);
      socket.emit("random-wait");
    }
  });

  socket.on('message', async ({ text, room }) => {
    const now = new Date();
    const message = {
      user: socket.nickname || "???",
      text,
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Seoul' }),
      date: now.toISOString().split('T')[0],
      room
    };
  
    // 해당 room 또는 기본 room으로 메시지 전송
    io.to(room || "default").emit("message", message);
  
    // DB에 저장
    try {
      await new Chat(message).save();
    } catch (err) {
      console.error("❌ 채팅 저장 실패:", err);
    }
  });

  socket.on("leave-random", async () => {
    const room = randomRooms[socket.id];

    if (room) {
      // 상대방 소켓 ID 찾기
      const partnerId = Object.keys(randomRooms).find(id => 
        randomRooms[id] === room && id !== socket.id
      );

      socket.leave(room);
      delete randomRooms[socket.id];
      socket.join("default");  // 기본 방으로 복귀

      const now = new Date();
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Seoul'
      });
      const date = now.toISOString().split('T')[0];

      // 상대방에게 '누가 나갔습니다' 메시지 전송
      if (partnerId) {
        io.to(partnerId).emit("message", {
          system: true,
          text: `${socket.nickname} has left the conversation.`,
          time,
          date,
          room,
        });
      }
      
      // 방 인원 확인 후 DB 삭제
      if (room && room.startsWith("random-")) {
        const socketsInRoom = io.sockets.adapter.rooms.get(room);
        if (!socketsInRoom || socketsInRoom.size === 0) {
          console.log("🧹 Deleting chat messages for random room by leave-random:", room);
          await Chat.deleteMany({ room });
        }
      } else {
        console.warn("❗ Unexpected room name during deletion by leave-random:", room);
      }
      
      // 자유 채팅방 로그 다시 보내기
      const history = await Chat.find({ room: "default" }).sort({ _id: -1 }).limit(50).lean();
      history.reverse();
      socket.emit("loadHistory", history);
    }
  });

  socket.on('disconnect', async () => {
    setTimeout(() => {
      io.emit('userCount', io.engine.clientsCount);
    }, 200);

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Seoul'
    });
    const date = now.toISOString().split('T')[0];

    // 랜덤채팅 대기열에서 제거
    const index = waitingUsers.indexOf(socket.id);
    if (index !== -1) waitingUsers.splice(index, 1);

    // 랜덤채팅 방 제거 처리
    const room = randomRooms[socket.id];
    if (room) {
      socket.leave(room);
      delete randomRooms[socket.id];

      // 상대방에게 '누가 나갔습니다' 메시지 전송
      io.to(room).emit('message', {
        system: true,
        text: `${socket.nickname} has left the conversation.`,
        time,
        date,
      });

      // DB에서 해당 룸 삭제
      if (room && room.startsWith("random-")) {
        const socketsInRoom = io.sockets.adapter.rooms.get(room);
        if (!socketsInRoom || socketsInRoom.size === 0) {
          console.log("🧹 Deleting chat messages for random room by disconnect:", room);
          await Chat.deleteMany({ room });
        }
      } else {
        console.warn("❗ Unexpected room name during deletion by disconnect:", room);
      }
    }
  });
});

server.listen(3000, () => {
  console.log("🚀 서버 실행 중: http://localhost:3000");
});