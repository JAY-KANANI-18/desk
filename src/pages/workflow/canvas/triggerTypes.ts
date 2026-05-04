import { TriggerType } from '../workflow.types';
import {
  MessageSquare, CheckSquare, Tag, Edit3, Zap, Webhook,
  MousePointerClick, Music, Hand, RefreshCcw, AppIcon, Menu, Image, FileText,
} from '@/components/ui/icons';

export interface TriggerMeta {
  type: TriggerType;
  label: string;
  description: string;
  Icon: AppIcon;
  upgradeRequired?: boolean;
}

export const TRIGGER_META: Record<TriggerType, TriggerMeta> = {
  conversation_opened:   { type: 'conversation_opened',   label: 'Conversation Opened',    description: 'When a conversation is opened with a contact',                  Icon: MessageSquare },
  conversation_closed:   { type: 'conversation_closed',   label: 'Conversation Closed',    description: 'When a conversation is closed',                                 Icon: CheckSquare },
  contact_tag_updated:   { type: 'contact_tag_updated',   label: 'Contact Tag Updated',    description: 'When a tag is added to or removed from a contact',              Icon: Tag },
  contact_field_updated: { type: 'contact_field_updated', label: 'Contact Field Updated',  description: 'When a specified contact field is updated',                     Icon: Edit3 },
  menu_click:            { type: 'menu_click',            label: 'Menu Click',             description: 'When a Messenger persistent menu action is tapped',             Icon: Menu },
  story_reply:           { type: 'story_reply',           label: 'Story Reply',            description: 'When an Instagram story reply automation runs',                 Icon: Image },
  template_send:         { type: 'template_send',         label: 'Template Send',          description: 'When a template message is sent through a connected channel',   Icon: FileText },
  // shortcut:              { type: 'shortcut',              label: 'Shortcut',               description: 'Manually triggered from the Inbox module by an agent',          Icon: Zap },
  // incoming_webhook:      { type: 'incoming_webhook',      label: 'Incoming Webhook',       description: 'Triggered by an HTTP POST from an external service',            Icon: Webhook, upgradeRequired: true },
  // click_to_chat_ads:     { type: 'click_to_chat_ads',     label: 'Click-to-Chat Ads',      description: 'When a Meta ad is clicked or related message is received',      Icon: MousePointerClick },
  // tiktok_messaging_ads:  { type: 'tiktok_messaging_ads',  label: 'TikTok Messaging Ads',   description: 'When a TikTok ad is clicked or related message is received',    Icon: Music },
  manual_trigger:        { type: 'manual_trigger',        label: 'Manual Trigger',         description: 'Triggered by the Trigger Another Workflow step',                Icon: Hand },
  lifecycle_updated:     { type: 'lifecycle_updated',     label: 'Lifecycle Updated',      description: "When a contact's lifecycle stage changes",                      Icon: RefreshCcw },
};

export const TRIGGER_LIST = Object.values(TRIGGER_META);
