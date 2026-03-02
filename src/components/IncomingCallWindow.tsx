import { Phone, PhoneOff, User } from 'lucide-react';
import { useCall } from '../context/CallContext';

export const IncomingCallWindow = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  const { contact } = incomingCall;
  const initials = contact.isKnown
    ? contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 2147483647 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative incoming-call-enter">
        <div className="bg-gray-900 rounded-3xl shadow-2xl w-72 overflow-hidden border border-white/5">

          {/* Top section */}
          <div className="px-6 pt-8 pb-6 text-center">
            {/* Label */}
            <p className="text-gray-400 text-[11px] font-semibold tracking-[0.18em] uppercase mb-6">
              Incoming Call
            </p>

            {/* Avatar with pulse rings */}
            <div className="relative flex items-center justify-center mb-5" style={{ height: 96 }}>
              <div className="call-ring-outer absolute w-24 h-24 rounded-full border border-green-400/20" />
              <div className="call-ring-inner absolute w-20 h-20 rounded-full border border-green-400/40" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold relative z-10 shadow-xl">
                {contact.isKnown ? initials : <User size={24} />}
              </div>
            </div>

            {/* Contact info */}
            <h2 className="text-white text-xl font-semibold leading-tight">{contact.name}</h2>
            <p className="text-gray-400 text-sm mt-1 font-mono">{contact.phone}</p>
            {contact.company && (
              <p className="text-gray-500 text-xs mt-0.5">{contact.company}</p>
            )}
            {!contact.isKnown && (
              <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-full border border-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                Unknown caller
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5 mx-6" />

          {/* Action buttons */}
          <div className="px-6 py-7 flex items-center justify-center gap-12">
            {/* Decline */}
            <div className="flex flex-col items-center gap-2.5">
              <button
                onClick={rejectCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 flex items-center justify-center transition-all shadow-lg shadow-red-500/30"
                aria-label="Decline call"
              >
                <PhoneOff size={22} className="text-white" />
              </button>
              <span className="text-gray-500 text-xs">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-2.5">
              <button
                onClick={acceptCall}
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 active:scale-95 flex items-center justify-center transition-all shadow-lg shadow-green-500/30 call-accept-pulse"
                aria-label="Accept call"
              >
                <Phone size={22} className="text-white" />
              </button>
              <span className="text-gray-500 text-xs">Accept</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
