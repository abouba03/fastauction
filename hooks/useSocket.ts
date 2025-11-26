// hooks/useSocket.ts

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
        path: "/socket.io", // Standard path, but good to be explicit if needed
        autoConnect: true,
      });
    }

    if (!socket.connected) {
      socket.connect();
    }

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Initial check
    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket?.off("connect", onConnect);
      socket?.off("disconnect", onDisconnect);
      // We don't necessarily want to disconnect on unmount if we want to keep the connection alive across pages,
      // but for now, let's keep it simple. If we want a singleton across the app, we shouldn't disconnect here.
      // For this specific app, let's NOT disconnect on unmount to avoid reconnection spam on navigation.
    };
  }, []);

  return { socket, isConnected };
}
