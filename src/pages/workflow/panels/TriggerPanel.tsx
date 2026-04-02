import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { TriggerType, TriggerConfig } from '../workflow.types';
import { TRIGGER_LIST, TRIGGER_META } from '../canvas/triggerTypes';
import { PanelShell, Section, ToggleRow } from './PanelShell';
import { useWorkflow } from '../WorkflowContext';
import {
  ConversationOpenedConfig, ConversationClosedConfig, ContactTagConfig,
  ContactFieldConfig, 
  // ShortcutConfig, WebhookConfig, ClickToChatConfig,
  // TikTokAdsConfig, 
  ManualTriggerConfig, LifecycleConfig,
} from './triggers';

export function TriggerPanel() {
  const { state, setTrigger, selectNode } = useWorkflow();
  const trigger = state.workflow?.config?.trigger ?? null;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectType = (type: TriggerType) => {
    setTrigger({
      type,
      conditions: [],
      advancedSettings: { triggerOncePerContact: false },
      data: getDefaultData(type),
    });
    setDropdownOpen(false);
  };

  const handleUpdate = (updates: Partial<TriggerConfig>) => {
    if (!trigger) return;
    setTrigger({ ...trigger, ...updates });
  };

  const selectedMeta = trigger ? TRIGGER_META[trigger.type] : null;
  const SelectedIcon = selectedMeta?.Icon;

  return (
    <PanelShell
      title="Trigger"
      subtitle="Choose the event that starts this workflow"
      onClose={() => selectNode(null, null)}
    >
      {/* ── Dropdown selector ── */}
      <div className="px-4 py-3 border-b border-gray-100">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          Trigger type
        </label>

        <div className="relative" ref={dropdownRef}>
          {/* Trigger button */}
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors text-left"
          >
            {SelectedIcon && (
              <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                <SelectedIcon size={13} className="text-gray-600" />
              </div>
            )}
            <span className={`flex-1 text-sm ${trigger ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              {selectedMeta?.label ?? 'Select a trigger…'}
            </span>
            <ChevronDown
              size={14}
              className={`text-gray-400 flex-shrink-0 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              <div className="max-h-72 overflow-y-auto py-1">
                {TRIGGER_LIST.map((t) => {
                  const { Icon } = t;
                  const isSelected = trigger?.type === t.type;
                  return (
                    <button
                      key={t.type}
                      onClick={() => handleSelectType(t.type)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left ${
                        isSelected ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon size={13} className="text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800">{t.label}</p>
                          {t.upgradeRequired && (
                            <span className="text-[10px] border border-gray-200 text-gray-400 px-1.5 py-0.5 rounded font-medium">
                              Upgrade
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{t.description}</p>
                      </div>
                      {isSelected && <Check size={13} className="text-gray-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Type-specific config (shown below dropdown) ── */}
      {trigger && (
        <>
          {trigger.type === 'conversation_opened'   && <ConversationOpenedConfig trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'conversation_closed'   && <ConversationClosedConfig  trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'contact_tag_updated'   && <ContactTagConfig          trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'contact_field_updated' && <ContactFieldConfig        trigger={trigger} onChange={handleUpdate} />}
          {/* {trigger.type === 'shortcut'              && <ShortcutConfig            trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'incoming_webhook'      && <WebhookConfig             trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'click_to_chat_ads'     && <ClickToChatConfig         trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'tiktok_messaging_ads'  && <TikTokAdsConfig           trigger={trigger} onChange={handleUpdate} />} */}
          {trigger.type === 'manual_trigger'        && <ManualTriggerConfig       trigger={trigger} onChange={handleUpdate} />}
          {trigger.type === 'lifecycle_updated'     && <LifecycleConfig           trigger={trigger} onChange={handleUpdate} />}
        </>
      )}

      {/* ── Advanced settings ── */}
      {trigger?.type !== 'manual_trigger' && (
        <Section title="Advanced Settings" collapsible defaultOpen={false}>
          <ToggleRow
            label="Trigger once per contact"
            description="Each contact can only enter this workflow once, ever"
            checked={trigger?.advancedSettings.triggerOncePerContact ?? false}
            onChange={(v) =>
              handleUpdate({ advancedSettings: { ...trigger!.advancedSettings, triggerOncePerContact: v } })
            }
          />
        </Section>
      )}
    </PanelShell>
  );
}

function getDefaultData(type: TriggerType): TriggerConfig['data'] {
  switch (type) {
    case 'conversation_opened':   return { sources: [] };
    case 'conversation_closed':   return { sources: [], categories: [] };
    case 'contact_tag_updated':   return { action: 'added', tags: [] };
    case 'contact_field_updated': return { fieldId: '', fieldName: '' };
    case 'shortcut':              return { icon: 'zap', name: '', description: '', formFields: [] };
    // case 'incoming_webhook':      return { webhookUrl: `https://app.yourapp.io/webhook/${Math.random().toString(36).slice(2)}`, contactIdentifierType: 'phone', contactIdentifierJsonKey: '', variables: [] };
    // case 'click_to_chat_ads':     return { facebookAccountId: '', adSelection: 'all', selectedAdIds: [] };
    // case 'tiktok_messaging_ads':  return { adAccountId: '', adSelection: 'all', selectedAdIds: [] };
    case 'manual_trigger':        return {};
    case 'lifecycle_updated':     return { stageSelection: 'all', stages: [], triggerWhenCleared: false };
    default:                      return {};
  }
}