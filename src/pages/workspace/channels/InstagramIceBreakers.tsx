// src/pages/workspace/channels/InstagramIceBreakers.tsx
import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Trash2, Save, Loader, AlertCircle, Info, Check, GripVertical } from 'lucide-react';
import { ChannelApi, IceBreakerItem } from '../../../lib/channelApi';
import { ConnectedChannel, useSave, SaveButton } from '../../channels/ManageChannelPage';
import { useWorkspace } from '../../../context/WorkspaceContext';

const MAX_ICEBREAKERS = 4;
const MAX_QUESTION_LEN = 80;
const MAX_PAYLOAD_LEN  = 1000;

export const InstagramIceBreakersSection = ({ channel }: { channel: ConnectedChannel }) => {
  const { workspace } = useWorkspace();
  const { saving, saved, error: saveError, save } = useSave();

  const [items,    setItems]   = useState<IceBreakerItem[]>([]);
  const [loading,  setLoading] = useState(true);
  const [syncing,  setSyncing] = useState(false);
  const [syncMsg,  setSyncMsg] = useState<string | null>(null);
  const [loadErr,  setLoadErr] = useState<string | null>(null);
  const [dirty,    setDirty]   = useState(false);

  const wid = workspace?.id ?? '';

  const load = async () => {
    setLoading(true);
    setLoadErr(null);
    const r = await ChannelApi.listIceBreakers(String(channel.id), wid);
    setLoading(false);
    if (r.success) { setItems(r.data ?? []); setDirty(false); }
    else setLoadErr(r.error ?? 'Failed to load ice-breakers');
  };

  useEffect(() => { load(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    const r = await ChannelApi.syncIceBreakers(String(channel.id), wid);
    setSyncing(false);
    if (r.success) {
      setSyncMsg(`Synced ${r.data?.synced ?? 0} ice-breakers`);
      load();
      setTimeout(() => setSyncMsg(null), 3500);
    } else {
      setLoadErr(r.error ?? 'Sync failed');
    }
  };

  const addItem = () => {
    if (items.length >= MAX_ICEBREAKERS) return;
    setItems(p => [...p, { question: '', payload: '' }]);
    setDirty(true);
  };

  const updateItem = (i: number, field: keyof IceBreakerItem, value: string) => {
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
    setDirty(true);
  };

  const removeItem = (i: number) => {
    setItems(p => p.filter((_, idx) => idx !== i));
    setDirty(true);
  };

  const handleSave = () =>
    save(async () => {
      const invalid = items.some(it => !it.question.trim());
      if (invalid) return { success: false, error: 'All ice-breakers must have a question' };
      return ChannelApi.pushIceBreakers(String(channel.id), wid, items);
    });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Ice-Breakers</h2>
          <p className="text-sm text-gray-500 mt-0.5">Quick-reply buttons shown to new contacts when they open a conversation.</p>
        </div>
        <div className="flex items-center gap-2">
          {syncMsg && <span className="text-xs text-green-600 flex items-center gap-1"><Check size={12}/>{syncMsg}</span>}
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            {syncing ? <Loader size={13} className="animate-spin"/> : <RefreshCw size={13}/>}
            {syncing ? 'Syncing…' : 'Sync from Meta'}
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
        <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5"/>
        <p className="text-xs text-blue-800">
          Ice-breakers are shown to contacts <strong>before</strong> they send their first message. 
          You can add up to {MAX_ICEBREAKERS}. Changes are pushed live to Instagram when you save.
        </p>
      </div>

      {/* Error */}
      {loadErr && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle size={14}/>{loadErr}
        </div>
      )}

      {/* Items */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
          <Loader size={18} className="animate-spin"/><span className="text-sm">Loading…</span>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ice-Breaker {i + 1}</span>
                <button onClick={() => removeItem(i)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={13}/>
                </button>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Question <span className="text-gray-400 font-normal">{item.question.length}/{MAX_QUESTION_LEN}</span>
                </label>
                <input value={item.question} maxLength={MAX_QUESTION_LEN}
                  onChange={e => updateItem(i, 'question', e.target.value)}
                  placeholder="What are your business hours?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Payload <span className="text-gray-400 font-normal">(optional — sent to your webhook)</span>
                </label>
                <input value={item.payload} maxLength={MAX_PAYLOAD_LEN}
                  onChange={e => updateItem(i, 'payload', e.target.value)}
                  placeholder="business_hours_query"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          ))}

          {items.length < MAX_ICEBREAKERS && (
            <button onClick={addItem}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <Plus size={15}/>Add ice-breaker ({items.length}/{MAX_ICEBREAKERS})
            </button>
          )}

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No ice-breakers configured. Add your first one above.
            </div>
          )}
        </div>
      )}

      {dirty && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Info size={13}/>Unsaved changes — click Save to push to Instagram
        </div>
      )}

      <SaveButton saving={saving} saved={saved} error={saveError} onClick={handleSave}
        label="Save & Push to Instagram" disabled={!dirty && items.length === 0} />
    </div>
  );
};