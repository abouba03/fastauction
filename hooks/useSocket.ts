// hooks/useSocket.ts

import { useEffect } from "react";

// Project now uses Supabase Realtime instead of Socket.IO.
// This file is a no-op stub to avoid importing socket.io-client during build.
export function useSocket() {
  useEffect(() => {
    return () => {
      // no-op cleanup
    };
  }, []);

  return { socket: null as null, isConnected: false };
}
