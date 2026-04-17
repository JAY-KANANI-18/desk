import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search, Phone, ChevronDown, ChevronLeft, UserCircle2,
  CheckCircle2, LockOpen, MoreVertical,
} from 'lucide-react';
import { teams } from './data';
import type { Conversation } from './types';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useInbox } from '../../context/InboxContext';
import { inboxApi } from '../../lib/inboxApi';
import { useCall } from '../../context/CallContext';
import { MobileSheet } from '../../components/topbar/MobileSheet';

interface ChatHeaderProps {
  selectedConversation: Conversation;
  snoozedUntil: string | null;
  onSnooze: (value: string) => void;
  onUnsnooze: () => void;
  chatStatus: 'open' | 'closed';
  msgSearchOpen: boolean;
  onToggleMsgSearch: () => void;
  onBack?: () => void;
  onOpenContactDetails?: () => void;
}
export type ConvStatus = "open" | "closed";
export type ConvPriority = "low" | "normal" | "high" | "urgent";
export type Direction = "incoming" | "outgoing";

// ─── LifecycleSelector ────────────────────────────────────────────
// Renders below the contact name as plain metadata text.
// On hover a small chevron appears. On click a minimal dropdown opens.

interface LifecycleStage {
  id: string | number;
  name: string;
  emoji: string;
  type: 'lifecycle' | 'lost';
}

interface LifecycleSelectorProps {
  currentStageId: string | number | null | undefined;
  lifecycles: LifecycleStage[];
  onSelect: (stageId: string | number | null) => Promise<void>;
  className?: string;
  chevronClassName?: string;
}

function LifecycleSelector({
  currentStageId,
  lifecycles,
  onSelect,
  className,
  chevronClassName,
}: LifecycleSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = lifecycles.find(l => String(l.id) === String(currentStageId));
  const lifecycleStages = lifecycles.filter(l => l.type === 'lifecycle');
  const lostStages = lifecycles.filter(l => l.type === 'lost');
  return (
    <div className="relative inline-flex" ref={ref}>
      {/* Trigger — plain text appearance; chevron fades in on hover */}
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={className ?? "group flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors leading-none"}
      >
        {current ? (
          <>
            <span className="text-sm leading-none">{current.emoji}</span>
            <span className={current.type === 'lost' ? 'text-orange-500' : 'text-indigo-500'}>
              {current.name}
            </span>
          </>
        ) : (
          <span className="italic">Set stage</span>
        )}
        <ChevronDown
          size={10}
          className={chevronClassName ?? "opacity-0 group-hover:opacity-50 transition-opacity -mb-px"}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Clear option */}
          <div className="p-1.5 border-b border-gray-100">
            <button
              type="button"
              onClick={() => { onSelect(null); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors
                ${!currentStageId ? 'bg-gray-100 text-gray-600' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <span className="w-4 text-center leading-none">—</span>
              <span>No stage</span>
              {!currentStageId && <CheckCircle2 size={11} className="ml-auto text-gray-500" />}
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {lifecycleStages.length > 0 && (
              <div>
                <p className="px-3 pt-2 pb-0.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  Lifecycle
                </p>
                {lifecycleStages.map(stage => {
                  const selected = String(stage.id) === String(currentStageId);
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => { onSelect(stage.id); setOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors
                        ${selected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                    >
                      <span className="text-sm leading-none w-4 text-center">{stage.emoji}</span>
                      <span className={`flex-1 text-left font-medium ${selected ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {stage.name}
                      </span>
                      {selected && <CheckCircle2 size={11} className="text-indigo-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {lostStages.length > 0 && (
              <div className={lifecycleStages.length > 0 ? 'border-t border-gray-100 mt-1' : ''}>
                <p className="px-3 pt-2 pb-0.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  Lost
                </p>
                {lostStages.map(stage => {
                  const selected = String(stage.id) === String(currentStageId);
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => { onSelect(stage.id); setOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors
                        ${selected ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                    >
                      <span className="text-sm leading-none w-4 text-center">{stage.emoji}</span>
                      <span className={`flex-1 text-left font-medium ${selected ? 'text-orange-700' : 'text-gray-700'}`}>
                        {stage.name}
                      </span>
                      {selected && <CheckCircle2 size={11} className="text-orange-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {lifecycles.length === 0 && (
              <p className="py-5 text-xs text-center text-gray-400">No stages configured</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ChatHeader ───────────────────────────────────────────────────

export function ChatHeader({
  selectedConversation,
  msgSearchOpen,
  onToggleMsgSearch,
  onBack,
  onOpenContactDetails,
}: ChatHeaderProps) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatStatus, setChatStatus] = useState<"open" | "closed" | null>(null);

  const assignRef = useRef<HTMLDivElement>(null);
  const assignSheetRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const { workspaceUsers } = useWorkspace();

  const { assignUser, closeConversation, openConversation, lifecycles, fetchLifecycles, sendMessage, selectedChannel } = useInbox();
  const { startOutgoingCall } = useCall();

  useEffect(() => {
    fetchLifecycles();
  }, [fetchLifecycles]);

  const filteredMembers = workspaceUsers?.filter(m => m?.firstName?.toLowerCase().includes(assignSearch.toLowerCase()) || m?.lastName?.toLowerCase().includes(assignSearch.toLowerCase())) || [];
  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(assignSearch.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        assignRef.current &&
        !assignRef.current.contains(e.target as Node) &&
        !assignSheetRef.current?.contains(e.target as Node)
      ) {
        setAssignOpen(false); setAssignSearch('');
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!selectedConversation) return;
    setChatStatus((selectedConversation?.contact?.status as "open" | "closed" | undefined) ?? null);
  }, [selectedConversation,selectedConversation?.contact?.status]);

  const assignee = useMemo(
    () =>
      workspaceUsers?.find(
        (u) => u.id === selectedConversation?.contact?.assigneeId,
      ) || null,
    [workspaceUsers, selectedConversation?.contact?.assigneeId],
  );
  const currentLifecycle = useMemo(
    () =>
      (lifecycles ?? []).find(
        (stage: LifecycleStage) =>
          String(stage.id) === String(selectedConversation?.contact?.lifecycleId),
      ) ?? null,
    [lifecycles, selectedConversation?.contact?.lifecycleId],
  );
  const contactName =
    [selectedConversation?.contact?.firstName, selectedConversation?.contact?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Contact';
  const mobileContactName =
    contactName.length > 7 ? `${contactName.slice(0, 7)}...` : contactName;
  const mobileAssigneeLabel = assignee
    ? [assignee.firstName, assignee.lastName]
      .filter(Boolean)
      .map((part) => part.split(' ')[0])
      .join(' ')
      .trim() || assignee.email || 'Assigned'
    : 'Unassigned';
  const fallbackLifecycleName =
    selectedConversation?.contact?.lifecycleStage?.trim() || '';
  const mobileLifecycleLabel = currentLifecycle
    ? `${currentLifecycle.emoji} ${currentLifecycle.name}`
    : fallbackLifecycleName
      ? `Lifecycle: ${fallbackLifecycleName}`
      : 'Lifecycle details';
  const mobileStatusLabel = chatStatus === 'closed' ? 'Open conversation' : 'Close conversation';

  const handleStatusAction = async (s: ConvStatus) => {
    setChatStatus(null);
    setMobileMenuOpen(false);
    if (s === "closed") await closeConversation();
    else if (s === "open") await openConversation();
  };

  const handleAssign = async (userId: string | null) => {
    setAssignOpen(false);
    setAssignSheetOpen(false);
    setAssignSearch("");
    await assignUser(userId);
  };

  const handleLifecycleChange = async (stageId: string | number | null) => {
    await inboxApi.updateContactLifecycle(
      String(selectedConversation.contact.id),
      stageId === null ? '' : String(stageId),
    );
  };

  const handleStartCall = async () => {
    if (!selectedChannel || selectedChannel.type !== 'exotel_call') return;
    const phone = selectedConversation?.contact?.phone;
    if (!phone) return;

    startOutgoingCall({
      name: `${selectedConversation?.contact?.firstName ?? ''} ${selectedConversation?.contact?.lastName ?? ''}`.trim() || 'Contact',
      phone,
      isKnown: true,
    });

    await sendMessage({
      text: '',
      metadata: {
        mode: 'voice_call',
        to: phone,
      },
    });
  };

  return (
    <div className="flex min-h-[3rem] shrink-0 flex-nowrap items-center gap-1.5 border-b border-gray-200 bg-white px-2 py-1.5 sm:gap-2 sm:px-4 md:min-h-[3.75rem] md:flex-wrap md:px-6 md:py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 md:hidden"
            aria-label="Back to inbox"
          >
            <ChevronLeft size={16} />
          </button>
        ) : null}

        <div className="relative">
          {onOpenContactDetails ? (
            <button
              type="button"
              onClick={onOpenContactDetails}
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-300 text-sm font-semibold transition-opacity hover:opacity-90 md:hidden"
              aria-label="Open contact details"
              title="Open contact details"
            >
              {selectedConversation?.contact?.avatarUrl ? (
                <img
                  src={selectedConversation.contact.avatarUrl}
                  alt={selectedConversation.contact.firstName || "avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>
                  {selectedConversation?.contact?.firstName?.charAt(0)?.toUpperCase() || "C"}
                </span>
              )}
            </button>
          ) : null}

          <div className={`${onOpenContactDetails ? 'hidden md:flex' : 'flex'} h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-300 text-sm font-semibold md:h-10 md:w-10`}>
            {selectedConversation?.contact?.avatarUrl ? (
              <img
                src={selectedConversation.contact.avatarUrl}
                alt={selectedConversation.contact.firstName || "avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {selectedConversation?.contact?.firstName?.charAt(0)?.toUpperCase() || "C"}
              </span>
            )}
          </div>

          {/* Channel icon if you want */}
          {/* 
  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white bg-white`}>
    <img src={ch.icon} alt={ch.label} className="w-3 h-3" />
  </span> 
  */}
        </div>

        <div className="min-w-0 max-w-[calc(100%-9rem)] flex-1 md:max-w-none">
          {onOpenContactDetails ? (
            <div
              className="flex min-w-0 max-w-full flex-col items-start rounded-lg px-0.5 py-0 text-left md:hidden"
              title={contactName}
            >
              <span className="block min-w-0 max-w-full whitespace-nowrap text-[14px] font-semibold leading-tight text-gray-900">
                {mobileContactName}
              </span>
              <LifecycleSelector
                currentStageId={selectedConversation?.contact?.lifecycleId}
                lifecycles={lifecycles ?? []}
                onSelect={handleLifecycleChange}
                className="group mt-0.5 flex items-center gap-1 text-[10px] leading-none text-gray-400 hover:text-gray-600 transition-colors"
                chevronClassName="opacity-70 transition-opacity -mb-px"
              />
            </div>
          ) : null}

          <div className={`${onOpenContactDetails ? 'hidden md:flex' : 'flex'} min-w-0 flex-col gap-0.5`}>
            <h3 className="truncate text-[15px] font-semibold leading-tight text-gray-900 sm:text-base">
              {contactName}
            </h3>
            <LifecycleSelector
              currentStageId={selectedConversation?.contact?.lifecycleId}
              lifecycles={lifecycles ?? []}
              onSelect={handleLifecycleChange}
            />
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-1 md:ml-auto md:w-auto md:flex-wrap md:justify-end md:gap-2">

        {/* Assign dropdown */}
        <button
          type="button"
          onClick={() => {
            setAssignSheetOpen(true);
            setAssignSearch('');
          }}
          className="flex h-8 min-w-0 max-w-[108px] flex-shrink items-center gap-1.5 rounded-lg border border-gray-200 px-2 text-[12px] text-gray-700 transition-colors hover:bg-gray-50 md:hidden"
        >
          {assignee === null ? (
            <><UserCircle2 size={16} className="text-gray-400" /><span className="truncate text-gray-500">{mobileAssigneeLabel}</span></>
          ) : (
            <>
              <div className="relative flex-shrink-0">
                {assignee.avatarUrl ? (
                  <img src={assignee.avatarUrl} alt={`${assignee.firstName} ${assignee.lastName}`} className="h-[18px] w-[18px] rounded-full object-cover" />
                ) : (
                  <div className="h-[18px] w-[18px] rounded-full bg-indigo-100 text-[9px] font-semibold text-indigo-700 flex items-center justify-center">
                    {assignee?.lastName?.charAt(0) || assignee?.firstName?.charAt(0)}
                  </div>
                )}
                {assignee.activityStatus === 'online' && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" />}
              </div>
              <span className="truncate max-w-[74px]">{mobileAssigneeLabel}</span>
            </>
          )}
          <ChevronDown size={12} className="flex-shrink-0 text-black" />
        </button>

        <div className="relative hidden min-w-0 flex-shrink md:block md:max-w-none md:flex-none" ref={assignRef}>
          <button
            type="button"
            onClick={() => { setAssignOpen(!assignOpen); setAssignSearch(''); }}
            className="flex w-auto min-w-0 items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            {assignee === null ? (
              <><UserCircle2 size={16} className="text-gray-400" /><span className="truncate text-gray-500">{mobileAssigneeLabel}</span></>
            ) :
              // assignee.kind === 'user' ? (
              <>
                <div className="relative flex-shrink-0">
                  <img src={assignee.avatarUrl} alt={`${assignee.firstName} ${assignee.lastName}`} className="h-[18px] w-[18px] rounded-full object-cover md:h-5 md:w-5" />

                  {/* <div className="w-5 h-5 bg-indigo-200 rounded-full flex items-center justify-center text-[10px] font-semibold text-indigo-700">{assignee?.firstName?.charAt(0) || assignee.lastName.charAt(0)}</div> */}
                  {assignee.activityStatus === 'online' && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" />}
                </div>
                <span className="truncate max-w-[74px] md:max-w-[120px]">{mobileAssigneeLabel}</span>
              </>
              // ) : (
              //   <>
              //     <div className={`w-5 h-5 ${assignee.color} rounded flex items-center justify-center`}><Users size={10} className="text-white" /></div>
              //     <span className="truncate max-w-[80px]">{assignee.name}</span>
              //   </>
              // )
            }
            <ChevronDown size={12} className="flex-shrink-0 text-black" />
          </button>

          {assignOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input autoFocus type="text" value={assignSearch} onChange={e => setAssignSearch(e.target.value)}
                    placeholder="Search agents or teams…"
                    className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {!assignSearch && (
                  <button onClick={() => { handleAssign(null); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors ${assignee === null ? 'bg-indigo-50' : ''}`}>
                    <UserCircle2 size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-500">Unassigned</span>
                    {assignee === null && <CheckCircle2 size={14} className="text-indigo-600 ml-auto" />}
                  </button>
                )}
                {filteredMembers.length > 0 && (
                  <>
                    <div className="px-3 pt-2 pb-1"><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Agents</span></div>
                    {filteredMembers.map(member => {
                      const isSelected =
                        // assignee?.kind === 'user' 
                        // && 
                        assignee?.id === member.id;
                      return (
                        <button key={member.id}
                          onClick={() => { handleAssign(member.id); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}>
                          <div className="relative flex-shrink-0">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-semibold text-indigo-700">{member?.lastName?.charAt(0) || member?.firstName?.charAt(0)}</div>
                            )}
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${member?.activityStatus === 'online' ? 'bg-green-500' : 'bg-gray-300'}`} />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-medium truncate">{member?.firstName} {member?.lastName}</p>
                            <p className={`text-xs ${member?.activityStatus === 'online' ? 'text-green-600' : 'text-gray-400'}`}>{member?.activityStatus === 'online' ? 'Online' : 'Offline'}</p>
                          </div>
                          {isSelected && <CheckCircle2 size={14} className="text-indigo-600 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </>
                )}
                {/* {filteredTeams.length > 0 && (
                  <>
                    <div className="px-3 pt-2 pb-1"><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Teams</span></div>
                    {filteredTeams.map(team => {
                      const isSelected = assignee?.kind === 'team' && assignee.id === team.id;
                      return (
                        <button key={team.id}
                          onClick={() => { setAssignee({ kind: 'team', ...team }); setAssignOpen(false); setAssignSearch(''); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}>
                          <div className={`w-7 h-7 ${team.color} rounded-lg flex items-center justify-center flex-shrink-0`}><Users size={13} className="text-white" /></div>
                          <span className="text-sm font-medium flex-1 text-left">{team.name}</span>
                          {isSelected && <CheckCircle2 size={14} className="text-indigo-600 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </>
                )} */}
                {filteredMembers.length === 0 && filteredTeams.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">No results</p>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleStatusAction(chatStatus === 'closed' ? 'open' : 'closed')}
          className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50 md:hidden"
          aria-label={mobileStatusLabel}
          title={mobileStatusLabel}
        >
          {chatStatus === 'closed' ? <LockOpen size={16} /> : <CheckCircle2 size={16} />}
        </button>

        <button
          type="button"
          onClick={onToggleMsgSearch}
          className={`hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 transition-colors md:flex md:h-10 md:w-10 md:rounded-2xl ${msgSearchOpen ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
          title="Search messages"
        >
          <Search size={18} />
        </button>

        {/* Snooze */}
        {/* <div className="relative" ref={snoozeRef}>
          <button
            onClick={() => setSnoozeOpen(!snoozeOpen)}
            className={`p-2 rounded-lg transition-colors relative ${snoozedUntil ? 'bg-amber-100 text-amber-600' : snoozeOpen ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}`}
            title={snoozedUntil ? `Snoozed (${snoozedUntil})` : 'Snooze chat'}
          >
            {snoozedUntil ? <AlarmClock size={20} /> : <Clock size={20} />}
            {snoozedUntil && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />}
          </button>
          {snoozeOpen && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2"><BellOff size={14} className="text-gray-500" /><span className="text-sm font-semibold text-gray-700">Snooze chat</span></div>
                {snoozedUntil && <p className="text-xs text-amber-600 mt-1">Currently snoozed</p>}
              </div>
              <div className="py-1">
                {snoozeOptions.map(opt => (
                  <button key={opt.value} onClick={() => { onSnooze(opt.value); setSnoozeOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${snoozedUntil === opt.value ? 'bg-amber-50 text-amber-700' : 'text-gray-700'}`}>
                    <span>{opt.label}</span>
                    {snoozedUntil === opt.value && <CheckCircle2 size={14} className="text-amber-600" />}
                  </button>
                ))}
              </div>
              {snoozedUntil && (
                <div className="border-t border-gray-100 py-1">
                  <button onClick={() => { onUnsnooze(); setSnoozeOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Remove snooze</button>
                </div>
              )}
            </div>
          )}
        </div> */}

        {selectedChannel?.type === 'exotel_call' && (
          <button
            type="button"
            onClick={handleStartCall}
            className="hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 md:flex md:h-10 md:w-10 md:rounded-2xl"
            title="Start call"
          >
            <Phone size={18} />
          </button>
        )}

        {/* Open / Close */}
        <div className="relative hidden md:block">
          {chatStatus === 'closed' ? (
            <button type="button" onClick={() => handleStatusAction('open')} className="inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50 md:rounded-2xl md:text-sm">
              <LockOpen size={16} />Open
            </button>
          ) : (
            <button type="button" onClick={() => handleStatusAction('closed')} className="inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50 md:rounded-2xl md:text-sm">
              <CheckCircle2 size={16} />Close
              {/* <ChevronDown size={14} className={`transition-transform ${closeMenuOpen ? 'rotate-180' : ''}`} /> */}
            </button>
          )}
          {/* ) : (
            <button onClick={() => setCloseMenuOpen(!closeMenuOpen)} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <CheckCircle2 size={16} />Close
              <ChevronDown size={14} className={`transition-transform ${closeMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          )} */}
          {/* {closeMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2"><Lock size={14} className="text-gray-500" /><span className="text-sm font-semibold text-gray-800">Close Conversation</span></div>
                <button onClick={() => setCloseMenuOpen(false)} className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100 transition-colors"><X size={14} /></button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                  <select value={closeCategory} onChange={e => setCloseCategory(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-700">
                    <option value="">Select a category…</option>
                    <option value="resolved">Resolved</option>
                    <option value="spam">Spam</option>
                    <option value="not_interested">Not Interested</option>
                    <option value="follow_up">Follow Up Later</option>
                    <option value="converted">Converted</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Summary</label>
                  <textarea value={closeSummary} onChange={e => setCloseSummary(e.target.value)}
                    placeholder="Add a brief summary of this conversation…" rows={3}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400" />
                </div>
              </div>
              <div className="px-4 pb-4">
                <button onClick={handleCloseChat} className="w-full py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <Lock size={14} />Close Chat
                </button>
              </div>
            </div>
          )} */}
        </div>

        <div className="relative md:hidden" ref={mobileMenuRef}>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 transition-colors ${mobileMenuOpen ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
            aria-label="More actions"
          >
            <MoreVertical size={16} />
          </button>

          {mobileMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
              <button
                type="button"
                onClick={() => {
                  onToggleMsgSearch();
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-3 text-left text-sm transition-colors ${msgSearchOpen ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Search size={16} />
                Search messages
              </button>

              {selectedChannel?.type === 'exotel_call' && (
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="flex w-full items-center gap-2.5 px-3 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Phone size={16} />
                  Start call
                </button>
              )}

              {onOpenContactDetails && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenContactDetails();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <ChevronDown size={16} />
                  {mobileLifecycleLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <MobileSheet
        open={assignSheetOpen}
        onClose={() => {
          setAssignSheetOpen(false);
          setAssignSearch('');
        }}
        title={
          <div>
            <p className="text-base font-semibold text-gray-900">Assign conversation</p>
            <p className="mt-0.5 truncate text-xs text-gray-500">{contactName}</p>
          </div>
        }
      >
        <div className="p-4" ref={assignSheetRef}>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={assignSearch}
              onChange={e => setAssignSearch(e.target.value)}
              placeholder="Search agents or teams..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
            {!assignSearch && (
              <button
                type="button"
                onClick={() => { handleAssign(null); }}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${assignee === null ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                  <UserCircle2 size={20} className="text-gray-400" />
                </span>
                <span className="flex-1 text-sm font-medium text-gray-600">Unassigned</span>
                {assignee === null && <CheckCircle2 size={16} className="text-indigo-600" />}
              </button>
            )}

            {filteredMembers.length > 0 && (
              <>
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Agents</span>
                </div>
                {filteredMembers.map(member => {
                  const isSelected = assignee?.id === member.id;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => { handleAssign(member.id); }}
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${isSelected ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'}`}
                    >
                      <div className="relative flex-shrink-0">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                            {member?.lastName?.charAt(0) || member?.firstName?.charAt(0)}
                          </div>
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${member?.activityStatus === 'online' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{member?.firstName} {member?.lastName}</p>
                        <p className={`text-xs ${member?.activityStatus === 'online' ? 'text-green-600' : 'text-gray-400'}`}>
                          {member?.activityStatus === 'online' ? 'Online' : 'Offline'}
                        </p>
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="flex-shrink-0 text-indigo-600" />}
                    </button>
                  );
                })}
              </>
            )}

            {filteredMembers.length === 0 && filteredTeams.length === 0 && (
              <p className="bg-white py-8 text-center text-sm text-gray-400">No results</p>
            )}
          </div>
        </div>
      </MobileSheet>
    </div>
  );
}
