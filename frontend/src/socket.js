import { io } from "socket.io-client";

let socket;

export const getSocket = () => {
  if (!socket) {
    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });
  }
  return socket;
};

export { socket };
