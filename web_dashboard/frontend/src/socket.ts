import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  autoConnect: true,
  withCredentials: true,
});

(window as any).socket = socket; // 👈 Add this line
