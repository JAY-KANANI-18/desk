// All 17 step configuration components — clean minimal UI
import React, { useState } from 'react';
import { Plus, Trash2, Copy, ChevronDown, ChevronUp, X } from 'lucide-react';
import {
  StepConfig, SendMessageData, AskQuestionData, AssignToData,
  BranchData, UpdateContactTagData, CloseConversationData, AddCommentData,
  JumpToData, WaitData, TriggerAnotherWorkflowData, DateTimeData,
  HttpRequestData, AddGoogleSheetsRowData, SendConversionsApiEventData,
  SendTikTokLowerFunnelEventData, BranchCase, BranchCondition,
  HttpHeader, HttpResponseMapping, GoogleSheetsColumn, QuestionType,
  SP,
  genId,
  HTTP_METHODS,
  TIMEZONES,
  WEEKDAYS,
} from '../../workflow.types';
import { Section, Field, ToggleRow, Select, TextInput, Textarea, TagInput, InfoBox, DurationInput } from '../PanelShell';
import { useWorkflow } from '../../WorkflowContext';

// ─── Mock data ────────────────────────────────────────────────────────────────



export { SendMessageConfig } from './sendMessageConfig';
export { AskQuestionConfig } from './askQuestionConfig';
export { AssignToConfig } from './assignToConfig';
export { BranchConfig } from './branchConfig';
export { UpdateContactTagConfig } from './updateContactTagConfig';
export { UpdateContactFieldConfig } from './updateContactFieldConfig';
export { OpenConversationConfig } from './openConversationConfig';
export { CloseConversationConfig } from './CloseConversationConfig';
export { AddCommentConfig } from './addCommentConfig';

export { JumpToConfig } from './jumpToConfig';
export { TriggerAnotherWorkflowConfig } from './triggerAnotherWorkflowConfig';



// ─── 11. Wait ─────────────────────────────────────────────────────────────────

export function WaitConfig({ step, onChange }: SP) {
  const data = step.data as WaitData;
  const u = (p: Partial<WaitData>) => onChange({ ...data, ...p });
  return (
    <Section title="Configuration">
      <Field label="Wait Duration" required hint="Maximum 7 days. Total workflow execution cannot exceed 7 days.">
        <DurationInput value={data.value} unit={data.unit} onValueChange={(v) => u({ value: v })} onUnitChange={(u2) => u({ unit: u2 })} max={data.unit === 'days' ? 7 : undefined} />
      </Field>
      <InfoBox type="warning">If the total workflow run time reaches 7 days, the workflow ends automatically.</InfoBox>
    </Section>
  );
}


// ─── 13. Date & Time ──────────────────────────────────────────────────────────

export function DateTimeConfig({ step, onChange }: SP) {
  const data = step.data as DateTimeData;
  const u = (p: Partial<DateTimeData>) => onChange({ ...data, ...p });
  const toggleDay = (day: string) => { const cur = data.businessHours?.[day] ?? { enabled: false, startTime: '09:00', endTime: '18:00' }; u({ businessHours: { ...data.businessHours, [day]: { ...cur, enabled: !cur.enabled } } }); };
  const updateDay = (day: string, f: 'startTime' | 'endTime', val: string) => { const cur = data.businessHours?.[day] ?? { enabled: true, startTime: '09:00', endTime: '18:00' }; u({ businessHours: { ...data.businessHours, [day]: { ...cur, [f]: val } } }); };
  return (
    <>
      <Section title="Timezone">
        <Select value={data.timezone} onChange={(v) => u({ timezone: v })} options={TIMEZONES} />
      </Section>
      <Section title="Mode">
        <div className="flex gap-2 mb-3">
          {(['business_hours','date_range'] as const).map((m) => (
            <button key={m} onClick={() => u({ mode: m })}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${data.mode === m ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
              {m === 'business_hours' ? 'Business Hours' : 'Date Range'}
            </button>
          ))}
        </div>
        {data.mode === 'business_hours' && (
          <div className="space-y-2">
            {WEEKDAYS.map((day) => {
              const bh = data.businessHours?.[day];
              const enabled = bh?.enabled ?? false;
              return (
                <div key={day} className="flex items-center gap-2">
                  <label className="flex items-center gap-2 w-28 cursor-pointer">
                    <input type="checkbox" checked={enabled} onChange={() => toggleDay(day)} className="rounded" />
                    <span className="text-xs capitalize text-gray-700">{day}</span>
                  </label>
                  {enabled ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input type="time" value={bh?.startTime ?? '09:00'} onChange={(e) => updateDay(day,'startTime',e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                      <span className="text-gray-300 text-xs">–</span>
                      <input type="time" value={bh?.endTime ?? '18:00'} onChange={(e) => updateDay(day,'endTime',e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                    </div>
                  ) : <span className="text-xs text-gray-300">Closed</span>}
                </div>
              );
            })}
          </div>
        )}
        {data.mode === 'date_range' && (
          <div className="space-y-3">
            <Field label="Start Date"><TextInput type="date" value={data.dateRangeStart ?? ''} onChange={(v) => u({ dateRangeStart: v })} /></Field>
            <Field label="End Date"><TextInput type="date" value={data.dateRangeEnd ?? ''} onChange={(v) => u({ dateRangeEnd: v })} /></Field>
          </div>
        )}
      </Section>
      <InfoBox>Contacts outside set hours/range go to the Failure Branch.</InfoBox>
    </>
  );
}

// ─── 14. HTTP Request ─────────────────────────────────────────────────────────

export function HttpRequestConfig({ step, onChange }: SP) {
  const data = step.data as HttpRequestData;
  const u = (p: Partial<HttpRequestData>) => onChange({ ...data, ...p });
  const addHeader = () => { if (data.headers.length < 10) u({ headers: [...data.headers, { id: genId(), key: '', value: '' }] }); };
  const updHeader = (id: string, f: 'key'|'value', val: string) => u({ headers: data.headers.map((h) => h.id === id ? { ...h, [f]: val } : h) });
  const delHeader = (id: string) => u({ headers: data.headers.filter((h) => h.id !== id) });
  const addMap = () => { if (data.responseMappings.length < 10) u({ responseMappings: [...data.responseMappings, { id: genId(), jsonKey: '', variableName: '' }] }); };
  const updMap = (id: string, f: 'jsonKey'|'variableName', val: string) => u({ responseMappings: data.responseMappings.map((m) => m.id === id ? { ...m, [f]: val } : m) });
  const delMap = (id: string) => u({ responseMappings: data.responseMappings.filter((m) => m.id !== id) });
  return (
    <>
      <Section title="Request">
        <Field label="Method" required>
          <div className="flex gap-1 flex-wrap">
            {HTTP_METHODS.map((m) => (
              <button key={m} onClick={() => u({ method: m as HttpRequestData['method'] })}
                className={`px-2.5 py-1.5 text-xs font-mono font-medium rounded-md border transition-colors ${data.method === m ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                {m}
              </button>
            ))}
          </div>
        </Field>
        <Field label="URL" required hint="Include http:// or https://. Supports $variables.">
          <TextInput value={data.url} onChange={(v) => u({ url: v })} placeholder="https://api.example.com/endpoint" />
        </Field>
        {['POST','PUT','PATCH'].includes(data.method) && (
          <>
            <Field label="Content-Type">
              <Select value={data.contentType ?? 'application/json'} onChange={(v) => u({ contentType: v })}
                options={[{ value: 'application/json', label: 'application/json' }, { value: 'application/x-www-form-urlencoded', label: 'form-urlencoded' }, { value: 'text/plain', label: 'text/plain' }]} />
            </Field>
            <Field label="Body">
              <Textarea value={data.body ?? ''} onChange={(v) => u({ body: v })} placeholder='{"key": "value"}' rows={4} />
            </Field>
          </>
        )}
      </Section>
      <Section title={`Headers (${data.headers.length}/10)`} collapsible defaultOpen={data.headers.length > 0}>
        <div className="space-y-2">
          {data.headers.map((h) => (
            <div key={h.id} className="flex gap-2 items-center">
              <TextInput value={h.key}   onChange={(v) => updHeader(h.id,'key',v)}   placeholder="Name"  className="flex-1" />
              <TextInput value={h.value} onChange={(v) => updHeader(h.id,'value',v)} placeholder="Value" className="flex-1" />
              <button onClick={() => delHeader(h.id)} className="p-1 hover:bg-gray-100 rounded flex-shrink-0"><X size={12} className="text-gray-400" /></button>
            </div>
          ))}
          {data.headers.length < 10 && (
            <button onClick={addHeader} className="w-full py-2 border border-dashed border-gray-200 rounded-md text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5">
              <Plus size={12} /> Add Header
            </button>
          )}
        </div>
      </Section>
      <Section title={`Response Mapping (${data.responseMappings.length}/10)`} collapsible defaultOpen={data.responseMappings.length > 0}>
        <InfoBox>Map JSON response keys to variables. Use $.field syntax.</InfoBox>
        <div className="mt-3 space-y-2">
          {data.responseMappings.map((m) => (
            <div key={m.id} className="flex gap-2 items-center">
              <TextInput value={m.jsonKey}       onChange={(v) => updMap(m.id,'jsonKey',v)}       placeholder="$.phone"     className="flex-1" />
              <span className="text-gray-300 text-xs flex-shrink-0">→ $</span>
              <TextInput value={m.variableName}  onChange={(v) => updMap(m.id,'variableName',v)}  placeholder="variable"    className="flex-1" />
              <button onClick={() => delMap(m.id)} className="p-1 hover:bg-gray-100 rounded flex-shrink-0"><X size={12} className="text-gray-400" /></button>
            </div>
          ))}
          {data.responseMappings.length < 10 && (
            <button onClick={addMap} className="w-full py-2 border border-dashed border-gray-200 rounded-md text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5">
              <Plus size={12} /> Add Mapping
            </button>
          )}
        </div>
      </Section>
      <Section title="Response Status" collapsible defaultOpen={false}>
        <ToggleRow label="Save response status as variable" description="Saves HTTP status code (e.g. 200, 404)" checked={data.saveResponseStatus} onChange={(v) => u({ saveResponseStatus: v })} />
        {data.saveResponseStatus && <div className="mt-2"><TextInput value={data.responseStatusVariableName ?? ''} onChange={(v) => u({ responseStatusVariableName: v })} placeholder="e.g. api_status_code" /></div>}
      </Section>
    </>
  );
}

// // ─── 15. Google Sheets ────────────────────────────────────────────────────────

// export function GoogleSheetsConfig({ step, onChange }: SP) {
//   const data = step.data as AddGoogleSheetsRowData;
//   const u = (p: Partial<AddGoogleSheetsRowData>) => onChange({ ...data, ...p });
//   const addCol = () => u({ columns: [...data.columns, { id: genId(), columnName: '', value: '' }] });
//   const updCol = (id: string, f: 'columnName'|'value', val: string) => u({ columns: data.columns.map((c) => c.id === id ? { ...c, [f]: val } : c) });
//   const delCol = (id: string) => u({ columns: data.columns.filter((c) => c.id !== id) });
//   return (
//     <>
//       <Section title="Connection">
//         <Field label="Google Account">
//           <button className="w-full py-2 border border-dashed border-gray-200 rounded-md text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5">
//             <Plus size={12} /> Connect Google Account
//           </button>
//         </Field>
//         <Field label="Spreadsheet"><TextInput value={data.spreadsheetId ?? ''} onChange={(v) => u({ spreadsheetId: v })} placeholder="Select spreadsheet..." disabled={!data.googleAccountId} /></Field>
//         <Field label="Sheet Tab"><TextInput value={data.sheetName ?? ''} onChange={(v) => u({ sheetName: v })} placeholder="Sheet name..." disabled={!data.spreadsheetId} /></Field>
//       </Section>
//       <Section title="Columns">
//         <div className="space-y-2">
//           {data.columns.map((col) => (
//             <div key={col.id} className="flex gap-2 items-center">
//               <TextInput value={col.columnName} onChange={(v) => updCol(col.id,'columnName',v)} placeholder="Column name" className="flex-1" />
//               <TextInput value={col.value}      onChange={(v) => updCol(col.id,'value',v)}      placeholder="Value or $variable" className="flex-1" />
//               <button onClick={() => delCol(col.id)} className="p-1 hover:bg-gray-100 rounded flex-shrink-0"><Trash2 size={12} className="text-gray-400" /></button>
//             </div>
//           ))}
//           <button onClick={addCol} className="w-full py-2 border border-dashed border-gray-200 rounded-md text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5">
//             <Plus size={12} /> Add Column
//           </button>
//         </div>
//       </Section>
//     </>
//   );
// }

// // ─── 16. Conversions API Event ────────────────────────────────────────────────

// export function ConversionsApiConfig({ step, onChange }: SP) {
//   const data = step.data as SendConversionsApiEventData;
//   const u = (p: Partial<SendConversionsApiEventData>) => onChange({ ...data, ...p });
//   return (
//     <Section title="Configuration">
//       <InfoBox>Sends a conversion event to Meta. Use after contact converts from a Meta ad.</InfoBox>
//       <div className="mt-3 space-y-3">
//         <Field label="Event Name" required hint="e.g. Lead, Purchase, CompleteRegistration">
//           <TextInput value={data.eventName} onChange={(v) => u({ eventName: v })} placeholder="e.g. Lead" />
//         </Field>
//         <Field label="Meta Pixel ID">
//           <TextInput value={data.pixelId ?? ''} onChange={(v) => u({ pixelId: v })} placeholder="Pixel ID" />
//         </Field>
//       </div>
//     </Section>
//   );
// }

// // ─── 17. TikTok Lower Funnel Event ────────────────────────────────────────────

// export function TikTokEventConfig({ step, onChange }: SP) {
//   const data = step.data as SendTikTokLowerFunnelEventData;
//   const u = (p: Partial<SendTikTokLowerFunnelEventData>) => onChange({ ...data, ...p });
//   return (
//     <Section title="Configuration">
//       <InfoBox>Reports a lower-funnel event to TikTok. Helps TikTok optimize ad delivery.</InfoBox>
//       <div className="mt-3 space-y-3">
//         <Field label="Event Type" required>
//           <Select value={data.eventType} onChange={(v) => u({ eventType: v })} placeholder="Select event type..."
//             options={[{ value: 'SubmitForm', label: 'Submit Form' }, { value: 'Purchase', label: 'Purchase' }, { value: 'Subscribe', label: 'Subscribe' }, { value: 'Contact', label: 'Contact' }, { value: 'Download', label: 'Download' }]} />
//         </Field>
//         <Field label="TikTok Ad Account ID">
//           <TextInput value={data.adAccountId ?? ''} onChange={(v) => u({ adAccountId: v })} placeholder="Ad Account ID" />
//         </Field>
//       </div>
//     </Section>
//   );
// }