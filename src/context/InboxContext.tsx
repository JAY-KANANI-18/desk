import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { conversations as initialConversations } from "../pages/inbox/data";
import type { Conversation, Message } from "../pages/inbox/types";
import { useNotifications } from "./NotificationContext";
import { inboxApi } from "../lib/inboxApi";
import { useSocket } from "../socket/socket-provider";
import { useWorkspace } from "./WorkspaceContext";
import { ChannelApi } from "../lib/channelApi";
import { useOrganization } from "./OrganizationContext";
import { contactsApi } from "../lib/contactApi";

const DUMMY_MODE = false;

const STORAGE_KEY = "inbox_messages_v1";

function loadMessages(): Record<number, Message[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMessages(msgs: Record<number, Message[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch { }
}

const INCOMING_MESSAGES = [
  "Hey, I have a quick question about my order",
  "Can you help me with the pricing?",
  "When will my package arrive?",
  "I'd like to schedule a demo call",
  "Thanks for the quick response!",
  "Is this product still available?",
  "I need to update my billing information",
  "Can we reschedule our call to tomorrow?",
  "Just checking in on my support request",
  "Got your message, that sounds great!",
  "Do you offer any discounts for annual plans?",
  "I'm having trouble logging into my account",
  "Can you send me the invoice again?",
  "What's the refund policy?",
  "I'd like to upgrade my plan",
  "Are there any ongoing promotions?",
  "I just placed an order, can you confirm?",
];

const NEW_CONTACTS: Array<{
  firstName: string;
  lastName: string;
  avatar: string;
  channel: string;
  tag: string;
}> = [
    {
      firstName: "Alex",
      lastName: "Turner",
      avatar: "AT",
      channel: "whatsapp",
      tag: "New Lead",
    },
    {
      firstName: "Emma",
      lastName: "Wilson",
      avatar: "EW",
      channel: "email",
      tag: "New Lead",
    },
    {
      firstName: "Carlos",
      lastName: "Ruiz",
      avatar: "CR",
      channel: "instagram",
      tag: "Hot Lead",
    },
    {
      firstName: "Nina",
      lastName: "Patel",
      avatar: "NP",
      channel: "websitechat",
      tag: "New Lead",
    },
    {
      firstName: "James",
      lastName: "Kim",
      avatar: "JK",
      channel: "messenger",
      tag: "Customer",
    },
    {
      firstName: "Olivia",
      lastName: "Chen",
      avatar: "OC",
      channel: "whatsapp",
      tag: "Hot Lead",
    },
    {
      firstName: "Ryan",
      lastName: "Foster",
      avatar: "RF",
      channel: "email",
      tag: "New Lead",
    },
    {
      firstName: "Zara",
      lastName: "Ahmed",
      avatar: "ZA",
      channel: "instagram",
      tag: "New Lead",
    },
    {
      firstName: "Lucas",
      lastName: "Mendes",
      avatar: "LM",
      channel: "websitechat",
      tag: "Customer",
    },
  ];

const AGENT_NAMES = [
  "Alice Johnson",
  "Bob Smith",
  "Carol White",
  "David Lee",
  "Eva Martinez",
];

const MENTION_TEMPLATES = [
  (agent: string, contact: string) =>
    `${agent} mentioned you in ${contact}'s conversation`,
  (agent: string, contact: string) =>
    `${agent}: "@you please handle ${contact}'s request"`,
  (agent: string, contact: string) =>
    `${agent} tagged you in a note for ${contact}`,
];

let _nextConvId = 100;
let _nextMsgId = 1000;

function getNow() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface InboxContextType {
  convList: Conversation[];
  selectedConversation: Conversation;
  messages: Record<number, Message[]>;
  // channelOverrides: Record<number, string>;
  selectedChannel: any;
  inputMode: "reply" | "comment";
  snoozedUntil: string | null;
  msgSearchOpen: boolean;
  msgSearch: string;
  channels: any[] | null;
  selectedContact: any;
  uploadFile: ( file: File,conversationId: number,) => Promise<void>;
  selectConversation: (conv: Conversation) => void;
  addMessage: (msg: Message) => void;
  assignContact: (contactId: number, userId: string | null) => Promise<void>;
  refreshContact: () => Promise<void>;
  handleChannelChange: (channel: string) => void;
  setInputMode: React.Dispatch<React.SetStateAction<"reply" | "comment">>;
  setSnoozedUntil: React.Dispatch<React.SetStateAction<string | null>>;
  toggleMsgSearch: () => void;
  setMsgSearch: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: (msg: Omit<Message, "id" | "time" | "status">) => Promise<void>;
}

const InboxContext = createContext<InboxContextType | null>(null);

export const InboxProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { notify } = useNotifications();

  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  const [convList, setConvList] = useState<any[]>([]

    // () =>
    // DUMMY_MODE ? [...initialConversations] : []
  );

  const [messages, setMessages] = useState<Record<number, Message[]>>(() =>
    DUMMY_MODE ? loadMessages() : {}
  );
  // const [channelOverrides, setChannelOverrides] = useState<
  //   Record<number, string>
  // >({});
  const [inputMode, setInputMode] = useState<"reply" | "comment">("reply");
  const [snoozedUntil, setSnoozedUntil] = useState<string | null>(null);
  const [msgSearchOpen, setMsgSearchOpen] = useState(false);
  const [msgSearch, setMsgSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);

  const [channels, setChannels] = useState<any[] | null>(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedConversation, setSelectedConversation] =
    useState<any>(
      null
      // () =>
      // DUMMY_MODE ? initialConversations[0] : initialConversations[0]
    );
  const { refreshOrganizationsUsers } = useOrganization()

  useEffect(() => {
    refreshOrganizationsUsers();
  }, [refreshOrganizationsUsers])





  useEffect(() => {
    if (!selectedConversation) return;

    setSelectedChannel(selectedConversation.channel);
  }, [selectedConversation]);
  useEffect(() => {

    refreshChannels();
  }, []);

  const refreshChannels = useCallback(async () => {
    const result = await ChannelApi.getChannels();
    setChannels(result);
    if (selectedChannel == null && result.length > 0) {
      setSelectedChannel(result[0]);
    }

  }, []);

  const refreshContact = useCallback(async () => {
    if (!selectedConversation?.contact?.id) return;
    contactsApi.getContact(selectedConversation.contactId).then((details) => {

      setSelectedContact(details);
    })
  }, [selectedConversation?.contact?.id]);

  const selectedConvIdRef = useRef(selectedConversation?.id);
  const convListRef = useRef(convList);


  const socket = useSocket();
  const { activeWorkspace } = useWorkspace();

  const assignContact = async (contactId: number, userId: string) => {
    await contactsApi.assignContact(contactId, userId)

  }

  useEffect(() => {
    refreshContact()
  }, [selectedConversation?.contact?.id, refreshContact])


  const upsertConversation = (conv: Conversation) => {
    setConvList((prev) => {
      const exists = prev.find((c) => c.id === conv.id);

      if (!exists) {
        return [conv, ...prev];
      }

      const rest = prev.filter((c) => c.id !== conv.id);

      return [
        {
          ...exists,
          ...conv,
        },
        ...rest,
      ];
    });
  };

  const appendMessage = (msg: Message) => {
    setMessages((prev) => {
      const list = prev[msg.conversationId] ?? [];

      const already = list.some((m) => m.id === msg.id);
      if (already) return prev;

      return {
        ...prev,
        [msg.conversationId]: [...list, msg],
      };
    });
  };



  useEffect(() => {
    if (!socket || !activeWorkspace) return;

    const onMessage = (msg: Message) => {
      console.log("NEW message", msg);

      appendMessage(msg);

      setConvList((prev) => {
        let conv = prev.find((c) => c.id === msg.conversationId);

        const isSelected = selectedConvIdRef.current === msg.conversationId;

        if (!conv) {
          // conversation not loaded yet
          const newConv: Conversation = {
            id: msg.conversationId,
            name: msg.author,
            avatar: msg.initials,
            channel: msg.channel,
            message: msg.text || "Attachment",
            time: msg.time,
            unreadCount: isSelected ? 0 : 1,
            tag: "",
            direction: "incoming",
          };

          return [newConv, ...prev];
        }

        const rest = prev.filter((c) => c.id !== msg.conversationId);

        return [
          {
            ...conv,
            message: msg.text || "Attachment",
            time: msg.time,
            direction: "incoming",
            unreadCount: isSelected ? 0 : conv.unreadCount + 1,
          },
          ...rest,
        ];
      });

      notifyRef.current({
        type: "new_message",
        title: `New message`,
        body: msg.text || "Attachment",
        conversationId: msg.conversationId,
      });
    };

    const onConversation = (conv: Conversation) => {
      console.log("NEW conversation", conv);

      upsertConversation(conv);

      // notifyRef.current({
      //   type: "new_message",
      //   title: "New conversation",
      //   body: `${conv?.contact?.firstName}: ${conv.lastMessage.text || "Attachment"}`,
      //   conversationId: conv.id,
      //   contactName: conv?.contact?.firstName,
      // });
    };

    socket.on("message.upsert", onMessage);
    socket.on("conversation.upsert", onConversation);

    return () => {
      socket.off("message.upsert", onMessage);
      socket.off("conversation.upsert", onConversation);
    };
  }, [socket, activeWorkspace]);
  useEffect(() => {
    selectedConvIdRef.current = selectedConversation?.id;

  }, [selectedConversation?.id]);
  useEffect(() => {
    convListRef.current = convList;
  }, [convList]);
  useEffect(() => {
  }, [convList]);

  useEffect(() => {
  }, []);

  useEffect(() => {
    console.log("selectedConversation updated:dwdw ", selectedConversation);
  }, [selectedConversation]);
  useEffect(() => {
    if (DUMMY_MODE) return;

    inboxApi
      .getConversations()
      .then((convs: any) => {
        setConvList(convs);
        if (convs.length > 0) setSelectedConversation(convs[0]);


      })


    const unsubscribe = inboxApi.subscribeToUpdates(
      (msg) => {
        setMessages((prev) => ({
          ...prev,
          [msg.conversationId]: [...(prev[msg.conversationId] ?? []), msg],
        }));
        setConvList((prev) => {
          const target = prev.find((c) => c.id === msg.conversationId);
          if (!target) return prev;
          const isSelected = selectedConvIdRef.current === msg.conversationId;
          const rest = prev.filter((c) => c.id !== msg.conversationId);
          return [
            {
              ...target,
              message: msg.text || "Attachment",
              time: msg.time,
              direction: "incoming" as const,
              unreadCount: isSelected ? 0 : target.unreadCount + 1,
            },
            ...rest,
          ];
        });
        notifyRef.current({
          type: "new_message",
          title: `New message`,
          body: msg.text || "Attachment",
          conversationId: msg.conversationId,
        });
      },
      (conv) => {
        setConvList((prev) => [conv, ...prev]);
        notifyRef.current({
          type: "new_message",
          title: "New conversation",
          body: `${conv.name}: ${conv.message}`,
          conversationId: conv.id,
          contactName: conv.name,
        });
      },
      (evt) => {
        notifyRef.current({
          type: "assign",
          title: "Conversation assigned to you",
          body: `${evt.assignedBy} assigned ${evt.contactName}'s conversation to you`,
          conversationId: evt.conversationId,
          contactName: evt.contactName,
        });
      },
      (evt) => {
        notifyRef.current({
          type: "mention",
          title: `${evt.mentionedBy} mentioned you`,
          body: evt.text,
          conversationId: evt.conversationId,
          contactName: evt.contactName,
        });
      }
    );

    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (DUMMY_MODE) return;
    if (selectedConversation?.id) {

      inboxApi
        .getMessages(selectedConversation?.id)
        .then((msgs) => {
          setMessages((prev) => ({ ...prev, [selectedConversation?.id]: msgs }));
        })
    }
  }, [selectedConversation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!DUMMY_MODE) return;

    const interval = setInterval(() => {
      const candidates = convListRef.current.filter(
        (c) => c.id !== selectedConvIdRef.current
      );
      if (candidates.length === 0) return;

      const target = pickRandom(candidates);
      const text = pickRandom(INCOMING_MESSAGES);
      const timeStr = getNow();
      const msgId = _nextMsgId++;
      console.log({ target, text, timeStr, msgId });

      setConvList((prev) => {
        const t = prev.find((c) => c.id === target.id);
        if (!t) return prev;
        const rest = prev.filter((c) => c.id !== target.id);
        return [
          {
            ...t,
            message: text,
            time: timeStr,
            unreadCount: t.unreadCount + 1,
            direction: "incoming" as const,
          },
          ...rest,
        ];
      });

      setMessages((prev) => {
        const updated = {
          ...prev,
          [target.id]: [
            ...(prev[target.id] ?? []),
            {
              id: msgId,
              conversationId: target.id,
              type: "reply" as const,
              text,
              author: target.name,
              initials: target.avatar,
              time: timeStr,
              channel: target.channel,
            },
          ],
        };
        saveMessages(updated);
        return updated;
      });

      notifyRef.current({
        type: "new_message",
        title: `New message from ${target.name}`,
        body: text,
        conversationId: target.id,
        contactName: target.name,
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!DUMMY_MODE) return;

    const interval = setInterval(() => {
      const contact = pickRandom(NEW_CONTACTS);
      const text = pickRandom(INCOMING_MESSAGES);
      const timeStr = getNow();
      const newId = _nextConvId++;
      const msgId = _nextMsgId++;

      const newConv: Conversation = {
        id: newId,
        name: contact.name,
        message: text,
        time: timeStr,
        unreadCount: 1,
        tag: contact.tag,
        avatar: contact.avatar,
        channel: contact.channel,
        direction: "incoming",
      };

      setConvList((prev) => [newConv, ...prev]);

      setMessages((prev) => {
        const updated = {
          ...prev,
          [newId]: [
            {
              id: msgId,
              conversationId: newId,
              type: "reply" as const,
              text,
              author: contact.name,
              initials: contact.avatar,
              time: timeStr,
              channel: contact.channel,
            },
          ],
        };
        saveMessages(updated);
        return updated;
      });

      notifyRef.current({
        type: "new_message",
        title: "New conversation",
        body: `${contact.name}: ${text}`,
        conversationId: newId,
        contactName: contact.name,
      });
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!DUMMY_MODE) return;

    const interval = setInterval(() => {
      const list = convListRef.current;
      if (list.length === 0) return;
      const conv = pickRandom(list);
      const agent = pickRandom(AGENT_NAMES);

      notifyRef.current({
        type: "assign",
        title: "Conversation assigned to you",
        body: `${agent} assigned ${conv.name}'s conversation to you`,
        conversationId: conv.id,
        contactName: conv.name,
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!DUMMY_MODE) return;

    const interval = setInterval(() => {
      const list = convListRef.current;
      if (list.length === 0) return;
      const conv = pickRandom(list);
      const agent = pickRandom(AGENT_NAMES);
      const template = pickRandom(MENTION_TEMPLATES);

      notifyRef.current({
        type: "mention",
        title: `${agent} mentioned you`,
        body: template(agent, conv.name),
        conversationId: conv.id,
        contactName: conv.name,
      });
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  const updateMessageStatus = useCallback(
    (msgId: number, conversationId: number, status: Message["status"]) => {
      setMessages((prev) => {
        const updated = {
          ...prev,
          [conversationId]: (prev[conversationId] ?? []).map((m) =>
            m.id === msgId ? { ...m, status } : m
          ),
        };
        if (DUMMY_MODE) saveMessages(updated);
        return updated;
      });
    },
    []
  );


  const addMessage = useCallback(
    (msg: Message) => {
      if (msg.channel) {
        // setChannelOverrides((prev) => ({
        //   ...prev,
        //   [msg.conversationId]: msg.channel!,
        // }));
        setChannels((prev: any) => ({
          ...prev,
          [msg.conversationId]: msg.channel!,
        }));
      }

      if (DUMMY_MODE) {
        const pending: Message = { ...msg, status: "pending" };

        setMessages((prev) => {
          const updated = {
            ...prev,
            [msg.conversationId]: [
              ...(prev[msg.conversationId] ?? []),
              pending,
            ],
          };
          saveMessages(updated);
          return updated;
        });

        setConvList((prev) => {
          const target = prev.find((c) => c.id === msg.conversationId);
          if (!target) return prev;
          const rest = prev.filter((c) => c.id !== msg.conversationId);
          return [
            {
              ...target,
              message: msg.text || "Attachment",
              time: msg.time,
              direction: "outgoing" as const,
            },
            ...rest,
          ];
        });

        setTimeout(
          () => updateMessageStatus(msg.id, msg.conversationId, "sent"),
          700
        );
        setTimeout(
          () => updateMessageStatus(msg.id, msg.conversationId, "delivered"),
          1800
        );
        setTimeout(
          () => updateMessageStatus(msg.id, msg.conversationId, "read"),
          3500
        );
      } else {
        const optimistic: Message = { ...msg, status: "pending" };
        setMessages((prev) => ({
          ...prev,
          [msg.conversationId]: [
            ...(prev[msg.conversationId] ?? []),
            optimistic,
          ],
        }));

        const { id: _id, status: _status, ...payload } = msg;
        inboxApi
          .sendMessage(payload)
          .then((saved) => {
            setMessages((prev) => ({
              ...prev,
              [msg.conversationId]: (prev[msg.conversationId] ?? []).map((m) =>
                m.id === msg.id ? saved : m
              ),
            }));
          })
          .catch((err) => {
            console.error("[InboxContext] sendMessage failed:", err);
            updateMessageStatus(msg.id, msg.conversationId, "pending");
          });

        setConvList((prev) => {
          const target = prev.find((c) => c.id === msg.conversationId);
          if (!target) return prev;
          const rest = prev.filter((c) => c.id !== msg.conversationId);
          return [
            {
              ...target,
              message: msg.text || "Attachment",
              time: msg.time,
              direction: "outgoing" as const,
            },
            ...rest,
          ];
        });
      }
    },
    [updateMessageStatus]
  );

  const getMessagesForConversation = useCallback(
    (conversationId: number) => {

      inboxApi.getMessages(conversationId).then((msgs) => {
        setMessages((prev) => ({ ...prev, [conversationId]: msgs }));
      })

      return messages[conversationId] ?? [];
    },
    [messages]
  );

  const selectConversation = useCallback((conv: Conversation) => {
    setConvList((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );

    setSelectedConversation({ ...conv, unreadCount: 0 });

    setMsgSearch("");
    setMsgSearchOpen(false);
    getMessagesForConversation(conv.id);

    if (!DUMMY_MODE) {
      inboxApi.markConversationRead(conv.id)
    }
  }, []);

  const toggleMsgSearch = useCallback(() => {
    setMsgSearchOpen((prev) => {
      if (prev) setMsgSearch("");
      return !prev;
    });
  }, []);
  // let selectedChannel =  channels && channels[0]
  //  (channels?.length && channels[selectedConversation?.id]) ?? selectedConversation?.channel;
  // channelOverrides[selectedConversation?.id] ?? selectedConversation?.channel;

  async function uploadFile(file: File, entityId: string) {

    // 1 get presign
    let { uploadUrl, fileUrl } = await inboxApi.getPresignedUploadUrl({ type: "message-attachment", fileName: file.name, contentType: file.type, entityId })


    // 2 upload directly to R2
    await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type
      },
      body: file
    });

    // 3 return final public url
    return fileUrl;
  }

 const sendMessage = useCallback(
  async (msg: Omit<Message, "id" | "time" | "status"> & { template?: any }) => {

    const payload: any = {
      ...(msg.text && { text: msg.text }),
      ...(msg.attachments?.length && { attachments: msg.attachments })
    };

    if (msg.template) {
      payload.metadata = {
        template: msg.template
      };
    }

    const message = await inboxApi.sendMessage(
      selectedChannel?.id,
      String(selectedConversation?.id),
      payload
    );

    console.log({ message });

  },
  [selectedChannel?.id, selectedConversation?.id]
);
  const handleChannelChange = useCallback(
    (channel: any) => {
      // selectedChannel = channel;
      setSelectedChannel(channel)
      // setChannelOverrides((prev) => ({
      //   ...prev,
      //   [selectedConversation?.id]: channel,
      // }));
    },
    [selectedConversation?.id]
  );

  return (
    <InboxContext.Provider
      value={{
        convList,
        selectedConversation,
        messages,
        // channelOverrides,
        selectedChannel,
        inputMode,
        snoozedUntil,
        msgSearchOpen,
        msgSearch,
        channels,
        selectedContact,
        uploadFile,
        assignContact,
        refreshContact,
        selectConversation,
        addMessage,
        handleChannelChange,
        setInputMode,
        setSnoozedUntil,
        toggleMsgSearch,
        setMsgSearch,
        sendMessage,
      }}
    >
      {children}
    </InboxContext.Provider>
  );
};

export const useInbox = (): InboxContextType => {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useInbox must be used within InboxProvider");
  return ctx;
};
