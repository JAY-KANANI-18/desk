import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "./socket";
import { supabase } from "../lib/supabase";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const connectingRef = useRef(false); // ✅ ref-based guard, survives re-renders

  useEffect(() => {
    let cleanup = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const token = session?.access_token ?? null;

        if (!token) {
          disconnectSocket();
          setSocket(null);
          connectingRef.current = false;
          return;
        }

        // ✅ Skip if already connecting/connected with same token
        if (connectingRef.current) return;
        connectingRef.current = true;

        if (cleanup) return;

        const s = connectSocket(token);
        setSocket(s);
      }
    );

    return () => {
      cleanup = true;
      connectingRef.current = false;
      subscription.unsubscribe();
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