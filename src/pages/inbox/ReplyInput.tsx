/**
  * ReplyInput.tsx  — chat reply composer (WhatsApp / Instagram / Messenger / Chat)
 *
 * Changes vs. previous version:
 * ──────────────────────────────
 * 1. Accepts SharedInputProps (inputMode, onInputModeChange, replyContext, onClearReplyContext)
 * 2. Shows a WhatsApp-style quoted reply banner when replyContext.type === "chat"
 * 3. Sends replyTo metadata with the message so the BE knows which message is quoted
 * 4. Mode switcher (Reply / Note) is two tiny icon-pills in the toolbar —
 *    no external tab bar needed — saves vertical space
 * 5. Note mode turns the composer background amber; send builds type:"comment"
 */

import { useState, useRef, useEffect } from 'react';
import {
  Send, Paperclip, Smile, Mic, X, ChevronDown, Check,
  Video, FileText, DollarSign, LayoutTemplate,
  MessageSquare, StickyNote, Image as ImageIcon,
  Play, File,
} from 'lucide-react';
import { channelConfig, variables } from './data';
import type { Conversation, Message, MediaAttachment, AttachmentType } from './types';
import { EmojiPicker } from './EmojiPicker';
import { AudioRecorder } from './AudioRecorder';
import { Template, TemplateModal } from './TemplateModal';
import { useInbox } from '../../context/InboxContext';
import type { SharedInputProps } from './InputArea';
import type { ReplyContext } from './MessageArea';

/* ─── types ─────────────────────────────────────────────────────────────────── */

type AttachedFile = { file: File; type: AttachmentType; url: string; previewUrl?: string };

function getAttachmentType(file: File): AttachmentType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  return 'doc';
}

/* ─── Quoted-reply banner ────────────────────────────────────────────────────── */

function QuotedReplyBanner({
  ctx,
  onDismiss,
}: {
  ctx: ReplyContext;
  onDismiss: () => void;
}) {
  if (ctx.type !== 'chat' || !ctx.quotedMessage) return null;
  const q = ctx.quotedMessage;

  return (
    <div className="flex items-start gap-2 px-3 pt-2.5 pb-0">
      <div className="flex-1 flex items-start gap-2 bg-gray-50 border-l-[3px] border-indigo-500 rounded-r-lg px-3 py-2 min-w-0">
        {/* attachment thumb */}
        {q.attachmentType === 'image' && q.attachmentUrl && (
          <img src={q.attachmentUrl} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
        )}
        {q.attachmentType === 'video' && (
          <div className="w-9 h-9 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
            <Play size={14} className="text-gray-500 ml-0.5" />
          </div>
        )}
        {q.attachmentType === 'file' && (
          <div className="w-9 h-9 rounded bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <File size={14} className="text-indigo-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-indigo-600 mb-0.5">{q.author}</p>
          {q.text ? (
            <p className="text-[12px] text-gray-600 truncate leading-snug">{q.text}</p>
          ) : q.attachmentType ? (
            <p className="text-[12px] text-gray-400 italic">
              {q.attachmentType === 'image' ? '📷 Photo' : q.attachmentType === 'video' ? '🎥 Video' : q.attachmentType === 'audio' ? '🎤 Voice message' : '📄 File'}
            </p>
          ) : null}
        </div>
      </div>
      <button onClick={onDismiss} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5">
        <X size={13} />
      </button>
    </div>
  );
}

/* ─── ReplyInput ─────────────────────────────────────────────────────────────── */

export function ReplyInput({
  
  onChannelChange,
  onSendMessage,
  onSendNote,
  inputMode,
  onInputModeChange,
  replyContext,
  onClearReplyContext,
}: SharedInputProps) {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const [variableQuery, setVariableQuery] = useState<string | null>(null);
  const [variableHighlight, setVariableHighlight] = useState(0);
  const [templateOpen, setTemplateOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<HTMLDivElement>(null);
  const variableDropdownRef = useRef<HTMLDivElement>(null);

  const { uploadFile,selectedChannel,channels,selectedConversation } = useInbox();

  const isNote = inputMode === 'note';

  const filteredVariables = variableQuery !== null
    ? variables.filter(v =>
      v.key.toLowerCase().includes(variableQuery.toLowerCase()) ||
      v.label.toLowerCase().includes(variableQuery.toLowerCase())
    )
    : [];

  // click-outside handlers
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

  // auto-grow textarea
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);
    // variable trigger
    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const varMatch = textBeforeCursor.match(/\$(\w*)$/);
    if (varMatch) { setVariableQuery(varMatch[1]); setVariableHighlight(0); }
    else setVariableQuery(null);
    // auto-grow
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (variableQuery !== null && filteredVariables.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setVariableHighlight(h => Math.min(h + 1, filteredVariables.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setVariableHighlight(h => Math.max(h - 1, 0)); return; }
      if (e.key === 'Enter') { e.preventDefault(); insertVariable(filteredVariables[variableHighlight]); return; }
      if (e.key === 'Escape') { setVariableQuery(null); return; }
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

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const uploaded: AttachedFile[] = [];
    for (const file of Array.from(files)) {
      const previewUrl = URL.createObjectURL(file);
      const uploadedUrl = await uploadFile(file, selectedConversation?.id);
      uploaded.push({ file, type: getAttachmentType(file), previewUrl, url: uploadedUrl || '' });
    }
    setAttachedFiles(prev => [...prev, ...uploaded]);
  };

  const removeFile = (index: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== index));

  const canSend = message.trim().length > 0 || attachedFiles.length > 0;

  const handleSend = () => {
    if (!canSend) return;
    const attachments: MediaAttachment[] = attachedFiles.map(af => ({
      type: af.type, filename: af.file.name, url: af.url, mimeType: af.file.type,
    }));

    if (!isNote) {
      onSendMessage({
        id: Date.now(),
        conversationId: selectedConversation?.id,
        type: isNote ? 'comment' : 'reply',
        text: message.trim(),
        author: 'You',
        initials: 'ME',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        direction: 'outgoing',
        channel: selectedChannel?.type,
        attachments: attachments.length > 0 ? attachments : undefined,
        // attach quoted context for BE
        metadata:{
          contactIdentifier: selectedConversation?.contact?.identifier, // e.g. phone number or email or sessionId
          ...(replyContext?.type === 'chat' && replyContext.quotedMessage
            ? { replyTo: replyContext.quotedMessage   }
            : {}),
        },


      } as any);
    } else {

      onSendNote({
        text: message.trim()
      } as any);
    }

    setMessage('');
    setAttachedFiles([]);
    onClearReplyContext?.();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleAudioSend = async (audioBlob: Blob) => {
    const file = new File([audioBlob], 'audio_recording.m4a', { type: 'audio/x-m4a' });
    const url = await uploadFile(file, selectedConversation.id);
    onSendMessage({
      id: Date.now(),
      conversationId: selectedConversation?.id,
      type: isNote ? 'comment' : 'reply',
      text: '',
      author: 'You',
      initials: 'ME',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      direction: 'outgoing',
      channel: selectedChannel,
      attachments: [{ type: 'audio', filename: file.name, url, mimeType: file.type }],
    } as any);
    setShowRecorder(false);
  };

  const handleTemplateUse = (template: Template) => {

    onSendMessage({
      
      conversationId: selectedConversation?.id,
      type: isNote ? 'comment' : 'reply',
      author: 'You',
      channel: selectedChannel,
      metadata:{
        template
      }
    } as any);

    // setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const templateContextValues: Record<string, string> = {
    conversation_id: String(selectedConversation?.id ?? ''),
    contact_name: selectedConversation?.customerName ?? '',
  };

  /* ── bg ── */
  const noteBg = 'bg-amber-50';
  const replyBg = 'bg-white';
  const activeBg = isNote ? noteBg : replyBg;
  const borderClr = isNote ? 'border-amber-300' : 'border-gray-300';
  const focusRing = isNote ? 'focus-within:ring-amber-300 focus-within:border-amber-400' : 'focus-within:ring-indigo-400 focus-within:border-indigo-400';

  return (
    <div className={`${activeBg} transition-colors duration-150 `}>
      <TemplateModal open={templateOpen}  onClose={() => setTemplateOpen(false)} onUse={handleTemplateUse} contextValues={templateContextValues} />

      {/* ── Quoted reply banner ── */}
      {replyContext?.type === 'chat' && (
        <QuotedReplyBanner ctx={replyContext} onDismiss={() => onClearReplyContext?.()} />
      )}

      {showRecorder ? (
        <div className="px-4 py-3">
          <AudioRecorder onSend={handleAudioSend} onCancel={() => setShowRecorder(false)} />
        </div>
      ) : (
        <div className={`mx-3 mb-2.5 border ${borderClr} rounded-xl transition-shadow p-1`}>

          {/* Variable dropdown */}
          <div className="relative">
            {variableQuery !== null && filteredVariables.length > 0 && (
              <div ref={variableDropdownRef} className="absolute bottom-full left-0 mb-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                  <DollarSign size={13} className="text-violet-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Insert variable</span>
                  {variableQuery && <span className="ml-auto text-xs text-violet-600 font-medium bg-violet-50 px-1.5 py-0.5 rounded">${variableQuery}</span>}
                </div>
                <div className="max-h-52 overflow-y-auto py-1">
                  {filteredVariables.map((v, idx) => (
                    <button key={v.key} onMouseDown={e => { e.preventDefault(); insertVariable(v); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${variableHighlight === idx ? 'bg-violet-50' : 'hover:bg-gray-50'}`}>
                      <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <DollarSign size={13} className="text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{v.label}</p>
                        <p className="text-xs text-gray-400 truncate">{v.description}</p>
                      </div>
                      <code className="text-[10px] text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded font-mono flex-shrink-0">{`{{${v.key}}}`}</code>
                    </button>
                  ))}
                </div>
                <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50">
                  <p className="text-[10px] text-gray-400">↑↓ navigate · ↵ select · Esc dismiss</p>
                </div>
              </div>
            )}
            {variableQuery !== null && variableQuery.length > 0 && filteredVariables.length === 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                <div className="px-4 py-3 text-center">
                  <p className="text-sm text-gray-400">No variable matches <span className="font-medium text-gray-600">${variableQuery}</span></p>
                </div>
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder={isNote ? "Write an internal note… (only visible to your team)" : "Reply… type '$' for variables"}
              className={`w-full px-4 py-3 resize-none focus:outline-none text-sm leading-relaxed ${isNote ? 'bg-amber-50 placeholder-amber-400' : 'bg-white placeholder-gray-400'}`}
              rows={2}
              style={{ maxHeight: 200, overflowY: 'auto' }}
            />
          </div>

          {/* Attached file previews */}
          {attachedFiles.length > 0 && (
            <div className={`px-3 py-2 border-t ${isNote ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-white'}`}>
              <div className="flex flex-wrap gap-2 items-start">
                {attachedFiles.map((af, i) =>
                  af.type === 'image' ? (
                    <div key={i} className="relative group flex-shrink-0">
                      <img src={af.previewUrl} alt={af.file.name} className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm" />
                      <button onMouseDown={e => { e.preventDefault(); removeFile(i); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <span key={i} className={`flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1.5 ${af.type === 'audio' ? 'bg-red-50 text-red-700 border-red-200' : af.type === 'video' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                      {af.type === 'audio' ? <Mic size={11} /> : af.type === 'video' ? <Video size={11} /> : <FileText size={11} />}
                      <span className="max-w-[120px] truncate font-medium">{af.file.name}</span>
                      <button onMouseDown={e => { e.preventDefault(); removeFile(i); }} className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"><X size={10} /></button>
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* Bottom toolbar */}
          <div className={`flex items-center justify-between px-2 py-1.5 border-t ${isNote ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>

            {/* Left: attachments + emoji + mic + template */}
            <div className="flex items-center gap-0.5">
              {/* Channel selector (only in reply mode) */}
              {!isNote && (
                <div className="relative mr-1" ref={channelRef}>
                  <button onClick={() => setChannelMenuOpen(o => !o)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                    title="Switch channel">
                    <img src={channelConfig[selectedChannel?.type]?.icon} alt={selectedChannel?.name} className="w-3 h-3" />
                    <span className="hidden sm:inline max-w-[80px] truncate">{selectedChannel?.name}</span>
                    <ChevronDown size={10} className={`transition-transform ${channelMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {channelMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1.5">Send via channel</p>
                      {channels?.map((ch) => (
                        <button key={ch.id} onClick={() => { onChannelChange(ch); setChannelMenuOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedChannel?.id === ch.id ? 'bg-gray-50' : ''}`}>
                          <img src={channelConfig[ch.type]?.icon} alt={ch.name} className="w-4 h-4" />
                          <span className="flex-1 text-left font-medium text-gray-700">{ch.name || 'Unnamed'}</span>
                          {selectedChannel?.id === ch.id && <Check size={13} className="text-indigo-600 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* <button onClick={() => imageRef.current?.click()} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="Attach image"><ImageIcon size={16} /></button>
              <button onClick={() => videoRef.current?.click()} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="Attach video"><Video size={16} /></button> */}
              <button onClick={() => fileRef.current?.click()} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="Attach file"><Paperclip size={16} /></button>

              <div className="relative" ref={emojiRef}>
                <button onClick={() => setEmojiOpen(o => !o)}
                  className={`p-1.5 rounded-lg transition-colors ${emojiOpen ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-200 text-gray-500'}`} title="Emoji">
                  <Smile size={16} />
                </button>
                {emojiOpen && (
                  <EmojiPicker mode="reply" accent="gray" onSelect={emoji => { setMessage(prev => prev + emoji); setEmojiOpen(false); }} />
                )}
              </div>

              {/* <button onClick={() => setShowRecorder(true)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-500 transition-colors" title="Record voice"><Mic size={16} /></button> */}

              {!isNote && (
                <button onClick={() => setTemplateOpen(true)} className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-gray-500 transition-colors" title="Insert template">
                  <LayoutTemplate size={16} />
                </button>
              )}
            </div>

            {/* Right: mode pills + send */}
            <div className="flex items-center gap-1.5">

              {/* ── Mode switcher: two compact pills ── */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => onInputModeChange('reply')}
                  title="Reply to customer"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${!isNote ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <MessageSquare size={11} />
                  <span>Reply</span>
                </button>
                <button
                  onClick={() => onInputModeChange('note')}
                  title="Internal note"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${isNote ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <StickyNote size={11} />
                  <span>Note</span>
                </button>
              </div>

              {/* Send button */}
              <button onClick={handleSend} disabled={!canSend}
                className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors ${canSend
                  ? isNote ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}>
                <Send size={14} />
              </button>
            </div>
          </div>

        </div>
      )}

      <input ref={imageRef} type="file"  accept="image/*" className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
      <input ref={videoRef} type="file"  accept="video/*" className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
      <input ref={fileRef} type="file"  className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );
}