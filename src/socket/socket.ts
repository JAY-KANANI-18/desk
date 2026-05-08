import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;
let isConnecting = false; // ✅ prevent race conditions

const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000/api";

export function connectSocket(token: string): Socket {
  // ✅ Reuse if same token — connected or still connecting
  if (socket && currentToken === token) {
    return socket;
  }

  // ✅ Kill old socket if token changed
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentToken = null;
  }

  if (isConnecting) {
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
  });

  socket.on("disconnect", (reason) => {
  });

  socket.on("connect_error", (err) => {
    isConnecting = false;
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
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
