import { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowDownLeft, ArrowUpRight, PhoneMissed, Phone, Settings } from 'lucide-react';
import { callLogs, channelConfig } from './data';
import type { Conversation } from './types';

const PAGE_SIZE = 10;

/* ─── skeletons ─────────────────────────────────────────────────────────────── */

function ConvSkeleton() {
  return (
    <div className="px-4 py-3 border-b border-gray-100 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-28" />
            <div className="h-3 bg-gray-100 rounded w-10" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-40" />
          <div className="flex gap-1.5">
            <div className="h-4 bg-gray-100 rounded w-16" />
            <div className="h-4 bg-gray-100 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CallSkeleton() {
  return (
    <div className="p-4 border-b border-gray-100 animate-pulse flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-3 bg-gray-100 rounded w-12" />
        </div>
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
    </div>
  );
}

/* ─── unread badge ──────────────────────────────────────────────────────────── */

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

/* ─── main component ───────────────────────────────────────────────────────── */

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation;
  onSelectConversation: (conv: Conversation) => void;
  channelOverrides?: Record<number, string>;
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  channelOverrides = {},
}: ConversationListProps) {
  const [chatSearch,     setChatSearch]     = useState('');
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [unreplied,      setUnreplied]      = useState(false);
  const [activeTab,      setActiveTab]      = useState<'chats' | 'calls'>('chats');
  const [chatDirection,  setChatDirection]  = useState<'all' | 'incoming' | 'outgoing'>('all');

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore,  setLoadingMore]  = useState(false);

  const listRef     = useRef<HTMLDivElement>(null);
  const callListRef = useRef<HTMLDivElement>(null);

  /* reset pagination when filters change */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [chatSearch, chatDirection, unreplied, activeTab]);

  const filteredConversations = conversations.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(chatSearch.toLowerCase()) ||
      c.message.toLowerCase().includes(chatSearch.toLowerCase());
    const matchesDirection = chatDirection === 'all' || c.direction === chatDirection;
    const matchesUnreplied = !unreplied || c.unreadCount > 0;
    return matchesSearch && matchesDirection && matchesUnreplied;
  });

  const hasMoreConvs        = filteredConversations.length > visibleCount;
  const visibleConversations = filteredConversations.slice(0, visibleCount);

  const hasMoreCalls    = callLogs.length > visibleCount;
  const visibleCallLogs = callLogs.slice(0, visibleCount);

  /* total unread count for tab badge */
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  /* scroll handler for conversation list */
  const handleConvScroll = () => {
    if (!listRef.current || loadingMore || !hasMoreConvs) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 60) {
      setLoadingMore(true);
      setTimeout(() => {
        setVisibleCount(prev => prev + PAGE_SIZE);
        setLoadingMore(false);
      }, 600);
    }
  };

  /* scroll handler for call log list */
  const handleCallScroll = () => {
    if (!callListRef.current || loadingMore || !hasMoreCalls) return;
    const { scrollTop, scrollHeight, clientHeight } = callListRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 60) {
      setLoadingMore(true);
      setTimeout(() => {
        setVisibleCount(prev => prev + PAGE_SIZE);
        setLoadingMore(false);
      }, 600);
    }
  };

  return (
    <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'chats' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Chats
          {totalUnread > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] bg-blue-600 text-white text-[10px] font-bold rounded-full px-1 leading-none">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('calls')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'calls' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Calls
        </button>
      </div>

      {activeTab === 'chats' ? (
        <>
          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => { setChatSearchOpen(!chatSearchOpen); if (chatSearchOpen) setChatSearch(''); }}
                className={`p-1.5 rounded-lg transition-colors ${chatSearchOpen ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <Search size={16} />
              </button>
            </div>
            {chatSearchOpen && (
              <div className="relative mb-2">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  value={chatSearch}
                  onChange={e => setChatSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {chatSearch && (
                  <button onClick={() => setChatSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 flex-1 min-w-0">
                <option>Open, Newest</option>
                <option>Open, Oldest</option>
                <option>Closed</option>
              </select>
              <button
                onClick={() => setUnreplied(!unreplied)}
                className={`text-sm px-3 py-1.5 border rounded-lg transition-colors whitespace-nowrap ${unreplied ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Unreplied
              </button>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {(['all', 'incoming', 'outgoing'] as const).map(dir => (
                <button
                  key={dir}
                  onClick={() => setChatDirection(dir)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    chatDirection === dir
                      ? dir === 'incoming' ? 'bg-green-50 border-green-400 text-green-700'
                        : dir === 'outgoing' ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-gray-100 border-gray-400 text-gray-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {dir === 'incoming' && <ArrowDownLeft size={12} />}
                  {dir === 'outgoing' && <ArrowUpRight size={12} />}
                  {dir === 'all' ? 'All' : dir.charAt(0).toUpperCase() + dir.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation rows */}
          <div
            ref={listRef}
            onScroll={handleConvScroll}
            className="flex-1 overflow-y-auto"
          >
            {visibleConversations.length > 0 ? (
              <>
                {visibleConversations.map(conv => {
                  const effectiveChannel = channelOverrides[conv.id] ?? conv.channel;
                  const cfg = channelConfig[effectiveChannel] ?? channelConfig['email'];
                  const isUnread = conv.unreadCount > 0;
                  const isSelected = selectedConversation.id === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => onSelectConversation(conv)}
                      className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50'
                          : isUnread
                            ? 'bg-white hover:bg-gray-50'
                            : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar + channel badge */}
                        <div className="relative flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${isUnread ? 'bg-gray-400 text-white' : 'bg-gray-300'}`}>
                            {conv.avatar}
                          </div>
                          <span
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white text-white ${cfg.bg}`}
                            title={cfg.label}
                          >
                            {cfg.icon}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Row 1: name + time + unread badge */}
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                              {conv.name}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                              <span className={`text-xs ${isUnread ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                                {conv.time}
                              </span>
                              <UnreadBadge count={conv.unreadCount} />
                            </div>
                          </div>

                          {/* Row 2: direction arrow + message preview */}
                          <div className="flex items-center gap-1 mb-1.5">
                            {conv.direction === 'incoming'
                              ? <ArrowDownLeft size={11} className="text-green-500 flex-shrink-0" />
                              : <ArrowUpRight size={11} className="text-blue-500 flex-shrink-0" />}
                            <p className={`text-xs truncate ${isUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                              {conv.message}
                            </p>
                          </div>

                          {/* Row 3: tag + channel pill */}
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 font-medium">
                              {conv.tag}
                            </span>
                            {/* <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium text-white ${cfg.bg}`}>
                              {cfg.icon}{cfg.label}
                            </span> */}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loadingMore && (
                  <>
                    <ConvSkeleton />
                    <ConvSkeleton />
                    <ConvSkeleton />
                  </>
                )}

                {!hasMoreConvs && !loadingMore && filteredConversations.length > PAGE_SIZE && (
                  <div className="flex justify-center py-4">
                    <span className="text-[11px] text-gray-400">All conversations loaded</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center mt-10">No conversations found</p>
            )}
          </div>
        </>
      ) : (
        /* ── Calls tab ─────────────────────────────────────────────────────── */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Calls</span>
            <button className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
              <Settings size={13} />Manage
            </button>
          </div>
          <div
            ref={callListRef}
            onScroll={handleCallScroll}
            className="flex-1 overflow-y-auto"
          >
            {visibleCallLogs.map(call => {
              const isIncoming = call.direction === 'incoming';
              const isMissed   = call.direction === 'missed';
              return (
                <div key={call.id} className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">{call.avatar}</div>
                    <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${isMissed ? 'bg-red-100' : isIncoming ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {isMissed
                        ? <PhoneMissed size={10} className="text-red-500" />
                        : isIncoming
                          ? <ArrowDownLeft size={10} className="text-green-600" />
                          : <ArrowUpRight size={10} className="text-blue-600" />}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-sm">{call.name}</span>
                      <span className="text-xs text-gray-500">{call.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isMissed ? (
                        <span className="text-xs text-red-500 font-medium">Missed call</span>
                      ) : (
                        <>
                          <span className={`text-xs font-medium ${isIncoming ? 'text-green-600' : 'text-blue-600'}`}>{isIncoming ? 'Incoming' : 'Outgoing'}</span>
                          {call.duration && <span className="text-xs text-gray-400">· {call.duration}</span>}
                        </>
                      )}
                    </div>
                  </div>
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 flex-shrink-0"><Phone size={15} /></button>
                </div>
              );
            })}

            {loadingMore && (
              <>
                <CallSkeleton />
                <CallSkeleton />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
