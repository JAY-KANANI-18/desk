/**
 * InboxPage.tsx
 *
 * Changes vs. previous version:
 * ──────────────────────────────
 * • Adds `replyContext` state — set when MessageArea fires `onReply(ctx)`.
 * • Passes `replyContext` + `onClearReplyContext` down to InputArea.
 * • InputArea passes them further into ReplyInput / EmailInput.
 * • Tab-bar-style `inputMode` prop is still threaded through (the mode toggle
 *   now lives inside the inputs themselves as pills, but the state stays here).
 */

import { useEffect, useCallback, useState } from "react";
import { useParams, useNavigate, Outlet } from "react-router-dom";
import { InboxProvider, useInbox } from "../context/InboxContext";
import { SubSidebar }       from "./inbox/SubSidebar";
import { ConversationList } from "./inbox/ConversationList";
import { ChatHeader }       from "./inbox/ChatHeader";
import { MessageArea }      from "./inbox/MessageArea";
import { InputArea }        from "./inbox/InputArea";
import { ContactSidebar }   from "./inbox/ContactSidebar";
import type { Conversation } from "./inbox/types";
import type { ReplyContext } from "./inbox/MessageArea";

export function InboxPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  const {
    convList,
    selectedConversation,
    messages,
    timeline,
    selectedChannel,
    inputMode,
    snoozedUntil,
    selectedContact,
    msgSearchOpen,
    msgSearch,
    selectConversation,
    channels,
    handleChannelChange,
    setInputMode,
    setSnoozedUntil,
    toggleMsgSearch,
    setMsgSearch,
    sendMessage,
    sendNote
  } = useInbox();

  // ── Reply context: set when user clicks "Reply" on a bubble ──────────────────
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);

  const handleReply = useCallback((ctx: ReplyContext) => {
    setReplyContext(ctx);
    // If it's an email reply, make sure we're in reply mode (not note)
    if (ctx.type === 'email') setInputMode('reply');
  }, [setInputMode]);

  const handleClearReplyContext = useCallback(() => setReplyContext(null), []);

  // Clear reply context when conversation changes
  useEffect(() => { setReplyContext(null); }, [selectedConversation?.id]);

  const handleSendMessage = useCallback((msg) => sendMessage(msg), [sendMessage]);
  const handleSendNote = useCallback((msg) => sendNote(msg), [sendNote]);

  useEffect(() => {
    if (!conversationId && convList.length > 0) navigate(`/inbox/${convList[0].id}`, { replace: true });
  }, [conversationId, convList, navigate]);

  useEffect(() => {
    if (!conversationId) return;
    const id   = Number(conversationId);
    if (id === selectedConversation?.id) return;
    const conv = convList.find((c) => c.id === id);
    if (conv) selectConversation(conv);
  }, [conversationId, convList]);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    selectConversation(conv);
    navigate(`/inbox/${conv.id}`);
  }, [selectConversation, navigate]);

  return (
    <div className="flex h-full flex-col md:flex-row">
      <SubSidebar />

      <ConversationList
        conversations={convList}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversation}
        channels={channels}
      />

      {selectedConversation ? (
        <div className="flex-1 flex flex-col bg-white min-w-0">
          <ChatHeader
            selectedConversation={selectedConversation}
            snoozedUntil={snoozedUntil}
            onSnooze={setSnoozedUntil}
            onUnsnooze={() => setSnoozedUntil(null)}
            msgSearchOpen={msgSearchOpen}
            onToggleMsgSearch={toggleMsgSearch}
          />

          <MessageArea
            selectedConversation={selectedConversation}
            // messages={messages[selectedConversation?.id] ?? []}
            timelineItems={timeline}
            snoozedUntil={snoozedUntil}
            onUnsnooze={() => setSnoozedUntil(null)}
            msgSearchOpen={msgSearchOpen}
            msgSearch={msgSearch}
            onMsgSearchChange={setMsgSearch}
            onCloseMsgSearch={() => { setMsgSearch(""); toggleMsgSearch(); }}
            onReply={handleReply}
          />

          <InputArea
            key={selectedConversation?.id}
            inputMode={inputMode}
            onInputModeChange={setInputMode}
            selectedConversation={selectedConversation}
            selectedChannel={selectedChannel}
            onChannelChange={handleChannelChange}
            channels={channels}
            onSendMessage={handleSendMessage}
            onSendNote={handleSendNote}
            replyContext={replyContext}
            onClearReplyContext={handleClearReplyContext}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Select a conversation to start messaging</p>
        </div>
      )}

      {selectedConversation?.id && (
        <ContactSidebar key={selectedConversation?.id} selectedConversation={selectedConversation} contactDetails={selectedContact} />
      )}
    </div>
  );
}

export function InboxLayout() {
  return (
    <InboxProvider>
      <Outlet />
    </InboxProvider>
  );
}

export const Inbox = InboxLayout;