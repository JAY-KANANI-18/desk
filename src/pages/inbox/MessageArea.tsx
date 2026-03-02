import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import {
  AlarmClock, Search, X, EyeOff, Clock, Check, CheckCheck,
  Play, Pause, FileText, Download,
  CornerUpLeft, CornerUpRight, Smile, Copy, Star, Trash2, Users,
} from 'lucide-react';
import type { Conversation, Message, MessageStatus, MediaAttachment } from './types';
import { renderCommentText, formatTime } from './utils';
import { channelConfig } from './data';

const PAGE_SIZE = 10;

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MsgStatusIcon({ status }: { status?: MessageStatus }) {
  if (!status || status === 'pending') return <Clock size={11} className="text-gray-400 flex-shrink-0" />;
  if (status === 'sent')              return <Check size={11} className="text-gray-400 flex-shrink-0" />;
  if (status === 'delivered')         return <CheckCheck size={11} className="text-gray-400 flex-shrink-0" />;
  return <CheckCheck size={11} className="text-blue-500 flex-shrink-0" />;
}

/* ─── skeleton ─────────────────────────────────────────────────────────────── */

function MessageSkeleton({ outgoing = false }: { outgoing?: boolean }) {
  return (
    <div className={`flex items-end gap-3 mb-4 animate-pulse ${outgoing ? 'flex-row-reverse' : ''}`}>
      <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
      <div className={`flex flex-col gap-1.5 ${outgoing ? 'items-end' : 'items-start'}`}>
        <div className={`h-10 rounded-2xl bg-gray-200 ${outgoing ? 'w-44' : 'w-56'}`} />
        <div className="h-2.5 bg-gray-100 rounded w-14" />
      </div>
    </div>
  );
}

/* ─── per-channel quick actions ────────────────────────────────────────────── */

type ActionDef = {
  id: string;
  icon: React.ElementType;
  label: string;
  danger?: boolean;
};

const CHANNEL_ACTIONS: Record<string, ActionDef[]> = {
  whatsapp: [
    { id: 'reply',   icon: CornerUpLeft,  label: 'Reply'   },
    { id: 'react',   icon: Smile,         label: 'React'   },
    { id: 'forward', icon: CornerUpRight, label: 'Forward' },
    { id: 'copy',    icon: Copy,          label: 'Copy'    },
    { id: 'star',    icon: Star,          label: 'Star'    },
    { id: 'delete',  icon: Trash2,        label: 'Delete',  danger: true },
  ],
  email: [
    { id: 'reply',    icon: CornerUpLeft,  label: 'Reply'     },
    { id: 'replyall', icon: Users,         label: 'Reply All' },
    { id: 'forward',  icon: CornerUpRight, label: 'Forward'   },
    { id: 'copy',     icon: Copy,          label: 'Copy'      },
    { id: 'delete',   icon: Trash2,        label: 'Delete',    danger: true },
  ],
  websitechat: [
    { id: 'reply',  icon: CornerUpLeft, label: 'Reply'  },
    { id: 'copy',   icon: Copy,         label: 'Copy'   },
    { id: 'delete', icon: Trash2,       label: 'Delete', danger: true },
  ],
  instagram: [
    { id: 'reply',  icon: CornerUpLeft, label: 'Reply'  },
    { id: 'react',  icon: Smile,        label: 'React'  },
    { id: 'copy',   icon: Copy,         label: 'Copy'   },
    { id: 'delete', icon: Trash2,       label: 'Delete', danger: true },
  ],
  facebook: [
    { id: 'reply',  icon: CornerUpLeft, label: 'Reply'  },
    { id: 'react',  icon: Smile,        label: 'React'  },
    { id: 'copy',   icon: Copy,         label: 'Copy'   },
    { id: 'delete', icon: Trash2,       label: 'Delete', danger: true },
  ],
  comment: [
    { id: 'copy',   icon: Copy,   label: 'Copy'   },
    { id: 'delete', icon: Trash2, label: 'Delete', danger: true },
  ],
};

function QuickActions({
  channel,
  isOutgoing,
  msgText,
  visible,
}: {
  channel: string;
  isOutgoing: boolean;
  msgText: string;
  visible: boolean;
}) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const actions = CHANNEL_ACTIONS[channel] ?? CHANNEL_ACTIONS.websitechat;

  const handleAction = (id: string) => {
    if (id === 'copy') {
      navigator.clipboard.writeText(msgText).catch(() => {});
    }
  };

  const posClass = isOutgoing ? 'right-full mr-2' : 'left-full ml-2';

  return (
    <div
      className={`absolute ${posClass} top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white border border-gray-200 rounded-full shadow-lg px-1.5 py-1 z-20 transition-all duration-150 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
    >
      {actions.map(action => (
        <div key={action.id} className="relative">
          <button
            onClick={() => handleAction(action.id)}
            onMouseEnter={() => setTooltip(action.label)}
            onMouseLeave={() => setTooltip(null)}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
              action.danger
                ? 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <action.icon size={13} />
          </button>
          {tooltip === action.label && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap pointer-events-none z-30">
              {action.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── mini audio player ────────────────────────────────────────────────────── */

function MiniAudioPlayer({ url, isVoice, dark }: { url: string; isVoice?: boolean; dark?: boolean }) {
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setPlaying(true); }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
    setProgress(pct * 100);
  };

  const trackBg   = dark ? 'bg-white/30' : 'bg-gray-200';
  const trackFill = dark ? 'bg-white'    : 'bg-blue-500';
  const btnBg     = dark ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700';
  const labelClr  = dark ? 'text-white/80' : 'text-gray-500';
  const timeClr   = dark ? 'text-white/70' : 'text-gray-400';
  const wrapBg    = dark ? 'bg-blue-600'   : 'bg-gray-100';

  return (
    <div className={`flex items-center gap-2.5 ${wrapBg} rounded-2xl rounded-br-sm px-3 py-2.5 min-w-[200px] max-w-[260px] shadow-sm`}>
      <button
        onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-colors ${btnBg}`}
      >
        {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        {isVoice && <p className={`text-[10px] font-medium mb-1 ${labelClr}`}>Voice message</p>}
        <div className={`h-1.5 ${trackBg} rounded-full cursor-pointer`} onClick={handleSeek}>
          <div className={`h-full ${trackFill} rounded-full transition-all duration-100`} style={{ width: `${progress}%` }} />
        </div>
        <div className={`flex justify-between text-[10px] mt-0.5 ${timeClr}`}>
          <span>{formatTime(Math.floor((progress / 100) * duration))}</span>
          <span>{formatTime(Math.floor(duration))}</span>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          if (audioRef.current && duration)
            setProgress((audioRef.current.currentTime / duration) * 100);
        }}
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
        onEnded={() => { setPlaying(false); setProgress(0); if (audioRef.current) audioRef.current.currentTime = 0; }}
      />
    </div>
  );
}

/* ─── single attachment bubble ─────────────────────────────────────────────── */

function SingleAttachmentBubble({ att }: { att: MediaAttachment }) {
  if (att.type === 'image') {
    return (
      <a
        href={att.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-[260px] rounded-2xl rounded-br-sm overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
      >
        <img src={att.url} alt={att.name} className="w-full max-h-[200px] object-cover" />
        <div className="px-3 py-2 flex items-center gap-2 border-t border-gray-100">
          <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <p className="text-[11px] font-medium text-gray-600 truncate flex-1">{att.name}</p>
        </div>
      </a>
    );
  }

  if (att.type === 'video') {
    return (
      <div className="max-w-[280px] rounded-2xl rounded-br-sm overflow-hidden border border-gray-200 bg-white shadow-sm">
        <video controls src={att.url} className="w-full max-h-[200px] bg-black block" />
        <div className="px-3 py-2 flex items-center gap-2 border-t border-gray-100">
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </div>
          <p className="text-[11px] font-medium text-gray-600 truncate flex-1">{att.name}</p>
        </div>
      </div>
    );
  }

  if (att.type === 'audio') {
    return <MiniAudioPlayer url={att.url} isVoice={att.name === 'Voice message'} dark={true} />;
  }

  return (
    <a
      href={att.url}
      download={att.name}
      className="flex items-center gap-2.5 bg-blue-600 rounded-2xl rounded-br-sm px-3 py-2.5 transition-colors cursor-pointer max-w-[260px] hover:bg-blue-700 shadow-sm"
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/20">
        <FileText size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate text-white">{att.name}</p>
        {att.size && <p className="text-[10px] text-white/60">{formatFileSize(att.size)}</p>}
      </div>
      <Download size={13} className="flex-shrink-0 text-white/70" />
    </a>
  );
}

/* ─── main component ───────────────────────────────────────────────────────── */

interface MessageAreaProps {
  selectedConversation: Conversation;
  messages: Message[];
  snoozedUntil: string | null;
  onUnsnooze: () => void;
  msgSearchOpen: boolean;
  msgSearch: string;
  onMsgSearchChange: (val: string) => void;
  onCloseMsgSearch: () => void;
}

export function MessageArea({
  selectedConversation,
  messages,
  snoozedUntil,
  onUnsnooze,
  msgSearchOpen,
  msgSearch,
  onMsgSearchChange,
  onCloseMsgSearch,
}: MessageAreaProps) {
  const messagesEndRef      = useRef<HTMLDivElement>(null);
  const scrollRef           = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const prevConvIdRef       = useRef(selectedConversation.id);
  const prevMsgLenRef       = useRef(messages.length);
  const isFirstRenderRef    = useRef(true);

  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [visibleCount,  setVisibleCount]  = useState(PAGE_SIZE);
  const [loadingMore,   setLoadingMore]   = useState(false);

  const allFiltered = msgSearch
    ? messages.filter(m =>
        m.text.toLowerCase().includes(msgSearch.toLowerCase()) ||
        m.attachments?.some(a => a.name.toLowerCase().includes(msgSearch.toLowerCase()))
      )
    : messages;

  const hasMore        = allFiltered.length > visibleCount;
  const visibleMessages = allFiltered.slice(Math.max(0, allFiltered.length - visibleCount));

  useEffect(() => {
    if (!scrollRef.current) return;

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevConvIdRef.current    = selectedConversation.id;
      prevMsgLenRef.current    = messages.length;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      return;
    }

    const convChanged = prevConvIdRef.current !== selectedConversation.id;

    if (convChanged) {
      prevConvIdRef.current  = selectedConversation.id;
      prevMsgLenRef.current  = messages.length;
      setVisibleCount(PAGE_SIZE);
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
      return;
    }

    if (messages.length > prevMsgLenRef.current) {
      prevMsgLenRef.current = messages.length;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    prevMsgLenRef.current = messages.length;
  }, [selectedConversation.id, messages]);

  // useLayoutEffect fires synchronously before the browser paints — this
  // prevents the visible "jump from top to bottom" that useEffect causes.
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current > 0 && scrollRef.current) {
      const newScrollHeight = scrollRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      scrollRef.current.scrollTop = diff > 0 ? diff : 0;
      prevScrollHeightRef.current = 0;
    }
  }, [visibleCount]);

  const handleScroll = () => {
    if (!scrollRef.current || loadingMore || !hasMore) return;
    if (scrollRef.current.scrollTop <= 60) {
      prevScrollHeightRef.current = scrollRef.current.scrollHeight;
      setLoadingMore(true);
      setTimeout(() => {
        setVisibleCount(prev => prev + PAGE_SIZE);
        setLoadingMore(false);
      }, 700);
    }
  };

  return (
    <>
      {/* Message search bar */}
      {msgSearchOpen && (
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={msgSearch}
              onChange={e => onMsgSearchChange(e.target.value)}
              placeholder="Search messages in this conversation…"
              className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {msgSearch && (
              <button onClick={() => onMsgSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={onCloseMsgSearch} className="text-sm text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* Snooze banner */}
      {snoozedUntil && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
          <AlarmClock size={14} className="text-amber-600" />
          <span className="text-sm text-amber-700 font-medium">
            This chat is snoozed
            {snoozedUntil === '30m'      && ' for 30 minutes'}
            {snoozedUntil === '1h'       && ' for 1 hour'}
            {snoozedUntil === '3h'       && ' for 3 hours'}
            {snoozedUntil === 'tomorrow' && ' until tomorrow morning'}
            {snoozedUntil === 'nextweek' && ' until next week'}
          </span>
          <button onClick={onUnsnooze} className="ml-auto text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-0.5 rounded hover:bg-amber-100 transition-colors">
            Unsnooze
          </button>
        </div>
      )}

      {/* Messages scroll container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6"
        style={{ scrollBehavior: 'auto', overflowAnchor: 'none' }}
      >
        {/* Skeleton while loading older messages */}
        {loadingMore && (
          <div className="mb-2">
            <MessageSkeleton />
            <MessageSkeleton outgoing />
            <MessageSkeleton />
          </div>
        )}

        {/* "Beginning of conversation" pill when all messages are loaded */}
        {!hasMore && !loadingMore && (
          <div className="flex justify-center mb-5">
            <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
              Beginning of conversation
            </span>
          </div>
        )}

        <div className="flex justify-center mb-4">
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Today</span>
        </div>
        <div className="text-center mb-4">
          <p className="text-sm text-gray-500">Conversation opened by Contact</p>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-500 text-center mb-2">
            Lifecycle Stage <span className="font-semibold">New Lead</span> added
          </p>
        </div>

        {/* Initial customer message */}
        <div className="flex items-start gap-3 mb-4">
          {(() => {
            const cfg = channelConfig[selectedConversation.channel] ?? channelConfig['email'];
            return (
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-xs font-semibold">
                  {selectedConversation.avatar}
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white text-white [&>svg]:!w-2.5 [&>svg]:!h-2.5 ${cfg.bg}`}
                  title={cfg.label}
                >
                  {cfg.icon}
                </span>
              </div>
            );
          })()}

          <div
            className="relative"
            onMouseEnter={() => setHoveredMsgId('initial')}
            onMouseLeave={() => setHoveredMsgId(null)}
          >
            <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-md">
              <p className="text-sm">{selectedConversation.message}</p>
            </div>
            <QuickActions
              channel={selectedConversation.channel}
              isOutgoing={false}
              msgText={selectedConversation.message}
              visible={hoveredMsgId === 'initial'}
            />
          </div>
        </div>

        {/* Dynamic messages */}
        {visibleMessages.map(msg => {
          if (msg.type === 'reply') {
            const msgCh = msg.channel ? (channelConfig[msg.channel] ?? null) : null;
            const attachments = msg.attachments ?? [];
            const hasText = msg.text.trim().length > 0;

            type BubbleItem =
              | { kind: 'attachment'; att: MediaAttachment }
              | { kind: 'text'; text: string };

            const items: BubbleItem[] = [
              ...attachments.map(att => ({ kind: 'attachment' as const, att })),
              ...(hasText ? [{ kind: 'text' as const, text: msg.text }] : []),
            ];

            const hoverKey = `msg-${msg.id}`;

            return (
              <div key={msg.id} className="flex items-end gap-3 mb-4 justify-end">
                <div
                  className="relative flex flex-col items-end gap-1.5 max-w-sm"
                  onMouseEnter={() => setHoveredMsgId(hoverKey)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                >
                  <QuickActions
                    channel={msg.channel ?? selectedConversation.channel}
                    isOutgoing={true}
                    msgText={msg.text}
                    visible={hoveredMsgId === hoverKey}
                  />
                  {items.map((item, idx) => {
                    const isLast = idx === items.length - 1;
                    return (
                      <div key={idx} className="flex flex-col items-end w-full">
                        {item.kind === 'attachment' ? (
                          <SingleAttachmentBubble att={item.att} />
                        ) : (
                          <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
                            <p className="text-sm leading-relaxed">{item.text}</p>
                          </div>
                        )}
                        {isLast && (
                          <div className="flex items-center gap-1.5 mt-1">
                            {/* {msgCh && (
                              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white [&>svg]:!w-2.5 [&>svg]:!h-2.5 ${msgCh.bg}`}>
                                {msgCh.icon}{msgCh.label}
                              </span>
                            )} */}
                            <span className="text-xs text-gray-400">{msg.time}</span>
                            <MsgStatusIcon status={msg.status} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-700">
                    {msg.initials}
                  </div>
                  {msgCh && (
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white text-white [&>svg]:!w-2.5 [&>svg]:!h-2.5 ${msgCh.bg}`}
                      title={msgCh.label}
                    >
                      {msgCh.icon}
                    </span>
                  )}
                </div>
              </div>
            );
          }

          /* Internal comment */
          const hoverKey = `msg-${msg.id}`;
          return (
            <div key={msg.id} className="flex items-start gap-3 mb-4">
              <div className="flex items-start gap-3 w-full">
                <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-xs font-semibold text-amber-800 flex-shrink-0">
                  {msg.initials}
                </div>
                <div
                  className="flex-1 max-w-lg relative"
                  onMouseEnter={() => setHoveredMsgId(hoverKey)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                >
                  <div className="bg-amber-50 border border-amber-200 border-dashed rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-amber-800">{msg.author}</span>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                        <EyeOff size={9} />Internal note
                      </span>
                      <span className="text-xs text-amber-400 ml-auto">{msg.time}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{renderCommentText(msg.text)}</p>
                  </div>
                  <QuickActions
                    channel="comment"
                    isOutgoing={false}
                    msgText={msg.text}
                    visible={hoveredMsgId === hoverKey}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>
    </>
  );
}
