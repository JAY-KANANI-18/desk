import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;
let isConnecting = false; // ✅ prevent race conditions

const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000/api";

export function connectSocket(token: string): Socket {
  // ✅ Reuse if same token — connected or still connecting
  if (socket && currentToken === token) {
    console.log("♻️ Reusing socket:", socket.id);
    return socket;
  }

  // ✅ Kill old socket if token changed
  if (socket) {
    console.log("🧹 Killing old socket");
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentToken = null;
  }

  if (isConnecting) {
    console.log("⏳ Already connecting, skip");
    return socket!;
  }

  isConnecting = true;
  currentToken = token;

  socket = io(`${SOCKET_BASE}/inbox`, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    isConnecting = false;
    console.log("✅ Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    isConnecting = false;
    console.error("🚨 connect_error:", err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    console.log("🔌 Disconnecting socket:", socket.id);
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentToken = null;
    isConnecting = false;
  }
}

export function getSocket(): Socket | null {
  return socket;
}