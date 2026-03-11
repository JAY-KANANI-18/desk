import { Send, MessageSquare } from 'lucide-react';
import type { Conversation, Message } from './types';
import { ReplyInput } from './ReplyInput';
import { CommentInput } from './CommentInput';
import { EmailInput } from './EmailInput';

interface InputAreaProps {
  inputMode: 'reply' | 'comment';
  onInputModeChange: (mode: 'reply' | 'comment') => void;
  selectedConversation: Conversation;
  selectedChannel: any;
  onChannelChange: (channel: any) => void;
  onSendMessage: (msg: Message) => void;
  channels: any[] | null;
}

export function InputArea({ inputMode, onInputModeChange, selectedConversation, selectedChannel, onChannelChange, onSendMessage , channels}: InputAreaProps) {
  return (
    <div className="border-t border-gray-200">
      {/* Mode tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => onInputModeChange('reply')}
          className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            inputMode === 'reply'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Send size={13} />Reply
        </button>
        <button
          onClick={() => onInputModeChange('comment')}
          className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            inputMode === 'comment'
              ? 'border-amber-500 text-amber-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <MessageSquare size={13} />Comment
        </button>
      </div>

      {inputMode === 'reply' && (selectedChannel?.type === 'email' || selectedChannel?.type === 'gmail')
        ? <EmailInput channels={channels} selectedConversation={selectedConversation} selectedChannel={selectedChannel} onChannelChange={onChannelChange} onSendMessage={onSendMessage} />
        : inputMode === 'reply'
        ? <ReplyInput channels={channels} selectedConversation={selectedConversation} selectedChannel={selectedChannel} onChannelChange={onChannelChange} onSendMessage={onSendMessage} />
        : <CommentInput   conversationId={selectedConversation?.id} onSendMessage={onSendMessage} />
      }
    </div>
  );
}
