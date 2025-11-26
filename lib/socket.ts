// lib/socket.ts

import { Server as HTTPServer } from "http";
import { Socket as ServerSocket, Server } from "socket.io";

let io: Server | null = null;

export function initializeSocket(httpServer: HTTPServer) {
  if (!io) {
    io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket: ServerSocket) => {
      console.log("Utilisateur connecté:", socket.id);

      socket.on("join-auction", (auctionId: string) => {
        socket.join(`auction-${auctionId}`);
        console.log(`Utilisateur ${socket.id} a rejoint l'enchère ${auctionId}`);
      });

      socket.on("disconnect", () => {
        console.log("Utilisateur déconnecté:", socket.id);
      });
    });
  }

  return io;
}

export function getIO() {
  return io;
}

export function emitBidUpdate(auctionId: string, bid: unknown) {
  if (io) {
    io.to(`auction-${auctionId}`).emit("bid-update", bid);
  }
}
