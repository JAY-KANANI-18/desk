import { Props } from '../../workflow.types';
import { InfoBox, Section } from '../PanelShell';
import { ConditionBuilder } from './conversationClosed';

const TRIGGER_COPY = {
  menu_click: {
    title: 'Messenger Menu Click',
    body: 'Runs when a saved Messenger persistent menu action is tapped. Use conditions to match a payload, title, or a specific channel.',
    triggerType: 'menu_click',
    fields: ['payload', 'title', 'channelId'],
  },
  story_reply: {
    title: 'Instagram Story Reply',
    body: 'Runs when the story reply automation processes an inbound story response and sends the follow-up through the normal conversation pipeline.',
    triggerType: 'story_reply',
    fields: ['storyId', 'storyUrl', 'text', 'channelId'],
  },
  template_send: {
    title: 'Template Send',
    body: 'Runs whenever a template message is sent and logged through the outbound pipeline. Use this for follow-up workflows or channel-specific tracking.',
    triggerType: 'template_send',
    fields: [
      'templateName',
      'templateLanguage',
      'templateCategory',
      'templateStatus',
      'channelId',
    ],
  },
} as const;

function AutomationTriggerConfig({
  trigger,
  onChange,
  kind,
}: Props & { kind: keyof typeof TRIGGER_COPY }) {
  const copy = TRIGGER_COPY[kind];

  return (
    <>
      <Section title={copy.title}>
        <InfoBox>{copy.body}</InfoBox>
        <div className="mt-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
          Available trigger fields: {copy.fields.join(', ')}
        </div>
      </Section>

      <ConditionBuilder
        triggerType={copy.triggerType}
        conditions={trigger.conditions}
        onChange={(conditions) => onChange({ conditions })}
      />
    </>
  );
}

export function MenuClickTriggerConfig(props: Props) {
  return <AutomationTriggerConfig {...props} kind="menu_click" />;
}

export function StoryReplyTriggerConfig(props: Props) {
  return <AutomationTriggerConfig {...props} kind="story_reply" />;
}

export function TemplateSendTriggerConfig(props: Props) {
  return <AutomationTriggerConfig {...props} kind="template_send" />;
}
