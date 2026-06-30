import { createServer } from "http";
import { Server } from "socket.io";

// Types
interface ChatUser {
  id: string;
  name: string;
  role: "student" | "trainer";
  socketId: string;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderRole: "student" | "trainer";
  content: string;
  messageType: "TEXT" | "CODE" | "IMAGE";
  timestamp: string;
}

interface Session {
  users: Map<string, ChatUser>;
  messages: ChatMessage[];
}

// In-memory storage
const sessions = new Map<string, Session>();

function getSession(sessionId: string): Session {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      users: new Map(),
      messages: [],
    });
  }
  return sessions.get(sessionId)!;
}

// Create HTTP server and attach Socket.IO
const httpServer = createServer();
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: "/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const PORT = 3004;

// Track socket-to-user mapping
const socketUserMap = new Map<string, { sessionId: string; userId: string }>();

io.on("connection", (socket) => {
  const tempUserId = `temp_${socket.id}`;
  console.log(`✅ New connection: ${socket.id} (temp user: ${tempUserId})`);

  // Send temporary user ID to client
  socket.emit("connected", { tempUserId, socketId: socket.id });

  // Join a doubt session room
  socket.on("join-session", (data: {
    sessionId: string;
    userId: string;
    userName: string;
    role: "student" | "trainer";
  }) => {
    const { sessionId, userId, userName, role } = data;
    const session = getSession(sessionId);

    console.log(`📥 User "${userName}" (${userId}) joined session ${sessionId} as ${role}`);

    // Store user info
    const user: ChatUser = {
      id: userId,
      name: userName,
      role,
      socketId: socket.id,
    };
    session.users.set(userId, user);
    socketUserMap.set(socket.id, { sessionId, userId });

    // Join the Socket.IO room
    socket.join(sessionId);

    // Send existing messages to the joining user
    socket.emit("session-history", {
      sessionId,
      messages: session.messages,
      activeUsers: Array.from(session.users.values()).map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
      })),
    });

    // Add mock trainer welcome message if this is the first user and a student is joining
    if (role === "student" && session.messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `msg_welcome_${Date.now()}`,
        sessionId,
        senderId: "trainer-bot",
        senderName: "Trainer",
        senderRole: "trainer",
        content: `Welcome to the doubt session! Feel free to ask your questions here. I'll do my best to help you out. 🎓`,
        messageType: "TEXT",
        timestamp: new Date().toISOString(),
      };
      session.messages.push(welcomeMessage);
      io.to(sessionId).emit("new-message", welcomeMessage);
      console.log(`🤖 Sent trainer welcome message to session ${sessionId}`);
    }

    // Broadcast user joined notification to the room (excluding the joiner)
    socket.to(sessionId).emit("user-joined", {
      sessionId,
      user: { id: userId, name: userName, role },
      activeUsers: Array.from(session.users.values()).map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
      })),
      timestamp: new Date().toISOString(),
    });

    console.log(`👥 Active users in session ${sessionId}: ${session.users.size}`);
  });

  // Send a message to the session
  socket.on("send-message", (data: {
    sessionId: string;
    content: string;
    messageType: "TEXT" | "CODE" | "IMAGE";
  }) => {
    const { sessionId, content, messageType } = data;
    const userInfo = socketUserMap.get(socket.id);

    if (!userInfo) {
      console.warn(`⚠️ Unregistered socket ${socket.id} tried to send a message`);
      return;
    }

    const session = getSession(sessionId);
    const user = session.users.get(userInfo.userId);

    if (!user) {
      console.warn(`⚠️ User ${userInfo.userId} not found in session ${sessionId}`);
      return;
    }

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      sessionId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      content,
      messageType,
      timestamp: new Date().toISOString(),
    };

    // Store in memory
    session.messages.push(message);

    // Broadcast to all users in the session (including sender)
    io.to(sessionId).emit("new-message", message);

    console.log(`💬 [${session.messages.length}] ${user.name} (${user.role}): ${content.substring(0, 80)}${content.length > 80 ? "..." : ""}`);
  });

  // Typing indicator
  socket.on("typing", (data: { sessionId: string; userName: string }) => {
    const { sessionId, userName } = data;
    socket.to(sessionId).emit("user-typing", {
      sessionId,
      userName,
      timestamp: new Date().toISOString(),
    });
    console.log(`⌨️ ${userName} is typing in session ${sessionId}`);
  });

  // Get active users in a session
  socket.on("get-active-users", (data: { sessionId: string }, callback: (users: Array<{ id: string; name: string; role: string }>) => void) => {
    const { sessionId } = data;
    const session = getSession(sessionId);
    const users = Array.from(session.users.values()).map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
    }));
    console.log(`📋 Active users requested for session ${sessionId}: ${users.length}`);
    if (typeof callback === "function") {
      callback(users);
    }
  });

  // Disconnect
  socket.on("disconnect", (reason) => {
    const userInfo = socketUserMap.get(socket.id);

    if (userInfo) {
      const session = getSession(userInfo.sessionId);
      session.users.delete(userInfo.userId);
      socketUserMap.delete(socket.id);

      socket.leave(userInfo.sessionId);

      // Broadcast user left
      io.to(userInfo.sessionId).emit("user-left", {
        sessionId: userInfo.sessionId,
        userId: userInfo.userId,
        activeUsers: Array.from(session.users.values()).map((u) => ({
          id: u.id,
          name: u.name,
          role: u.role,
        })),
        timestamp: new Date().toISOString(),
      });

      console.log(`👋 User ${userInfo.userId} disconnected from session ${userInfo.sessionId}. Reason: ${reason}`);
      console.log(`👥 Remaining users in session ${userInfo.sessionId}: ${session.users.size}`);
    } else {
      console.log(`🔌 Socket ${socket.id} disconnected. Reason: ${reason}`);
    }
  });

  // Error handler
  socket.on("error", (error) => {
    console.error(`Socket error (${socket.id}):`, error);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Chat service running on port ${PORT}`);
});

// Periodic cleanup for empty sessions (every 5 minutes)
setInterval(() => {
  let cleaned = 0;
  for (const [sessionId, session] of sessions.entries()) {
    if (session.users.size === 0) {
      sessions.delete(sessionId);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} empty session(s)`);
  }
}, 5 * 60 * 1000);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM signal, shutting down chat service...");
  httpServer.close(() => {
    console.log("Chat service closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("Received SIGINT signal, shutting down chat service...");
  httpServer.close(() => {
    console.log("Chat service closed");
    process.exit(0);
  });
});