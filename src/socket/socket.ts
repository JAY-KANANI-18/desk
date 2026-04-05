import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const SOCKET_BASE =  import.meta.env.VITE_SOCKET_URL || "http://localhost:3000/api";

export function connectSocket(token: string): Socket {
  console.log({SOCKET_BASE,token,socket});
  
  if (socket) return socket;   // prevents duplicate connections

  socket = io(`${SOCKET_BASE}/inbox`, {
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
}

export function getSocket() {
  return socket;
}