import { useEffect, useCallback } from "react";
import { useParams, useNavigate, Outlet } from "react-router-dom";
import { InboxProvider, useInbox } from "../context/InboxContext";
import { SubSidebar } from "./inbox/SubSidebar";
import { ConversationList } from "./inbox/ConversationList";
import { ChatHeader } from "./inbox/ChatHeader";
import { MessageArea } from "./inbox/MessageArea";
import { InputArea } from "./inbox/InputArea";
import { ContactSidebar } from "./inbox/ContactSidebar";
import type { Conversation } from "./inbox/types";

// ─── Inner page — reads from InboxContext, syncs with URL param ───────────────
export function InboxPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  console.log("INBOX PAGE");

  const {
    convList,
    selectedConversation,
    messages,
    // channelOverrides,
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
  } = useInbox();

  console.log({ selectedChannel, channels, selectedConversation });

  const handleSendMessage = useCallback(
    (msg) => {
      console.log("SENDING MESSAGE", msg);
      return sendMessage(msg);


    },
    [sendMessage]
  );

  // Redirect /inbox → /inbox/:firstId on mount or when convList loads
  useEffect(() => {
    if (!conversationId && convList.length > 0) {
      navigate(`/inbox/${convList[0].id}`, { replace: true });
    }
  }, [conversationId, convList, navigate]);

  // Sync URL param → context (handles direct URL navigation & browser back/forward)
  useEffect(() => {
    if (!conversationId) return;
    const id = Number(conversationId);
    if (id === selectedConversation?.id) return;
    const conv = convList.find((c) => c.id === id);
    if (conv) selectConversation(conv);
  }, [conversationId, convList]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wrap selectConversation to also push URL
  const handleSelectConversation = useCallback(
    (conv: Conversation) => {
      selectConversation(conv);
      navigate(`/inbox/${conv.id}`);
    },
    [selectConversation, navigate]
  );

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
            messages={messages[selectedConversation?.id] ?? []}
            snoozedUntil={snoozedUntil}
            onUnsnooze={() => setSnoozedUntil(null)}
            msgSearchOpen={msgSearchOpen}
            msgSearch={msgSearch}
            onMsgSearchChange={setMsgSearch}
            onCloseMsgSearch={() => {
              setMsgSearch("");
              toggleMsgSearch();
            }}
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
          />

        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Select a conversation to start messaging</p>
        </div>
      )
      }

      {selectedConversation?.id && <ContactSidebar key={selectedConversation?.id} selectedConversation={selectedConversation} contactDetails={selectedContact} />}
    </div>
  );
}

// ─── Layout — mounts InboxProvider once, renders nested route via <Outlet /> ──
export function InboxLayout() {
  return (
    <InboxProvider>
      <Outlet />
    </InboxProvider>
  );
}

// ─── Legacy default export (kept for any direct imports) ─────────────────────
export const Inbox = InboxLayout;
