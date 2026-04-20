import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "./socket";
import { authApi } from "../lib/authApi";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const connectingRef = useRef(false);

  useEffect(() => {
    let cleanup = false;

    const syncSocket = async () => {
      const { session } = await authApi.getSession();
      const token = session?.access_token ?? null;

      if (!token) {
        disconnectSocket();
        setSocket(null);
        connectingRef.current = false;
        return;
      }

      if (connectingRef.current || cleanup) {
        return;
      }

      connectingRef.current = true;
      const nextSocket = connectSocket(token);
      setSocket(nextSocket);
    };

    void syncSocket();

    const unsubscribe = authApi.onAuthStateChange((_user, session) => {
      const token = session?.access_token ?? null;

      if (!token) {
        disconnectSocket();
        setSocket(null);
        connectingRef.current = false;
        return;
      }

      if (connectingRef.current || cleanup) {
        return;
      }

      connectingRef.current = true;
      const nextSocket = connectSocket(token);
      setSocket(nextSocket);
    });

    return () => {
      cleanup = true;
      connectingRef.current = false;
      unsubscribe();
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};

