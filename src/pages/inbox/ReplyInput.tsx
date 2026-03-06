import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, X, ChevronDown, Check, Video, FileText, DollarSign } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { channelConfig, variables } from './data';
import type { Conversation, Message, MediaAttachment, AttachmentType } from './types';
import { EmojiPicker } from './EmojiPicker';
import { AudioRecorder } from './AudioRecorder';

type AttachedFile = {
  file: File;
  type: AttachmentType;
  url: string;
};

function getAttachmentType(file: File): AttachmentType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  return 'doc';
}

interface ReplyInputProps {
  channels: any[];
  selectedConversation: Conversation;
  selectedChannel: any;
  onChannelChange: (channel: any) => void;
  onSendMessage: (msg: Message) => void;
}

export function ReplyInput({ channels, selectedConversation, selectedChannel, onChannelChange, onSendMessage }: ReplyInputProps) {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const [variableQuery, setVariableQuery] = useState<string | null>(null);
  const [variableHighlight, setVariableHighlight] = useState(0);

  const textareaRef         = useRef<HTMLTextAreaElement>(null);
  const fileRef             = useRef<HTMLInputElement>(null);
  const imageRef            = useRef<HTMLInputElement>(null);
  const videoRef            = useRef<HTMLInputElement>(null);
  const emojiRef            = useRef<HTMLDivElement>(null);
  const channelRef          = useRef<HTMLDivElement>(null);
  const variableDropdownRef = useRef<HTMLDivElement>(null);

  const ch = channelConfig[selectedChannel?.type] ?? channelConfig['email'];

  const filteredVariables = variableQuery !== null
    ? variables.filter(v =>
        v.key.toLowerCase().includes(variableQuery.toLowerCase()) ||
        v.label.toLowerCase().includes(variableQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false);
      if (channelRef.current && !channelRef.current.contains(e.target as Node)) setChannelMenuOpen(false);
      if (
        variableDropdownRef.current && !variableDropdownRef.current.contains(e.target as Node) &&
        textareaRef.current && !textareaRef.current.contains(e.target as Node)
      ) setVariableQuery(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);
    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const varMatch = textBeforeCursor.match(/\$(\w*)$/);
    if (varMatch) {
      setVariableQuery(varMatch[1]);
      setVariableHighlight(0);
    } else {
      setVariableQuery(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (variableQuery !== null && filteredVariables.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setVariableHighlight(h => Math.min(h + 1, filteredVariables.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setVariableHighlight(h => Math.max(h - 1, 0)); return; }
      if (e.key === 'Enter')     { e.preventDefault(); insertVariable(filteredVariables[variableHighlight]); return; }
      if (e.key === 'Escape')    { setVariableQuery(null); return; }
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend();
  };

  const insertVariable = (variable: typeof variables[0]) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart ?? message.length;
    const textBeforeCursor = message.slice(0, cursorPos);
    const varMatch = textBeforeCursor.match(/\$(\w*)$/);
    if (varMatch) {
      const start = cursorPos - varMatch[0].length;
      const insertion = `{{${variable.key}}}`;
      const newText = message.slice(0, start) + insertion + message.slice(cursorPos);
      setMessage(newText);
      setVariableQuery(null);
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = start + insertion.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: AttachedFile[] = Array.from(files).map(file => ({
      file,
      type: getAttachmentType(file),
      url: URL.createObjectURL(file),
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const canSend = message.trim().length > 0 || attachedFiles.length > 0;

  const handleSend = () => {
    if (!canSend) return;
    const attachments: MediaAttachment[] = attachedFiles.map(af => ({
      type: af.type,
      name: af.file.name,
      url: af.url,
      mimeType: af.file.type,
      size: af.file.size,
    }));
    onSendMessage({
      id: Date.now(),
      conversationId: selectedConversation.id,
      type: 'reply',
      text: message.trim(),
      author: 'You',
      initials: 'ME',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: selectedChannel?.type,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    setMessage('');
    setAttachedFiles([]);
  };

  const handleAudioSend = (audioUrl: string) => {
    onSendMessage({
      id: Date.now(),
      conversationId: selectedConversation.id,
      type: 'reply',
      text: '',
      author: 'You',
      initials: 'ME',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: selectedChannel,
      attachments: [{ type: 'audio', name: 'Voice message', url: audioUrl }],
    });
    setShowRecorder(false);
  };

  return (
    <div className="p-4">
      <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
        {/* Channel selector */}
        <div className="relative" ref={channelRef}>
          <button
            onClick={() => setChannelMenuOpen(o => !o)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm ${ch.bg}`}
            title="Switch channel"
          >
            <span className="[&>svg]:!w-3 [&>svg]:!h-3">{ch.icon}</span>
            <span>{ch.label}</span>
            <ChevronDown size={11} className={`transition-transform ${channelMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {channelMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1.5">Send via channel</p>
              {channels?.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => { onChannelChange(ch); setChannelMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedChannel?.id === ch.id ? 'bg-gray-50' : ''}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0 [&>svg]:!w-3 [&>svg]:!h-3 ${channelConfig[ch.type].bg}`}>
                    {channelConfig[ch.type].icon}
                  </span>
                  <span className="flex-1 text-left font-medium text-gray-700">{channelConfig[ch.type].label}</span>
                  {selectedChannel?.id === ch.id && <Check size={13} className="text-blue-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <span className="text-lg">✨</span>AI Assist
        </button>
      </div>

      {showRecorder ? (
        <AudioRecorder onSend={handleAudioSend} onCancel={() => setShowRecorder(false)} />
      ) : (
        <div className="relative border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400">

          {/* Variable dropdown */}
          {variableQuery !== null && filteredVariables.length > 0 && (
            <div ref={variableDropdownRef} className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                <DollarSign size={13} className="text-violet-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Insert variable</span>
                {variableQuery && (
                  <span className="ml-auto text-xs text-violet-600 font-medium bg-violet-50 px-1.5 py-0.5 rounded">
                    ${variableQuery}
                  </span>
                )}
              </div>
              <div className="max-h-52 overflow-y-auto py-1">
                {filteredVariables.map((v, idx) => (
                  <button
                    key={v.key}
                    onMouseDown={e => { e.preventDefault(); insertVariable(v); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${variableHighlight === idx ? 'bg-violet-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <DollarSign size={13} className="text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{v.label}</p>
                      <p className="text-xs text-gray-400 truncate">{v.description}</p>
                    </div>
                    <code className="text-[10px] text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                      {`{{${v.key}}}`}
                    </code>
                  </button>
                ))}
              </div>
              <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50">
                <p className="text-[10px] text-gray-400">↑↓ navigate · ↵ select · Esc dismiss</p>
              </div>
            </div>
          )}

          {/* No match */}
          {variableQuery !== null && variableQuery.length > 0 && filteredVariables.length === 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 text-center">
                <p className="text-sm text-gray-400">
                  No variable matches <span className="font-medium text-gray-600">${variableQuery}</span>
                </p>
              </div>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder="Use '/' for snippets, '$' for variables, ':' for emoji"
            className="w-full px-4 py-3 resize-none focus:outline-none rounded-t-lg text-sm"
            rows={3}
          />

          {/* File previews */}
          {attachedFiles.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100">
              <div className="flex flex-wrap gap-2 items-start">
                {attachedFiles.map((af, i) =>
                  af.type === 'image' ? (
                    <div key={i} className="relative group flex-shrink-0">
                      <img
                        src={af.url}
                        alt={af.file.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm"
                      />
                      <button
                        onMouseDown={e => { e.preventDefault(); removeFile(i); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X size={10} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 py-0.5 rounded-b-lg truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {af.file.name}
                      </div>
                    </div>
                  ) : (
                    <span
                      key={i}
                      className={`flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1.5 ${
                        af.type === 'audio'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : af.type === 'video'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {af.type === 'audio' ? <Mic size={11} /> : af.type === 'video' ? <Video size={11} /> : <FileText size={11} />}
                      <span className="max-w-[120px] truncate font-medium">{af.file.name}</span>
                      <button
                        onMouseDown={e => { e.preventDefault(); removeFile(i); }}
                        className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => imageRef.current?.click()}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                title="Attach image"
              >
                <ImageIcon size={18} />
              </button>
              <button
                onClick={() => videoRef.current?.click()}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                title="Attach video"
              >
                <Video size={18} />
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                title="Attach file / document"
              >
                <Paperclip size={18} />
              </button>
              <div className="relative" ref={emojiRef}>
                <button
                  onClick={() => setEmojiOpen(o => !o)}
                  className={`p-1.5 rounded-lg transition-colors ${emojiOpen ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-100 text-gray-500'}`}
                  title="Emoji"
                >
                  <Smile size={18} />
                </button>
                {emojiOpen && (
                  <EmojiPicker
                    mode="reply"
                    accent="gray"
                    onSelect={emoji => { setMessage(prev => prev + emoji); setEmojiOpen(false); }}
                  />
                )}
              </div>
              <button
                onClick={() => setShowRecorder(true)}
                className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-500 transition-colors"
                title="Record voice message"
              >
                <Mic size={18} />
              </button>
            </div>

            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                canSend
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send size={15} />
              <span>Send via</span>
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold text-white ${ch.bg}`}>
                <span className="[&>svg]:!w-2.5 [&>svg]:!h-2.5">{ch.icon}</span>
                {/* {ch.label} */}
              </span>
            </button>
          </div>
        </div>
      )}

      <input ref={imageRef} type="file" multiple accept="image/*" className="hidden"
        onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
      <input ref={videoRef} type="file" multiple accept="video/*" className="hidden"
        onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
      <input ref={fileRef} type="file" multiple className="hidden"
        onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );
}
