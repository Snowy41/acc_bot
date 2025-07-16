import { io } from "socket.io-client";

// Helper to dynamically determine the correct host, protocol, and port.
const getSocketUrl = () => {
  // Use the current page's protocol (http/https) and host (vanish.rip, localhost, etc)
  let url = window.location.origin;

  // If you're running locally, you might want to use a custom port (optional)
  // if (window.location.hostname === "localhost") {
  //   url = "http://localhost:5000";
  // }
  return url;
};

export const socket = io(getSocketUrl(), {
  path: "/socket.io", // Default path; change if your server uses a custom one
  transports: ["websocket"],
  autoConnect: true,
  withCredentials: true,
});

