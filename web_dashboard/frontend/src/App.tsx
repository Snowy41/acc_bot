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
import ParticleBackground from "./components/ParticleBackground";
import Shop from "./components/Shop";
import ShopCategory from "./components/ShopCategory";
import ShopItemDetail from "./components/ShopItemDetails";
import SupportPage from "./components/SupportPage";
import ModerationDashboard from "./components/ModerationDashboard";
import MessagesPage from "./components/MessagePage";
import ChatModal from "./components/ChatModal";
import FriendsModal from "./components/FriendsModal"; // adjust path if needed

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
  const [isPremium, setIsPremium] = useState(false);
  const [role, setRole] = useState("user");
  const [animatedColors, setAnimatedColors] = useState<string[]>([]);

  // Modal state for register
  const [showRegister, setShowRegister] = useState(false);

  // Show/hide "Get Started" button on homepage
  const [showGetStarted, setShowGetStarted] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        console.log("🧪 AUTH STATUS DATA:", data); // <--- add this
        setLoggedIn(!!data.loggedIn);
        setUsertag(data.usertag || "");
        setDisplayName(data.username || "");
        setUserColor(data.color || "#fff");
        setUserAvatar(data.avatar || "");
        setRole(data.role || "user");
        setIsAdmin(data.role === "admin");
        setIsPremium(data.role === "premium" || data.role === "admin");
        setAnimatedColors(Array.isArray(data.animatedColors) ? data.animatedColors : []);
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      });
  }, []);


  useEffect(() => {
    setTimeout(() => setShowGetStarted(true), 3000);
  }, []);
  const safeColors = typeof animatedColors === "string"
    ? JSON.parse(animatedColors)
    : animatedColors;
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
          setRole(data.role || "user");
          setIsAdmin(data.role === "admin");
          setIsPremium(data.role === "admin" || data.role === "premium");
          console.log("avatar value from backend:", data.avatar);
          setUserAvatar(data.avatar || "");
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

  const handleChatMessage = (data: { to: string; from: string; text: string; timestamp: number; notification?: UserNotification }) => {
    console.log("[Socket] chat_message received:", data); // <--- ADD THIS
    if (data.to === usertag && data.notification) {
      setNotifications(prev => [data.notification, ...prev]);
    }
    socket.on("chat_message", handleChatMessage);
    return () => {
      socket.off("chat_message", handleChatMessage);
  };
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
      <ParticleBackground />
      <div className="flex min-h-screen relative z-10">
        <Sidebar active={active} setActive={setActive} isAdmin={isAdmin} isPremium={isPremium}/>
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
            userRole={role}
            animatedColors={safeColors}
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
                <FriendsModal
                  open={showFriends}
                  onClose={() => setShowFriends(false)}
                  usertag={usertag}
                  onlineUsers={onlineUsers}
                />
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
                  <div className="w-full flex flex-col items-center justify-center mb-2">
                    <img
                      src="/logo_for_website.png"  // or use your import if not in public/
                      alt="vanish.rip logo banner"
                      className="max-w-lg w-full h-auto drop-shadow-lg"
                      style={{ marginBottom: '10px' }}
                    />
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
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:category" element={<ShopCategory />} />
            <Route path="/shop/:category/:item" element={<ShopItemDetail />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/moderation" element={<ModerationDashboard />} />
            <Route path="/messages" element={<MessagesPage usertag={usertag} />}/>
            <Route path="*" element={<div>Page not found!</div>} />
          </Routes>
        </main>
        <ToastContainer position="top-center" autoClose={3000} aria-label="Notification center"/>
      </div>
    </Router>
  );
}

export default App;
