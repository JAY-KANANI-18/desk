import { useState, useRef, useEffect } from 'react';
import { Paperclip, Smile, AtSign, MessageSquare, X, EyeOff, DollarSign } from 'lucide-react';
import { teamMembers, variables } from './data';
import type { Message } from './types';
import { EmojiPicker } from './EmojiPicker';

interface CommentInputProps {
  conversationId: number;
  onSendMessage: (msg: Message) => void;
}

export function CommentInput({ conversationId, onSendMessage }: CommentInputProps) {
  const [commentText, setCommentText] = useState('');
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionHighlight, setMentionHighlight] = useState(0);
  const [variableQuery, setVariableQuery] = useState<string | null>(null);
  const [variableHighlight, setVariableHighlight] = useState(0);

  const commentInputRef     = useRef<HTMLTextAreaElement>(null);
  const mentionDropdownRef  = useRef<HTMLDivElement>(null);
  const variableDropdownRef = useRef<HTMLDivElement>(null);
  const emojiRef            = useRef<HTMLDivElement>(null);
  const fileRef             = useRef<HTMLInputElement>(null);

  const filteredMentionMembers = mentionQuery !== null
    ? teamMembers.filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : [];

  const filteredVariables = variableQuery !== null
    ? variables.filter(v =>
        v.key.toLowerCase().includes(variableQuery.toLowerCase()) ||
        v.label.toLowerCase().includes(variableQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        mentionDropdownRef.current && !mentionDropdownRef.current.contains(e.target as Node) &&
        commentInputRef.current && !commentInputRef.current.contains(e.target as Node)
      ) setMentionQuery(null);
      if (
        variableDropdownRef.current && !variableDropdownRef.current.contains(e.target as Node) &&
        commentInputRef.current && !commentInputRef.current.contains(e.target as Node)
      ) setVariableQuery(null);
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);
    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);

    // @ mention detection
    const mentionMatch = textBeforeCursor.match(/@(\w[\w ]*)$/);
    const atOnlyMatch  = textBeforeCursor.match(/@$/);
    if (mentionMatch)      { setMentionQuery(mentionMatch[1]); setMentionHighlight(0); }
    else if (atOnlyMatch)  { setMentionQuery(''); setMentionHighlight(0); }
    else                   { setMentionQuery(null); }

    // $ variable detection (only when not in mention mode)
    if (!mentionMatch && !atOnlyMatch) {
      const varMatch = textBeforeCursor.match(/\$(\w*)$/);
      if (varMatch) { setVariableQuery(varMatch[1]); setVariableHighlight(0); }
      else          { setVariableQuery(null); }
    } else {
      setVariableQuery(null);
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredMentionMembers.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionHighlight(h => Math.min(h + 1, filteredMentionMembers.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionHighlight(h => Math.max(h - 1, 0)); return; }
      if (e.key === 'Enter')     { e.preventDefault(); insertMention(filteredMentionMembers[mentionHighlight]); return; }
      if (e.key === 'Escape')    { setMentionQuery(null); return; }
    } else if (variableQuery !== null && filteredVariables.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setVariableHighlight(h => Math.min(h + 1, filteredVariables.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setVariableHighlight(h => Math.max(h - 1, 0)); return; }
      if (e.key === 'Enter')     { e.preventDefault(); insertVariable(filteredVariables[variableHighlight]); return; }
      if (e.key === 'Escape')    { setVariableQuery(null); return; }
    }
  };

  const insertMention = (member: typeof teamMembers[0]) => {
    if (!commentInputRef.current) return;
    const cursorPos = commentInputRef.current.selectionStart ?? commentText.length;
    const textBeforeCursor = commentText.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w[\w ]*)$/) || textBeforeCursor.match(/@$/);
    if (mentionMatch) {
      const start = cursorPos - mentionMatch[0].length;
      const newText = commentText.slice(0, start) + `@${member.name} ` + commentText.slice(cursorPos);
      setCommentText(newText);
      setMentionQuery(null);
      setTimeout(() => {
        if (commentInputRef.current) {
          const newPos = start + member.name.length + 2;
          commentInputRef.current.focus();
          commentInputRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  const insertVariable = (variable: typeof variables[0]) => {
    if (!commentInputRef.current) return;
    const cursorPos = commentInputRef.current.selectionStart ?? commentText.length;
    const textBeforeCursor = commentText.slice(0, cursorPos);
    const varMatch = textBeforeCursor.match(/\$(\w*)$/);
    if (varMatch) {
      const start = cursorPos - varMatch[0].length;
      const insertion = `{{${variable.key}}}`;
      const newText = commentText.slice(0, start) + insertion + commentText.slice(cursorPos);
      setCommentText(newText);
      setVariableQuery(null);
      setTimeout(() => {
        if (commentInputRef.current) {
          const newPos = start + insertion.length;
          commentInputRef.current.focus();
          commentInputRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  const insertAtSymbol = () => {
    if (!commentInputRef.current) return;
    const pos = commentInputRef.current.selectionStart ?? commentText.length;
    const newText = commentText.slice(0, pos) + '@' + commentText.slice(pos);
    setCommentText(newText);
    setMentionQuery('');
    setMentionHighlight(0);
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
        commentInputRef.current.setSelectionRange(pos + 1, pos + 1);
      }
    }, 0);
  };

  const handleSend = () => {
    if (!commentText.trim()) return;
    onSendMessage({
      id: Date.now(),
      conversationId,
      type: 'comment',
      text: commentText.trim(),
      author: 'You',
      initials: 'ME',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setCommentText('');
    setCommentFiles([]);
    setMentionQuery(null);
    setVariableQuery(null);
  };

  return (
    <div className="p-4 bg-amber-50/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold">
          <EyeOff size={11} />
          Internal note — only visible to agents
        </div>
      </div>

      <div className="relative border border-amber-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-amber-400 shadow-sm">

        {/* Mention dropdown */}
        {mentionQuery !== null && filteredMentionMembers.length > 0 && (
          <div ref={mentionDropdownRef} className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
              <AtSign size={13} className="text-amber-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mention an agent</span>
              {mentionQuery && <span className="ml-auto text-xs text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">@{mentionQuery}</span>}
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {filteredMentionMembers.map((member, idx) => (
                <button key={member.id} onMouseDown={e => { e.preventDefault(); insertMention(member); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${mentionHighlight === idx ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">{member.initials}</div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${member.online ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{member.name}</p>
                    <p className={`text-xs ${member.online ? 'text-green-600' : 'text-gray-400'}`}>{member.online ? '● Online' : '○ Offline'}</p>
                  </div>
                  {mentionHighlight === idx && <span className="text-xs text-amber-500 font-medium flex-shrink-0">↵ select</span>}
                </button>
              ))}
            </div>
            <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50">
              <p className="text-[10px] text-gray-400">↑↓ navigate · ↵ select · Esc dismiss</p>
            </div>
          </div>
        )}

        {mentionQuery !== null && mentionQuery.length > 0 && filteredMentionMembers.length === 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 text-center">
              <p className="text-sm text-gray-400">No agents match <span className="font-medium text-gray-600">@{mentionQuery}</span></p>
            </div>
          </div>
        )}

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

        {variableQuery !== null && variableQuery.length > 0 && filteredVariables.length === 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 text-center">
              <p className="text-sm text-gray-400">No variable matches <span className="font-medium text-gray-600">${variableQuery}</span></p>
            </div>
          </div>
        )}

        <textarea
          ref={commentInputRef}
          value={commentText}
          onChange={handleCommentChange}
          onKeyDown={handleCommentKeyDown}
          placeholder="Add an internal note… type @ to mention, $ for variables"
          className="w-full px-4 py-3 resize-none focus:outline-none rounded-t-xl bg-transparent text-sm placeholder-amber-300"
          rows={3}
        />

        {commentFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 py-2 border-t border-amber-100">
            {commentFiles.map((f, i) => (
              <span key={i} className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1">
                <Paperclip size={11} />
                <span className="max-w-[120px] truncate">{f.name}</span>
                <button onMouseDown={e => { e.preventDefault(); setCommentFiles(prev => prev.filter((_, idx) => idx !== i)); }} className="ml-0.5 text-amber-400 hover:text-amber-600"><X size={10} /></button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between px-3 py-2 border-t border-amber-100">
          <div className="flex items-center gap-1">
            <button onClick={() => fileRef.current?.click()} className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-500 transition-colors" title="Attach file">
              <Paperclip size={17} />
            </button>
            <div className="relative" ref={emojiRef}>
              <button onClick={() => setEmojiOpen(o => !o)}
                className={`p-1.5 rounded-lg transition-colors ${emojiOpen ? 'bg-amber-200 text-amber-700' : 'hover:bg-amber-100 text-amber-500'}`}
                title="Emoji">
                <Smile size={17} />
              </button>
              {emojiOpen && (
                <EmojiPicker mode="comment" accent="amber" onSelect={emoji => { setCommentText(prev => prev + emoji); setEmojiOpen(false); }} />
              )}
            </div>
            <button onMouseDown={e => { e.preventDefault(); insertAtSymbol(); }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mentionQuery !== null ? 'bg-amber-200 text-amber-700' : 'hover:bg-amber-100 text-amber-500'}`}
              title="Mention an agent">
              <AtSign size={15} /><span>Mention</span>
            </button>
          </div>
          <button onClick={handleSend} disabled={!commentText.trim()}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${commentText.trim() ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm' : 'bg-amber-100 text-amber-300 cursor-not-allowed'}`}>
            <MessageSquare size={14} />Add Note
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-amber-500/80">
        💡 Use <kbd className="px-1 py-0.5 bg-amber-100 rounded text-amber-600 font-mono text-[10px]">@</kbd> to mention agents · <kbd className="px-1 py-0.5 bg-violet-100 rounded text-violet-600 font-mono text-[10px]">$</kbd> to insert variables
      </p>

      <input ref={fileRef} type="file" multiple className="hidden"
        onChange={e => { if (e.target.files) { setCommentFiles(prev => [...prev, ...Array.from(e.target.files!)]); e.target.value = ''; } }} />
    </div>
  );
}
