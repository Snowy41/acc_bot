import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client"; // Import SocketIO client

const MonitorPage = () => {
  const { botName } = useParams(); // Get the bot name (e.g., knuddels_login.py)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Create a WebSocket connection to the backend
  const socket = io({
    path: "/socket.io/",
    transports: ["websocket"],
    withCredentials: true,
  });

  useEffect(() => {
    socket.on("bot_output", (data: string) => {
      setLogs((prevLogs) => [...prevLogs, data]);
    });

    return () => {
      socket.off("bot_output");
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Send credentials to the backend to start the bot
    const response = await fetch("/api/start_knuddels_login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (data.status === "success") {
      setIsLoggedIn(true);
    } else {
      alert("Failed to start bot");
    }
  };

  return (
    <div className="monitor-page">
      <h1>Monitoring {botName}</h1>

      {!isLoggedIn ? (
        <form onSubmit={handleLogin}>
          <div>
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Start {botName}</button>
        </form>
      ) : (
        <div>
          <h2>Status: Bot running...</h2>
          <div className="logs">
            <h3>Terminal Output:</h3>
            {logs.map((log, index) => (
              <p key={index}>{log}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitorPage;
