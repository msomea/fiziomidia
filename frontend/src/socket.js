import { io } from "socket.io-client";

let socket;

export const getSocket = () => {
  if (!socket) {
    let SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;

    // Remove /api path if present (socket connects to root)
    if (SOCKET_URL && SOCKET_URL.endsWith("/api")) {
      SOCKET_URL = SOCKET_URL.slice(0, -4); // Remove last 4 chars (/api)
    }

    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"], // Add polling as fallback
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000, // Increase timeout to 10 seconds
    });

    // Error handling
    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
    });
  }
  return socket;
};

export { socket };
