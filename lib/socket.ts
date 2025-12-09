// lib/socket.ts

// Socket.IO was removed in favor of Supabase Realtime.
// Keep a small no-op shim to avoid build errors from leftover imports.

import { Server as HTTPServer } from "http";

let initialized = false;

export function initializeSocket(_httpServer: HTTPServer) {
  // No-op: socket server intentionally removed.
  initialized = true;
  return null;
}

export function getIO() {
  return null;
}

export function emitBidUpdate(_auctionId: string, _bid: unknown) {
  // No-op: handled by Supabase Realtime now.
}
