import { useState, useEffect, useCallback } from 'react';
import { Save, Check } from 'lucide-react';
import { Toggle } from '../components/Toggle';
import { SectionLoader } from '../components/SectionLoader';
import { SectionError } from '../components/SectionError';
import type { UserProfile, NotificationPrefs, AvailabilityStatus } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';

export const UserSettings = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifs, setNotifs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const [p] = await Promise.all([
      workspaceApi.getUserProfile(),
      // workspaceApi.getNotificationPrefs(),
      // workspaceApi.getAvailability(),
    ]);
    setProfile(p); setNotifs({email:true,browser:true , mentions:true,assignments:true,newConversations:true}); 
    setLoading(false);

  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!profile || !notifs) return;
    setSaving(true); setError(null);
    await Promise.all([
      workspaceApi.updateUserProfile({firstName: profile.firstName, lastName: profile.lastName,avatarUrl: profile?.avatarUrl || ''}),
      // workspaceApi.updateNotificationPrefs(notifs),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);

  };

 

  const handleChangePassword = async () => {
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    if (!pwForm.current || !pwForm.next) { setPwError('All fields are required'); return; }
    setPwSaving(true); setPwError(null);
    await workspaceApi.changePassword(pwForm.current, pwForm.next);
    setPwForm({ current: '', next: '', confirm: '' });
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2000);
    setPwSaving(false);
  };

  if (loading) return <SectionLoader />;
  if (error || !profile || !notifs) return <SectionError message={error ?? 'Unknown error'} onRetry={load} />;

  return (
<div className="space-y-6 overflow-y-auto h-[calc(100vh-120px)] p-5">
        {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Profile</h2>
        <div className="flex items-start  items-center gap-5 mb-5">
          <div className="flex flex-col items-center align-i gap-2">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {profile.firstName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <button className="text-xs text-indigo-600 hover:underline">Change</button>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input readOnly value={profile.email}  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
       
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input readOnly value={profile.role} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
            </div>
   {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-start">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60 ${saved ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          {saved ? <><Check size={16} /> Saved</> : saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : <><Save size={16} /> Save changes</>}
        </button>
      </div>
          </div>
        </div>
      </div>
     

      {/* Notification Preferences */}
      {/* <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Notification preferences</h2>
        <div className="space-y-4">
          {([
            { key: 'email', label: 'Email notifications', desc: 'Receive notifications via email' },
            { key: 'browser', label: 'Browser notifications', desc: 'Show desktop push notifications' },
            { key: 'mobile', label: 'Mobile push', desc: 'Send push to mobile app' },
            { key: 'mentions', label: 'Mentions', desc: 'Notify when someone @mentions you' },
            { key: 'assignments', label: 'Conversation assignments', desc: 'Notify when a conversation is assigned to you' },
            { key: 'newConversations', label: 'New conversations', desc: 'Notify on every new incoming conversation' },
          ] as { key: keyof NotificationPrefs; label: string; desc: string }[]).map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <Toggle checked={notifs[item.key]} onChange={v => setNotifs({ ...notifs, [item.key]: v })} />
            </div>
          ))}
        </div>
      </div> */}

   

   
    </div>
  );
};
