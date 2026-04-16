import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ChannelApi } from '../lib/channelApi';
import { useSocket } from '../socket/socket-provider';
import { useChannel } from '../context/ChannelContext';
import { useIsMobile } from './useIsMobile';
import { useAuth } from '../context/AuthContext';

type OAuthProvider =
  | 'instagram'
  | 'messenger'
  | 'whatsapp'
  | 'whatsapp_coexist';

type ChannelConnectedPayload = {
  eventId?: string;
  provider: OAuthProvider;
  channel: any;
  workspaceId: string;
};

type ChannelErrorPayload = {
  eventId?: string;
  provider: OAuthProvider;
  error: string;
  workspaceId: string;
};

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  instagram: 'Instagram',
  messenger: 'Facebook Messenger',
  whatsapp: 'WhatsApp',
  whatsapp_coexist: 'WhatsApp Business App',
};

export function useChannelOAuth(options: {
  provider: OAuthProvider;
  workspaceId: string;
  onSuccess: (channel: any) => void;
  onError: (message: string) => void;
}) {
  const { provider, workspaceId, onSuccess, onError } = options;
  const { socket } = useSocket();
  const { refreshChannels } = useChannel();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(false);

  const handledEventsRef = useRef<Set<string>>(new Set());
  const popupRef = useRef<Window | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const closedCheckRef = useRef<number | null>(null);
  const completionRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const { user } = useAuth();

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onError, onSuccess]);

  const flushPendingEvents = useCallback(() => {
    socket?.emit('oauth:pending:flush', { user });
  }, [socket, user]);

  useEffect(() => {
    if (!socket || !workspaceId) {
      return;
    }

    const handleConnected = (payload: ChannelConnectedPayload) => {
      if (payload.provider !== provider || payload.workspaceId !== workspaceId) {
        return;
      }

      const eventKey =
        payload.eventId ??
        `${payload.provider}:${payload.workspaceId}:${payload.channel?.id ?? 'unknown'}`;

      if (handledEventsRef.current.has(eventKey)) {
        return;
      }

      handledEventsRef.current.add(eventKey);
      completionRef.current = true;
      clearWatchers();
      setLoading(false);
      popupRef.current?.close();
      popupRef.current = null;
      void refreshChannels(true);
      toast.success(`${PROVIDER_LABELS[provider]} connected`);
      onSuccessRef.current(payload.channel);
    };

    const handleError = (payload: ChannelErrorPayload) => {
      if (payload.provider !== provider || payload.workspaceId !== workspaceId) {
        return;
      }

      const eventKey =
        payload.eventId ??
        `${payload.provider}:${payload.workspaceId}:${payload.error}`;

      if (handledEventsRef.current.has(eventKey)) {
        return;
      }

      handledEventsRef.current.add(eventKey);
      completionRef.current = true;
      clearWatchers();
      setLoading(false);
      popupRef.current?.close();
      popupRef.current = null;
      const message =
        payload.error || `${PROVIDER_LABELS[provider]} connection failed.`;
      toast.error(message);
      onErrorRef.current(message);
    };

    socket.on('channel:connected', handleConnected);
    socket.on('channel:error', handleError);
    flushPendingEvents();

    return () => {
      socket.off('channel:connected', handleConnected);
      socket.off('channel:error', handleError);
    };
  }, [flushPendingEvents, provider, refreshChannels, socket, workspaceId]);

  useEffect(() => {
    return () => {
      clearWatchers();
    };
  }, []);

  const prepareAuth = () => {
    if (!workspaceId) {
      const message = 'Select a workspace before connecting a channel.';
      onErrorRef.current(message);
      return false;
    }

    completionRef.current = false;
    setLoading(true);
    clearWatchers();
    timeoutRef.current = window.setTimeout(() => {
      if (completionRef.current) {
        return;
      }

      clearWatchers();
      setLoading(false);
      const message = `${PROVIDER_LABELS[provider]} authorization timed out. Please try again.`;
      toast.error(message);
      onErrorRef.current(message);
    }, 5 * 60 * 1000);

    return true;
  };

  const failAuth = (error: any) => {
    clearWatchers();
    setLoading(false);
    const message =
      error?.message ?? `${PROVIDER_LABELS[provider]} connection failed.`;
    toast.error(message);
    onErrorRef.current(message);
  };

  const startAuth = async () => {
    if (!prepareAuth()) {
      return;
    }

    try {
      const { url } = await getAuthUrl(provider);

      if (isMobile) {
        window.location.assign(url);
        return;
      }

      const popup = window.open(
        url,
        `${provider}_oauth`,
        'width=680,height=760,scrollbars=yes,resizable=yes',
      );

      if (!popup) {
        window.location.assign(url);
        return;
      }

      popupRef.current = popup;
      watchPopupClose();
    } catch (error: any) {
      failAuth(error);
    }
  };

  const startCustomAuth = async (executor: () => Promise<void>) => {
    if (!prepareAuth()) {
      return;
    }

    try {
      await executor();
      flushPendingEvents();
    } catch (error: any) {
      failAuth(error);
    }
  };

  useEffect(() => {
  const handler = (event: MessageEvent) => {
    if (!event.data) return;

    if (event.data.type === "OAUTH_CALLBACK") {
      completionRef.current = true;

      clearWatchers();
      setLoading(false);

      if (event.data.status === "success") {
        toast.success(`${PROVIDER_LABELS[provider]} connected`);

        // 🔥 IMPORTANT: refresh channels or trigger socket sync
        onSuccessRef.current?.(event.data);
      } else {
        const message = `${PROVIDER_LABELS[provider]} connection failed`;
        toast.error(message);
        onErrorRef.current(message);
      }

      // close popup if still open
      popupRef.current?.close();
    }
  };

  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}, []);

  const clearWatchers = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (closedCheckRef.current) {
      window.clearInterval(closedCheckRef.current);
      closedCheckRef.current = null;
    }
  };

  const watchPopupClose = () => {
    if (!popupRef.current) {
      return;
    }

    closedCheckRef.current = window.setInterval(() => {
      if (!popupRef.current || !popupRef.current.closed) {
        return;
      }

      popupRef.current = null;
      window.setTimeout(() => {
        if (completionRef.current) {
          return;
        }

        clearWatchers();
        setLoading(false);
        const message = `${PROVIDER_LABELS[provider]} authorization was closed before it completed.`;
        toast.error(message);
        onErrorRef.current(message);
      }, 800);
    }, 500);
  };

  return {
    loading,
    startAuth,
    startCustomAuth,
  };
}

async function getAuthUrl(
  provider: OAuthProvider,

) {
  switch (provider) {
    case 'instagram':
      return ChannelApi.getInstagramAuthUrl();
    case 'messenger':
      return ChannelApi.getMessengerAuthUrl();
    case 'whatsapp':
      return ChannelApi.getWhatsAppAuthUrl();
    case 'whatsapp_coexist':
      throw new Error('WhatsApp Business App auth does not use an OAuth URL.');
  }
}
