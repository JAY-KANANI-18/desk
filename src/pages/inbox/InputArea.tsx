/**
 * InputArea.tsx
 *
 * The bottom input zone for the inbox conversation view.
 *
 * Design decisions:
 * ─────────────────
 * • NO separate Reply / Note tab bar — those tabs waste vertical space and look
 *   clunky.  Instead, mode is toggled with two small icon-pills in the toolbar
 *   itself (right side of the bottom bar in ReplyInput, or via a tiny top strip
 *   in EmailInput). "Reply" is the default; "Note" turns the background amber.
 *
 * • When MessageArea calls onReply(ctx), this component receives the context
 *   and passes it down:
 *     – chat reply  → ReplyInput shows a quoted-message banner above the textarea
 *     – email reply → EmailInput pre-fills To, Subject, threadId, messageId
 *
 * • EmailInput and ReplyInput share the same SharedInputProps interface so the
 *   wrapper doesn't need to know the internals.
 */

import { useEffect } from 'react';
import { ReplyInput }  from './ReplyInput';
import { EmailInput }  from './EmailInputV2';
import type { Conversation, Message } from './types';
import type { ReplyContext } from './MessageArea';

// ─── Shared props both inputs accept ─────────────────────────────────────────

export interface SharedInputProps {
  channels: any[] | null;
  selectedConversation: Conversation;
  selectedChannel: any;
  onChannelChange: (ch: any) => void;
  onSendMessage: (msg: Message) => void;
  onSendNote: (note: any) => void;
  /** 'reply' = normal reply, 'note' = internal note */
  inputMode: 'reply' | 'note';
  onInputModeChange: (mode: 'reply' | 'note') => void;
  /** Populated when the user clicks Reply on a bubble in MessageArea */
  replyContext?: ReplyContext | null;
  onClearReplyContext?: () => void;
}

// ─── InputArea ────────────────────────────────────────────────────────────────

interface InputAreaProps {
  inputMode: 'reply' | 'note';
  onInputModeChange: (mode: 'reply' | 'note') => void;
  selectedConversation: Conversation;
  selectedChannel: any;
  onChannelChange: (ch: any) => void;
  channels: any[] | null;
  onSendMessage: (msg: Message) => void;
  onSendNote: (note: any) => void;
  /** Forwarded from MessageArea's onReply callback */
  replyContext?: ReplyContext | null;
  onClearReplyContext?: () => void;
}

export function InputArea({
  inputMode,
  onInputModeChange,
  selectedConversation,
  selectedChannel,
  onChannelChange,
  channels,
  onSendMessage,
  onSendNote,
  replyContext,
  onClearReplyContext,
}: InputAreaProps) {
  const isEmail = selectedChannel?.type === 'email'
    || replyContext?.type === 'email';

  // When an email reply context arrives, make sure we're not stuck on 'note'
  useEffect(() => {
    if (replyContext?.type === 'email' && inputMode === 'note') {
      onInputModeChange('reply');
    }
  }, [replyContext]);

  const sharedProps: SharedInputProps = {
    channels,
    selectedConversation,
    selectedChannel,
    onChannelChange,
    onSendMessage,
    inputMode,
    onInputModeChange,
    onSendNote,
    replyContext,
    onClearReplyContext,
  };

  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-white">
      {isEmail
        ? <EmailInput {...sharedProps} />
        : <ReplyInput  {...sharedProps} />
      }
    </div>
  );
}
