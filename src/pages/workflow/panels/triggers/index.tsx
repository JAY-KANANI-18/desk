
import {
  
   ShortcutFormField,
  
  Props,
} from '../../workflow.types';
import { Section, InfoBox } from '../PanelShell';

export { ConversationOpenedConfig } from './conversationOpened';
export { ConversationClosedConfig } from './conversationClosed';
export { ContactTagConfig } from './tagUpdated.trigger';
export { ContactFieldConfig } from './contactFieldUpdated';
// export { ShortcutConfig } from './shortcut';
// export { WebhookConfig } from './incomingWebhook';
// export { ClickToChatConfig } from './clickToChatAds';
// export { TikTokAdsConfig } from './tiktokAds';
// export { ManualTriggerConfig } from './manualTrigger';
export { LifecycleConfig } from './lifecycleUpdated.trigger';








// export function ShortcutConfig({ trigger, onChange }: Props) {
//   const data = trigger.data as ShortcutData;
//   const addField = () => onChange({ data: { ...data, formFields: [...data.formFields, { id: `f-${Date.now()}`, label: '', type: 'text', variableName: '', required: false }] } });
//   const updateField = (id: string, u: Partial<ShortcutFormField>) =>
//     onChange({ data: { ...data, formFields: data.formFields.map((f) => f.id === id ? { ...f, ...u } : f) } });
//   const removeField = (id: string) =>
//     onChange({ data: { ...data, formFields: data.formFields.filter((f) => f.id !== id) } });

//   return (
//     <>
//       <Section title="Identity">
//         <Field label="Name" required>
//           <TextInput value={data.name} onChange={(v) => onChange({ data: { ...data, name: v } })} placeholder="e.g. Issue Escalation" />
//         </Field>
//         <Field label="Description">
//           <TextInput value={data.description} onChange={(v) => onChange({ data: { ...data, description: v } })} placeholder="When to use this shortcut" />
//         </Field>
//       </Section>
//       <Section title="Shortcut Form" collapsible defaultOpen={false}>
//         <InfoBox>Fields shown to agents before the workflow launches. Values saved as $variables.</InfoBox>
//         <div className="mt-3 space-y-3">
//           {data.formFields.map((field, idx) => (
//             <div key={field.id} className="border border-gray-100 rounded-md p-3 space-y-2">
//               <div className="flex items-center justify-between">
//                 <span className="text-xs text-gray-400">Field {idx + 1}</span>
//                 <button onClick={() => removeField(field.id)} className="p-1 hover:bg-gray-100 rounded">
//                   <Trash2 size={12} className="text-gray-400" />
//                 </button>
//               </div>
//               <TextInput value={field.label} onChange={(v) => updateField(field.id, { label: v })} placeholder="Label (e.g. Order ID)" />
//               <Select value={field.type} onChange={(v) => updateField(field.id, { type: v as ShortcutFormField['type'] })} options={SC_FIELD_TYPES} />
//               <TextInput value={field.variableName} onChange={(v) => updateField(field.id, { variableName: v })} placeholder="Variable name (e.g. order_id)" />
//               <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
//                 <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })} className="rounded" />
//                 Required
//               </label>
//             </div>
//           ))}
//           <button onClick={addField} className="w-full py-2 border border-dashed border-gray-200 rounded-md text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5">
//             <Plus size={12} /> Add Form Field
//           </button>
//         </div>
//       </Section>
//     </>
//   );
// }

// ── 6. Incoming Webhook ───────────────────────────────────────────────────────

// export function WebhookConfig({ trigger, onChange }: Props) {
//   const data = trigger.data as IncomingWebhookData;
//   const addVar = () => {
//     if (data.variables.length >= 10) return;
//     onChange({ data: { ...data, variables: [...data.variables, { id: `v-${Date.now()}`, jsonKey: '', variableName: '' }] } });
//   };
//   const updateVar = (id: string, u: Partial<WebhookVariable>) =>
//     onChange({ data: { ...data, variables: data.variables.map((v) => v.id === id ? { ...v, ...u } : v) } });
//   const removeVar = (id: string) =>
//     onChange({ data: { ...data, variables: data.variables.filter((v) => v.id !== id) } });

//   return (
//     <>
//       <Section title="Webhook URL">
//         <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-md px-3 py-2">
//           <code className="flex-1 text-xs text-gray-600 break-all">{data.webhookUrl}</code>
//           <button onClick={() => navigator.clipboard.writeText(data.webhookUrl)} className="p-1 hover:bg-gray-200 rounded flex-shrink-0">
//             <Copy size={12} className="text-gray-400" />
//           </button>
//         </div>
//         <p className="text-xs text-gray-400 mt-1.5">Send HTTP POST requests with JSON body to this URL.</p>
//       </Section>
//       <Section title="Contact Identifier">
//         <Field label="Type" required>
//           <Select value={data.contactIdentifierType}
//             onChange={(v) => onChange({ data: { ...data, contactIdentifierType: v as IncomingWebhookData['contactIdentifierType'] } })}
//             options={[{ value: 'contact_id', label: 'Contact ID' }, { value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone Number' }]} />
//         </Field>
//         <Field label="JSON Key" required hint="e.g. $.phone or $.custom_fields.email">
//           <TextInput value={data.contactIdentifierJsonKey} onChange={(v) => onChange({ data: { ...data, contactIdentifierJsonKey: v } })} placeholder="$.phone" />
//         </Field>
//       </Section>
//       <Section title="Variables" collapsible defaultOpen={false}>
//         <InfoBox>Save payload values as variables. Max 10.</InfoBox>
//         <div className="mt-3 space-y-2">
//           {data.variables.map((v) => (
//             <div key={v.id} className="flex items-center gap-2">
//               <TextInput value={v.jsonKey} onChange={(val) => updateVar(v.id, { jsonKey: val })} placeholder="$.name" className="flex-1" />
//               <span className="text-gray-300 text-xs flex-shrink-0">→</span>
//               <TextInput value={v.variableName} onChange={(val) => updateVar(v.id, { variableName: val })} placeholder="variable" className="flex-1" />
//               <button onClick={() => removeVar(v.id)} className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
//                 <X size={12} className="text-gray-400" />
//               </button>
//             </div>
//           ))}
//           {data.variables.length < 10 && (
//             <button onClick={addVar} className="w-full py-2 border border-dashed border-gray-200 rounded-md text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5">
//               <Plus size={12} /> Add Variable
//             </button>
//           )}
//         </div>
//       </Section>
//     </>
//   );
// }

// ── 7. Click-to-Chat Ads ──────────────────────────────────────────────────────

// export function ClickToChatConfig({ trigger, onChange }: Props) {
//   const data = trigger.data as ClickToChatAdsData;
//   return (
//     <Section title="Configuration">
//       <InfoBox>Supported: WhatsApp API, WhatsApp Cloud, Instagram, Facebook Messenger.</InfoBox>
//       <div className="mt-3 space-y-3">
//         <Field label="Facebook Ad Account">
//           <TextInput value={data.facebookAccountId} onChange={(v) => onChange({ data: { ...data, facebookAccountId: v } })} placeholder="Connect Facebook account first" disabled />
//         </Field>
//         <Field label="Ad Selection">
//           <div className="flex gap-2">
//             {(['all', 'selected'] as const).map((m) => (
//               <button key={m} onClick={() => onChange({ data: { ...data, adSelection: m } })}
//                 className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${m === data.adSelection ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
//                 {m === 'all' ? 'All Ads' : 'Selected Ads'}
//               </button>
//             ))}
//           </div>
//         </Field>
//       </div>
//     </Section>
//   );
// }

// ── 8. TikTok Ads ─────────────────────────────────────────────────────────────

// export function TikTokAdsConfig({ trigger, onChange }: Props) {
//   const data = trigger.data as TikTokAdsData;
//   return (
//     <Section title="Configuration">
//       <InfoBox>Connect your TikTok Ads account in Integrations first.</InfoBox>
//       <div className="mt-3 space-y-3">
//         <Field label="TikTok Ad Account">
//           <TextInput value={data.adAccountId} onChange={(v) => onChange({ data: { ...data, adAccountId: v } })} placeholder="Connect TikTok Ads account first" disabled />
//         </Field>
//         <Field label="Ad Selection">
//           <div className="flex gap-2">
//             {(['all', 'selected'] as const).map((m) => (
//               <button key={m} onClick={() => onChange({ data: { ...data, adSelection: m } })}
//                 className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${m === data.adSelection ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
//                 {m === 'all' ? 'All Ads' : 'Selected Ads'}
//               </button>
//             ))}
//           </div>
//         </Field>
//       </div>
//     </Section>
//   );
// }

// ── 9. Manual Trigger ─────────────────────────────────────────────────────────

export function ManualTriggerConfig() {
  return (
    <Section title="How It Works">
      <InfoBox>This trigger only fires when the "Trigger Another Workflow" step in another workflow points here.</InfoBox>
      <div className="mt-3 text-xs text-gray-500 space-y-1.5 bg-gray-50 rounded-md p-3">
        <p>1. Build this workflow with steps.</p>
        <p>2. In another workflow, add a <strong className="text-gray-700">Trigger Another Workflow</strong> step.</p>
        <p>3. Select this workflow as the target.</p>
      </div>
    </Section>
  );
}
