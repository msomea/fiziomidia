export const API_URL =
  import.meta.env.VITE_API_URL;

const socketUrlEnv =
  import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;

// Remove /api path from socket URL if present (socket should connect to root)
export const SOCKET_URL = socketUrlEnv?.replace(/\/api\/?$/, "") || "";

export const ASSET_URL = import.meta.env.VITE_SOCKET_URL;