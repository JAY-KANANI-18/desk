import React from 'react';
import { TriggerConfig, TriggerType } from '../workflow.types';
import { TRIGGER_LIST, TRIGGER_META } from '../canvas/triggerTypes';
import { PanelShell, Section, ToggleRow } from './PanelShell';
import { useWorkflow } from '../WorkflowContext';
import { CompactSelectMenu } from '../../../components/ui/select/CompactSelectMenu';
import {
  ContactFieldConfig,
  ContactTagConfig,
  ConversationClosedConfig,
  ConversationOpenedConfig,
  LifecycleConfig,
  ManualTriggerConfig,
  MenuClickTriggerConfig,
  StoryReplyTriggerConfig,
  TemplateSendTriggerConfig,
} from './triggers';

interface TriggerPanelProps {
  hideHeader?: boolean;
}

export function TriggerPanel({ hideHeader = false }: TriggerPanelProps) {
  const { state, setTrigger, selectNode } = useWorkflow();
  const trigger = state.workflow?.config?.trigger ?? null;

  const handleSelectType = (type: TriggerType) => {
    setTrigger({
      type,
      conditions: [],
      advancedSettings: { triggerOncePerContact: false },
      data: getDefaultData(type),
    });
  };

  const handleUpdate = (updates: Partial<TriggerConfig>) => {
    if (!trigger) return;
    setTrigger({ ...trigger, ...updates });
  };

  const selectedMeta = trigger ? TRIGGER_META[trigger.type] : null;
  const SelectedIcon = selectedMeta?.Icon;
  const triggerOptions = TRIGGER_LIST.map((item) => {
    const { Icon } = item;

    return {
      value: item.type,
      label: item.label,
      description: item.upgradeRequired ? `${item.description} / Upgrade` : item.description,
      leading: (
        <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100">
          <Icon size={13} className="text-gray-600" />
        </span>
      ),
      searchText: `${item.label} ${item.description}`,
    };
  });

  return (
    <PanelShell
      title="Trigger"
      subtitle="Choose the event that starts this workflow"
      onClose={() => selectNode(null, null)}
      hideHeader={hideHeader}
    >
      <div className="border-b border-gray-100 px-4 py-3">
        <label className="mb-1.5 block text-xs font-medium text-gray-500">
          Trigger type
        </label>

        <CompactSelectMenu
          value={trigger?.type}
          groups={[{ options: triggerOptions }]}
          onChange={(value) => handleSelectType(value as TriggerType)}
          placeholder="Select a trigger..."
          fullWidth
          size="md"
          triggerAppearance="field"
          dropdownWidth="trigger"
          searchable
          searchPlaceholder="Search triggers..."
          triggerContent={
            <span className="flex min-w-0 items-center gap-2.5">
              {SelectedIcon ? (
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-100">
                  <SelectedIcon size={13} className="text-gray-600" />
                </span>
              ) : null}
              <span className={`min-w-0 flex-1 truncate text-sm ${trigger ? 'font-medium text-gray-800' : 'text-gray-400'}`}>
                {selectedMeta?.label ?? 'Select a trigger...'}
              </span>
            </span>
          }
        />
      </div>

      {trigger ? (
        <>
          {trigger.type === 'conversation_opened' && <ConversationOpenedConfig trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'conversation_closed' && <ConversationClosedConfig trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'contact_tag_updated' && <ContactTagConfig trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'contact_field_updated' && <ContactFieldConfig trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'menu_click' && <MenuClickTriggerConfig trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'story_reply' && <StoryReplyTriggerConfig trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'template_send' && <TemplateSendTriggerConfig trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'manual_trigger' && <ManualTriggerConfig trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'lifecycle_updated' && <LifecycleConfig trigger={trigger} onChange={handleUpdate} />}
        </>
      ) : null}

      {trigger?.type !== 'manual_trigger' ? (
        <Section title="Advanced Settings" collapsible defaultOpen={false}>
          <ToggleRow
            label="Trigger once per contact"
            description="Each contact can only enter this workflow once, ever"
            checked={trigger?.advancedSettings.triggerOncePerContact ?? false}
            onChange={(value) =>
              handleUpdate({
                advancedSettings: {
                  ...trigger!.advancedSettings,
                  triggerOncePerContact: value,
                },
              })
            }
          />
        </Section>
      ) : null}
    </PanelShell>
  );
}

function getDefaultData(type: TriggerType): TriggerConfig['data'] {
  switch (type) {
    case 'conversation_opened': return { sources: [] };
    case 'conversation_closed': return { sources: [], categories: [] };
    case 'contact_tag_updated': return { action: 'added', tags: [] };
    case 'contact_field_updated': return { fieldId: '', fieldName: '' };
    case 'menu_click': return {};
    case 'story_reply': return {};
    case 'template_send': return {};
    case 'shortcut': return { icon: 'zap', name: '', description: '', formFields: [] };
    case 'manual_trigger': return {};
    case 'lifecycle_updated': return { stageSelection: 'all', stages: [], triggerWhenCleared: false };
    default: return {};
  }
}
