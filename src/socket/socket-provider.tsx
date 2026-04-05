import { createContext, useContext, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { connectSocket } from "./socket";
import { supabase } from "../lib/supabase";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let activeSocket: Socket | null = null;

    const getSessionAndConnect = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token ?? null;
      console.log("accessTokensocket",accessToken);
      
      setToken(accessToken);

      if (accessToken) {
        activeSocket = connectSocket(accessToken);
        setSocket(activeSocket);
      }
    };

    getSessionAndConnect();
    console.log("secket connectiong");
    

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const accessToken = session?.access_token ?? null;
      console.log("socker access",accessToken);
      
      setToken(accessToken);

      if (activeSocket) {
        activeSocket.disconnect();
        activeSocket = null;
      }

      if (accessToken) {
        activeSocket = connectSocket(accessToken);
        setSocket(activeSocket);
      } else {
        setSocket(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (activeSocket) {
        activeSocket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}