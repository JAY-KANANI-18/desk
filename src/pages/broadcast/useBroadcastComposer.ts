import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { channelSupportsBroadcast } from "../../config/channelMetadata";
import { broadcastApi, type BroadcastSendResult } from "../../lib/broadcastApi";
import { useFeatureFlags } from "../../context/FeatureFlagContext";
import { workspaceApi } from "../../lib/workspaceApi";
import type {
  BroadcastAudiencePreviewState,
  BroadcastFormState,
  BroadcastTemplate,
  LifecycleRow,
  TagRow,
} from "./types";
import {
  formatDateTime,
  templateFieldLabel,
  templateVariableKeys,
} from "./utils";

const INITIAL_FORM: BroadcastFormState = {
  name: "",
  channelId: "",
  text: "",
  tagIds: [],
  lifecycleId: "",
  respectMarketingOptOut: true,
  limit: 200,
  scheduleMode: "now",
  scheduledAt: "",
};

export function useBroadcastComposer({
  channels,
  reloadRuns,
}: {
  channels: any[];
  reloadRuns: () => Promise<void>;
}) {
  const { flags } = useFeatureFlags();
  const [tags, setTags] = useState<TagRow[]>([]);
  const [lifecycles, setLifecycles] = useState<LifecycleRow[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [lastSendResult, setLastSendResult] = useState<BroadcastSendResult | null>(null);
  const [form, setForm] = useState<BroadcastFormState>(INITIAL_FORM);
  const [audiencePreview, setAudiencePreview] = useState<BroadcastAudiencePreviewState | null>(null);
  const [waTemplates, setWaTemplates] = useState<BroadcastTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!flags.lifecycle) {
      setLifecycles([]);
    }

    (async () => {
      try {
        const [tagResponse, lifecycleResponse] = await Promise.all([
          workspaceApi.getTags(),
          flags.lifecycle ? workspaceApi.getLifecycleStages() : Promise.resolve([]),
        ]);
        const tagList = Array.isArray(tagResponse)
          ? tagResponse
          : (tagResponse as { data?: TagRow[] })?.data ?? [];
        const rawLifecycles = Array.isArray(lifecycleResponse)
          ? lifecycleResponse
          : (lifecycleResponse as { data?: LifecycleRow[] })?.data ?? [];
        setTags(tagList);
        setLifecycles(rawLifecycles.filter((stage) => !stage.type || stage.type === "lifecycle"));
      } catch {
        // Non-fatal metadata load.
      }
    })();
  }, [flags.lifecycle]);

  useEffect(() => {
    if (flags.lifecycle || !form.lifecycleId) return;
    setForm((prev) => (prev.lifecycleId ? { ...prev, lifecycleId: "" } : prev));
  }, [flags.lifecycle, form.lifecycleId]);

  const selectedChannel = useMemo(
    () => channels.find((channel) => String(channel.id) === form.channelId),
    [channels, form.channelId],
  );
  const isWhatsApp = selectedChannel?.type === "whatsapp";

  useEffect(() => {
    if (!form.channelId || !selectedChannel) return;
    if (channelSupportsBroadcast(selectedChannel.type)) return;
    setForm((prev) => ({ ...prev, channelId: "" }));
  }, [form.channelId, selectedChannel]);

  useEffect(() => {
    setAudiencePreview(null);
    setSelectedTemplateId("");
    setTemplateVars({});
    setWaTemplates([]);
    if (!form.channelId || !isWhatsApp) return;

    (async () => {
      try {
        const list = await broadcastApi.whatsappTemplates(form.channelId);
        setWaTemplates(Array.isArray(list) ? list : []);
      } catch {
        setWaTemplates([]);
      }
    })();
  }, [form.channelId, isWhatsApp]);

  useEffect(() => {
    setAudiencePreview(null);
  }, [form.channelId, form.lifecycleId, form.respectMarketingOptOut, form.tagIds]);

  const selectedTemplate = useMemo(
    () => waTemplates.find((template) => template.id === selectedTemplateId),
    [waTemplates, selectedTemplateId],
  );

  useEffect(() => {
    if (!selectedTemplateId) {
      setTemplateVars({});
      return;
    }
    const template = waTemplates.find((item) => item.id === selectedTemplateId);
    if (!template) {
      setTemplateVars({});
      return;
    }
    const keys = templateVariableKeys(template.variables);
    setTemplateVars((prev) => {
      const next: Record<string, string> = {};
      keys.forEach((key) => {
        next[key] = prev[key] ?? "";
      });
      return next;
    });
  }, [selectedTemplateId, waTemplates]);

  const runAudiencePreview = useCallback(async () => {
    if (!form.channelId) {
      toast.error("Choose where to send from");
      return;
    }
    if (!selectedChannel || !channelSupportsBroadcast(selectedChannel.type)) {
      toast.error("Broadcasts are available for WhatsApp and Email only");
      return;
    }
    setPreviewLoading(true);
    try {
      const result = await broadcastApi.audiencePreview({
        channelId: form.channelId,
        tagIds: form.tagIds.length ? form.tagIds : undefined,
        lifecycleId: flags.lifecycle && form.lifecycleId ? form.lifecycleId : undefined,
        respectMarketingOptOut: form.respectMarketingOptOut,
        limit: 200,
      });
      setAudiencePreview({
        totalMatching: result.totalMatching,
        sample: result.sample ?? [],
      });
      toast.success(`${result.totalMatching} people can receive this broadcast`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not check people");
    } finally {
      setPreviewLoading(false);
    }
  }, [flags.lifecycle, form, selectedChannel]);

  const handleSend = useCallback(async () => {
    if (!form.name.trim()) {
      toast.error("Give this broadcast a name");
      return;
    }
    if (!form.channelId) {
      toast.error("Choose where to send from");
      return;
    }
    if (!selectedChannel || !channelSupportsBroadcast(selectedChannel.type)) {
      toast.error("Broadcasts are available for WhatsApp and Email only");
      return;
    }
    if (isWhatsApp) {
      if (!selectedTemplate) {
        toast.error("Choose an approved WhatsApp message");
        return;
      }
      for (const key of templateVariableKeys(selectedTemplate.variables)) {
        if (!(templateVars[key] ?? "").trim()) {
          toast.error(`Fill in ${templateFieldLabel(key)}`);
          return;
        }
      }
    } else if (!form.text.trim()) {
      toast.error("Write your message");
      return;
    }

    if (form.scheduleMode === "later") {
      if (!form.scheduledAt) {
        toast.error("Choose when to send");
        return;
      }
      if (new Date(form.scheduledAt).getTime() <= Date.now() + 30_000) {
        toast.error("Choose a time at least 1 minute from now");
        return;
      }
    }

    setSending(true);
    setLastSendResult(null);
    try {
      const result = await broadcastApi.send({
        name: form.name.trim(),
        channelId: form.channelId,
        text: isWhatsApp ? undefined : form.text.trim(),
        template:
          isWhatsApp && selectedTemplate
            ? {
                name: selectedTemplate.name,
                language: selectedTemplate.language,
                variables: templateVars,
              }
            : undefined,
        tagIds: form.tagIds.length ? form.tagIds : undefined,
        lifecycleId: flags.lifecycle && form.lifecycleId ? form.lifecycleId : undefined,
        respectMarketingOptOut: form.respectMarketingOptOut,
        limit: Math.min(500, Math.max(1, form.limit)),
        scheduledAt:
          form.scheduleMode === "later" && form.scheduledAt
            ? new Date(form.scheduledAt).toISOString()
            : undefined,
      });

      setLastSendResult(result);
      toast.success(
        result.status === "scheduled"
          ? `Scheduled for ${result.totalAudience} people on ${formatDateTime(result.scheduledAt)}`
          : `Started sending to ${result.queued} people${result.failed ? `, ${result.failed} need attention` : ""}`,
      );
      if (result.whatsAppComplianceNote) {
        toast("WhatsApp will only send approved messages to people who can receive them.", { icon: "i" });
      }
      setShowComposer(false);
      setForm(INITIAL_FORM);
      setAudiencePreview(null);
      await reloadRuns();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start broadcast");
    } finally {
      setSending(false);
    }
  }, [flags.lifecycle, form, isWhatsApp, reloadRuns, selectedChannel, selectedTemplate, templateVars]);

  return {
    tags,
    lifecycles,
    showComposer,
    sending,
    previewLoading,
    lastSendResult,
    form,
    audiencePreview,
    waTemplates,
    selectedTemplateId,
    selectedTemplate,
    templateVars,
    isWhatsApp,
    setForm,
    setSelectedTemplateId,
    setTemplateVars,
    runAudiencePreview,
    handleSend,
    openComposer: () => {
      setLastSendResult(null);
      setShowComposer(true);
    },
    closeComposer: () => setShowComposer(false),
  };
}
