import { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { connectSocket } from "./socket";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }) {

  const [socket, setSocket] = useState<Socket | null>(null);
  const token = localStorage.getItem("access_token");

  useEffect(() => {

    if (!token) return;

    const s = connectSocket(JSON.parse(token));

    setSocket(s);

  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}