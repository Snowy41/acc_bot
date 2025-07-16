import {useState, useEffect, useRef} from "react";
import {BrowserRouter as Router, Routes, Route, Link, useNavigate} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ProfilePanel from "./components/ProfilePanel";
import LogViewer from "./components/LogViewer";
import BotSelection from "./components/BotSelection";
import BotMonitor from "./components/BotMonitor";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import ProfilePage from "./components/ProfilePage";
import ProfileEdit from "./components/EditProfile";
import AdminPanel from "./components/AdminPanel";
import ForumCategories from "./components/ForumCategories";
import ForumCategoryView from "./components/ForumCategoryView";
import ForumPostView from "./components/ForumPostView";
import SearchBar from "./components/SearchBar";
import { socket } from "./socket";
import SystemMessage from "./components/SystemMessage";
import NotificationBell from "./components/NotificationBell";
import type {UserNotification} from "./components/NotificationBell"
import { ToastContainer, toast } from "react-toastify";


function App() {
  const [active, setActive] = useState("home");
  const [loggedIn, setLoggedIn] = useState(false);
  const [usertag, setUsertag] = useState("");    // unique key!
  const [displayName, setDisplayName] = useState(""); // display username
  const [userColor, setUserColor] = useState("#fff");
  const [isAdmin, setIsAdmin] = useState(false);
  const [userAvatar, setUserAvatar] = useState("");
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [showFriends, setShowFriends] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);


  // Modal state for register
  const [showRegister, setShowRegister] = useState(false);

  // Show/hide "Get Started" button on homepage
  const [showGetStarted, setShowGetStarted] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setLoggedIn(!!data.loggedIn);
        setUsertag(data.usertag || "");
        setDisplayName(data.username || "");
        setUserColor(data.color || "#fff");
        setIsAdmin(data.isAdmin || false);
        setUserAvatar(data.avatar || "");
        console.log("Final Avatar URL:", data.avatar, userAvatar);
      });
  }, []);

  useEffect(() => {
    setTimeout(() => setShowGetStarted(true), 3000);
  }, []);

  const handleLogin = async (enteredUsertag: string, password: string) => {
  try {
    const response = await fetch('/api/knuddels/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: enteredUsertag, password }),
    });

    const data = await response.json();
    if (data.status === 'success') {
      fetch("/api/auth/status", { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          setLoggedIn(!!data.loggedIn);
          setUsertag(data.usertag || "");
          setDisplayName(data.username || "");
          setUserColor(data.color || "#fff");
          setIsAdmin(data.isAdmin || false);
          setUserAvatar(data.avatar ? `${window.location.origin}${data.avatar}` : "");
          if (Array.isArray(data.notifications)) {
            setNotifications(data.notifications);
          }
        });
      toast.success(data.message);
    } else {
      toast.error(data.message);
    }
  } catch (err) {
    toast.error("Network/server error");
  }
};
useEffect(() => {
  socket.emit("connect_user", { usertag });
  fetch("/api/online-users").then(res => res.json()).then(data => {
    setOnlineUsers(data.online || []);
  });

  socket.on("user_online", data => {
    setOnlineUsers(prev => [...new Set([...prev, data.usertag])]);
  });

  socket.on("user_offline", data => {
    setOnlineUsers(prev => prev.filter(u => u !== data.usertag));
  });

  return () => {
    socket.off("user_online");
    socket.off("user_offline");
  };
}, [usertag]);

 useEffect(() => {
  const handleSystemMessage = (msg: { text: string }) => {
    setSystemMessage(msg.text);
    setTimeout(() => setSystemMessage(null), 5000);
    setNotifications(prev => [{
      id: crypto.randomUUID(),
      type: "system",
      message: `📣 ${msg.text}`,
      timestamp: Date.now(),
    }, ...prev]);
  };

  const handleFriendRequest = (data: { to: string; from: string }) => {
    if (data.to === usertag) {
      setNotifications(prev => [{
        id: crypto.randomUUID(),
        type: "friend",
        message: `👥 Friend request from @${data.from}`,
        timestamp: Date.now(),
      }, ...prev]);
    }
  };

  const handleChatMessage = (data: { to: string; from: string; text: string; timestamp: number }) => {
    if (data.to === usertag) {
      setNotifications(prev => [{
        id: crypto.randomUUID(),
        type: "chat",
        message: `💬 Message from @${data.from}`,
        timestamp: data.timestamp,
      }, ...prev]);
    }
  };

  socket.on("system_message", handleSystemMessage);
  socket.on("friend_request", handleFriendRequest);
  socket.on("chat_message", handleChatMessage);

  return () => {
    socket.off("system_message", handleSystemMessage);
    socket.off("friend_request", handleFriendRequest);
    socket.off("chat_message", handleChatMessage);
  };
}, [usertag]);



  // Show login/register modal when not logged in
  if (!loggedIn) {
    return (
      <>
        {showRegister ? (
          <RegisterModal
            onSuccess={(usertag, password) => {
              setShowRegister(false);
              handleLogin(usertag, password); // Auto-login on register
            }}
            onClose={() => setShowRegister(false)}
          />
        ) : (
          <LoginModal
            onLogin={handleLogin}
            onClose={() => {}}
            onRegister={() => setShowRegister(true)}
          />
        )}
      </>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen relative z-10 bg-midnight">
        <Sidebar active={active} setActive={setActive} isAdmin={isAdmin} />
        <SearchBar />
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <NotificationBell
            notifications={notifications}
            onClear={() => setNotifications([])}

          />
          <ProfilePanel
            loggedIn={loggedIn}
            setLoggedIn={setLoggedIn}
            user={usertag}
            setUser={setUsertag}
            userColor={userColor}
            displayName={displayName}
            userAvatar={userAvatar}
          />
        </div>

        {systemMessage && <SystemMessage text={systemMessage} />}
        {showFriends && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1b2435] border border-cyan-800 rounded-xl p-6 w-80 text-white relative animate__animated animate__fadeIn animate__delay-0.5s">
              <button
                className="absolute top-2 right-3 text-lg text-red-300 hover:text-red-500"
                onClick={() => setShowFriends(false)}
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-4 text-aqua">Your Friends</h2>
              <div className="space-y-6">
                <FriendList
                  onClose={() => setShowFriends(false)}
                  onlineUsers={onlineUsers}
                />
                <PendingRequests />
              </div>
            </div>
          </div>
        )}


      <button
        onClick={() => setShowFriends(true)}
        className="fixed bottom-6 right-6 bg-aqua text-midnight font-semibold py-3 px-6 rounded-full shadow-lg hover:bg-cyan-400 transition z-50"
      >
        Friends
      </button>

        <main className="flex-1 p-10 flex flex-col items-center justify-center text-white transition relative">
          <Routes>
            <Route
              path="/"
              element={
                <div className="dashboard-container">
                  {/* Hero Section */}
                  <div className="hero-section text-center space-y-8 relative z-10">
                    <h1 className="text-6xl font-extrabold tracking-tight text-aqua drop-shadow-lg animate__animated animate__fadeIn animate__delay-1s">
                      Welcome to White Bot Dashboard
                    </h1>
                    <p className="text-xl text-gray-300 max-w-xl mx-auto animate__animated animate__fadeIn animate__delay-1s">
                      Run and monitor your automation scripts in style. <br />
                      Use the sidebar to view logs or return here at any time.
                    </p>
                  </div>
                  {/* Info Section */}
                  <div className="info-section mt-12 flex flex-wrap justify-center gap-10">
                    <div className="info-card animate__animated animate__fadeIn animate__delay-1s flex flex-col p-8 bg-gradient-to-tr from-cyan-500 to-aqua-500 rounded-lg shadow-lg max-w-xs">
                      <h3 className="text-xl font-bold text-white">Monitor Your Bots</h3>
                      <p className="text-gray-200 mt-4 flex-grow">Keep track of your bots in real-time. Stay informed about their performance, and troubleshoot if needed.</p>
                      <div className="cta-container flex justify-center mt-4">
                        <Link
                          to="/botSelection"
                          className="cta-button bg-transparent text-white border-2 border-white hover:bg-white hover:text-midnight transition py-2 px-6 rounded-full text-lg font-semibold w-full text-center"
                        >
                          View Bots
                        </Link>
                      </div>
                    </div>
                    <div className="info-card animate__animated animate__fadeIn animate__delay-2s flex flex-col p-8 bg-gradient-to-tr from-aqua to-cyan-500 rounded-lg shadow-lg max-w-xs">
                      <h3 className="text-xl font-bold text-white">Logs</h3>
                      <p className="text-gray-200 mt-4 flex-grow">View detailed logs of bot activities. Analyze and optimize performance with historical data.</p>
                      <div className="cta-container flex justify-center mt-4">
                        <Link
                          to="/logs"
                          className="cta-button bg-transparent text-white border-2 border-white hover:bg-white hover:text-midnight transition py-2 px-6 rounded-full text-lg font-semibold w-full text-center"
                        >
                          View Logs
                        </Link>
                      </div>
                    </div>
                    <div className="info-card animate__animated animate__fadeIn animate__delay-3s flex flex-col p-8 bg-gradient-to-tr from-cyan-500 to-aqua-500 rounded-lg shadow-lg max-w-xs">
                      <h3 className="text-xl font-bold text-white">Bot Selection</h3>
                      <p className="text-gray-200 mt-4 flex-grow">Select and configure your automation bots with ease. Choose from various bot types and set configurations.</p>
                      <div className="cta-container flex justify-center mt-4">
                        <Link
                          to="/botSelection"
                          className="cta-button bg-transparent text-white border-2 border-white hover:bg-white hover:text-midnight transition py-2 px-6 rounded-full text-lg font-semibold w-full text-center"
                        >
                          Select Bot
                        </Link>
                      </div>
                    </div>
                  </div>
                  {/* Get Started Button */}
                  {showGetStarted && (
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 animate__animated animate__fadeIn animate__delay-3s">
                      <button className="cta-button bg-aqua text-midnight hover:bg-cyan-400 transition py-2 px-6 rounded-full text-lg font-semibold">
                        Get Started
                      </button>
                    </div>
                  )}
                </div>
              }
            />
            <Route path="/logs" element={<LogViewer />} />
            <Route path="/botSelection" element={<BotSelection />} />
            <Route path="/monitor/:botName" element={<BotMonitor />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/profile/:usertag" element={<ProfilePage />} />
            <Route path="/profile/:usertag/edit" element={<ProfileEdit />} />
            <Route path="/forum" element={<ForumCategories />} />
            <Route path="/forum/:category" element={<ForumCategoryView usertag={usertag} displayName={displayName} />} />
            <Route path="/forum/:category/:postId" element={<ForumPostView usertag={usertag} displayName={displayName} />} />

            <Route path="*" element={<div>Page not found!</div>} />
          </Routes>
        </main>
        <ToastContainer position="top-center" autoClose={3000} aria-label="Notification center"/>
      </div>
    </Router>
  );
}

export default App;

function FriendList({
  onClose,
  onlineUsers
}: {
  onClose: () => void;
  onlineUsers: string[];
}) {
  const [friends, setFriends] = useState<string[]>([]);
  const [chatTarget, setChatTarget] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/friends/list", { credentials: "include" })
      .then(res => res.json())
      .then(data => Array.isArray(data.friends) && setFriends(data.friends));
  }, []);

  const removeFriend = async (friendTag: string) => {
    if (!confirm(`Remove @${friendTag}?`)) return;
    await fetch("/api/friends/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ friendTag }),
    });
    setFriends(friends => friends.filter(f => f !== friendTag));
  };

  return (
    <>
      <ul className="space-y-2">
        {friends.map(friend => (
          <li key={friend} className="flex justify-between items-center bg-cyan-900/30 px-4 py-2 rounded-md cursor-pointer hover:bg-cyan-800" onClick={() => {
            onClose();
            navigate(`/profile/${friend}`);
          }}>
            <span>@{friend} {onlineUsers.includes(friend) && <span className="text-green-400">●</span>}</span>
            <div className="flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); removeFriend(friend); }} className="text-xs bg-red-500 px-2 py-1 rounded text-white">Remove</button>
              <button onClick={(e) => { e.stopPropagation(); setChatTarget(friend); }} className="text-xs bg-aqua px-2 py-1 rounded text-midnight">💬</button>
            </div>
          </li>
        ))}
      </ul>
      {chatTarget && <ChatModal friend={chatTarget} onClose={() => setChatTarget(null)} />}
    </>
  );
}




function PendingRequests() {
  const [requests, setRequests] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/friends/requests", { credentials: "include" })
      .then(res => res.json())
      .then(data => setRequests(data.requests || []));
  }, []);

  const acceptRequest = async (requesterTag: string) => {
    await fetch("/api/friends/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ requesterTag }),
    });
    setRequests((prev) => prev.filter((r) => r !== requesterTag));
  };

  if (requests.length === 0) return null;

  return (
    <div>
      <h3 className="text-cyan-300 text-sm font-bold mb-2">Pending Requests</h3>
      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r} className="flex justify-between items-center bg-cyan-900/30 px-3 py-2 rounded-md">
            @{r}
            <button
              onClick={() => acceptRequest(r)}
              className="text-sm bg-aqua text-midnight px-3 py-1 rounded hover:bg-cyan-400"
            >
              Accept
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}


function ChatModal({
  friend,
  onClose,
}: {
  friend: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<{ from: string; text: string; timestamp: number }[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentUser = useRef("");

  useEffect(() => {
    fetch("/api/auth/status", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        currentUser.current = data.usertag || "";
      });

    fetch(`/api/messages/${friend}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setMessages(data.messages || []);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
  }, [friend]);

  useEffect(() => {
    const handler = (data: any) => {
      if (data.from === friend || data.to === friend) {
          setMessages(prev => [...prev, data]);
          scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };
    socket.on("dm", handler); // ✅ attach listener

    return () => {
      socket.off("dm", handler); // ✅ cleanup listener
    };
  }, []);


  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    socket.emit("dm", { to: friend, text });
    setInput("");
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-[#121a24] border border-cyan-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between bg-cyan-900/20 p-4 border-b border-cyan-800">
          <div className="flex items-center gap-3">
            <span className="text-aqua font-semibold text-lg">@{friend}</span>
            {/* optional online status dot */}
            {/* <span className="w-2 h-2 bg-green-400 rounded-full"></span> */}
          </div>
          <button onClick={onClose} className="text-red-300 hover:text-red-500 text-xl font-bold">
            ×
          </button>
        </div>

        {/* Chat body */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#18222f] space-y-3">
          {messages.map((msg, i) => {
            const isMe = msg.from === currentUser.current;
            return (
              <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] p-3 rounded-xl text-sm shadow ${
                  isMe
                    ? "bg-aqua text-midnight rounded-br-none"
                    : "bg-cyan-900/40 text-white rounded-bl-none"
                }`}>
                  <div>{msg.text}</div>
                  <div className="text-[10px] text-right opacity-50 mt-1">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef}></div>
        </div>

        {/* Input */}
        <div className="flex gap-2 p-4 bg-cyan-900/10 border-t border-cyan-800">
          <input
            className="flex-1 px-4 py-2 rounded-lg bg-cyan-900/30 text-white border border-cyan-700 placeholder-cyan-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
          />
          <button
            onClick={sendMessage}
            className="bg-aqua px-4 py-2 rounded-lg text-midnight font-bold hover:bg-cyan-400"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
