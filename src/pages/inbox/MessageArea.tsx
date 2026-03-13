import React, {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  AlarmClock,
  Search,
  X,
  Clock,
  Check,
  CheckCheck,
  Play,
  Pause,
  FileText,
  Download,
  CornerUpLeft,
  CornerUpRight,
  Smile,
  Copy,
  Star,
  Trash2,
  Users,
  ExternalLink,
  Mail,
  Reply,
  Eye,
  ChevronUp,
  ChevronDown,
  UserCheck,
  UserMinus,
  UserPlus,
  RefreshCw,
  Archive,
  BellOff,
  PhoneCall,
  Tag,
  ArrowRightLeft,
  Phone,
  LayoutTemplate,
  GitMerge,
  MessageSquare,
  Zap,
  AlertTriangle,
  TrendingUp,
  Hash,
} from "lucide-react";
import DOMPurify from "dompurify";
import { useChannel } from "../../context/ChannelContext";
import { Conversation } from "./types";
import { useWorkspace } from "../../context/WorkspaceContext";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════ */

export type MessageStatus = "pending" | "sent" | "delivered" | "read";

export interface MediaAttachment {
  type: "image" | "video" | "audio" | "file";
  url: string;
  name: string;
  size?: number;
}

export type ConversationEventType =
  | "assigned" | "unassigned" | "contact_changed" | "opened" | "closed"
  | "snoozed" | "unsnoozed" | "label_added" | "label_removed"
  | "channel_changed" | "call_started" | "call_ended" | "bot_handoff";

export type ActivityEventType =
  | "open" | "close" | "reopen" | "pending"
  | "assign_user" | "unassign_user" | "assign_team" | "unassign_team"
  | "merge_contact" | "channel_added"
  | "note"
  | "label_added" | "label_removed"
  | "priority_changed" | "sla_breached";

export interface ActivityResponse {
  id: string;
  conversationId: string;
  eventType: ActivityEventType;
  actorType: "user" | "system" | "automation" | "bot";
  actor?: { id: string; name: string; avatarUrl?: string; type?: string };
  subjectUser?: { id: string; name: string; avatarUrl?: string };
  subjectTeam?: { id: string; name: string };
  metadata?: Record<string, any>;
  createdAt: string;
  description: string;
}

export type TimelineItemType = "message" | "activity";

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  timestamp: string;
  message?: Message;
  activity?: ActivityResponse;
}

export interface Message {
  id: number;
  conversationId: string;
  channelId: string;
  type: "reply" | "comment" | "system" | "event" | "whatsapp_template";
  text: string;
  author: string;
  initials: string;
  time: string;
  createdAt?: string | Date;
  channel?: string;
  status?: MessageStatus;
  direction?: "incoming" | "outgoing";
  metadata?: {
    email?: {
      subject?: string; htmlBody?: string; from?: string;
      to?: string; cc?: string; messageId?: string; threadId?: string;
    };
    whatsapp?: {
      templateName?: string;
      headerType?: "image" | "video" | "document" | "text";
      headerUrl?: string;
      footer?: string;
      buttons?: Array<{ type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER"; text: string }>;
    };
    sender?: { userId?: string };
    event?: { type: ConversationEventType; actorName?: string; targetName?: string; detail?: string };
    quotedMessage?: {
      id?: number; text?: string; author?: string;
      attachmentType?: MediaAttachment["type"]; attachmentUrl?: string;
    };
  };
  attachments?: MediaAttachment[];
  messageAttachments?: MediaAttachment[];
}

export interface ReplyContext {
  type: "chat" | "email";
  quotedMessage?: {
    id: number; text: string; author: string;
    attachmentType?: "image" | "video" | "audio" | "file"; attachmentUrl?: string;
  };
  emailReply?: {
    to: string; subject: string;
    threadId?: string; messageId?: string; cc?: string;
  };
}

/* ═══════════════════════════════════════════════════════════════════
   INTERNAL NORMALISED TYPE
═══════════════════════════════════════════════════════════════════ */

type RenderItem =
  | { kind: "message";  key: string; timestamp: Date; msg: Message }
  | { kind: "activity"; key: string; timestamp: Date; act: ActivityResponse };

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════ */

const PAGE_SIZE = 20;

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════ */

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatAudioTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatMsgTime(createdAt?: string | Date, fallback?: string): string {
  if (createdAt) {
    try {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime()))
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {}
  }
  return fallback ?? "";
}

function dateBadgeLabel(dateKey: string): string {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}

function highlightText(text: string, term: string): React.ReactNode {
  if (!term || !text) return text;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{part}</mark>
          : part
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STATUS ICON
═══════════════════════════════════════════════════════════════════ */

function MsgStatusIcon({ status }: { status?: MessageStatus }) {
  if (!status || status === "pending") return <Clock size={11} className="text-gray-400 flex-shrink-0" />;
  if (status === "sent")     return <Check size={11} className="text-gray-400 flex-shrink-0" />;
  if (status === "delivered") return <CheckCheck size={11} className="text-gray-400 flex-shrink-0" />;
  return <CheckCheck size={11} className="text-blue-500 flex-shrink-0" />;
}

/* ═══════════════════════════════════════════════════════════════════
   QUOTED REPLY PREVIEW
═══════════════════════════════════════════════════════════════════ */

function QuotedPreview({
  text, author, attachmentType, attachmentUrl, isOutgoing,
}: {
  text?: string; author?: string;
  attachmentType?: MediaAttachment["type"]; attachmentUrl?: string;
  isOutgoing: boolean;
}) {
  if (!author && !text && !attachmentType) return null;
  const bar   = isOutgoing ? "bg-white/40"   : "bg-blue-400";
  const bg    = isOutgoing ? "bg-white/10"   : "bg-gray-200/60";
  const clr   = isOutgoing ? "text-white/75" : "text-gray-600";
  const actor = isOutgoing ? "text-white/90" : "text-blue-600";
  return (
    <div className={`flex gap-1.5 rounded-lg overflow-hidden ${bg} mx-2 mt-2`}>
      <div className={`w-0.5 flex-shrink-0 ${bar}`} />
      <div className="py-1.5 pr-2 flex-1 min-w-0">
        {author && <p className={`text-[10px] font-semibold mb-0.5 ${actor}`}>{author}</p>}
        {attachmentType === "image" && attachmentUrl && (
          <img src={attachmentUrl} alt="" className="w-10 h-10 object-cover rounded mb-0.5" />
        )}
        {attachmentType && attachmentType !== "image" && (
          <p className={`text-[11px] italic ${clr}`}>
            {attachmentType === "audio" ? "🎵 Voice message"
              : attachmentType === "video" ? "🎬 Video" : "📎 File"}
          </p>
        )}
        {text && <p className={`text-[11px] ${clr} line-clamp-2`}>{text}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   QUICK ACTIONS
═══════════════════════════════════════════════════════════════════ */

type ActionDef = { id: string; icon: React.ElementType; label: string; danger?: boolean };

const CHANNEL_ACTIONS: Record<string, ActionDef[]> = {
  whatsapp: [
    { id: "reply",   icon: CornerUpLeft,  label: "Reply" },
    { id: "react",   icon: Smile,         label: "React" },
    { id: "forward", icon: CornerUpRight, label: "Forward" },
    { id: "copy",    icon: Copy,          label: "Copy" },
    { id: "star",    icon: Star,          label: "Star" },
    { id: "delete",  icon: Trash2,        label: "Delete", danger: true },
  ],
  email: [
    { id: "reply",    icon: CornerUpLeft,  label: "Reply" },
    { id: "replyall", icon: Users,         label: "Reply All" },
    { id: "forward",  icon: CornerUpRight, label: "Forward" },
    { id: "copy",     icon: Copy,          label: "Copy" },
    { id: "delete",   icon: Trash2,        label: "Delete", danger: true },
  ],
  websitechat: [
    { id: "reply",  icon: CornerUpLeft, label: "Reply" },
    { id: "copy",   icon: Copy,         label: "Copy" },
    { id: "delete", icon: Trash2,       label: "Delete", danger: true },
  ],
  instagram: [
    { id: "reply",  icon: CornerUpLeft, label: "Reply" },
    { id: "react",  icon: Smile,        label: "React" },
    { id: "copy",   icon: Copy,         label: "Copy" },
    { id: "delete", icon: Trash2,       label: "Delete", danger: true },
  ],
  messenger: [
    { id: "reply",  icon: CornerUpLeft, label: "Reply" },
    { id: "react",  icon: Smile,        label: "React" },
    { id: "copy",   icon: Copy,         label: "Copy" },
    { id: "delete", icon: Trash2,       label: "Delete", danger: true },
  ],
  comment: [
    { id: "copy",   icon: Copy,  label: "Copy" },
    { id: "delete", icon: Trash2, label: "Delete", danger: true },
  ],
};

function QuickActions({
  channel, isOutgoing, msg, visible, onReply,
}: {
  channel: string; isOutgoing: boolean; msg: Message;
  visible: boolean; onReply: (ctx: ReplyContext) => void;
}) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const actions = CHANNEL_ACTIONS[channel] ?? CHANNEL_ACTIONS.websitechat;

  const handleAction = (id: string) => {
    if (id === "copy") { navigator.clipboard.writeText(msg.text ?? ""); return; }
    if (id === "reply") {
      if (channel === "email") {
        onReply({
          type: "email",
          emailReply: {
            to:        msg.metadata?.email?.from ?? msg.metadata?.email?.to ?? "",
            subject:   msg.metadata?.email?.subject
              ? `Re: ${msg.metadata.email.subject.replace(/^Re:\s*/i, "")}`
              : "Re:",
            threadId:  msg.metadata?.email?.threadId,
            messageId: msg.metadata?.email?.messageId,
            cc:        msg.metadata?.email?.cc,
          },
        });
      } else {
        const atts = msg.messageAttachments ?? msg.attachments ?? [];
        const firstAtt = atts[0];
        onReply({
          type: "chat",
          quotedMessage: {
            id:             msg.id,
            text:           msg.text,
            author:         msg.author,
            attachmentType: firstAtt?.type,
            attachmentUrl:  firstAtt?.url,
          },
        });
      }
    }
  };

  const posClass = isOutgoing ? "right-full mr-2" : "left-full ml-2";
  return (
    <div className={`absolute ${posClass} top-1/2 -translate-y-1/2 flex items-center gap-0.5
      bg-white border border-gray-200 rounded-full shadow-lg px-1.5 py-1 z-20
      transition-all duration-150
      ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
      {actions.map((action) => (
        <div key={action.id} className="relative">
          <button
            onClick={() => handleAction(action.id)}
            onMouseEnter={() => setTooltip(action.label)}
            onMouseLeave={() => setTooltip(null)}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors
              ${action.danger
                ? "hover:bg-red-50 text-gray-400 hover:text-red-500"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"}`}
          >
            <action.icon size={13} />
          </button>
          {tooltip === action.label && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5
              bg-gray-800 text-white text-[10px] rounded whitespace-nowrap pointer-events-none z-30">
              {action.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AUDIO PLAYER
═══════════════════════════════════════════════════════════════════ */

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
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
    setProgress(pct * 100);
  };

  const trackBg  = dark ? "bg-white/30" : "bg-gray-200";
  const fill     = dark ? "bg-white"    : "bg-blue-500";
  const btn      = dark ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-blue-600 text-white hover:bg-blue-700";
  const labelClr = dark ? "text-white/80" : "text-gray-500";
  const timeClr  = dark ? "text-white/70" : "text-gray-400";
  const wrapBg   = dark ? "bg-blue-600"   : "bg-gray-100";

  return (
    <div className={`flex items-center gap-2.5 ${wrapBg} rounded-2xl px-3 py-2.5 min-w-[200px] max-w-[260px] shadow-sm`}>
      <button onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-colors ${btn}`}>
        {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        {isVoice && <p className={`text-[10px] font-medium mb-1 ${labelClr}`}>Voice message</p>}
        <div className={`h-1.5 ${trackBg} rounded-full cursor-pointer`} onClick={handleSeek}>
          <div className={`h-full ${fill} rounded-full transition-all duration-100`} style={{ width: `${progress}%` }} />
        </div>
        <div className={`flex justify-between text-[10px] mt-0.5 ${timeClr}`}>
          <span>{formatAudioTime(Math.floor((progress / 100) * duration))}</span>
          <span>{formatAudioTime(Math.floor(duration))}</span>
        </div>
      </div>
      <audio ref={audioRef} src={url}
        onTimeUpdate={() => { if (audioRef.current && duration) setProgress((audioRef.current.currentTime / duration) * 100); }}
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
        onEnded={() => { setPlaying(false); setProgress(0); if (audioRef.current) audioRef.current.currentTime = 0; }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ATTACHMENT ITEM
═══════════════════════════════════════════════════════════════════ */

function AttachmentItem({ att, isOutgoing }: { att: MediaAttachment; isOutgoing?: boolean }) {
  if (att.type === "image") {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="block w-full overflow-hidden">
        <img src={att.url} alt={att.name} className="w-full max-h-[220px] object-cover" />
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-black/5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className={isOutgoing ? "text-white/60" : "text-blue-500"}>
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <p className={`text-[11px] font-medium truncate flex-1 ${isOutgoing ? "text-white/80" : "text-gray-600"}`}>{att.name}</p>
        </div>
      </a>
    );
  }
  if (att.type === "video") {
    return (
      <div className="w-full overflow-hidden">
        <video controls src={att.url} className="w-full max-h-[200px] bg-black block" />
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-black/5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className={isOutgoing ? "text-white/60" : "text-purple-500"}>
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
          <p className={`text-[11px] font-medium truncate flex-1 ${isOutgoing ? "text-white/80" : "text-gray-600"}`}>{att.name}</p>
        </div>
      </div>
    );
  }
  if (att.type === "audio") return <MiniAudioPlayer url={att.url} isVoice dark={isOutgoing} />;
  return (
    <a href={att.url} download={att.name}
      className={`flex items-center gap-2.5 px-3 py-2.5 ${isOutgoing ? "text-white" : "text-gray-700"}`}>
      <FileText size={16} className={isOutgoing ? "text-white/80" : "text-blue-500"} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isOutgoing ? "text-white" : "text-gray-800"}`}>{att.name}</p>
        {att.size && <p className={`text-[10px] ${isOutgoing ? "text-white/60" : "text-gray-400"}`}>{formatFileSize(att.size)}</p>}
      </div>
      <Download size={13} className={isOutgoing ? "text-white/70" : "text-gray-400"} />
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MESSAGE BUBBLE
═══════════════════════════════════════════════════════════════════ */

function MessageBubble({
  msg, isOutgoing, bubbleColor, isEmail, isWaTemplate,
  isExpanded, onToggleExpand, onOpenEmailModal, previewLength, searchTerm,
}: {
  msg: Message; isOutgoing: boolean; bubbleColor: string;
  isEmail: boolean; isWaTemplate: boolean; isExpanded: boolean;
  onToggleExpand: () => void; onOpenEmailModal: () => void;
  previewLength: number; searchTerm?: string;
}) {
  const atts   = msg.messageAttachments ?? msg.attachments ?? [];
  const images = atts.filter((a) => a.type === "image");
  const others = atts.filter((a) => a.type !== "image");
  const rawText = msg.text ?? "";
  const displayText = isExpanded ? rawText : rawText.slice(0, previewLength);
  const hasText     = !!rawText.trim();
  const needsExpand = rawText.length > previewLength;
  const quoted      = msg.metadata?.quotedMessage;

  const renderText = (t: string) =>
    searchTerm ? highlightText(t, searchTerm) : t;

  const expandBtn = (outgoing: boolean) => needsExpand && (
    <button onClick={onToggleExpand}
      className={`mt-1.5 flex items-center gap-1 text-xs font-medium opacity-70 hover:opacity-100 transition-opacity
        ${outgoing ? "text-blue-200" : "text-indigo-500"}`}>
      {isExpanded ? <><ChevronUp size={12}/> Show less</> : <><ChevronDown size={12}/> Show more</>}
    </button>
  );

  /* WA template */
  if (isWaTemplate) {
    const wa = msg.metadata?.whatsapp;
    return (
      <div className={`rounded-2xl overflow-hidden shadow-sm ${bubbleColor} max-w-sm`}>
        <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-1 border-b border-white/10">
          <LayoutTemplate size={10} className="opacity-70" />
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Template</span>
          {wa?.templateName && <span className="text-[10px] opacity-50 ml-1">· {wa.templateName}</span>}
        </div>
        {wa?.headerType === "image" && wa.headerUrl && <img src={wa.headerUrl} alt="" className="w-full max-h-40 object-cover" />}
        {wa?.headerType === "video" && wa.headerUrl && (
          <div className="relative">
            <img src={wa.headerUrl} alt="" className="w-full max-h-40 object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                <Play size={16} className="text-white ml-0.5" fill="white" />
              </div>
            </div>
          </div>
        )}
        {wa?.headerType === "document" && (
          <div className="flex items-center gap-2 px-4 py-2 bg-black/10">
            <FileText size={16} className="opacity-80" />
            <span className="text-xs font-medium opacity-80">Document</span>
          </div>
        )}
        <div className="px-4 py-2.5">
          <p className="text-sm whitespace-pre-wrap">{renderText(rawText)}</p>
        </div>
        {wa?.footer && <div className="px-4 pb-2"><p className="text-[10.5px] opacity-60">{wa.footer}</p></div>}
        {wa?.buttons && wa.buttons.length > 0 && (
          <div className="border-t border-white/10">
            {wa.buttons.map((btn, i) => (
              <div key={i} className="flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium
                border-t border-white/10 first:border-t-0 opacity-90 hover:opacity-100 cursor-pointer">
                {btn.type === "URL"          && <ExternalLink size={11} />}
                {btn.type === "PHONE_NUMBER" && <Phone size={11} />}
                {btn.type === "QUICK_REPLY"  && <CornerUpLeft size={11} />}
                <span>{btn.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* Email */
  if (isEmail) {
    return (
      <div className={`rounded-2xl overflow-hidden shadow-sm ${bubbleColor} max-w-sm`}>
        {msg.metadata?.email?.subject && (
          <div className={`flex items-center gap-1.5 px-4 pt-3 pb-2 border-b ${isOutgoing ? "border-white/10" : "border-gray-100"}`}>
            <Mail size={11} className="flex-shrink-0 opacity-50" />
            <span className={`text-xs font-semibold truncate max-w-[240px] ${isOutgoing ? "text-white/90" : "text-gray-700"}`}>
              {msg.metadata.email.subject}
            </span>
          </div>
        )}
        {quoted && <QuotedPreview {...quoted} isOutgoing={isOutgoing} />}
        {hasText && (
          <div className="px-4 pt-2.5 pb-1">
            <p className="text-sm whitespace-pre-wrap">
              {renderText(displayText)}{!isExpanded && needsExpand && "…"}
            </p>
            {expandBtn(isOutgoing)}
          </div>
        )}
        {atts.length > 0 && (
          <div className={hasText ? "border-t border-black/5 mt-1" : ""}>
            {images.length > 0 && (
              <div className={`grid gap-0.5 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {images.map((att, i) => (
                  <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden">
                    <img src={att.url} alt={att.name} className="w-full object-cover"
                      style={{ maxHeight: images.length === 1 ? 200 : 120 }} />
                  </a>
                ))}
              </div>
            )}
            {others.map((att, i) => (
              <div key={i} className={i > 0 || images.length > 0 ? "border-t border-black/5" : ""}>
                <AttachmentItem att={att} isOutgoing={isOutgoing} />
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 px-4 pb-3 pt-2">
          <button onClick={onOpenEmailModal}
            className={`flex items-center gap-1 text-xs opacity-70 hover:opacity-100 font-medium transition-opacity
              ${isOutgoing ? "text-white" : "text-gray-600"}`}>
            <Eye size={11} />
          </button>
          <button className={`flex items-center gap-1 text-xs opacity-70 hover:opacity-100 font-medium transition-opacity
              ${isOutgoing ? "text-white" : "text-gray-600"}`}>
            <Reply size={11} />
          </button>
        </div>
      </div>
    );
  }

  /* Regular chat */
  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm ${bubbleColor} max-w-sm`}>
      {quoted && <QuotedPreview {...quoted} isOutgoing={isOutgoing} />}
      {images.length > 0 && (
        <div className={`grid gap-0.5 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {images.map((att, i) => (
            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden">
              <img src={att.url} alt={att.name} className="w-full object-cover"
                style={{ maxHeight: images.length === 1 ? 200 : 120 }} />
            </a>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className={images.length > 0 ? "border-t border-black/5" : ""}>
          {others.map((att, i) => (
            <div key={i} className={i > 0 ? "border-t border-black/5" : ""}>
              <AttachmentItem att={att} isOutgoing={isOutgoing} />
            </div>
          ))}
        </div>
      )}
      {hasText && (
        <div className={`px-4 py-3 ${atts.length > 0 || quoted ? "border-t border-black/5" : ""}`}>
          <p className="text-sm whitespace-pre-wrap">
            {renderText(displayText)}{!isExpanded && needsExpand && "..."}
          </p>
          {expandBtn(isOutgoing)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DATE BADGE
═══════════════════════════════════════════════════════════════════ */

function DateBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-2 z-10" style={{ position: "sticky", top: 0 }}>
      <span className="px-3 py-1 text-[11px] font-semibold text-gray-500 bg-white
        border border-gray-200 rounded-full shadow-sm select-none">
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LEGACY EVENT ROW  (msg.type === "event" | "system")
═══════════════════════════════════════════════════════════════════ */

const LEGACY_EVENT_CONFIG: Record<
  ConversationEventType,
  { icon: React.ElementType; color: string; label: (e?: Message["metadata"]["event"]) => string }
> = {
  assigned:        { icon: UserCheck,      color: "text-emerald-600 bg-emerald-50 border-emerald-200", label: e => `Assigned to ${e?.targetName ?? "agent"}${e?.actorName ? ` by ${e.actorName}` : ""}` },
  unassigned:      { icon: UserMinus,      color: "text-gray-500 bg-gray-50 border-gray-200",          label: e => `Unassigned${e?.actorName ? ` by ${e.actorName}` : ""}` },
  contact_changed: { icon: ArrowRightLeft, color: "text-violet-600 bg-violet-50 border-violet-200",    label: e => `Contact changed to ${e?.targetName ?? "unknown"}` },
  opened:          { icon: RefreshCw,      color: "text-blue-600 bg-blue-50 border-blue-200",          label: e => `Conversation reopened${e?.actorName ? ` by ${e.actorName}` : ""}` },
  closed:          { icon: Archive,        color: "text-gray-600 bg-gray-50 border-gray-200",          label: e => `Conversation closed${e?.actorName ? ` by ${e.actorName}` : ""}` },
  snoozed:         { icon: BellOff,        color: "text-amber-600 bg-amber-50 border-amber-200",       label: e => `Snoozed${e?.detail ? ` until ${e.detail}` : ""}` },
  unsnoozed:       { icon: AlarmClock,     color: "text-amber-600 bg-amber-50 border-amber-200",       label: () => "Snooze removed" },
  label_added:     { icon: Tag,            color: "text-indigo-600 bg-indigo-50 border-indigo-200",    label: e => `Label "${e?.detail ?? ""}" added` },
  label_removed:   { icon: Tag,            color: "text-gray-500 bg-gray-50 border-gray-200",          label: e => `Label "${e?.detail ?? ""}" removed` },
  channel_changed: { icon: RefreshCw,      color: "text-teal-600 bg-teal-50 border-teal-200",          label: e => `Channel changed to ${e?.detail ?? "unknown"}` },
  call_started:    { icon: PhoneCall,      color: "text-green-600 bg-green-50 border-green-200",       label: () => "Call started" },
  call_ended:      { icon: PhoneCall,      color: "text-red-500 bg-red-50 border-red-200",             label: e => `Call ended${e?.detail ? ` · ${e.detail}` : ""}` },
  bot_handoff:     { icon: UserPlus,       color: "text-purple-600 bg-purple-50 border-purple-200",    label: () => "Handed off to agent" },
};

function LegacyEventRow({ msg }: { msg: Message }) {
  const ev  = msg.metadata?.event;
  const cfg = ev?.type ? LEGACY_EVENT_CONFIG[ev.type] : null;
  const time = formatMsgTime(msg.createdAt, msg.time);

  if (!cfg) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
          {msg.text}{time && <span className="ml-1.5 opacity-60">{time}</span>}
        </span>
      </div>
    );
  }
  const Icon = cfg.icon;
  return (
    <div className="flex items-center justify-center my-3 px-4">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium ${cfg.color}`}>
        <Icon size={11} />
        <span>{cfg.label(ev)}</span>
        {time && <span className="opacity-50 font-normal ml-1">{time}</span>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ACTIVITY ROW  (new BE ActivityResponse)
═══════════════════════════════════════════════════════════════════ */

interface ActivityConfig {
  icon: React.ElementType;
  pill: string;
  noteCard?: boolean;
}

const ACTIVITY_CONFIG: Record<ActivityEventType, ActivityConfig> = {
  open:             { icon: RefreshCw,     pill: "text-blue-700 bg-blue-50 border-blue-200" },
  close:            { icon: Archive,       pill: "text-gray-600 bg-gray-50 border-gray-200" },
  reopen:           { icon: RefreshCw,     pill: "text-blue-600 bg-blue-50 border-blue-200" },
  pending:          { icon: Clock,         pill: "text-amber-600 bg-amber-50 border-amber-200" },
  assign_user:      { icon: UserCheck,     pill: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  unassign_user:    { icon: UserMinus,     pill: "text-gray-500 bg-gray-50 border-gray-200" },
  assign_team:      { icon: Users,         pill: "text-violet-700 bg-violet-50 border-violet-200" },
  unassign_team:    { icon: Users,         pill: "text-gray-500 bg-gray-50 border-gray-200" },
  merge_contact:    { icon: GitMerge,      pill: "text-orange-600 bg-orange-50 border-orange-200" },
  channel_added:    { icon: Hash,          pill: "text-teal-700 bg-teal-50 border-teal-200" },
  note:             { icon: MessageSquare, pill: "text-amber-700 bg-amber-50 border-amber-200", noteCard: true },
  label_added:      { icon: Tag,           pill: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  label_removed:    { icon: Tag,           pill: "text-gray-500 bg-gray-50 border-gray-200" },
  priority_changed: { icon: TrendingUp,    pill: "text-rose-600 bg-rose-50 border-rose-200" },
  sla_breached:     { icon: AlertTriangle, pill: "text-red-700 bg-red-50 border-red-200" },
};

function ActorAvatar({ actor, size = "sm" }: {
  actor?: ActivityResponse["actor"]; size?: "sm" | "xs";
}) {
  const dim = size === "xs" ? "w-5 h-5 text-[9px]" : "w-7 h-7 text-[11px]";
  if (!actor) {
    return (
      <div className={`${dim} bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0`}>
        <Zap size={size === "xs" ? 9 : 11} className="text-gray-500" />
      </div>
    );
  }
  if (actor.avatarUrl) {
    return <img src={actor.avatarUrl} alt={actor.name} className={`${dim} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${dim} bg-blue-100 text-blue-700 font-semibold rounded-full flex items-center justify-center flex-shrink-0`}>
      {actor.name.charAt(0).toUpperCase()}
    </div>
  );
}

function ActivityRow({ activity, searchTerm }: { activity: ActivityResponse; searchTerm?: string }) {
  const cfg  = ACTIVITY_CONFIG[activity.eventType] ?? { icon: RefreshCw, pill: "text-gray-500 bg-gray-50 border-gray-200" };
  const Icon = cfg.icon;
  const time = formatMsgTime(activity.createdAt);

  /* Internal note card */
  if (cfg.noteCard) {
    const text       = activity.metadata?.text as string | undefined;
    const mentionIds = (activity.metadata?.mentionedUserIds ?? []) as string[];
    return (
      <div className="flex justify-center my-4 px-4">
        <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-200/60">
            <MessageSquare size={11} className="text-amber-600 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">Internal Note</span>
            <div className="flex items-center gap-1.5 ml-auto">
              <ActorAvatar actor={activity.actor} size="xs" />
              {activity.actor && <span className="text-[11px] font-medium text-amber-800">{activity.actor.name}</span>}
              <span className="text-[10px] text-amber-600/70 ml-1">{time}</span>
            </div>
          </div>
          {text && (
            <div className="px-3 py-2.5">
              <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
                {searchTerm ? highlightText(text, searchTerm) : text}
              </p>
            </div>
          )}
          {mentionIds.length > 0 && (
            <div className="px-3 pb-2 flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-amber-600/70">Mentioned:</span>
              {mentionIds.map((uid) => (
                <span key={uid} className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">@{uid}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* Standard pill */
  const descNode = searchTerm
    ? highlightText(activity.description, searchTerm)
    : activity.description;

  return (
    <div className="flex items-center justify-center my-3 px-4">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-medium
        ${cfg.pill} max-w-[90%]`}>
        {activity.actor && activity.actorType === "user"
          ? <ActorAvatar actor={activity.actor} size="xs" />
          : <Icon size={11} className="flex-shrink-0 opacity-80" />}
        <span className="truncate">{descNode}</span>
        {time && <span className="opacity-50 font-normal ml-1 flex-shrink-0">{time}</span>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SEARCH BAR with match counter + prev/next
═══════════════════════════════════════════════════════════════════ */

function SearchBar({
  value, onChange, onClose, matchCount, matchIndex, onPrev, onNext,
}: {
  value: string; onChange: (v: string) => void; onClose: () => void;
  matchCount: number; matchIndex: number; onPrev: () => void; onNext: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search messages…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>
      {value && (
        <span className="text-xs text-gray-500 whitespace-nowrap shrink-0 min-w-[60px] text-center">
          {matchCount === 0 ? "No results" : `${matchIndex + 1} / ${matchCount}`}
        </span>
      )}
      {value && matchCount > 0 && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onPrev}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500 transition-colors">
            <ChevronUp size={14} />
          </button>
          <button onClick={onNext}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500 transition-colors">
            <ChevronDown size={14} />
          </button>
        </div>
      )}
      {value && (
        <button onClick={() => onChange("")}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 shrink-0">
          <X size={13} />
        </button>
      )}
      <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700 shrink-0 px-1">
        Cancel
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */

interface MessageAreaProps {
  selectedConversation: Conversation;
  messages?: Message[];
  timelineItems?: TimelineItem[];
  snoozedUntil: string | null;
  onUnsnooze: () => void;
  msgSearchOpen: boolean;
  msgSearch: string;
  onMsgSearchChange: (v: string) => void;
  onCloseMsgSearch: () => void;
  onReply?: (ctx: ReplyContext) => void;
}

export function MessageArea({
  selectedConversation,
  messages = [],
  timelineItems,
  snoozedUntil,
  onUnsnooze,
  msgSearchOpen,
  msgSearch,
  onMsgSearchChange,
  onCloseMsgSearch,
  onReply,
}: MessageAreaProps) {
  const messagesEndRef      = useRef<HTMLDivElement>(null);
  const scrollRef           = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const prevConvIdRef       = useRef(selectedConversation?.id);
  const prevItemLenRef      = useRef(0);
  const isFirstRenderRef    = useRef(true);
  const itemRefsMap         = useRef<Map<string, HTMLDivElement>>(new Map());

  const [hoveredMsgId, setHoveredMsgId]         = useState<string | null>(null);
  const [visibleCount, setVisibleCount]         = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore]           = useState(false);
  const [expanded, setExpanded]                 = useState<Record<string, boolean>>({});
  const [emailModalMsg, setEmailModalMsg]       = useState<Message | null>(null);
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);

  const { channels }       = useChannel();
  const { workspaceUsers } = useWorkspace();
  const previewLength = 220;

  /* ── Normalise → RenderItem[] ── */
  const allItems = useMemo<RenderItem[]>(() => {
    console.log({timelineItems});
    
    if (timelineItems && timelineItems.length > 0) {
      return timelineItems.map((item): RenderItem => {
        const ts = new Date(item.timestamp);
        if (item.type === "activity" && item.activity)
          return { kind: "activity", key: item.id, timestamp: ts, act: item.activity };
        return { kind: "message", key: item.id, timestamp: ts, msg: item.message! };
      });
    }
    return messages.map((m): RenderItem => ({
      kind:      "message",
      key:       String(m.id),
      timestamp: m.createdAt ? new Date(m.createdAt) : new Date(),
      msg:       m,
    }));
  }, [timelineItems, messages]);

  /* ── Search: collect matching keys ── */
  const matchingKeys = useMemo<string[]>(() => {
    if (!msgSearch) return [];
    const term = msgSearch.toLowerCase();
    return allItems
      .filter((item) => {
        if (item.kind === "activity") {
          const desc = (item.act.description ?? "").toLowerCase();
          const note = ((item.act.metadata?.text as string) ?? "").toLowerCase();
          return desc.includes(term) || note.includes(term);
        }
        return (item.msg.text ?? "").toLowerCase().includes(term);
      })
      .map((item) => item.key);
  }, [allItems, msgSearch]);

  const matchCount = matchingKeys.length;

  useEffect(() => { setSearchMatchIndex(0); }, [msgSearch]);

  /* ── Scroll to current search match ── */
  useEffect(() => {
    if (!msgSearch || matchCount === 0) return;
    const key = matchingKeys[searchMatchIndex];
    if (!key) return;
    // Expand visible window if item is outside it
    const itemIndex = allItems.findIndex((i) => i.key === key);
    if (itemIndex !== -1) {
      const fromEnd = allItems.length - itemIndex;
      if (fromEnd > visibleCount) {
        setVisibleCount(fromEnd + PAGE_SIZE);
      }
    }
    requestAnimationFrame(() => {
      itemRefsMap.current.get(key)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [searchMatchIndex, msgSearch, matchingKeys, allItems]);

  const handleSearchPrev = useCallback(() => {
    setSearchMatchIndex((i) => (i - 1 + matchCount) % matchCount);
  }, [matchCount]);

  const handleSearchNext = useCallback(() => {
    setSearchMatchIndex((i) => (i + 1) % matchCount);
  }, [matchCount]);

  /* ── Keyboard shortcuts for search ── */
  useEffect(() => {
    if (!msgSearchOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter")   { e.preventDefault(); e.shiftKey ? handleSearchPrev() : handleSearchNext(); }
      if (e.key === "Escape")  onCloseMsgSearch();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [msgSearchOpen, handleSearchPrev, handleSearchNext, onCloseMsgSearch]);

  /* ── Pagination ── */
  const hasMore      = allItems.length > visibleCount;
  const visibleItems = allItems.slice(Math.max(0, allItems.length - visibleCount));

  /* ── Scroll behaviour ── */
  const totalLen = allItems.length;
  useEffect(() => {
    if (!scrollRef.current) return;
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevConvIdRef.current    = selectedConversation?.id;
      prevItemLenRef.current   = totalLen;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      return;
    }
    const convChanged = prevConvIdRef.current !== selectedConversation?.id;
    if (convChanged) {
      prevConvIdRef.current    = selectedConversation?.id;
      prevItemLenRef.current   = totalLen;
      setVisibleCount(PAGE_SIZE);
      setExpanded({});
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
      return;
    }
    if (totalLen > prevItemLenRef.current) {
      prevItemLenRef.current = totalLen;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    prevItemLenRef.current = totalLen;
  }, [selectedConversation?.id, totalLen]);

  useLayoutEffect(() => {
    if (prevScrollHeightRef.current > 0 && scrollRef.current) {
      const diff = scrollRef.current.scrollHeight - prevScrollHeightRef.current;
      scrollRef.current.scrollTop = diff > 0 ? diff : 0;
      prevScrollHeightRef.current = 0;
    }
  }, [visibleCount]);

  const handleScroll = () => {
    if (!scrollRef.current || loadingMore || !hasMore) return;
    if (scrollRef.current.scrollTop <= 80) {
      prevScrollHeightRef.current = scrollRef.current.scrollHeight;
      setLoadingMore(true);
      setTimeout(() => { setVisibleCount((prev) => prev + PAGE_SIZE); setLoadingMore(false); }, 600);
    }
  };

  /* ── Date groups ── */
  type DateGroup = { dateKey: string; items: RenderItem[] };
  const dateGroups = useMemo<DateGroup[]>(() => {
    const groups: DateGroup[] = [];
    for (const item of visibleItems) {
      const dk = item.timestamp.toISOString().slice(0, 10);
      if (!groups.length || groups[groups.length - 1].dateKey !== dk)
        groups.push({ dateKey: dk, items: [item] });
      else
        groups[groups.length - 1].items.push(item);
    }
    return groups;
  }, [visibleItems]);

  const setItemRef = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) itemRefsMap.current.set(key, el);
    else    itemRefsMap.current.delete(key);
  }, []);

  /* ── Match ring helpers ── */
  const isCurrentMatch = (key: string) => !!msgSearch && matchingKeys[searchMatchIndex] === key;
  const isAnyMatch     = (key: string) => !!msgSearch && matchingKeys.includes(key);

  const matchRingClass = (key: string) =>
    isCurrentMatch(key)
      ? "ring-2 ring-yellow-400 ring-offset-2 rounded-2xl"
      : isAnyMatch(key)
        ? "ring-1 ring-yellow-200 ring-offset-1 rounded-2xl"
        : "";

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */

  return (
    <>
      {/* SEARCH BAR */}
      {msgSearchOpen && (
        <SearchBar
          value={msgSearch}
          onChange={onMsgSearchChange}
          onClose={onCloseMsgSearch}
          matchCount={matchCount}
          matchIndex={searchMatchIndex}
          onPrev={handleSearchPrev}
          onNext={handleSearchNext}
        />
      )}

      {/* SNOOZE BANNER */}
      {snoozedUntil && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
          <AlarmClock size={14} className="text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 font-medium">
            This chat is snoozed
            {snoozedUntil === "30m"      && " for 30 minutes"}
            {snoozedUntil === "1h"       && " for 1 hour"}
            {snoozedUntil === "3h"       && " for 3 hours"}
            {snoozedUntil === "tomorrow" && " until tomorrow morning"}
            {snoozedUntil === "nextweek" && " until next week"}
          </span>
          <button onClick={onUnsnooze}
            className="ml-auto text-xs text-amber-600 hover:text-amber-800 font-medium
              px-2 py-0.5 rounded hover:bg-amber-100 transition-colors">
            Unsnooze
          </button>
        </div>
      )}

      {/* MESSAGE + ACTIVITY LIST */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ scrollBehavior: "auto", overflowAnchor: "none" }}
      >
        {/* Load older spinner */}
        {loadingMore && (
          <div className="flex justify-center mb-5">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <RefreshCw size={12} className="animate-spin" />
              Loading older messages…
            </div>
          </div>
        )}

        {/* Beginning of conversation */}
        {!hasMore && !loadingMore && (
          <div className="flex justify-center mb-6">
            <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
              Beginning of conversation
            </span>
          </div>
        )}

        {/* No search results */}
        {msgSearch && matchCount === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2.5">
            <Search size={28} className="text-gray-300" />
            <p className="text-sm text-gray-400">
              No results for{" "}
              <span className="font-semibold text-gray-600">"{msgSearch}"</span>
            </p>
          </div>
        )}

        {/* Date groups */}
        {dateGroups.map(({ dateKey, items }) => (
          <div key={dateKey}>
            <DateBadge label={dateBadgeLabel(dateKey)} />

            {items.map((item) => {

              /* ── ACTIVITY ── */
              if (item.kind === "activity") {
                return (
                  <div
                    key={item.key}
                    ref={(el) => setItemRef(item.key, el)}
                    className={matchRingClass(item.key)}
                  >
                    <ActivityRow
                      activity={item.act}
                      searchTerm={msgSearch || undefined}
                    />
                  </div>
                );
              }

              /* ── MESSAGE ── */
              const msg          = item.msg;
              const isOutgoing   = msg.direction === "outgoing";
              const isEvent      = msg.type === "event" || msg.type === "system";
              const isComment    = msg.type === "comment";
              const isWaTemplate = msg.type === "whatsapp_template";
              const channelType  = channels?.find((c) => c?.id === msg?.channelId)?.type;
              const isEmail      = channelType === "email";
              const displayTime  = formatMsgTime(msg.createdAt, msg.time);
              const hoverKey     = `msg-${msg.id}`;
              const isExpanded   = !!expanded[msg.id];
              const OutgoingSender = workspaceUsers?.find(
                (u) => u.id === msg?.metadata?.sender?.userId
              );
              const bubbleColor = isOutgoing
                ? "bg-blue-600 text-white rounded-br-sm"
                : "bg-gray-100 text-gray-900 rounded-bl-sm";

              /* Legacy event pill */
              if (isEvent) {
                return (
                  <div key={msg.id} ref={(el) => setItemRef(item.key, el)}>
                    <LegacyEventRow msg={msg} />
                  </div>
                );
              }

              /* Internal note (legacy comment) */
              if (isComment) {
                return (
                  <div
                    key={msg.id}
                    ref={(el) => setItemRef(item.key, el)}
                    className={matchRingClass(item.key)}
                  >
                    <div className="flex justify-center my-4 px-4">
                      <div className="w-full max-w-md bg-amber-50 border border-amber-200
                        rounded-xl overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-200/60">
                          <MessageSquare size={11} className="text-amber-600 flex-shrink-0" />
                          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
                            Internal Note
                          </span>
                          <div className="flex items-center gap-1.5 ml-auto">
                            <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center
                              text-[9px] font-bold text-amber-800">{msg.initials}</div>
                            <span className="text-[11px] font-medium text-amber-800">{msg.author}</span>
                            <span className="text-[10px] text-amber-600/70 ml-1">{displayTime}</span>
                          </div>
                        </div>
                        <div className="px-3 py-2.5">
                          <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
                            {msgSearch ? highlightText(msg.text ?? "", msgSearch) : msg.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              /* Regular message bubble */
              return (
                <div
                  key={msg.id}
                  ref={(el) => setItemRef(item.key, el)}
                  className={`flex items-end gap-3 mb-4 ${isOutgoing ? "justify-end" : "justify-start"}
                    ${matchRingClass(item.key)}`}
                  onMouseEnter={() => setHoveredMsgId(hoverKey)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                >
                  {/* Incoming avatar */}
                  {!isOutgoing && (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center
                      text-xs flex-shrink-0 overflow-hidden">
                      {selectedConversation?.contact?.avatarUrl
                        ? <img src={selectedConversation.contact.avatarUrl}
                            alt={selectedConversation.contact.firstName || "C"}
                            className="w-full h-full object-cover" />
                        : <span>{selectedConversation?.contact?.firstName?.charAt(0)?.toUpperCase() || "C"}</span>
                      }
                    </div>
                  )}

                  <div className="relative flex flex-col max-w-sm">
                    <QuickActions
                      channel={channelType ?? msg.channel ?? selectedConversation?.channel ?? "websitechat"}
                      isOutgoing={isOutgoing}
                      msg={msg}
                      visible={hoveredMsgId === hoverKey}
                      onReply={(ctx) => onReply?.(ctx)}
                    />
                    <MessageBubble
                      msg={msg}
                      isOutgoing={isOutgoing}
                      bubbleColor={bubbleColor}
                      isEmail={isEmail}
                      isWaTemplate={isWaTemplate}
                      isExpanded={isExpanded}
                      onToggleExpand={() => setExpanded((s) => ({ ...s, [msg.id]: !isExpanded }))}
                      onOpenEmailModal={() => setEmailModalMsg(msg)}
                      previewLength={previewLength}
                      searchTerm={msgSearch || undefined}
                    />
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <span>{displayTime}</span>
                      {isOutgoing && <MsgStatusIcon status={msg.status} />}
                    </div>
                  </div>

                  {/* Outgoing avatar */}
                  {isOutgoing && (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center
                      text-xs flex-shrink-0 overflow-hidden">
                      {OutgoingSender?.avatarUrl
                        ? <img src={OutgoingSender.avatarUrl}
                            alt={OutgoingSender.firstName || "U"}
                            className="w-full h-full object-cover" />
                        : <span>{OutgoingSender?.firstName?.charAt(0)?.toUpperCase() || "U"}</span>
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* EMAIL MODAL */}
      {emailModalMsg && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setEmailModalMsg(null); }}
        >
          <div className="bg-white w-[750px] max-h-[80vh] rounded-xl shadow-xl flex flex-col">
            <div className="border-b px-5 py-3.5 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {emailModalMsg.metadata?.email?.subject ?? "Email"}
                </p>
                {emailModalMsg.metadata?.email?.from && (
                  <p className="text-xs text-gray-500 mt-0.5">From: {emailModalMsg.metadata.email.from}</p>
                )}
                {emailModalMsg.metadata?.email?.to && (
                  <p className="text-xs text-gray-500">
                    To: {emailModalMsg.metadata.email.to}
                    {emailModalMsg.metadata.email.cc && `, CC: ${emailModalMsg.metadata.email.cc}`}
                  </p>
                )}
              </div>
              <button onClick={() => setEmailModalMsg(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded mt-0.5">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              {emailModalMsg.metadata?.email?.htmlBody
                ? <div dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(emailModalMsg.metadata.email.htmlBody),
                  }} />
                : <p className="text-sm text-gray-700 whitespace-pre-wrap">{emailModalMsg.text}</p>
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}