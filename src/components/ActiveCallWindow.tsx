import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  Mic, MicOff, Pause, Play, Volume2, VolumeX,
  Grid3x3, ArrowRightLeft, Circle, Square,
  PhoneOff, ChevronDown, ChevronUp,
  FileText, Search, Phone,
} from 'lucide-react';
import { useCall } from '../context/CallContext';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { BaseInput, TextareaInput } from './ui/inputs';
import { Tag } from './ui/Tag';
import { Tooltip } from './ui/Tooltip';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (s: number): string => {
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

const AGENTS = [
  { id: '1', name: 'Alex Rivera',  initials: 'AR', status: 'online'  },
  { id: '2', name: 'Jordan Lee',   initials: 'JL', status: 'online'  },
  { id: '3', name: 'Sam Taylor',   initials: 'ST', status: 'busy'    },
  { id: '4', name: 'Morgan Kim',   initials: 'MK', status: 'offline' },
  { id: '5', name: 'Casey Nguyen', initials: 'CN', status: 'online'  },
];

const STATUS_COLOR: Record<string, string> = {
  online: 'var(--color-success)',
  busy: 'var(--color-warning)',
  offline: 'var(--color-gray-500)',
};

const classDrivenButtonStyle = {
  padding: undefined,
  borderRadius: undefined,
  borderWidth: undefined,
  color: undefined,
  boxShadow: undefined,
  fontSize: undefined,
} satisfies CSSProperties;

const classDrivenTagStyle = {
  backgroundColor: undefined,
  borderColor: undefined,
  color: undefined,
} satisfies CSSProperties;

// ─────────────────────────────────────────────────────────────────────────────
// Control button
// ─────────────────────────────────────────────────────────────────────────────
interface CtrlBtnProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  activeClass?: string;
  onClick: () => void;
}

const CtrlBtn = ({
  icon, label, active,
  activeClass = 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  onClick,
}: CtrlBtnProps) => (
  <Button
    type="button"
    variant="unstyled"
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all active:scale-95 select-none ${
      active
        ? activeClass
        : 'bg-gray-800 text-gray-400 border-gray-700/50 hover:bg-gray-700 hover:text-gray-200'
    }`}
    style={classDrivenButtonStyle}
    preserveChildLayout
  >
    <span className="flex flex-col items-center gap-1.5">
      {icon}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </span>
  </Button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export const ActiveCallWindow = () => {
  const { activeCall, endCall, toggleMute, toggleHold, toggleSpeaker, toggleRecord } = useCall();

  const [minimized,      setMinimized]      = useState(false);
  const [panel,          setPanel]          = useState<'keypad' | 'transfer' | 'note' | null>(null);
  const [note,           setNote]           = useState('');
  const [dtmf,           setDtmf]           = useState('');
  const [transferSearch, setTransferSearch] = useState('');

  if (!activeCall) return null;

  const { contact, duration, isMuted, isOnHold, isSpeaker, isRecording } = activeCall;

  const initials = contact.isKnown
    ? contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const togglePanel = (p: typeof panel) => setPanel(prev => prev === p ? null : p);

  const filtered = AGENTS.filter(a =>
    a.name.toLowerCase().includes(transferSearch.toLowerCase())
  );

  // ── Minimized pill ────────────────────────────────────────────────────────
  if (minimized) {
    return (
      <div className="fixed bottom-5 left-4 z-[9999] active-call-enter">
        <div className="bg-gray-900 rounded-2xl shadow-2xl border border-white/5 flex items-center gap-3 px-4 py-3 min-w-[260px]">
          <Avatar
            name={contact.isKnown ? initials : '?'}
            size="sm"
            fallbackTone="primary"
            alt={contact.name}
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">{contact.name}</p>
            <p className={`text-xs font-mono font-semibold ${isOnHold ? 'text-amber-400' : 'text-green-400'}`}>
              {isOnHold ? '⏸ On Hold' : fmt(duration)}
            </p>
          </div>
          <Tooltip content="Expand">
            <Button
              type="button"
              variant="unstyled"
              onClick={() => setMinimized(false)}
              className="text-gray-500 hover:text-gray-300 p-1 transition-colors"
              style={classDrivenButtonStyle}
              aria-label="Expand"
              preserveChildLayout
            >
              <ChevronUp size={16} />
            </Button>
          </Tooltip>
          <Tooltip content="End call">
            <Button
              type="button"
              variant="unstyled"
              onClick={endCall}
              className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0"
              style={classDrivenButtonStyle}
              aria-label="End call"
              preserveChildLayout
            >
              <PhoneOff size={14} className="text-white" />
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  }

  // ── Expanded panel ────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-5 left-4 z-[9999] active-call-enter">
      <div className="bg-gray-900 rounded-3xl shadow-2xl w-72 border border-white/5 overflow-hidden">

        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                name={contact.isKnown ? initials : '?'}
                size="base"
                fallbackTone="primary"
                showStatus
                statusColor={
                  isOnHold ? 'var(--color-warning)' : 'var(--color-success)'
                }
                alt={contact.name}
                style={{
                  width: 'calc(var(--spacing-xl) + var(--spacing-md) - var(--spacing-xs))',
                  height: 'calc(var(--spacing-xl) + var(--spacing-md) - var(--spacing-xs))',
                }}
              />
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-sm leading-tight truncate">{contact.name}</h3>
                <p className="text-gray-400 text-xs font-mono truncate">{contact.phone}</p>
                {contact.company && (
                  <p className="text-gray-500 text-[11px] truncate">{contact.company}</p>
                )}
              </div>
            </div>
            <Tooltip content="Minimize">
              <Button
                type="button"
                variant="unstyled"
                onClick={() => setMinimized(true)}
                className="text-gray-600 hover:text-gray-400 p-1 transition-colors flex-shrink-0 ml-2"
                style={classDrivenButtonStyle}
                aria-label="Minimize"
                preserveChildLayout
              >
                <ChevronDown size={16} />
              </Button>
            </Tooltip>
          </div>

          {/* Timer + status chips */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Phone size={13} className={isOnHold ? 'text-amber-400' : 'text-green-400'} />
              <p className={`text-3xl font-mono font-bold tracking-wider ${isOnHold ? 'text-amber-400' : 'text-green-400'}`}>
                {fmt(duration)}
              </p>
            </div>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <Tag
                label={isOnHold ? '⏸ On Hold' : '● Active'}
                size="sm"
                className={`border-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  isOnHold ? 'bg-amber-500/15 text-amber-400' : 'bg-green-500/15 text-green-400'
                }`}
                style={classDrivenTagStyle}
              />
              {isMuted && (
                <Tag
                  label="🔇 Muted"
                  size="sm"
                  className="border-0 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/15 text-red-400"
                  style={classDrivenTagStyle}
                />
              )}
              {isRecording && (
                <Tag
                  label="⏺ Rec"
                  size="sm"
                  className="border-0 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-400 recording-blink"
                  style={classDrivenTagStyle}
                />
              )}
              {isSpeaker && (
                <Tag
                  label="🔊 Speaker"
                  size="sm"
                  className="border-0 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/15 text-blue-400"
                  style={classDrivenTagStyle}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="px-5 pb-5 space-y-2.5">

          {/* 2×3 control grid */}
          <div className="grid grid-cols-3 gap-2">
            <CtrlBtn
              icon={isMuted ? <MicOff size={17} /> : <Mic size={17} />}
              label={isMuted ? 'Unmute' : 'Mute'}
              active={isMuted}
              activeClass="bg-red-500/20 text-red-400 border-red-500/30"
              onClick={toggleMute}
            />
            <CtrlBtn
              icon={isOnHold ? <Play size={17} /> : <Pause size={17} />}
              label={isOnHold ? 'Resume' : 'Hold'}
              active={isOnHold}
              activeClass="bg-amber-500/20 text-amber-400 border-amber-500/30"
              onClick={toggleHold}
            />
            <CtrlBtn
              icon={isSpeaker ? <Volume2 size={17} /> : <VolumeX size={17} />}
              label="Speaker"
              active={isSpeaker}
              activeClass="bg-blue-500/20 text-blue-400 border-blue-500/30"
              onClick={toggleSpeaker}
            />
            <CtrlBtn
              icon={<Grid3x3 size={17} />}
              label="Keypad"
              active={panel === 'keypad'}
              onClick={() => togglePanel('keypad')}
            />
            <CtrlBtn
              icon={<ArrowRightLeft size={17} />}
              label="Transfer"
              active={panel === 'transfer'}
              activeClass="bg-violet-500/20 text-violet-400 border-violet-500/30"
              onClick={() => togglePanel('transfer')}
            />
            <CtrlBtn
              icon={isRecording ? <Square size={17} /> : <Circle size={17} />}
              label={isRecording ? 'Stop' : 'Record'}
              active={isRecording}
              activeClass="bg-rose-500/20 text-rose-400 border-rose-500/30"
              onClick={toggleRecord}
            />
          </div>

          {/* Note toggle button */}
          <Button
            type="button"
            variant="unstyled"
            onClick={() => togglePanel('note')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
              panel === 'note'
                ? 'bg-gray-700 text-gray-200'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
            }`}
            style={classDrivenButtonStyle}
            fullWidth
            preserveChildLayout
          >
            <span className="flex w-full items-center gap-2">
              <FileText size={13} />
              <span>{note ? 'Edit call note' : 'Add call note'}</span>
              {note && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />}
            </span>
          </Button>

          {/* ── Keypad panel ── */}
          {panel === 'keypad' && (
            <div className="bg-gray-800 rounded-2xl p-3">
              <p className="text-gray-400 text-xs font-mono text-center mb-2.5 min-h-[18px] tracking-widest">
                {dtmf || <span className="text-gray-600">· · ·</span>}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {KEYPAD.map(k => (
                  <Button
                    key={k}
                    type="button"
                    variant="unstyled"
                    onClick={() => setDtmf(p => p + k)}
                    className="h-10 rounded-xl bg-gray-700 hover:bg-gray-600 active:scale-95 text-white font-semibold text-sm transition-all"
                    style={classDrivenButtonStyle}
                    preserveChildLayout
                  >
                    {k}
                  </Button>
                ))}
              </div>
              {dtmf && (
                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() => setDtmf('')}
                  className="w-full mt-2 text-[11px] text-gray-500 hover:text-gray-400 transition-colors"
                  style={classDrivenButtonStyle}
                  fullWidth
                  preserveChildLayout
                >
                  Clear
                </Button>
              )}
            </div>
          )}

          {/* ── Transfer panel ── */}
          {panel === 'transfer' && (
            <div className="bg-gray-800 rounded-2xl p-3">
              <p className="text-gray-300 text-xs font-semibold mb-2.5">Transfer to agent</p>
              <div className="relative mb-2">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <BaseInput
                  type="search"
                  value={transferSearch}
                  onChange={e => setTransferSearch(e.target.value)}
                  placeholder="Search agents…"
                  className="w-full bg-gray-700 text-white text-xs pl-7 pr-3 py-2 rounded-lg outline-none placeholder-gray-500 border border-gray-600 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-0.5 max-h-36 overflow-y-auto">
                {filtered.length === 0 && (
                  <p className="text-gray-500 text-xs text-center py-3">No agents found</p>
                )}
                {filtered.map(agent => (
                  <Button
                    key={agent.id}
                    type="button"
                    variant="unstyled"
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-700 transition-colors text-left"
                    style={classDrivenButtonStyle}
                    fullWidth
                    preserveChildLayout
                  >
                    <span className="flex w-full items-center gap-2.5">
                      <Avatar
                        name={agent.initials}
                        size="xs"
                        fallbackTone="primary"
                        showStatus
                        statusColor={STATUS_COLOR[agent.status]}
                        alt={agent.name}
                      />
                      <span className="text-gray-300 text-xs flex-1 truncate">{agent.name}</span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* ── Note panel ── */}
          {panel === 'note' && (
            <TextareaInput
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Type your call note…"
              rows={3}
              className="w-full bg-gray-800 text-gray-200 text-xs px-3 py-2.5 rounded-xl outline-none placeholder-gray-600 resize-none border border-gray-700 focus:border-indigo-500 transition-colors"
            />
          )}

          {/* ── End call ── */}
          <Button
            type="button"
            variant="unstyled"
            onClick={endCall}
            className="w-full h-11 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
            style={classDrivenButtonStyle}
            fullWidth
            preserveChildLayout
          >
            <span className="flex items-center justify-center gap-2">
              <PhoneOff size={17} />
              End Call
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};
