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
import {
  useParams,
  useNavigate,
  Outlet,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { InboxProvider, useInbox } from "../context/InboxContext";
import { useChannel } from "../context/ChannelContext";
import { SubSidebar }       from "./inbox/SubSidebar";
import { ConversationList } from "./inbox/ConversationList";
import { ChatHeader }       from "./inbox/ChatHeader";
import { MessageArea }      from "./inbox/MessageArea";
import { InputArea }        from "./inbox/InputArea";
import { ContactSidebarHybrid } from "./inbox/ContactSidebarHybrid";
import { CONTACT_SIDEBAR_WIDTH } from "./inbox/contact-sidebar/DesktopShell";
import { InboxAddChannelPrompt } from "./inbox/InboxAddChannelPrompt";
import { MobileCategoryDrawer } from "./inbox/MobileCategoryDrawer";
import { MobileContactSheet } from "./inbox/MobileContactSheet";
import type { ReplyContext } from "./inbox/MessageArea";
import type { ApiConversation } from "../lib/inboxApi";
import { useIsMobile } from "../hooks/useIsMobile";

export function InboxPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const targetMessageId = searchParams.get("targetMessageId");
  const navTargetMessageId = (location.state as any)?.targetMessageId ?? null;
  const navPreserveSearch = (location.state as any)?.preserveSearch ?? false;
  const isMobile = useIsMobile();
  const { channels: workspaceChannels, loading: channelsLoading } = useChannel();

  const {
    convList,
    selectedConversation,
    timeline,
    targetMessageId: loadedTargetMessageId,
    requestedTargetMessageId,
    selectedChannel,
    inputMode,
    snoozedUntil,
    selectedContact,
    msgSearchOpen,
    msgSearch,
    selectConversation,
    refreshContact,
    refreshConversations,
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
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const [showMobileContact, setShowMobileContact] = useState(false);
  const [showDesktopContact, setShowDesktopContact] = useState(true);

  const handleReply = useCallback((ctx: ReplyContext) => {
    setReplyContext(ctx);
    // If it's an email reply, make sure we're in reply mode (not note)
    if (ctx.type === 'email') setInputMode('reply');
  }, [setInputMode]);

  const handleClearReplyContext = useCallback(() => setReplyContext(null), []);

  // Clear reply context when conversation changes
  useEffect(() => { setReplyContext(null); }, [selectedConversation?.id]);

  const handleSendMessage = useCallback((msg: any) => sendMessage(msg), [sendMessage]);
  const handleSendNote = useCallback(
    (msg: any) => sendNote(msg?.text ?? "", msg?.mentionedUserIds ?? []),
    [sendNote],
  );

  useEffect(() => {
    if (!conversationId && convList.length > 0 && !isMobile) {
      navigate(`/inbox/${convList[0].id}`, { replace: true });
    }
  }, [conversationId, convList, isMobile, navigate]);

  useEffect(() => {
    if (!conversationId) {
      setShowMobileContact(false);
    }
  }, [conversationId]);

  const resolvedTargetMessageId =
    targetMessageId ?? navTargetMessageId ?? loadedTargetMessageId ?? null;

  useEffect(() => {
    if (!conversationId) return;
    const isSameConversation = conversationId === selectedConversation?.id;
    const isSameTarget =
      (resolvedTargetMessageId ?? null) === (requestedTargetMessageId ?? null);
    if (isSameConversation && isSameTarget) return;
    const conv = convList.find((c) => c.id === conversationId);
    if (conv) {
      selectConversation(conv, {
        targetMessageId: resolvedTargetMessageId,
        preserveSearch: navPreserveSearch,
      });
    }
  }, [
    conversationId,
    convList,
    selectedConversation?.id,
    selectConversation,
    resolvedTargetMessageId,
    requestedTargetMessageId,
    navPreserveSearch,
  ]);

  const handleSelectConversation = useCallback((conv: ApiConversation) => {
    selectConversation(conv);
    navigate(`/inbox/${conv.id}`);
  }, [selectConversation, navigate]);

  const hasConversationRoute = Boolean(conversationId);
  const showConversationView = hasConversationRoute && Boolean(selectedConversation);
  const showNoChannelsState =
    !channelsLoading &&
    workspaceChannels.length === 0 &&
    convList.length === 0;

  return (
    <div className="flex h-full min-h-0 bg-slate-50 md:bg-white">
      <div className={`${showConversationView && isMobile ? "hidden" : "flex"} min-h-0 w-full md:w-auto`}>
        <div className="hidden md:flex">
          <SubSidebar />
        </div>
        <ConversationList
          onSelectConversation={handleSelectConversation}
          onOpenCategories={() => setShowMobileCategories(true)}
        />
      </div>

      {showConversationView ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-50 md:bg-white">
          <ChatHeader
            selectedConversation={selectedConversation as any}
            snoozedUntil={snoozedUntil}
            onSnooze={setSnoozedUntil}
            onUnsnooze={() => setSnoozedUntil(null)}
            chatStatus={selectedConversation.status === "closed" ? "closed" : "open"}
            msgSearchOpen={msgSearchOpen}
            onToggleMsgSearch={toggleMsgSearch}
            onBack={() => navigate("/inbox")}
            onOpenContactDetails={() => {
              if (isMobile) {
                setShowMobileContact(true);
                return;
              }
              setShowDesktopContact(true);
            }}
          />

          <MessageArea
            selectedConversation={selectedConversation as any}
            // messages={messages[selectedConversation?.id] ?? []}
            timelineItems={timeline as any}
            targetMessageId={resolvedTargetMessageId}
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
            selectedConversation={selectedConversation as any}
            selectedChannel={selectedChannel}
            onChannelChange={handleChannelChange}
            channels={channels}
            onSendMessage={handleSendMessage}
            onSendNote={handleSendNote}
            replyContext={replyContext}
            onClearReplyContext={handleClearReplyContext}
          />
        </div>
      ) : hasConversationRoute ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-400">Loading conversation…</p>
        </div>
      ) : channelsLoading ? (
        <div className="hidden flex-1 items-center justify-center md:flex">
          <p className="text-gray-500">Loading inbox...</p>
        </div>
      ) : showNoChannelsState ? (
        <div className="hidden flex-1 items-center justify-center border-l border-slate-100 bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 md:flex">
          <InboxAddChannelPrompt message="Connect a channel and the next customer hello lands here, ready for your reply." />
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center md:flex">
          <p className="text-gray-500">Select a conversation to start messaging</p>
        </div>
      )}

      {!isMobile ? (
        <div
          className="hidden min-h-0 flex-shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out xl:flex"
          style={{
            width: selectedConversation?.id && showDesktopContact ? CONTACT_SIDEBAR_WIDTH : 0,
            opacity: selectedConversation?.id && showDesktopContact ? 1 : 0,
          }}
        >
          {selectedConversation?.id ? (
            <ContactSidebarHybrid
              selectedConversation={selectedConversation as any}
              contactDetails={selectedContact}
              refreshContact={refreshContact}
              refreshConversations={refreshConversations}
              conversationList={convList}
              onSelectConversation={(conversation) => selectConversation(conversation as any)}
              desktopTitle="Contact details"
              onDesktopClose={() => setShowDesktopContact(false)}
              desktopContainerClassName="flex h-full"
            />
          ) : null}
        </div>
      ) : null}

      <MobileCategoryDrawer
        open={showMobileCategories}
        onClose={() => setShowMobileCategories(false)}
      />

      {selectedConversation ? (
        <MobileContactSheet
          open={showMobileContact}
          onClose={() => setShowMobileContact(false)}
          selectedConversation={selectedConversation as any}
          contactDetails={selectedContact}
        />
      ) : null}
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
