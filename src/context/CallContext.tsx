import React, {
  createContext, useContext, useState,
  useCallback, useEffect, useRef,
} from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface CallContact {
  id?: number;
  name: string;
  phone: string;
  company?: string;
  isKnown: boolean;
}

export interface IncomingCall {
  id: string;
  contact: CallContact;
  channel: string;
  startedAt: number;
}

export interface ActiveCall {
  id: string;
  contact: CallContact;
  channel: string;
  startedAt: number;
  duration: number;
  isMuted: boolean;
  isOnHold: boolean;
  isSpeaker: boolean;
  isRecording: boolean;
  status: 'active' | 'on_hold';
}

interface CallContextType {
  incomingCall: IncomingCall | null;
  activeCall: ActiveCall | null;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  toggleSpeaker: () => void;
  toggleRecord: () => void;
  simulateIncomingCall: (contact?: Partial<CallContact>) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────
const DUMMY_MODE = true;

const MOCK_CALLERS: CallContact[] = [
  { id: 1, name: 'Sarah Johnson',   phone: '+1 (555) 234-5678', company: 'Acme Corp',     isKnown: true  },
  { id: 2, name: 'Michael Chen',    phone: '+1 (555) 876-5432', company: 'TechStart Inc', isKnown: true  },
  {        name: 'Unknown Caller',  phone: '+1 (555) 000-1234',                            isKnown: false },
  { id: 3, name: 'Emma Williams',   phone: '+44 20 7946 0958',  company: 'Global Ltd',    isKnown: true  },
  { id: 4, name: 'James Rodriguez', phone: '+1 (555) 321-9876', company: 'StartupXYZ',    isKnown: true  },
  {        name: 'Unknown Caller',  phone: '+1 (555) 888-0000',                            isKnown: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const CallContext = createContext<CallContextType | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall,   setActiveCall]   = useState<ActiveCall   | null>(null);

  // Stable refs so callbacks/timeouts always see latest state
  const incomingRef = useRef(incomingCall);
  const activeRef   = useRef(activeCall);
  incomingRef.current = incomingCall;
  activeRef.current   = activeCall;

  // ── Duration timer (only ticks when not on hold) ─────────────────────────
  useEffect(() => {
    if (!activeCall) return;
    const interval = setInterval(() => {
      setActiveCall(prev => {
        if (!prev || prev.isOnHold) return prev;
        return { ...prev, duration: prev.duration + 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall?.id]); // restart only when a new call begins

  // ── Auto-dismiss incoming call after 30 s (no answer) ───────────────────
  useEffect(() => {
    if (!incomingCall) return;
    const t = setTimeout(() => setIncomingCall(null), 30_000);
    return () => clearTimeout(t);
  }, [incomingCall?.id]);

  // ── DUMMY_MODE: simulate first incoming call after 8 s ───────────────────
  useEffect(() => {
    if (!DUMMY_MODE) return;
    const t = setTimeout(() => {
      if (!incomingRef.current && !activeRef.current) {
        const caller = MOCK_CALLERS[Math.floor(Math.random() * MOCK_CALLERS.length)];
        setIncomingCall({
          id: `call_${Date.now()}`,
          contact: caller,
          channel: 'phone',
          startedAt: Date.now(),
        });
      }
    }, 8_000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ──────────────────────────────────────────────────────────────
  const simulateIncomingCall = useCallback((contact?: Partial<CallContact>) => {
    if (incomingRef.current || activeRef.current) return;
    const base   = MOCK_CALLERS[Math.floor(Math.random() * MOCK_CALLERS.length)];
    const caller = { ...base, ...contact };
    setIncomingCall({
      id: `call_${Date.now()}`,
      contact: caller,
      channel: 'phone',
      startedAt: Date.now(),
    });
  }, []);

  const acceptCall = useCallback(() => {
    const call = incomingRef.current;
    if (!call) return;
    setActiveCall({
      id: call.id,
      contact: call.contact,
      channel: call.channel,
      startedAt: Date.now(),
      duration: 0,
      isMuted: false,
      isOnHold: false,
      isSpeaker: false,
      isRecording: false,
      status: 'active',
    });
    setIncomingCall(null);
  }, []);

  const rejectCall    = useCallback(() => setIncomingCall(null), []);
  const endCall       = useCallback(() => setActiveCall(null), []);
  const toggleMute    = useCallback(() => setActiveCall(p => p ? { ...p, isMuted:      !p.isMuted      } : null), []);
  const toggleHold    = useCallback(() => setActiveCall(p => p ? { ...p, isOnHold:     !p.isOnHold,    status: p.isOnHold ? 'active' : 'on_hold' } : null), []);
  const toggleSpeaker = useCallback(() => setActiveCall(p => p ? { ...p, isSpeaker:    !p.isSpeaker    } : null), []);
  const toggleRecord  = useCallback(() => setActiveCall(p => p ? { ...p, isRecording:  !p.isRecording  } : null), []);

  return (
    <CallContext.Provider value={{
      incomingCall, activeCall,
      acceptCall, rejectCall, endCall,
      toggleMute, toggleHold, toggleSpeaker, toggleRecord,
      simulateIncomingCall,
    }}>
      {children}
    </CallContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export const useCall = (): CallContextType => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
};
