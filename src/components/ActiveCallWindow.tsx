import { useState } from 'react';
import {
  Mic, MicOff, Pause, Play, Volume2, VolumeX,
  Grid3x3, ArrowRightLeft, Circle, Square,
  PhoneOff, ChevronDown, ChevronUp, User,
  FileText, Search, Phone,
} from 'lucide-react';
import { useCall } from '../context/CallContext';

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

const DOT: Record<string, string> = {
  online:  'bg-green-400',
  busy:    'bg-amber-400',
  offline: 'bg-gray-500',
};

// ─────────────────────────────────────────────────────────────────────────────
// Control button
// ─────────────────────────────────────────────────────────────────────────────
interface CtrlBtnProps {
  icon: React.ReactNode;
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
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all active:scale-95 select-none ${
      active
        ? activeClass
        : 'bg-gray-800 text-gray-400 border-gray-700/50 hover:bg-gray-700 hover:text-gray-200'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium leading-none">{label}</span>
  </button>
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
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {contact.isKnown ? initials : <User size={14} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">{contact.name}</p>
            <p className={`text-xs font-mono font-semibold ${isOnHold ? 'text-amber-400' : 'text-green-400'}`}>
              {isOnHold ? '⏸ On Hold' : fmt(duration)}
            </p>
          </div>
          <button
            onClick={() => setMinimized(false)}
            className="text-gray-500 hover:text-gray-300 p-1 transition-colors"
            title="Expand"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={endCall}
            className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0"
            title="End call"
          >
            <PhoneOff size={14} className="text-white" />
          </button>
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
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {contact.isKnown ? initials : <User size={16} />}
                </div>
                {/* Live status dot */}
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${
                  isOnHold ? 'bg-amber-400' : 'bg-green-400 call-active-dot'
                }`} />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-sm leading-tight truncate">{contact.name}</h3>
                <p className="text-gray-400 text-xs font-mono truncate">{contact.phone}</p>
                {contact.company && (
                  <p className="text-gray-500 text-[11px] truncate">{contact.company}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setMinimized(true)}
              className="text-gray-600 hover:text-gray-400 p-1 transition-colors flex-shrink-0 ml-2"
              title="Minimize"
            >
              <ChevronDown size={16} />
            </button>
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
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                isOnHold ? 'bg-amber-500/15 text-amber-400' : 'bg-green-500/15 text-green-400'
              }`}>
                {isOnHold ? '⏸ On Hold' : '● Active'}
              </span>
              {isMuted && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/15 text-red-400">
                  🔇 Muted
                </span>
              )}
              {isRecording && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-400 recording-blink">
                  ⏺ Rec
                </span>
              )}
              {isSpeaker && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/15 text-blue-400">
                  🔊 Speaker
                </span>
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
          <button
            onClick={() => togglePanel('note')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
              panel === 'note'
                ? 'bg-gray-700 text-gray-200'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
            }`}
          >
            <FileText size={13} />
            <span>{note ? 'Edit call note' : 'Add call note'}</span>
            {note && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />}
          </button>

          {/* ── Keypad panel ── */}
          {panel === 'keypad' && (
            <div className="bg-gray-800 rounded-2xl p-3">
              <p className="text-gray-400 text-xs font-mono text-center mb-2.5 min-h-[18px] tracking-widest">
                {dtmf || <span className="text-gray-600">· · ·</span>}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {KEYPAD.map(k => (
                  <button
                    key={k}
                    onClick={() => setDtmf(p => p + k)}
                    className="h-10 rounded-xl bg-gray-700 hover:bg-gray-600 active:scale-95 text-white font-semibold text-sm transition-all"
                  >
                    {k}
                  </button>
                ))}
              </div>
              {dtmf && (
                <button
                  onClick={() => setDtmf('')}
                  className="w-full mt-2 text-[11px] text-gray-500 hover:text-gray-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* ── Transfer panel ── */}
          {panel === 'transfer' && (
            <div className="bg-gray-800 rounded-2xl p-3">
              <p className="text-gray-300 text-xs font-semibold mb-2.5">Transfer to agent</p>
              <div className="relative mb-2">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
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
                  <button
                    key={agent.id}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {agent.initials}
                    </div>
                    <span className="text-gray-300 text-xs flex-1 truncate">{agent.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT[agent.status]}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Note panel ── */}
          {panel === 'note' && (
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Type your call note…"
              rows={3}
              className="w-full bg-gray-800 text-gray-200 text-xs px-3 py-2.5 rounded-xl outline-none placeholder-gray-600 resize-none border border-gray-700 focus:border-indigo-500 transition-colors"
            />
          )}

          {/* ── End call ── */}
          <button
            onClick={endCall}
            className="w-full h-11 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
          >
            <PhoneOff size={17} />
            End Call
          </button>
        </div>
      </div>
    </div>
  );
};
