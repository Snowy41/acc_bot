import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import {useNavigate} from "react-router-dom";

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
  const dropdownRef = useRef(null);

  const unreadCount = notifications.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !(dropdownRef.current as any).contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open && notifications.length > 0) {
      // User just closed the dropdown — clear stored notifications
      fetch("/api/notifications/clear", {
        method: "POST",
        credentials: "include"
      });
    }
    if (!open && notifications.length > 0 && onClear) {
      onClear();  // clears local state
    }
  }, [open]);

  return (
    <div className="relative z-50 down-8" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="relative">
        <Bell className="text-white w-6 h-6" />
        {unreadCount > 0 && (
          <span className=" -top-1.5 -right-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
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
    // Add other types later if needed
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