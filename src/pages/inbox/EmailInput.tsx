/**
 * EmailInput.tsx  — rich-text email composer
 *
 * Changes vs. previous version:
 * ──────────────────────────────
 * 1. Now accepts SharedInputProps instead of its own bespoke interface.
 * 2. When replyContext.type === "email", automatically pre-fills:
 *      • To      ← replyContext.emailReply.to
 *      • Subject ← replyContext.emailReply.subject  (prefixed "Re: …")
 *    and attaches threadId + messageId + inReplyTo to the sent message so the
 *    backend can thread it correctly.
 * 3. Has the same Reply / Note mode pills as ReplyInput so the two inputs look
 *    consistent. (Note mode is unusual for email but supported for parity.)
 * 4. The external Reply/Comment tab bar is no longer needed.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Paperclip, X, FileText, Video, Mic,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Link, AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, DollarSign, ChevronDown, Check, CircleX,
  MessageSquare, StickyNote,
  LayoutTemplate,
  Smile,
} from 'lucide-react';
import type { Message, MediaAttachment, AttachmentType } from './types';
import { variables, channelConfig } from './data';
import { useInbox } from '../../context/InboxContext';
import type { SharedInputProps } from './InputArea';
import { EmojiPicker } from './EmojiPicker';

/* ─── types ─────────────────────────────────────────────────────────────────── */

type AttachedFile = { file: File; type: AttachmentType; url: string; previewUrl: string };

function getAttachmentType(file: File): AttachmentType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  return 'doc';
}

type FormatBtn = { icon: React.ReactNode; command: string; value?: string; title: string };

const formatButtons: (FormatBtn | 'sep')[] = [
  { icon: <Bold size={14} />,          command: 'bold',                title: 'Bold (Ctrl+B)' },
  { icon: <Italic size={14} />,        command: 'italic',              title: 'Italic (Ctrl+I)' },
  { icon: <Underline size={14} />,     command: 'underline',           title: 'Underline (Ctrl+U)' },
  { icon: <Strikethrough size={14} />, command: 'strikeThrough',       title: 'Strikethrough' },
  'sep',
  { icon: <List size={14} />,          command: 'insertUnorderedList', title: 'Bullet list' },
  { icon: <ListOrdered size={14} />,   command: 'insertOrderedList',   title: 'Numbered list' },
  'sep',
  { icon: <AlignLeft size={14} />,     command: 'justifyLeft',         title: 'Align left' },
  { icon: <AlignCenter size={14} />,   command: 'justifyCenter',       title: 'Align center' },
  { icon: <AlignRight size={14} />,    command: 'justifyRight',        title: 'Align right' },
];

/* ─── EmailInput ─────────────────────────────────────────────────────────────── */

export function EmailInput({
  
  onChannelChange,
  onSendMessage,
  inputMode,
  onInputModeChange,
  replyContext,
  onClearReplyContext,
}: SharedInputProps) {

  const er = replyContext?.type === 'email' ? replyContext.emailReply : null;
  const { uploadFile,channels,
  selectedConversation,
  selectedChannel } = useInbox();
  // header fields — pre-fill from replyContext when present
  const [to, setTo]               = useState(er?.to ?? selectedConversation?.contact?.email ?? '');
  const [cc, setCc]               = useState(er?.cc ?? '');
  const [bcc, setBcc]             = useState('');
  const [subject, setSubject]     = useState(er?.subject ?? '');
  const [showCc, setShowCc]       = useState(!!er?.cc);
  const [showBcc, setShowBcc]     = useState(false);
    const [emojiOpen, setEmojiOpen]       = useState(false);
      const [showRecorder, setShowRecorder] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);


  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isEmpty, setIsEmpty]     = useState(true);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [variableQuery, setVariableQuery] = useState<string | null>(null);
  const [variableHighlight, setVariableHighlight] = useState(0);
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);

  const editorRef           = useRef<HTMLDivElement>(null);
  const fileRef             = useRef<HTMLInputElement>(null);
  const imageRef            = useRef<HTMLInputElement>(null);
  const videoRef            = useRef<HTMLInputElement>(null);
  const variableDropdownRef = useRef<HTMLDivElement>(null);
  const channelRef          = useRef<HTMLDivElement>(null);


  const emojiRef           = useRef<HTMLDivElement>(null);


  const isNote = inputMode === 'note';

  const ch = channelConfig[selectedChannel?.type];

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

  // Re-populate header fields whenever replyContext changes
  useEffect(() => {
    if (replyContext?.type === 'email' && replyContext.emailReply) {
      const r = replyContext.emailReply;
      setTo(r.to ?? '');
      setSubject(r.subject ?? '');
      if (r.cc) { setCc(r.cc); setShowCc(true); }
    }
  }, [replyContext]);

  // Reset when conversation changes
  useEffect(() => {
    setTo(selectedConversation?.contact?.email ?? '');
    setCc(''); setBcc(''); setSubject('');
    setShowCc(false); setShowBcc(false); setAttachedFiles([]);
    if (editorRef.current) editorRef.current.innerHTML = '';
    setIsEmpty(true); setVariableQuery(null);
    onClearReplyContext?.();
  }, [selectedConversation?.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (variableDropdownRef.current && !variableDropdownRef.current.contains(e.target as Node) &&
          editorRef.current && !editorRef.current.contains(e.target as Node))
        setVariableQuery(null);
      if (channelRef.current && !channelRef.current.contains(e.target as Node))
        setChannelMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const execFormat = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value ?? undefined);
    updateActiveFormats();
  };

  const updateActiveFormats = useCallback(() => {
    const active = new Set<string>();
    ['bold','italic','underline','strikeThrough','insertUnorderedList','insertOrderedList'].forEach(cmd => {
      try { if (document.queryCommandState(cmd)) active.add(cmd); } catch {}
    });
    setActiveFormats(active);
  }, []);

  const detectVariableTrigger = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) { setVariableQuery(null); return; }
    const range = sel.getRangeAt(0);
    const node  = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').slice(0, range.startOffset);
      const m    = text.match(/\$(\w*)$/);
      if (m) { setVariableQuery(m[1]); setVariableHighlight(0); }
      else setVariableQuery(null);
    } else setVariableQuery(null);
  };

  const handleEditorInput = () => {
    setIsEmpty(!editorRef.current?.innerText?.trim() && !editorRef.current?.innerHTML?.includes('<img'));
    updateActiveFormats();
    detectVariableTrigger();
  };

  const insertVariable = (variable: typeof variables[0]) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node  = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').slice(0, range.startOffset);
      const m    = text.match(/\$(\w*)$/);
      if (m) {
        const del = document.createRange();
        del.setStart(node, range.startOffset - m[0].length);
        del.setEnd(node, range.startOffset);
        del.deleteContents();
        const tn = document.createTextNode(`{{${variable.key}}}`);
        del.insertNode(tn);
        const nr = document.createRange();
        nr.setStartAfter(tn); nr.collapse(true);
        sel.removeAllRanges(); sel.addRange(nr);
      }
    }
    setVariableQuery(null);
    editorRef.current?.focus();
    setIsEmpty(false);
  };

  const handleInsertLink = () => {
    const url = window.prompt('Enter URL:', 'https://');
    if (url) execFormat('createLink', url);
  };

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const uploaded: AttachedFile[] = [];
    for (const file of Array.from(files)) {
      const previewUrl  = URL.createObjectURL(file);
      const uploadedUrl = await uploadFile(file, selectedConversation.id);
      uploaded.push({ file, type: getAttachmentType(file), previewUrl, url: uploadedUrl || '' });
    }
    setAttachedFiles(prev => [...prev, ...uploaded]);
  };

  const removeFile = (i: number) => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i));

  const canSend = !isEmpty || attachedFiles.length > 0;

  const handleSend = () => {
    if (!canSend) return;
    const textContent = editorRef.current?.innerText?.trim() ?? '';
    const htmlContent = editorRef.current?.innerHTML ?? '';
    const attachments: MediaAttachment[] = attachedFiles.map(af => ({
      type: af.type, filename: af.file.name, url: af.url, mimeType: af.file.type,
    }));

    onSendMessage({
      id: Date.now(),
      conversationId: selectedConversation?.id,
      type: isNote ? 'comment' : 'reply',
      text: textContent,
      author: 'You',
      initials: 'ME',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      direction: 'outgoing',
      channel: 'email',
      attachments: attachments.length > 0 ? attachments : undefined,
      metadata: {
        email: {
          to,
          cc:       cc || undefined,
          bcc:      bcc || undefined,
          subject,
          htmlBody: htmlContent,
          // thread/reply linking for BE
          ...(replyContext?.type === 'email' ? {
            threadId:  replyContext.emailReply?.threadId,
            messageId: replyContext.emailReply?.messageId,
            inReplyTo: replyContext.emailReply?.messageId,
          } : {}),
        },
      },
    } as any);

    if (editorRef.current) editorRef.current.innerHTML = '';
    setIsEmpty(true); setAttachedFiles([]); setSubject(''); setVariableQuery(null);
    onClearReplyContext?.();
  };
  const noteBg    = 'bg-amber-50';
  const replyBg   = 'bg-white';
  const activeBg  = isNote ? noteBg : replyBg;
  const isNoteMode = isNote;

  return (
    <div className={`flex flex-col  transition-colors duration-150`}>

        <div className={`mx-3 mb-2.5 border ${activeBg} rounded-xl focus-within:ring-2  transition-shadow overflow-hidden`}>


      {/* ── Header fields ── */}
     {  !isNote &&  <div className="border-t border-gray-200 divide-y divide-gray-100">
       

        {/* Subject */}
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="text-xs font-semibold text-gray-400 w-8 flex-shrink-0">Sub</span>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
            className="flex-1 text-sm text-gray-800 focus:outline-none placeholder-gray-400 bg-transparent font-medium" placeholder="Subject" />
                    <div className="flex items-center gap-1 flex-shrink-0">
            {!showCc  && <button onClick={() => setShowCc(true)}  className="text-xs text-gray-400 hover:text-indigo-600 px-1.5 py-0.5 rounded hover:bg-indigo-50 transition-colors font-medium">Cc</button>}
            {!showBcc && <button onClick={() => setShowBcc(true)} className="text-xs text-gray-400 hover:text-indigo-600 px-1.5 py-0.5 rounded hover:bg-indigo-50 transition-colors font-medium">Bcc</button>}
          </div>
          {subject && <CircleX size={14} className="text-gray-300 hover:text-gray-500 cursor-pointer flex-shrink-0" onClick={() => setSubject('')} />}
        </div>

        {showCc && (
          <div className="flex items-center gap-2 px-4 py-2">
            <span className="text-xs font-semibold text-gray-400 w-8 flex-shrink-0">Cc</span>
            <input autoFocus type="text" value={cc} onChange={e => setCc(e.target.value)}
              className="flex-1 text-sm text-gray-800 focus:outline-none placeholder-gray-400 bg-transparent" placeholder="cc@example.com" />
            <button onClick={() => { setShowCc(false); setCc(''); }} className="text-gray-400 hover:text-gray-600 p-0.5 rounded flex-shrink-0"><X size={13} /></button>
          </div>
        )}
        {showBcc && (
          <div className="flex items-center gap-2 px-4 py-2">
            <span className="text-xs font-semibold text-gray-400 w-8 flex-shrink-0">Bcc</span>
            <input autoFocus type="text" value={bcc} onChange={e => setBcc(e.target.value)}
              className="flex-1 text-sm text-gray-800 focus:outline-none placeholder-gray-400 bg-transparent" placeholder="bcc@example.com" />
            <button onClick={() => { setShowBcc(false); setBcc(''); }} className="text-gray-400 hover:text-gray-600 p-0.5 rounded flex-shrink-0"><X size={13} /></button>
          </div>
        )}
      </div>}

      {/* ── Formatting toolbar ── */}
   { !isNote && <div className="flex items-center gap-0.5 px-3 py-1.5 border-t  border-gray-100 bg-gray-50 flex-wrap">
        {formatButtons.map((btn, i) => {
          if (btn === 'sep') return <div key={`sep-${i}`} className="w-px h-4 bg-gray-300 mx-1 flex-shrink-0" />;
          const isActive = activeFormats.has(btn.command);
          return (
            <button key={btn.command} onMouseDown={e => { e.preventDefault(); execFormat(btn.command, btn.value); }} title={btn.title}
              className={`p-1.5 rounded transition-colors flex-shrink-0 ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}>
              {btn.icon}
            </button>
          );
        })}
        <button onMouseDown={e => { e.preventDefault(); handleInsertLink(); }} title="Insert link"
          className="p-1.5 rounded text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors flex-shrink-0">
          <Link size={14} />
        </button>
        <select onChange={e => execFormat('fontSize', e.target.value)} defaultValue=""
          className="text-xs text-gray-500 bg-transparent border border-gray-200 rounded px-1 py-0.5 focus:outline-none hover:border-gray-300 cursor-pointer ml-1 flex-shrink-0">
          <option value="" disabled>Size</option>
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>
      </div>}
      

      {/* ── Rich-text editor ── */}
      <div className={`relative min-h-[80px] max-h-[220px] overflow-y-auto ${activeBg}`}>
        {/* Variable dropdown */}
        {variableQuery !== null && filteredVariables.length > 0 && (
          <div ref={variableDropdownRef} className="absolute bottom-full left-4 mb-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
              <DollarSign size={13} className="text-violet-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Insert variable</span>
              {variableQuery && <span className="ml-auto text-xs text-violet-600 font-medium bg-violet-50 px-1.5 py-0.5 rounded">${variableQuery}</span>}
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
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
          <div className="absolute bottom-full left-4 mb-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
            <div className="px-4 py-3 text-center">
              <p className="text-sm text-gray-400">No variable matches <span className="font-medium text-gray-600">${variableQuery}</span></p>
            </div>
          </div>
        )}

        {isEmpty && (
          <div className={`absolute top-3 left-4 text-sm pointer-events-none select-none ${isNoteMode ? 'text-amber-400' : 'text-gray-400'}`}>
            {isNoteMode ? 'Internal note… (only visible to your team)' : <>Write your email… type <span className="font-mono text-violet-400">$</span> for variables</>}
          </div>
        )}

        <div ref={editorRef} contentEditable suppressContentEditableWarning
          onInput={handleEditorInput} onKeyUp={updateActiveFormats} onMouseUp={updateActiveFormats}
          onKeyDown={e => {
            if (variableQuery !== null && filteredVariables.length > 0) {
              if (e.key === 'ArrowDown') { e.preventDefault(); setVariableHighlight(h => Math.min(h + 1, filteredVariables.length - 1)); return; }
              if (e.key === 'ArrowUp')   { e.preventDefault(); setVariableHighlight(h => Math.max(h - 1, 0)); return; }
              if (e.key === 'Enter')     { e.preventDefault(); insertVariable(filteredVariables[variableHighlight]); return; }
              if (e.key === 'Escape')    { setVariableQuery(null); return; }
            }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSend(); }
          }}
          className={`min-h-[80px] px-4 py-3 text-sm text-gray-800 focus:outline-none leading-relaxed [&_a]:text-indigo-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ${activeBg}`}
          style={{ wordBreak: 'break-word' }}
        />
      </div>

      {/* ── Attachment previews ── */}
      {attachedFiles.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
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

      {/* ── Bottom bar ── */}
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
              <button onClick={() => fileRef.current?.click()}  className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="Attach file"><Paperclip size={16} /></button>

              <div className="relative" ref={emojiRef}>
                <button onClick={() => setEmojiOpen(o => !o)}
                  className={`p-1.5 rounded-lg transition-colors ${emojiOpen ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-200 text-gray-500'}`} title="Emoji">
                  <Smile size={16} />
                </button>
                {emojiOpen && (
                  <EmojiPicker
                    mode="reply"
                    accent="gray"
                    onSelect={emoji => {
                      const selection = window.getSelection();
                      if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) {
                        document.execCommand('insertText', false, emoji);
                      } else if (editorRef.current) {
                        editorRef.current.focus();
                        document.execCommand('insertText', false, emoji);
                      }

                      setHtml(editorRef.current?.innerHTML || '');
                      setEmojiOpen(false);
                    }}
                  />
                )}
              </div>

              {/* <button onClick={() => setShowRecorder(true)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-500 transition-colors" title="Record voice"><Mic size={16} /></button> */}

          
            </div>

            {/* Right: mode pills + send */}
            <div className="flex items-center gap-1.5">

              {/* ── Mode switcher: two compact pills ── */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => onInputModeChange('reply')}
                  title="Reply to customer"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    !isNote ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageSquare size={11} />
                  <span>Reply</span>
                </button>
                <button
                  onClick={() => onInputModeChange('note')}
                  title="Internal note"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    isNote ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <StickyNote size={11} />
                  <span>Note</span>
                </button>
              </div>

              {/* Send button */}
              <button onClick={handleSend} disabled={!canSend}
                className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors ${
                  canSend
                    ? isNote ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}>
                <Send size={14} />
              </button>
            </div>
      </div>

      </div>

      <input ref={imageRef} type="file" multiple accept="image/*" className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
      <input ref={videoRef} type="file" multiple accept="video/*" className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
      <input ref={fileRef}  type="file" multiple             className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );
}
