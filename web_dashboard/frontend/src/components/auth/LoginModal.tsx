import { useState, useEffect } from "react";

interface LoginModalProps {
  onLogin: (usertag: string, password: string) => void;
  onClose: () => void;
  onRegister: () => void;  // <-- add this line
}


export default function LoginModal({ onLogin, onClose, onRegister }: LoginModalProps) {
  const [isVisible, setIsVisible] = useState(true); // Modal visibility
  const [isAnimating, setIsAnimating] = useState(false); // Controls the animation trigger
  const [backgroundVisible, setBackgroundVisible] = useState(false); // For background opacity

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setBackgroundVisible(true); // Background fades in with the modal
    }
  }, [isVisible]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: usertag, password }),
    })
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          onLogin(usertag, password); // This triggers fetch of user info in App
          setIsVisible(false); // Close with animation after successful login
        } else {
          setError(d.error || "Login failed");
        }
      });
  };

  const [usertag, setUsertag] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const closeModal = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setBackgroundVisible(false); // Hide background after modal animation
      onClose();
    }, 300); // Wait for animation to end before closing
  };

  return (
    <div
      className={`fixed inset-0 flex justify-center items-center z-50 transition-all duration-300 
        ${backgroundVisible ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    >
      <div
        className={`bg-black bg-opacity-50 absolute inset-0 transition-opacity duration-300`}
      ></div>

      <div
        className={`bg-sidebar p-8 rounded-xl w-80 transition-all duration-300
          ${isAnimating ? "transform translate-y-0 opacity-100" : "transform translate-y-4 opacity-0"}`}
      >
        <h2 className="text-2xl text-aqua font-bold mb-4">Login</h2>
        <form onSubmit={handleLogin}>
          <label className="block text-cyan-300 text-sm mb-1">Usertag</label>
          <input
            type="text"
            placeholder="Your usertag (e.g. 1)"
            className="w-full p-2 mb-2 text-aqua bg-midnight border border-cyan-800 rounded"
            value={usertag}
            onChange={(e) => setUsertag(e.target.value)}
            autoFocus
            autoComplete="username"
          />
          <label className="block text-cyan-300 text-sm mb-1">Password</label>
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 mb-2 text-aqua bg-midnight border border-cyan-800 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <div className="text-xs text-cyan-200 mb-2">
            <span className="italic">Use your usertag, not your display name. (e.g. <b>1</b>)</span>
          </div>
          {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
          <button
            type="submit"
            className="bg-aqua text-midnight px-4 py-2 rounded-full w-full mt-4"
          >
            Login
          </button>
        </form>
        <button
          onClick={onRegister}
          className="mt-2 w-full text-cyan-300 hover:text-aqua text-xs"
        >
          Register new account
        </button>
        <button
          onClick={closeModal}
          className="mt-2 w-full text-cyan-300 hover:text-aqua text-xs"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
