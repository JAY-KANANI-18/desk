// src/pages/workspace/channels/MessengerChatMenu.tsx
import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Trash2, Loader, AlertCircle, Info, Check, ChevronDown, Globe, MessageSquare } from 'lucide-react';
import { ChannelApi } from '../../../lib/channelApi';
import { ConnectedChannel, useSave, SaveButton } from '../../channels/ManageChannelPage';
import { useWorkspace } from '../../../context/WorkspaceContext';

type MenuItemType = 'postback' | 'web_url';

interface MenuItem {
  _id: string;
  type:    MenuItemType;
  title:   string;
  payload: string;
  url:     string;
}

function uid() { return Math.random().toString(36).slice(2, 9); }

const ITEM_TYPE_OPTS: { value: MenuItemType; label: string; icon: React.ReactNode }[] = [
  { value: 'postback', label: 'Send postback', icon: <MessageSquare size={12}/> },
  { value: 'web_url',  label: 'Open URL',      icon: <Globe size={12}/> },
];

// ─── Single menu item editor ──────────────────────────────────────────────────
const MenuItemRow = ({ item, onUpdate, onRemove }: {
  item: MenuItem;
  onUpdate: (updates: Partial<MenuItem>) => void;
  onRemove: () => void;
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        {ITEM_TYPE_OPTS.map(opt => (
          <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
            <div onClick={() => onUpdate({ type: opt.value })}
              className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${item.type === opt.value ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
              {item.type === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white"/>}
            </div>
            <span className="flex items-center gap-1 text-xs text-gray-600">{opt.icon}{opt.label}</span>
          </label>
        ))}
      </div>
      <button onClick={onRemove} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <Trash2 size={13}/>
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">Button Title</label>
        <input value={item.title} onChange={e => onUpdate({ title: e.target.value })}
          placeholder="e.g. Contact Support" maxLength={30}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <span className="text-[10px] text-gray-400">{item.title.length}/30 chars</span>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">
          {item.type === 'postback' ? 'Payload' : 'URL'}
        </label>
        <input
          value={item.type === 'postback' ? item.payload : item.url}
          onChange={e => onUpdate(item.type === 'postback' ? { payload: e.target.value } : { url: e.target.value })}
          placeholder={item.type === 'postback' ? 'CONTACT_SUPPORT' : 'https://yoursite.com/support'}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  </div>
);

// ─── Main section ─────────────────────────────────────────────────────────────
export const MessengerChatMenuSection = ({ channel }: { channel: ConnectedChannel }) => {
  const { activeWorkspace } = useWorkspace();
  const { saving, saved, error: saveError, save } = useSave();

  const [menuItems,    setMenuItems]    = useState<MenuItem[]>([]);
  const [getStarted,   setGetStarted]   = useState('GET_STARTED');
  const [loading,      setLoading]      = useState(true);
  const [syncing,      setSyncing]      = useState(false);
  const [syncMsg,      setSyncMsg]      = useState<string | null>(null);
  const [loadErr,      setLoadErr]      = useState<string | null>(null);
  const [dirty,        setDirty]        = useState(false);
  const [activeTab,    setActiveTab]    = useState<'menu' | 'get_started'>('menu');

  const wid = activeWorkspace?.id ?? '';

  const load = async () => {
    setLoading(true);
    setLoadErr(null);
    const r = await ChannelApi.listMessengerMenu(String(channel.id), wid);
    setLoading(false);
    if (r.success && r.data) {
      const menuRecord  = r.data.find((d: any) => d.type === 'persistent_menu');
      const gsRecord    = r.data.find((d: any) => d.type === 'get_started');
      if (menuRecord?.payload?.persistent_menu?.[0]?.call_to_actions) {
        const actions = menuRecord.payload.persistent_menu[0].call_to_actions;
        setMenuItems(actions.map((a: any) => ({
          _id: uid(), type: a.type, title: a.title,
          payload: a.payload ?? '', url: a.url ?? '',
        })));
      }
      if (gsRecord?.payload?.payload) setGetStarted(gsRecord.payload.payload);
      setDirty(false);
    } else if (!r.success) {
      setLoadErr(r.error ?? 'Failed to load menu');
    }
  };

  useEffect(() => { load(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    const r = await ChannelApi.syncMessengerMenu(String(channel.id), wid);
    setSyncing(false);
    if (r.success) { setSyncMsg(`Synced ${r.data?.synced ?? 0} items`); load(); setTimeout(() => setSyncMsg(null), 3500); }
    else setLoadErr(r.error ?? 'Sync failed');
  };

  const addItem = () => {
    if (menuItems.length >= 5) return;
    setMenuItems(p => [...p, { _id: uid(), type: 'postback', title: '', payload: '', url: '' }]);
    setDirty(true);
  };

  const updateItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems(p => p.map(it => it._id === id ? { ...it, ...updates } : it));
    setDirty(true);
  };

  const removeItem = (id: string) => {
    setMenuItems(p => p.filter(it => it._id !== id));
    setDirty(true);
  };

  const handleSave = () =>
    save(async () => {
      if (activeTab === 'get_started') {
        return ChannelApi.pushGetStarted(String(channel.id), wid, getStarted);
      }
      // Build menu payload
      const menu = [{
        locale:                   'default',
        composer_input_disabled:  false,
        call_to_actions:          menuItems.map(it => ({
          type:    it.type,
          title:   it.title,
          payload: it.type === 'postback' ? it.payload : undefined,
          url:     it.type === 'web_url'  ? it.url     : undefined,
        })),
      }];
      return ChannelApi.pushMessengerMenu(String(channel.id), wid, menu);
    });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Chat Menu</h2>
          <p className="text-sm text-gray-500 mt-0.5">Persistent menu and Get Started button for Messenger.</p>
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {([['menu','Persistent Menu'],['get_started','Get Started Button']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {loadErr && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle size={14}/>{loadErr}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
          <Loader size={18} className="animate-spin"/><span className="text-sm">Loading…</span>
        </div>
      ) : activeTab === 'menu' ? (
        <div className="space-y-3">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <Info size={15} className="text-indigo-500 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-indigo-800">The persistent menu appears as a hamburger icon in Messenger. Add up to 5 buttons.</p>
          </div>

          {menuItems.map(item => (
            <MenuItemRow key={item._id} item={item}
              onUpdate={updates => updateItem(item._id, updates)}
              onRemove={() => removeItem(item._id)} />
          ))}

          {menuItems.length < 5 && (
            <button onClick={addItem}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
              <Plus size={15}/>Add button ({menuItems.length}/5)
            </button>
          )}

          {menuItems.length === 0 && (
            <p className="text-center py-6 text-sm text-gray-400">No menu items yet. Add your first button above.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <Info size={15} className="text-indigo-500 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-indigo-800">The Get Started button appears the first time someone opens a conversation with your page. The payload is sent to your webhook.</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Get Started Payload</label>
            <input value={getStarted} onChange={e => { setGetStarted(e.target.value); setDirty(true); }}
              placeholder="GET_STARTED"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <p className="text-xs text-gray-400">This string is sent as a postback when users tap "Get Started"</p>
          </div>
        </div>
      )}

      {dirty && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Info size={13}/>Unsaved changes
        </div>
      )}

      <SaveButton saving={saving} saved={saved} error={saveError} onClick={handleSave}
        label={`Save & Push to Messenger`} disabled={activeTab === 'menu' && menuItems.length === 0} />
    </div>
  );
};