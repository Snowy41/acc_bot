import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
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

function App() {
  const [active, setActive] = useState("home");
  const [loggedIn, setLoggedIn] = useState(false);
  const [usertag, setUsertag] = useState("");    // unique key!
  const [displayName, setDisplayName] = useState(""); // display username
  const [userColor, setUserColor] = useState("#fff");
  const [isAdmin, setIsAdmin] = useState(false);
  const [userAvatar, setUserAvatar] = useState("");

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
        });
      alert(data.message);
    } else {
      alert(data.message);
    }
  };

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
        <ProfilePanel
          loggedIn={loggedIn}
          setLoggedIn={setLoggedIn}
          user={usertag}
          setUser={setUsertag}
          userColor={userColor}
          displayName={displayName}
          userAvatar={userAvatar}
        />
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
      </div>
    </Router>
  );
}

export default App;
