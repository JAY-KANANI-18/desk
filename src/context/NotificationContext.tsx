import React, {
  createContext, useContext, useState,
  useCallback, useRef,
  useEffect,
} from 'react';
import { playNotificationSound } from '../lib/notificationSound';
import type { NotificationSoundType } from '../lib/notificationSound';
import { useSocket } from '../socket/socket-provider';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type NotificationEventType = NotificationSoundType; // 'new_message' | 'assign' | 'mention'

export interface AppNotification {
  id: string;
  type: NotificationEventType;
  title: string;
  body: string;
  conversationId?: number;
  contactName?: string;
  timestamp: number;
}

interface NotificationContextType {
  /** Currently visible toast notifications (auto-dismiss after 5.5s) */
  notifications: AppNotification[];
  /** Full history of all notifications ever fired (persists until cleared) */
  history: AppNotification[];
  /** Count of unread notifications since last markAllRead() */
  unreadCount: number;
  /** Fire a notification (plays audio + shows toast + adds to history) */
  notify: (event: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  /** Dismiss a toast */
  dismiss: (id: string) => void;
  /** Dismiss all toasts */
  dismissAll: () => void;
  /** Remove a single item from history */
  dismissFromHistory: (id: string) => void;
  /** Clear all history */
  clearHistory: () => void;
  /** Reset unread count to 0 */
  markAllRead: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const NotificationContext = createContext<NotificationContextType | null>(null);

const AUTO_DISMISS_MS = 5500;
const MAX_VISIBLE     = 5;
const MAX_HISTORY     = 50;

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [history, setHistory]             = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [soundEnabled, setSoundEnabled]   = useState(true);

const socket = useSocket(); 
  useEffect(() => {

  if (!socket) return;

  socket.on("notification:new", (data) => {
    console.log("Notification", data);
  });

  return () => {
    socket.off("notification:new");
  };

}, [socket]);
  // Keep a ref so intervals/callbacks always see the latest value
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
    setNotifications([]);
  }, []);

  const dismissFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setUnreadCount(0);
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const notify = useCallback((event: Omit<AppNotification, 'id' | 'timestamp'>) => {
    const id: string = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const notification: AppNotification = { ...event, id, timestamp: Date.now() };

    if (soundEnabledRef.current) {
      playNotificationSound(event.type);
    }

    // Add to visible toasts
    setNotifications(prev => [notification, ...prev].slice(0, MAX_VISIBLE));
    // Add to persistent history
    setHistory(prev => [notification, ...prev].slice(0, MAX_HISTORY));
    // Increment unread
    setUnreadCount(prev => prev + 1);

    timersRef.current[id] = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
  }, [dismiss]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        history,
        unreadCount,
        notify,
        dismiss,
        dismissAll,
        dismissFromHistory,
        clearHistory,
        markAllRead,
        soundEnabled,
        toggleSound,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export const useNotifications = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
