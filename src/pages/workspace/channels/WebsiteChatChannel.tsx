import { useState, useRef } from 'react';
import { Copy, Check, Upload, X, ChevronDown } from 'lucide-react';
import type { Channel as WsChannel } from '../types';

const WIDGET_SCRIPT = `<!-- This site is converting visitors into subscribers and customers with https://axodesk.com --><script id="axodesk__widget" src="https://cdn.axodesk.com/webchat/widget/widget.js?cId=242b95714c20371b5ae18ca5ab66177"></script><!-- https://axodesk.com -->`;

// ─── Chat icon SVGs ────────────────────────────────────────────────────────────
const CHAT_ICONS = [
  // 1 — filled bubble with dots
  (color: string) => (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-3 11H7v-2h10v2zm0-4H7V7h10v2z"/>
    </svg>
  ),
  // 2 — outlined bubble
  (color: string) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="22" height="22">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  // 3 — two bubbles
  (color: string) => (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <path d="M21 6.5A2.5 2.5 0 0 0 18.5 4h-13A2.5 2.5 0 0 0 3 6.5v7A2.5 2.5 0 0 0 5.5 16H7v3l3.5-3H18.5A2.5 2.5 0 0 0 21 13.5v-7z"/>
    </svg>
  ),
  // 4 — speech bubble with tail bottom-left
  (color: string) => (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <path d="M20 2H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h3v3l4-3h9a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
    </svg>
  ),
  // 5 — rounded square bubble
  (color: string) => (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <rect x="2" y="2" width="20" height="16" rx="4" ry="4"/>
      <path d="M8 22l4-4h6a2 2 0 0 0 2-2V6"/>
    </svg>
  ),
];

type SetupProps = {
  connected: WsChannel | null;
  onConnect: (ch: WsChannel) => void;
  onDisconnect: (id: number) => void;
};

export const WebsiteChatChannel = ({ onConnect }: SetupProps) => {
  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  // ── Step 1 state ────────────────────────────────────────────────────────────
  const [websites, setWebsites] = useState<string[]>([]);
  const [websiteInput, setWebsiteInput] = useState('');
  const [showWebsiteDropdown, setShowWebsiteDropdown] = useState(false);
  const [themeColor, setThemeColor] = useState('#448AFF');
  const [selectedIcon, setSelectedIcon] = useState(0);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // ── Step 2 state ────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const addWebsite = (val: string) => {
    const trimmed = val.trim().replace(/,+$/, '');
    if (trimmed && !websites.includes(trimmed)) {
      setWebsites(prev => [...prev, trimmed]);
    }
    setWebsiteInput('');
    setShowWebsiteDropdown(false);
  };

  const removeWebsite = (w: string) => setWebsites(prev => prev.filter(x => x !== w));

  const handleWebsiteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addWebsite(websiteInput);
    } else if (e.key === 'Backspace' && !websiteInput && websites.length) {
      setWebsites(prev => prev.slice(0, -1));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(WIDGET_SCRIPT).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = () => {
    if (!confirmed) return;
    onConnect({
      id: Date.now(),
      name: 'Website Chat',
      identifier: 'website-chat',
      status: 'Connected',
      icon: '💬',
      color: 'bg-blue-800',
      msgs: 0,
    });
  };

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="space-y-6">
        {/* Heading */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">Connect Website Chat</h2>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Start setting up with basic configurations. Further customization options are available after the channel is connected.
          </p>
        </div>

        {/* 1. Websites */}
        <div>
          <p className="text-sm text-gray-700 mb-2">
            1. Add the Website(s) where the Widget will be added.
          </p>
          <div
            className="relative border border-gray-300 rounded-lg bg-white min-h-[40px] flex flex-wrap items-center gap-1.5 px-3 py-2 cursor-text focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-200"
            onClick={() => { setShowWebsiteDropdown(true); }}
          >
            {websites.map(w => (
              <span
                key={w}
                className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-200"
              >
                {w}
                <button
                  onClick={e => { e.stopPropagation(); removeWebsite(w); }}
                  className="hover:text-blue-900"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={websiteInput}
              onChange={e => setWebsiteInput(e.target.value)}
              onKeyDown={handleWebsiteKeyDown}
              onFocus={() => setShowWebsiteDropdown(true)}
              onBlur={() => setTimeout(() => setShowWebsiteDropdown(false), 150)}
              placeholder={websites.length === 0 ? 'Add your company website here e.g. www.apple.com' : ''}
              className="flex-1 min-w-[180px] text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
            />
            <ChevronDown size={16} className="text-gray-400 flex-shrink-0 ml-auto" />
          </div>
          {showWebsiteDropdown && websiteInput && (
            <div className="border border-gray-200 rounded-lg bg-white shadow-md mt-1 overflow-hidden">
              <button
                onMouseDown={e => { e.preventDefault(); addWebsite(websiteInput); }}
                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
              >
                Add "<span className="font-medium">{websiteInput}</span>"
              </button>
            </div>
          )}
        </div>

        {/* 2. Theme Color */}
        <div>
          <p className="text-sm text-gray-700 mb-2">
            2. Select a Theme Color for the Widget.
          </p>
          <div
            className="flex items-center gap-3 border border-gray-300 rounded-lg bg-gray-50 px-4 py-2.5 cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => colorInputRef.current?.click()}
          >
            <div
              className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: themeColor }}
            />
            <span className="text-sm font-mono text-gray-700 flex-1">{themeColor.toUpperCase()}</span>
            <input
              ref={colorInputRef}
              type="color"
              value={themeColor}
              onChange={e => setThemeColor(e.target.value)}
              className="sr-only"
            />
          </div>
        </div>

        {/* 3. Icon */}
        <div>
          <p className="text-sm text-gray-700 mb-3">
            3. Select an Icon for the Widget.
          </p>
          <div className="flex items-center gap-2.5">
            {CHAT_ICONS.map((IconFn, i) => (
              <button
                key={i}
                onClick={() => setSelectedIcon(i)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  selectedIcon === i
                    ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: themeColor }}
                title={`Icon ${i + 1}`}
              >
                {IconFn(themeColor)}
              </button>
            ))}
            {/* Upload custom icon */}
            <button
              className="w-11 h-11 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
              title="Upload custom icon"
            >
              <Upload size={16} />
            </button>
          </div>
        </div>

        {/* Note */}
        <p className="text-sm text-gray-400 border-t border-gray-100 pt-4">
          Further customization options are available once connected.
        </p>

        {/* Next button */}
        <button
          onClick={() => setStep(2)}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
          disabled
          title="Fill in the website field to continue"
        >
          Next
        </button>
      </div>
    );
  }

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Connect Website Chat</h2>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Add the script below to your website to activate the chat widget.
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-800 mb-3">Add the script below to your website.</p>
        <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <code className="flex-1 text-xs text-gray-700 font-mono leading-relaxed break-all">
            {WIDGET_SCRIPT}
          </code>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-1.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
            title="Copy script"
          >
            {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={e => setSendEmail(e.target.checked)}
            className="mt-0.5 accent-blue-600"
          />
          <span className="text-sm text-gray-700">Send installation instructions to website admin via email.</span>
        </label>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-blue-600"
          />
          <span className="text-sm text-gray-700">
            I have added the script or I have informed my website admin to add the script to my website.
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep(1)}
          className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleComplete}
          disabled={!confirmed}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            confirmed
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          Complete
        </button>
      </div>
    </div>
  );
};
