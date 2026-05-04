import { StepType } from '../workflow.types';
import {
  MessageSquare, HelpCircle, UserCheck, GitBranch, Tag, Edit3,
  MessageCircle, XCircle, StickyNote, CornerDownRight, Clock,
  Workflow, Calendar, Globe, Table, BarChart2, TrendingUp, Bot,
  AppIcon,
} from '@/components/ui/icons';

export interface StepMeta {
  type: StepType;
  label: string;
  description: string;
  Icon: AppIcon;
  category: StepCategory;
  upgradeRequired?: boolean;
}

export type StepCategory =
  | 'messaging' | 'assignment' | 'logic' | 'contact'
  | 'conversation' | 'flow' | 'integration' | 'ads' | 'ai';

export interface StepCategoryMeta {
  id: StepCategory;
  label: string;
  Icon: AppIcon;
}

export const STEP_CATEGORIES: StepCategoryMeta[] = [
  { id: 'messaging',    label: 'Messaging',      Icon: MessageSquare },
  { id: 'assignment',   label: 'Assignment',      Icon: UserCheck },
  { id: 'logic',        label: 'Logic',           Icon: GitBranch },
  { id: 'contact',      label: 'Contact Data',    Icon: Edit3 },
  { id: 'conversation', label: 'Conversation',    Icon: MessageCircle },
  { id: 'flow',         label: 'Flow Control',    Icon: CornerDownRight },
  { id: 'integration',  label: 'Integrations',    Icon: Globe },
  { id: 'ads',          label: 'Ads & Tracking',  Icon: BarChart2 },
  { id: 'ai',           label: 'AI',              Icon: Bot },
];

export const STEP_META: Record<StepType, StepMeta> = {
  send_message:                   { type: 'send_message',                   label: 'Send a Message',             description: 'Send a message to the contact on a chosen channel',     Icon: MessageSquare,   category: 'messaging' },
  ask_question:                   { type: 'ask_question',                   label: 'Ask a Question',             description: 'Send a question and collect a validated response',       Icon: HelpCircle,      category: 'messaging' },
  assign_to:                      { type: 'assign_to',                      label: 'Assign To',                  description: 'Assign the contact to a user, team, or unassign',        Icon: UserCheck,       category: 'assignment' },
  branch:                         { type: 'branch',                         label: 'Branch',                     description: 'Split the flow into conditional paths',                  Icon: GitBranch,       category: 'logic' },
  update_contact_tag:             { type: 'update_contact_tag',             label: 'Update Contact Tag',         description: 'Add or remove tags from the contact',                    Icon: Tag,             category: 'contact' },
  update_contact_field:           { type: 'update_contact_field',           label: 'Update Contact Field',       description: 'Modify a contact field value',                           Icon: Edit3,           category: 'contact' },
  open_conversation:              { type: 'open_conversation',              label: 'Open Conversation',          description: 'Open a conversation with the contact',                   Icon: MessageCircle,   category: 'conversation' },
  close_conversation:             { type: 'close_conversation',             label: 'Close Conversation',         description: 'Close the active conversation',                          Icon: XCircle,         category: 'conversation' },
  add_comment:                    { type: 'add_comment',                    label: 'Add Comment',                description: 'Add an internal note on the conversation',               Icon: StickyNote,      category: 'conversation' },
  jump_to:                        { type: 'jump_to',                        label: 'Jump To',                    description: 'Redirect to another step in the workflow',               Icon: CornerDownRight, category: 'flow' },
  wait:                           { type: 'wait',                           label: 'Wait',                       description: 'Pause the workflow for a set duration',                  Icon: Clock,           category: 'flow' },
  trigger_another_workflow:       { type: 'trigger_another_workflow',       label: 'Trigger Another Workflow',   description: 'Continue contact in a different workflow',               Icon: Workflow,        category: 'flow' },
  date_time:                      { type: 'date_time',                      label: 'Date & Time',                description: 'Branch based on current date or time',                   Icon: Calendar,        category: 'logic' },
  http_request:                   { type: 'http_request',                   label: 'HTTP Request',               description: 'Send a request to an external API',                      Icon: Globe,           category: 'integration', upgradeRequired: true },
  // add_google_sheets_row:          { type: 'add_google_sheets_row',          label: 'Add Google Sheets Row',      description: 'Append a row to a Google Sheet',                         Icon: Table,           category: 'integration' },
  // send_conversions_api_event:     { type: 'send_conversions_api_event',     label: 'Send Conversions API Event', description: 'Send a conversion event back to Meta',                   Icon: BarChart2,       category: 'ads' },
  // send_tiktok_lower_funnel_event: { type: 'send_tiktok_lower_funnel_event', label: 'TikTok Lower Funnel Event',  description: 'Send a conversion event back to TikTok',                Icon: TrendingUp,      category: 'ads' },
  // ai_objective:                   { type: 'ai_objective',                   label: 'AI Objective',               description: 'Automate conversations using AI (legacy)',               Icon: Bot,             category: 'ai' },
};

export const STEP_LIST = Object.values(STEP_META);
export const STEPS_BY_CATEGORY = STEP_CATEGORIES.map((cat) => ({
  ...cat,
  steps: STEP_LIST.filter((s) => s.category === cat.id),
}));