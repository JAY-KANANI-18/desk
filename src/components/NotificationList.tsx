import { useNavigate } from 'react-router-dom';
import { X, MessageCircle, UserCheck, AtSign, Volume2, VolumeX } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import type { NotificationEventType } from '../context/NotificationContext';

// ─────────────────────────────────────────────────────────────────────────────
// Per-type visual config
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  NotificationEventType,
  {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    border: string;
    progressColor: string;
  }
> = {
  new_message: {
    icon: <MessageCircle size={15} />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'border-blue-100',
    progressColor: 'bg-blue-500',
  },
  assign: {
    icon: <UserCheck size={15} />,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    border: 'border-emerald-100',
    progressColor: 'bg-emerald-500',
  },
  mention: {
    icon: <AtSign size={15} />,
    iconBg: 'bg-[var(--color-primary-light)]',
    iconColor: 'text-[var(--color-primary)]',
    border: 'border-[var(--color-primary-light)]',
    progressColor: 'bg-[var(--color-primary)]',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export const NotificationList = () => {
  const { notifications, dismiss, soundEnabled, toggleSound } = useNotifications();
  const navigate = useNavigate();

  if (notifications.length === 0) return null;

  return (
    <section
      aria-label="Notifications"
      className="fixed bottom-5 right-4 z-[999999999] flex flex-col-reverse gap-2 w-[22rem] pointer-events-none"
    >
      {/* Sound toggle */}
      <div className="flex items-center justify-between pointer-events-auto">
        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Mute notification sounds' : 'Unmute notification sounds'}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white shadow-md border border-gray-200 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {soundEnabled
            ? <><Volume2 size={12} /> <span>Sound on</span></>
            : <><VolumeX size={12} /> <span>Sound off</span></>
          }
        </button>
        {notifications.length > 1 && (
          <button
            onClick={() => {
              const { dismissAll } = useNotificationsRef.current!;
              dismissAll();
            }}
            className="text-xs text-gray-400 hover:text-gray-600 pointer-events-auto pr-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Toast stack */}
      {notifications.map(n => {
        const cfg = TYPE_CONFIG[n.type];
        return (
          <div
            key={n.id}
            className={`notification-enter pointer-events-auto flex items-start gap-3 p-3 rounded-2xl shadow-lg bg-white border ${cfg.border} cursor-pointer hover:shadow-xl transition-shadow overflow-hidden relative`}
            onClick={() => {
              if (n.conversationId != null) navigate('/inbox');
              dismiss(n.id);
            }}
          >
            {/* Auto-dismiss progress bar */}
            <div
              className={`absolute bottom-0 left-0 h-0.5 ${cfg.progressColor} notification-progress`}
            />

            {/* Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.iconBg} ${cfg.iconColor}`}>
              {cfg.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-semibold text-gray-800 leading-tight truncate">
                {n.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-snug">
                {n.body}
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={e => { e.stopPropagation(); dismiss(n.id); }}
              className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
              aria-label="Dismiss notification"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </section>
  );
};

// Internal ref trick to call dismissAll from the "Clear all" button
// without breaking the Rules of Hooks
const useNotificationsRef = { current: null as ReturnType<typeof useNotifications> | null };

// Wrap the export so we can capture the hook value
export const NotificationListWrapper = () => {
  const ctx = useNotifications();
  useNotificationsRef.current = ctx;
  const navigate = useNavigate();

  if (ctx.notifications.length === 0) return null;

  return (
    <section
      aria-label="Notifications"
      className="fixed bottom-5 right-4 z-[999999999] flex flex-col-reverse gap-2 w-[22rem] pointer-events-none"
    >
      {/* Sound toggle + clear all */}
      <div className="flex items-center justify-between pointer-events-auto">
        <button
          onClick={ctx.toggleSound}
          title={ctx.soundEnabled ? 'Mute notification sounds' : 'Unmute notification sounds'}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white shadow-md border border-gray-200 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {ctx.soundEnabled
            ? <><Volume2 size={12} /><span>Sound on</span></>
            : <><VolumeX size={12} /><span>Sound off</span></>
          }
        </button>
        {ctx.notifications.length > 1 && (
          <button
            onClick={ctx.dismissAll}
            className="text-xs text-gray-400 hover:text-gray-600 pointer-events-auto pr-1 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Toast stack (newest on top visually = last in DOM with flex-col-reverse) */}
      {ctx.notifications.map(n => {
        const cfg = TYPE_CONFIG[n.type];
        return (
          <div
            key={n.id}
            className={`notification-enter pointer-events-auto flex items-start gap-3 p-3 rounded-2xl shadow-lg bg-white border ${cfg.border} cursor-pointer hover:shadow-xl transition-shadow overflow-hidden relative`}
            onClick={() => {
              if (n.conversationId != null) navigate('/inbox');
              ctx.dismiss(n.id);
            }}
          >
            {/* Auto-dismiss progress bar */}
            <div className={`absolute bottom-0 left-0 h-[3px] ${cfg.progressColor} notification-progress`} />

            {/* Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.iconBg} ${cfg.iconColor}`}>
              {cfg.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-semibold text-gray-800 leading-tight truncate">
                {n.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-snug">
                {n.body}
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={e => { e.stopPropagation(); ctx.dismiss(n.id); }}
              className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
              aria-label="Dismiss notification"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </section>
  );
};
