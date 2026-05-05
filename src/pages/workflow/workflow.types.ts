// ─────────────────────────────────────────────
// WORKFLOW CORE TYPES
// ─────────────────────────────────────────────

export type WorkflowStatus = 'draft' | 'published' | 'stopped';

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'text', label: 'Text' }, { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'number', label: 'Number' }, { value: 'date', label: 'Date' },
  { value: 'phone', label: 'Phone' }, { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' }, { value: 'rating', label: 'Rating (1–5)' },
  { value: 'location', label: 'Location' },
];
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  // trigger: TriggerConfig | null;
  config: {
    trigger: TriggerConfig | null;
    steps: StepConfig[];
    settings: WorkflowSettings;
  };

  // steps: StepConfig[];
  settings: WorkflowSettings;
  createBy?: string;
  createdBy?: string;
  createdById?: string;
  createdByName?: string;
  publishedBy?: string | null;
  publishedById?: string | null;
  publishedByName?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  lastPublishedBy?: string | null;
  lastPublishedAt?: string | null;
  updatedAt?: string;
}

export interface WorkflowSettings {
  allowStopForContact: boolean;
  exitOnOutgoingMessage: boolean;
  exitOnIncomingMessage: boolean;
  exitOnManualAssignment: boolean;
}

// ─────────────────────────────────────────────
// TRIGGER TYPES
// ─────────────────────────────────────────────

export type TriggerType =
  | 'conversation_opened'
  | 'conversation_closed'
  | 'contact_tag_updated'
  | 'contact_field_updated'
  | 'menu_click'
  | 'story_reply'
  | 'template_send'
  | 'shortcut'
  // | 'incoming_webhook'
  // | 'click_to_chat_ads'
  // | 'tiktok_messaging_ads'
  | 'manual_trigger'
  | 'lifecycle_updated';

export interface TriggerCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string | string[] | number;
  logicalOperator?: 'AND' | 'OR'; // connector to NEXT condition
}

export type ConditionOperator =
  | 'is_equal_to'
  | 'is_not_equal_to'
  | 'is_greater_than'
  | 'is_less_than'
  | 'is_between'
  | 'exists'
  | 'does_not_exist'
  | 'contains'
  | 'does_not_contain'
  | 'has_none_of'
  | 'has_all_of'
  | 'has_any_of'
  | 'is_timestamp_after'
  | 'is_timestamp_before'
  | 'is_timestamp_between'
  | 'is_greater_than_time'
  | 'is_less_than_time'
  | 'is_between_time';

export interface TriggerConfig {
  type: TriggerType;
  conditions: TriggerCondition[];
  advancedSettings: {
    triggerOncePerContact: boolean;
  };
  // Type-specific config
  data: TriggerData;
}

// Union of all trigger-specific data shapes
export type TriggerData =
  | ConversationOpenedData
  | ConversationClosedData
  | ContactTagUpdatedData
  | ContactFieldUpdatedData
  | ShortcutData
  | IncomingWebhookData
  | ClickToChatAdsData
  | TikTokAdsData
  | ManualTriggerData
  | LifecycleUpdatedData
  | Record<string, never>;

export interface ConversationOpenedData {
  sources: ConversationSource[];
}

export interface ConversationClosedData {
  sources: ConversationClosedSource[];
  categories: string[];
}

// export type ConversationSource = 'user' | 'workflow' | 'contact' | 'api' | 'zapier' | 'make' | 'click_to_chat_ads';
// export type ConversationClosedSource = 'user' | 'workflow' | 'bot' | 'api' | 'zapier' | 'make';

export interface ContactTagUpdatedData {
  action: 'added' | 'removed';
  tags: string[];
}

export interface ContactFieldUpdatedData {
  fieldId: string;
  fieldName: string;
}

export interface ShortcutFormField {
  id: string;
  label: string;
  type: 'text' | 'list' | 'checkbox' | 'number' | 'date' | 'time' | 'phone' | 'email' | 'url';
  variableName: string;
  required: boolean;
  options?: string[]; // for list type
}

export interface ShortcutData {
  icon: string;
  name: string;
  description: string;
  formFields: ShortcutFormField[];
}

export interface WebhookVariable {
  id: string;
  jsonKey: string;
  variableName: string;
}

export interface IncomingWebhookData {
  webhookUrl: string;
  contactIdentifierType: 'contact_id' | 'email' | 'phone';
  contactIdentifierJsonKey: string;
  variables: WebhookVariable[];
}

export interface ClickToChatAdsData {
  facebookAccountId: string;
  adSelection: 'all' | 'selected';
  selectedAdIds: string[];
}

export interface TikTokAdsData {
  adAccountId: string;
  adSelection: 'all' | 'selected';
  selectedAdIds: string[];
}

export interface ManualTriggerData {
  linkedWorkflowId?: string;
}

export interface LifecycleUpdatedData {
  stageSelection: 'all' | 'specific';
  stages: string[];
  triggerWhenCleared: boolean;
}

// ─────────────────────────────────────────────
// STEP TYPES
// ─────────────────────────────────────────────

export type StepType =
  | 'send_message'
  | 'ask_question'
  | 'assign_to'
  | 'branch'
  | 'branch_connector'

  | 'update_contact_tag'
  | 'update_contact_field'
  | 'open_conversation'
  | 'close_conversation'
  | 'add_comment'
  | 'jump_to'
  | 'wait'
  | 'trigger_another_workflow'
  | 'date_time'
  | 'http_request'
  // | 'add_google_sheets_row'
  // | 'send_conversions_api_event'
  // | 'send_tiktok_lower_funnel_event'
  // | 'ai_objective';

export interface StepConfig {
  id: string;
  type: StepType;
  name: string;
  data: StepData;
  parentId?: string;
  // For branching steps — maps branch key to next step id
  branches?: Record<string, string | null>;
  nextStepId?: string | null;
  position: { x: number; y: number };
}

export type StepData =
  | SendMessageData
  | AskQuestionData
  | AssignToData
  | BranchData
  | BranchConnectorData
  | UpdateContactTagData
  | UpdateContactFieldData
  | OpenConversationData
  | CloseConversationData
  | AddCommentData
  | JumpToData
  | WaitData
  | TriggerAnotherWorkflowData
  | DateTimeData
  | HttpRequestData
  | AddGoogleSheetsRowData
  | SendConversionsApiEventData
  | SendTikTokLowerFunnelEventData
  | Record<string, never>;

// ─── Step Data Shapes ───

export type MessageChannel = 'last_interacted' | string; // string = specific channel id

export interface MessageContent {
  type: 'text' | 'media';
  text?: string; // max 2000 chars
  mediaUrl?: string;
  mediaType?: 'file' | 'image';
}

export interface ChannelResponse {
  channelId: string;
  messageType: string;
  content: MessageContent;
}

// workflow.types.ts
export interface MessageAttachment {
  url: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'file';
  filename?: string;
  mimeType?: string;
  size?: number;
}
export interface SendMessageData {
  channel: MessageChannel;
  defaultMessage: MessageContent;
  channelResponses: ChannelResponse[];
  addMessageFailureBranch: boolean;
    attachments?: MessageAttachment[]; // ← add this

}

export type QuestionType =
  | 'text'
  | 'multiple_choice'
  | 'number'
  | 'date'
  | 'phone'
  | 'email'
  | 'url'
  | 'rating'
  | 'location';

export interface MultipleChoiceOption {
  id: string;
  label: string; // max 20 chars
}

export interface AskQuestionData {
  questionText: string;
  questionType: QuestionType;
  multipleChoiceOptions: MultipleChoiceOption[]; // up to 10
  numberMin?: number;
  numberMax?: number;
  saveAsContactField: boolean;
  contactFieldId?: string;
  saveAsVariable: boolean;
  variableName?: string;
  saveAsTag: boolean; // only for multiple_choice
  addTimeoutBranch: boolean;
  timeoutValue: number;
  timeoutUnit: 'seconds' | 'minutes' | 'hours' | 'days';
  addMessageFailureBranch: boolean;
  connectors?: string[];
}

export type AssignAction =
  | 'specific_user'
  | 'user_in_team'
  | 'user_in_workspace'
  | 'unassign';

export type AssignmentLogic = 'round_robin' | 'least_open_contacts';

export interface AssignToData {
  action: AssignAction;
  userId?: string;
  teamId?: string;
  assignmentLogic: AssignmentLogic;
  onlyOnlineUsers: boolean;
  maxOpenContacts?: number;
  addTimeoutBranch: boolean;
  timeoutValue: number;
  timeoutUnit: 'seconds' | 'minutes' | 'hours' | 'days';
}

export type BranchCategory =
  | 'contact_field'
  | 'contact_tags'
  | 'variable'
  | 'assignee_status'
  | 'last_interacted_channel'
  | 'last_incoming_message'
  | 'last_outgoing_message'
  | 'last_outgoing_message_source'
  | 'time_since_last_incoming'
  | 'time_since_last_outgoing';

export interface BranchCondition {
  id: string;
  category: BranchCategory;
  field?: string; // contact field id or variable name
  operator: ConditionOperator;
  value: string | string[] | number;
  logicalOperator?: 'AND' | 'OR';
}

export interface BranchCase {
  id: string;
  name: string;
  conditions: BranchCondition[];
  steps: StepConfig[];      // steps belonging to this branch arm
}

export interface BranchData {
  connectors?: string[];
  branches?: BranchCase[];   // legacy nested branch shape
  elseSteps?: StepConfig[];  // legacy nested Else arm
}

export interface BranchConnectorData {
  conditions: BranchCondition[];
  isElse?: boolean;
}

export interface UpdateContactTagData {
  action: 'add' | 'remove';
  tags: string[];
}

export interface UpdateContactFieldData {
  fieldId: string;
  fieldName: string;
  value: string; // supports $variables
}

export interface OpenConversationData {
  // no config needed currently
}

export interface CloseConversationData {
  addClosingNotes: boolean;
  category?: string;
  notes?: string;
}

export interface AddCommentData {
  comment: string; // supports $variables
  mentionedUserIds?: string[];
}

export interface JumpToData {
  targetStepId: string;
  maxJumps: number; // 1-10
}

export interface WaitData {
  value: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
}

export interface TriggerAnotherWorkflowData {
  targetWorkflowId: string;
  startFrom: 'beginning' | 'specific_step';
  targetStepId?: string;
}

export interface BusinessHours {
  enabled: boolean;
  startTime: string; // HH:mm
  endTime: string;
}

export interface DateTimeData {
  timezone: string;
  mode: 'business_hours' | 'date_range';
  businessHours?: Record<string, BusinessHours>; // key = 'monday' etc
  dateRangeStart?: string;
  dateRangeEnd?: string;
  connectors?: string[];
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpHeader {
  id: string;
  key: string;
  value: string;
}

export interface HttpResponseMapping {
  id: string;
  jsonKey: string; // e.g. $.phone
  variableName: string;
}

export interface HttpRequestData {
  method: HttpMethod;
  url: string;
  body?: string;
  contentType?: string;
  headers: HttpHeader[]; // max 10
  responseMappings: HttpResponseMapping[]; // max 10
  saveResponseStatus: boolean;
  responseStatusVariableName?: string;
}

export interface GoogleSheetsColumn {
  id: string;
  columnName: string;
  value: string; // supports $variables
}

export interface AddGoogleSheetsRowData {
  googleAccountId?: string;
  spreadsheetId?: string;
  sheetName?: string;
  columns: GoogleSheetsColumn[];
}

export interface SendConversionsApiEventData {
  eventName: string;
  pixelId?: string;
  customData?: Record<string, string>;
}

export interface SendTikTokLowerFunnelEventData {
  eventType: string;
  adAccountId?: string;
}

// ─────────────────────────────────────────────
// CANVAS NODE / EDGE TYPES  (ReactFlow)
// ─────────────────────────────────────────────

export interface WorkflowNodeData {
  stepId: string;
  stepType: StepType | 'trigger';
  label: string;
  isConfigured: boolean;
  hasError: boolean;
  isSelected: boolean;
  config?: TriggerConfig | StepConfig;
}

// ─────────────────────────────────────────────
// TEMPLATE TYPES
// ─────────────────────────────────────────────

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  popular?: boolean;
  iconName: string;
  color: string;
  defaultWorkflow: Partial<Workflow>;
}

export type TemplateCategory =
  | 'welcome'
  | 'leads'
  | 'support'
  | 'sales'
  | 'reengagement'
  | 'notifications'
  | 'routing'
  | 'ads';

// ─────────────────────────────────────────────
// MISC
// ─────────────────────────────────────────────

export interface Variable {
  name: string;
  source: 'trigger' | 'step' | 'contact_field';
  stepId?: string;
}

export interface ValidationError {
  stepId: string;
  message: string;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ConversationSource = 'contact' | 'user' | 'workflow' | 'api' | 'zapier' | 'make' | 'click_to_chat_ads';
export  type ConversationClosedSource = 'user' | 'workflow' | 'bot' | 'api' | 'zapier' | 'make';

export  interface Props {
  trigger: TriggerConfig;
  onChange: (updates: Partial<TriggerConfig>) => void;
}

export interface SP { step: StepConfig; onChange: (d: StepConfig['data']) => void; }



// ── All operators from the docs ────────────────────────────────────────────

export const ALL_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'is_equal_to',            label: 'is equal to' },
  { value: 'is_not_equal_to',        label: 'is not equal to' },
  { value: 'is_greater_than',        label: 'is greater than' },
  { value: 'is_less_than',           label: 'is less than' },
  { value: 'is_between',             label: 'is between' },
  { value: 'exists',                 label: 'exists' },
  { value: 'does_not_exist',         label: 'does not exist' },
  { value: 'contains',               label: 'contains' },
  { value: 'does_not_contain',       label: 'does not contain' },
  { value: 'has_none_of',            label: 'has none of' },
  { value: 'has_all_of',             label: 'has all of' },
  { value: 'has_any_of',             label: 'has any of' },
  { value: 'is_timestamp_after',     label: 'is timestamp after' },
  { value: 'is_timestamp_before',    label: 'is timestamp before' },
  { value: 'is_timestamp_between',   label: 'is timestamp between' },
  { value: 'is_greater_than_time',   label: 'is greater than (time)' },
  { value: 'is_less_than_time',      label: 'is less than (time)' },
  { value: 'is_between_time',        label: 'is between (time)' },
];

// Operators available per category
export const OPERATORS_BY_CAT: Record<BranchCategory, ConditionOperator[]> = {
  contact_field: [
    'is_equal_to','is_not_equal_to','is_greater_than','is_less_than','is_between',
    'exists','does_not_exist','contains','does_not_contain',
    'is_timestamp_after','is_timestamp_before','is_timestamp_between',
  ],
  contact_tags: [
    'has_any_of','has_all_of','has_none_of','exists','does_not_exist',
  ],
  variable: [
    'is_equal_to','is_not_equal_to','is_greater_than','is_less_than',
    'exists','does_not_exist','contains','does_not_contain',
    'is_timestamp_after','is_timestamp_before','is_timestamp_between',
  ],
  assignee_status: [
    'is_equal_to','is_not_equal_to','exists','does_not_exist',
  ],
  last_interacted_channel: [
    'is_equal_to','is_not_equal_to','exists','does_not_exist',
  ],
  last_incoming_message: [
    'contains','does_not_contain','exists','does_not_exist',
  ],
  last_outgoing_message: [
    'contains','does_not_contain','exists','does_not_exist',
  ],
  last_outgoing_message_source: [
    'is_equal_to','is_not_equal_to','exists','does_not_exist',
  ],
  time_since_last_incoming: [
    'is_greater_than_time','is_less_than_time','is_between_time',
    'is_timestamp_after','is_timestamp_before','is_timestamp_between',
  ],
  time_since_last_outgoing: [
    'is_greater_than_time','is_less_than_time','is_between_time',
    'is_timestamp_after','is_timestamp_before','is_timestamp_between',
  ],
};

// Operators that need NO value input
export const NO_VALUE_OPS: ConditionOperator[] = ['exists', 'does_not_exist'];
// Operators that need TWO value inputs
export const BETWEEN_OPS: ConditionOperator[] = ['is_between', 'is_timestamp_between', 'is_between_time'];
// Operators that need a number + unit (time)
export const TIME_OPS: ConditionOperator[] = ['is_greater_than_time', 'is_less_than_time'];

export const TIME_UNITS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours',   label: 'Hours' },
  { value: 'days',    label: 'Days' },
];

export const MOCK_FIELDS  = [{ value: 'first_name', label: 'First Name' }, { value: 'last_name', label: 'Last Name' }, { value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone' }, { value: 'language', label: 'Language' }, { value: 'bot_status', label: 'Bot Status' }, { value: 'custom_1', label: 'Custom Field 1' }];

// ── Categories ─────────────────────────────────────────────────────────────

export const BRANCH_CATS: { value: BranchCategory; label: string }[] = [
  { value: 'contact_field',                label: 'Contact Field' },
  { value: 'contact_tags',                 label: 'Contact Tags' },
  { value: 'variable',                     label: 'Variable' },
  { value: 'assignee_status',              label: 'Assignee Status' },
  { value: 'last_interacted_channel',      label: 'Last Interacted Channel' },
  { value: 'last_incoming_message',        label: 'Last Incoming Message' },
  { value: 'last_outgoing_message',        label: 'Last Outgoing Message' },
  { value: 'last_outgoing_message_source', label: 'Last Outgoing Message Source' },
  { value: 'time_since_last_incoming',     label: 'Time Since Last Incoming' },
  { value: 'time_since_last_outgoing',     label: 'Time Since Last Outgoing' },
];

// Sub-fields per category
export const SUB_FIELDS: Partial<Record<BranchCategory, { value: string; label: string }[]>> = {
  contact_field: [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name',  label: 'Last Name' },
    { value: 'email',      label: 'Email Address' },
    { value: 'phone',      label: 'Phone Number' },
    { value: 'city',       label: 'City' },
    { value: 'country',    label: 'Country' },
    { value: 'language',   label: 'Language' },
  ],
  variable: [
    { value: 'conversation_id',  label: 'conversation_id' },
    { value: 'conversation_at',  label: 'conversation_at' },
    { value: 'last_seen',        label: 'last_seen' },
    { value: 'created_at',       label: 'created_at' },
  ],
};


// ── Tag type ───────────────────────────────────────────────────────────────
export interface Tag {
  id: string;
  name: string;
  color: string;
}

// ── Assignee status options ────────────────────────────────────────────────
export const ASSIGNEE_STATUS_OPTIONS = [
  { value: 'online',  label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'pending', label: 'Pending' },
];

// ── Last outgoing message source options ───────────────────────────────────
export const OUTGOING_SOURCE_OPTIONS = [
  { value: 'agent',      label: 'Agent' },
  { value: 'bot',        label: 'Bot' },
  { value: 'workflow',   label: 'Workflow' },
  { value: 'broadcasts', label: 'Broadcasts' },
  { value: 'api',        label: 'API' },
];


export const TIMEZONES    = [{ value: 'UTC', label: 'UTC' }, { value: 'Asia/Kolkata', label: 'India (IST)' }, { value: 'America/New_York', label: 'New York (ET)' }, { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' }, { value: 'Europe/London', label: 'London (GMT)' }, { value: 'Asia/Dubai', label: 'Dubai (GST)' }, { value: 'Asia/Singapore', label: 'Singapore (SGT)' }];
export const WEEKDAYS     = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
export const OPERATORS    = [{ value: 'is_equal_to', label: 'Is equal to' }, { value: 'is_not_equal_to', label: 'Is not equal to' }, { value: 'is_greater_than', label: 'Is greater than' }, { value: 'is_less_than', label: 'Is less than' }, { value: 'is_between', label: 'Is between' }, { value: 'exists', label: 'Exists' }, { value: 'does_not_exist', label: 'Does not exist' }, { value: 'contains', label: 'Contains' }, { value: 'does_not_contain', label: 'Does not contain' }, { value: 'has_any_of', label: 'Has any of' }, { value: 'has_all_of', label: 'Has all of' }, { value: 'has_none_of', label: 'Has none of' }];
export const HTTP_METHODS = ['GET','POST','PUT','PATCH','DELETE'];
export const genId = () => `id-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

export const VARIABLE_OPTIONS = [
  "contact.first_name",
  "contact.last_name",
  "contact.email",
  "contact.phone",
  "contact.language",
];

export const TRIGGER_FIELDS = [
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name',  label: 'Last Name' },
  { value: 'email',      label: 'Email' },
  { value: 'phone',      label: 'Phone' },
  { value: 'language',   label: 'Language' },
  { value: 'lifecycle',  label: 'Lifecycle Stage' },
  { value: 'bot_status', label: 'Bot Status' },
];


// ── Constants ──────────────────────────────────────────────────────────────

export const CONV_OPEN_SOURCES:   { value: string; label: string }[] = [
  { value: 'contact',           label: 'Contact (inbound)' },
  { value: 'user',              label: 'User (outbound)' },
  { value: 'workflow',          label: 'Workflow' },
  { value: 'api',               label: 'API' },
  { value: 'zapier',            label: 'Zapier' },
  { value: 'make',              label: 'Make' },
  { value: 'click_to_chat_ads', label: 'Click-to-Chat Ads' },
];

export const CONV_CLOSE_SOURCES: { value: string; label: string }[] = [
  { value: 'user',     label: 'User' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'bot',      label: 'Bot' },
  { value: 'api',      label: 'API' },
  { value: 'zapier',   label: 'Zapier' },
  { value: 'make',     label: 'Make' },
];

export const CONV_CLOSE_CATEGORIES: { value: string; label: string }[] = [
  { value: 'general_inquiry', label: 'General Inquiry' },
  { value: 'others',          label: 'Others' },
  { value: 'payment_issue',   label: 'Payment Issue' },
  { value: 'technical',       label: 'Technical' },
  { value: 'billing',         label: 'Billing' },
];

// field definitions per trigger type
// multi: true  → value is string[], operator options include 'has_any_of'
// multi: false → value is string,   operator options are equality-based
export interface FieldDef {
  value: string;
  label: string;
  multi: boolean;
  options: { value: string; label: string }[];
}

export const FIELD_DEFS_BY_TRIGGER: Record<string, FieldDef[]> = {
  conversation_opened: [
    { value: 'source',   label: 'Source',   multi: false, options: CONV_OPEN_SOURCES },
    { value: 'assignee', label: 'Assignee', multi: false, options: [] },
    { value: 'team',     label: 'Team',     multi: false, options: [] },
  ],
  conversation_closed: [
    { value: 'source',   label: 'Source',   multi: false, options: CONV_CLOSE_SOURCES },
    { value: 'category', label: 'Category', multi: true,  options: CONV_CLOSE_CATEGORIES },
    { value: 'assignee', label: 'Assignee', multi: false, options: [] },
  ],
  menu_click: [
    { value: 'payload',   label: 'Menu Payload',  multi: false, options: [] },
    { value: 'title',     label: 'Menu Title',    multi: false, options: [] },
    { value: 'channelId', label: 'Channel ID',    multi: false, options: [] },
  ],
  story_reply: [
    { value: 'storyId',   label: 'Story ID',      multi: false, options: [] },
    { value: 'storyUrl',  label: 'Story URL',     multi: false, options: [] },
    { value: 'text',      label: 'Reply Text',    multi: false, options: [] },
    { value: 'channelId', label: 'Channel ID',    multi: false, options: [] },
  ],
  template_send: [
    { value: 'templateName',     label: 'Template Name',     multi: false, options: [] },
    { value: 'templateLanguage', label: 'Template Language', multi: false, options: [] },
    { value: 'templateCategory', label: 'Template Category', multi: false, options: [] },
    { value: 'templateStatus',   label: 'Template Status',   multi: false, options: [] },
    { value: 'channelId',        label: 'Channel ID',        multi: false, options: [] },
  ],
};

export const SINGLE_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'is_equal_to',     label: 'is equal to' },
  { value: 'is_not_equal_to', label: 'is not equal to' },
];

export const MULTI_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'has_any_of',  label: 'has any of' },
  { value: 'has_none_of', label: 'has none of' },
];




export const FIELD_OPTIONS = [
  { value: 'source',   label: 'Source' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'team',     label: 'Team' },
  { value: 'channel',  label: 'Channel' },
];

export const OPERATOR_OPTIONS: { value: ConditionOperator; label: string }[] = [
  { value: 'is_equal_to',     label: 'is equal to' },
  { value: 'is_not_equal_to', label: 'is not equal to' },
];

export const VALUE_OPTIONS_BY_FIELD: Record<string, { value: string; label: string }[]> = {
  source: CONV_OPEN_SOURCES,
};

// ── 5. Shortcut ───────────────────────────────────────────────────────────────

export const SC_FIELD_TYPES: { value: ShortcutFormField['type']; label: string }[] = [
  { value: 'text', label: 'Text' }, { value: 'list', label: 'List (dropdown)' },
  { value: 'checkbox', label: 'Checkbox' }, { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' }, { value: 'time', label: 'Time' },
  { value: 'phone', label: 'Phone' }, { value: 'email', label: 'Email' }, { value: 'url', label: 'URL' },
];

export type Step = {
  id: string;
  name: string;
  type: string;
  parentId: string;
  data: any;
};

export type InsertCtx = {
  afterNodeId: string;
};
