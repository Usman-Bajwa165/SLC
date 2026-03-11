"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X, CheckCheck } from "lucide-react";
import { clsx } from "clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const notificationApi = {
  getNotifications: async () => {
    const res = await fetch(`${API_URL}/whatsapp/notifications`);
    const json = await res.json();
    return json.data || json;
  },
  markAsRead: async (id: number) => {
    const res = await fetch(`${API_URL}/whatsapp/notifications/${id}/read`, {
      method: "PATCH",
    });
    const json = await res.json();
    return json.data || json;
  },
  markAllAsRead: async () => {
    const res = await fetch(`${API_URL}/whatsapp/notifications/mark-all-read`, {
      method: "POST",
    });
    const json = await res.json();
    return json.data || json;
  },
};

const getNotificationIcon = (type: string) => {
  const icons: Record<string, string> = {
    student: "🎓",
    staff: "👔",
    finance: "💰",
    account: "🏦",
    enrollment: "📚",
    deactivation: "🚫",
    backup: "🚨",
  };
  return icons[type] || "📢";
};

const getNotificationColor = (type: string) => {
  const colors: Record<string, string> = {
    student: "bg-blue-50 border-blue-200",
    staff: "bg-purple-50 border-purple-200",
    finance: "bg-green-50 border-green-200",
    account: "bg-amber-50 border-amber-200",
    enrollment: "bg-indigo-50 border-indigo-200",
    deactivation: "bg-red-50 border-red-200",
    backup: "bg-orange-50 border-orange-200",
  };
  return colors[type] || "bg-slate-50 border-slate-200";
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationApi.getNotifications,
    refetchInterval: 5000,
    notifyOnChangeProps: ["data", "error"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.notifications || [];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-brand-blue hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  className="text-xs font-bold text-brand-blue hover:text-brand-blue/70 uppercase tracking-widest"
                >
                  Mark All Read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    className={clsx(
                      "p-4 hover:bg-slate-50 transition-colors cursor-pointer border-l-4",
                      notif.isRead
                        ? "border-l-slate-200 opacity-60"
                        : "border-l-brand-blue"
                    )}
                    onClick={() => {
                      if (!notif.isRead) {
                        markAsReadMutation.mutate(notif.id);
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="text-xl flex-shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-2">
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <div className="w-2 h-2 bg-brand-blue rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {notif.message.split("\n").slice(1).join(" ")}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2">
                          {new Date(notif.createdAt).toLocaleDateString("en-PK", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Showing {notifications.length} recent notifications
              </p>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
