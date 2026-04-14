import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Check, Camera, Loader2, X } from 'lucide-react';
import { Toggle } from '../components/Toggle';

import { SectionError } from '../components/SectionError';
import type { UserProfile, NotificationPrefs, AvailabilityStatus } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { DataLoader } from '../../Loader';
import { useAuth } from '../../../context/AuthContext';
import { Card } from '../../../components/ui/Card';

export const UserSettings = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifs, setNotifs] = useState<NotificationPrefs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);

  const { uploadFile } = useWorkspace();
  const {user,setUserOnce } = useAuth()

  const load = useCallback(async () => {

    console.log({usezzr:user});
    
    if(!user) return 
 
    setProfile(user);
    setNotifs({ email: true, browser: true, mentions: true, assignments: true, newConversations: true });
  }, [user]);

  useEffect(() => { load(); }, [load,user]);

  // Clean up object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file.');
      return;
    }
    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be smaller than 5MB.');
      return;
    }

    setAvatarError(null);
    setAvatarFile(file);

    // Revoke previous preview URL
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleClearAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!profile || !notifs) return;
    setSaving(true);
    setError(null);

    try {
      let finalAvatarUrl = profile.avatarUrl || '';

      // Upload avatar if a new file was selected
      if (avatarFile) {
        setAvatarUploading(true);
        try {
          finalAvatarUrl = await uploadFile(avatarFile, profile.id ?? 'user');
          setAvatarFile(null);
          // Keep preview as the new avatar URL after upload
          if (avatarPreview && avatarPreview.startsWith('blob:')) {
            URL.revokeObjectURL(avatarPreview);
          }
          setAvatarPreview(null);
        } catch (uploadErr) {
          setAvatarError('Failed to upload avatar. Please try again.');
          setAvatarUploading(false);
          setSaving(false);
          return;
        }
        setAvatarUploading(false);
      }

    const user =   await workspaceApi.updateUserProfile({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        avatarUrl: finalAvatarUrl,
      });
      setUserOnce(user)

      // Update local profile with new avatar URL
      setProfile(prev => prev ? { ...prev, avatarUrl: finalAvatarUrl } : prev);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    if (!pwForm.current || !pwForm.next) { setPwError('All fields are required'); return; }
    setPwSaving(true);
    setPwError(null);
    await workspaceApi.changePassword(pwForm.current, pwForm.next);
    setPwForm({ current: '', next: '', confirm: '' });
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2000);
    setPwSaving(false);
  };

  // Derived avatar display: local preview > uploaded url > initials fallback
  const displayAvatarUrl = avatarPreview ?? (profile?.avatarUrl || null);
  const initials = profile
    ? (profile.firstName?.split(' ').map(n => n[0]).join('') ?? '').slice(0, 2).toUpperCase()
    : '??';

  // if (loading) return <DataLoader type={"Profile details"} />;
  // if (error || !profile || !notifs) return <SectionError message={error ?? 'Unknown error'} onRetry={load} />;

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card className="rounded-[28px] border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Profile</h2>

        <div className="flex items-center gap-5 mb-5">
          {/* Avatar upload area */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl ring-2 ring-offset-2 ring-transparent group-hover:ring-indigo-400 transition-all">
                {displayAvatarUrl ? (
                  <img
                    src={displayAvatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              {/* Hover overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                aria-label="Change avatar"
              >
                {avatarUploading ? (
                  <Loader2 size={20} className="text-white animate-spin" />
                ) : (
                  <>
                    <Camera size={18} className="text-white" />
                    <span className="text-[10px] text-white mt-1 font-medium">Change</span>
                  </>
                )}
              </button>

              {/* Clear pending upload badge */}
              {avatarFile && !avatarUploading && (
                <button
                  type="button"
                  onClick={handleClearAvatar}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                  aria-label="Remove selected avatar"
                >
                  <X size={11} className="text-white" />
                </button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />

            {/* Pending upload label */}
            {avatarFile && !avatarUploading && (
              <span className="text-[11px] text-indigo-600 font-medium max-w-[90px] truncate text-center" title={avatarFile?.name}>
                {avatarFile?.name}
              </span>
            )}

            {/* Avatar error */}
            {avatarError && (
              <span className="text-[11px] text-red-500 max-w-[90px] text-center">{avatarError}</span>
            )}
          </div>

          {/* Fields */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input
                value={profile?.firstName || ''}
                onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input
                value={profile?.lastName || ''}
                onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                readOnly
                value={profile?.email || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-500"
              />
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                readOnly
                value={profile.role || ''}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
              />
            </div> */}

            {error && <p className="text-sm text-red-500 col-span-2">{error}</p>}

            <div className="flex justify-start col-span-2">
              <button
                onClick={handleSave}
                disabled={saving || avatarUploading}
                className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60 ${
                  saved ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {saved ? (
                  <><Check size={16} /> Saved</>
                ) : saving || avatarUploading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                ) : (
                  <><Save size={16} /> Save changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
