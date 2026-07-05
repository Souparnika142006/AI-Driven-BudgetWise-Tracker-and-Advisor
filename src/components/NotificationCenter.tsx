import { useState } from "react";
import { Notification } from "../types";
import { Bell, Trash2, CheckCheck, AlertTriangle, Check, Info } from "lucide-react";

interface NotificationCenterProps {
  notifications: Notification[];
  onClearAll: () => void;
  onDeleteAll: () => void;
  currency: string;
}

export default function NotificationCenter({
  notifications,
  onClearAll,
  onDeleteAll,
  currency,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        id="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-[#1A1A1A] hover:text-white hover:bg-[#1A1A1A] focus:outline-none transition-colors duration-150 cursor-pointer border border-transparent hover:border-[#1A1A1A] rounded-none"
        title="View Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-mono font-bold leading-none text-white bg-red-700">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white rounded-none shadow-[6px_6px_0px_0px_rgba(26,26,26,0.1)] border border-[#1A1A1A]/15 py-3.5 z-50 animate-in fade-in duration-200 text-[#1A1A1A]">
          <div className="flex items-center justify-between px-4 pb-2.5 border-b border-[#1A1A1A]/10">
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif italic text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#1A1A1A]/5 text-[#1A1A1A] px-2 py-0.5 border border-[#1A1A1A]/10">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={onClearAll}
                  className="flex items-center gap-1 text-[10px] text-[#1A1A1A] hover:opacity-75 font-bold uppercase tracking-wider cursor-pointer"
                  title="Mark all read"
                >
                  <CheckCheck className="w-3 h-3" />
                  Read all
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onDeleteAll}
                  className="p-1 text-[#1A1A1A]/40 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer border border-transparent"
                  title="Clear all history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[350px] overflow-y-auto mt-2">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-[#1A1A1A]/50 text-xs font-serif italic">
                No notifications logged
              </div>
            ) : (
              <div className="divide-y divide-[#1A1A1A]/5">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 flex gap-3 transition-colors ${
                      notif.read ? "bg-white" : "bg-[#F8F7F3]"
                    }`}
                  >
                    <div className="mt-0.5">
                      {notif.type === "warning" ? (
                        <div className="p-1 bg-red-50 text-red-800 border border-red-200">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      ) : notif.type === "success" ? (
                        <div className="p-1 bg-green-50 text-green-800 border border-green-200">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1 bg-blue-50 text-blue-800 border border-blue-200">
                          <Info className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1A1A1A] leading-relaxed break-words">
                        {notif.message}
                      </p>
                      <span className="text-[9px] font-mono text-[#1A1A1A]/40 mt-1 block">
                        {new Date(notif.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
