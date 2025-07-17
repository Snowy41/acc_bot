import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type UserNotification = {
  id: string;
  type: string;
  message: string;
  timestamp: number;
};

export default function NotificationBell({
  notifications,
  onClear,
}: {
  notifications: UserNotification[];
  onClear?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [popNotifications, setPopNotifications] = useState<UserNotification[]>([]);
  const lastNotificationIds = useRef<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.length;

  // --- 1. Handle "pop" notifications ---
  useEffect(() => {
    // Only pop notifications not seen before
    const newOnes = notifications.filter(
      (n) => !lastNotificationIds.current.includes(n.id)
    );
    if (newOnes.length > 0) {
      console.log("[Bell] New notifications to pop:", newOnes); // <--- ADD THIS
      setPopNotifications((prev) => [...prev, ...newOnes]);
      lastNotificationIds.current = notifications.map((n) => n.id);
      // Remove from pop after 3 seconds
      newOnes.forEach((n) => {
        setTimeout(() => {
          setPopNotifications((prev) => prev.filter((p) => p.id !== n.id));
        }, 3000);
      });
    }
  }, [notifications]);

  // --- 2. Click outside closes dropdown ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !(dropdownRef.current as any).contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 3. Clear notifications on dropdown close ---
  useEffect(() => {
    if (!open && notifications.length > 0) {
      fetch("/api/notifications/clear", {
        method: "POST",
        credentials: "include",
      });
    }
    if (!open && notifications.length > 0 && onClear) {
      onClear(); // clears local state
    }
    // eslint-disable-next-line
  }, [open]);

  // --- 4. One-time animation CSS (injects once) ---
  useEffect(() => {
    if (document.getElementById("notification-animations")) return;
    const style = document.createElement("style");
    style.id = "notification-animations";
    style.innerHTML = `
@keyframes slide-in-down {
  from { opacity: 0; transform: translateY(-30px) scale(0.97);}
  to   { opacity: 1; transform: translateY(0) scale(1);}
}
@keyframes fade-out-up {
  0%   { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-30px) scale(0.97);}
}
.animate-slide-in-down {
  animation: slide-in-down 0.4s cubic-bezier(.22,1.05,.36,1) both;
}
.animate-fade-out-up {
  animation: fade-out-up 3s 0.1s cubic-bezier(.68,-0.6,.32,1.6) forwards;
}
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Pop notifications beside the bell */}
      <div className="fixed top-6 right-20 flex flex-col gap-2 items-end z-[9999] pointer-events-none">
        {popNotifications.map((n) => (
          <div
            key={n.id}
            className="animate-slide-in-down animate-fade-out-up bg-aqua/90 text-midnight shadow-xl px-5 py-3 rounded-xl border-2 border-cyan-300 font-semibold text-base pointer-events-auto"
            style={{
              minWidth: "240px",
              maxWidth: "320px",
              transition: "opacity 0.3s",
            }}
          >
            <span>{n.message}</span>
            <span className="block text-xs text-cyan-900 font-normal mt-1">
              {new Date(n.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      {/* Bell and dropdown */}
      <button onClick={() => setOpen(!open)} className="relative">
        <Bell className="text-white w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-[#1b2435] border border-cyan-800 text-white rounded-xl shadow-xl z-50 animate__animated animate__fadeIn animate__delay-0.3s">
          <div className="px-4 py-3 border-b border-cyan-900 flex justify-between items-center font-semibold text-cyan-300">
            Notifications
            {onClear && (
              <button
                className="text-xs text-red-300 hover:text-red-500"
                onClick={onClear}
              >
                Clear
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-3 text-gray-400">No notifications</div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="px-4 py-2 hover:bg-[#223043] text-sm border-b border-cyan-900/30 cursor-pointer"
                >
                  <NotificationItem notification={n} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification }: { notification: UserNotification }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (notification.type === "friend") {
      // Extract @username
      const match = notification.message.match(/@(\w+)/);
      if (match) {
        navigate(`/profile/${match[1]}`);
      }
    }
    // Add more types if needed
  };

  return (
    <button onClick={handleClick} className="text-left w-full">
      <span className="block">{notification.message}</span>
      <span className="text-xs text-gray-400">
        {new Date(notification.timestamp).toLocaleTimeString()}
      </span>
    </button>
  );
}
