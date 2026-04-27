import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Check, Camera, X } from 'lucide-react';
import type { UserProfile, NotificationPrefs } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useAuth } from '../../../context/AuthContext';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { TruncatedText } from '../../../components/ui/TruncatedText';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';

export const UserSettings = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifs, setNotifs] = useState<NotificationPrefs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
  const { user, setUserOnce } = useAuth();

  const load = useCallback(async () => {
    if (!user) return;

    setProfile(user);
    setNotifs({
      email: true,
      browser: true,
      mentions: true,
      assignments: true,
      newConversations: true,
    });
  }, [user]);

  useEffect(() => {
    void load();
  }, [load, user]);

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

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be smaller than 5MB.');
      return;
    }

    setAvatarError(null);
    setAvatarFile(file);

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

      if (avatarFile) {
        setAvatarUploading(true);

        try {
          finalAvatarUrl = await uploadFile(avatarFile, profile.id ?? 'user');
          setAvatarFile(null);

          if (avatarPreview && avatarPreview.startsWith('blob:')) {
            URL.revokeObjectURL(avatarPreview);
          }

          setAvatarPreview(null);
        } catch {
          setAvatarError('Failed to upload avatar. Please try again.');
          setAvatarUploading(false);
          setSaving(false);
          return;
        }

        setAvatarUploading(false);
      }

      const nextUser = await workspaceApi.updateUserProfile({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        avatarUrl: finalAvatarUrl,
      });

      setUserOnce(nextUser);
      setProfile((prev) => (prev ? { ...prev, avatarUrl: finalAvatarUrl } : prev));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Passwords do not match');
      return;
    }

    if (!pwForm.current || !pwForm.next) {
      setPwError('All fields are required');
      return;
    }

    setPwSaving(true);
    setPwError(null);
    await workspaceApi.changePassword(pwForm.current, pwForm.next);
    setPwForm({ current: '', next: '', confirm: '' });
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2000);
    setPwSaving(false);
  };

  void handleChangePassword;
  void pwError;
  void pwSaved;

  const displayAvatarUrl = avatarPreview ?? (profile?.avatarUrl || null);
  const displayName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || 'User'
    : 'User';
  const initials = profile
    ? (profile.firstName?.split(' ').map((name) => name[0]).join('') ?? '')
        .slice(0, 2)
        .toUpperCase()
    : '??';

  return (
    <div className="space-y-6">
    
        <div className="mb-5 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex w-full shrink-0 flex-col items-center gap-2 sm:w-auto sm:items-start">
            <div className="group relative h-20 w-20 sm:h-24 sm:w-24">
              <Avatar
                src={displayAvatarUrl ?? undefined}
                name={displayName || initials}
                alt="Avatar"
                size="2xl"
                style={{ width: '100%', height: '100%' }}
                className="overflow-hidden ring-2 ring-transparent ring-offset-2 transition-all duration-200 group-hover:ring-indigo-400"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/45 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-black/55 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-0"
                aria-label="Change avatar"
              >
                <Camera size={14} />
                <span className="text-[10px] font-medium">Change</span>
              </button>

              {avatarFile && !avatarUploading ? (
                <button
                  type="button"
                  onClick={handleClearAvatar}
                  className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                  aria-label="Remove selected avatar"
                >
                  <X size={11} />
                </button>
              ) : null}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />

            {avatarFile && !avatarUploading ? (
              <TruncatedText
                text={avatarFile?.name ?? ''}
                maxLength={20}
                className="max-w-full text-center text-[11px] font-medium text-indigo-600 sm:max-w-[90px] sm:text-left"
              />
            ) : null}

            {avatarError ? (
              <span className="max-w-full text-center text-[11px] text-red-500 sm:max-w-[90px] sm:text-left">
                {avatarError}
              </span>
            ) : null}
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <BaseInput
              label="First name"
              value={profile?.firstName || ''}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
            />
            <BaseInput
              label="Last name"
              value={profile?.lastName || ''}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
            />
            <div className="md:col-span-2">
              <BaseInput
                label="Email"
                readOnly
                value={profile?.email || ''}
              />
            </div>

            {error ? <p className="text-sm text-red-500 md:col-span-2">{error}</p> : null}

            <div className="flex md:col-span-2">
              <div className="w-full sm:w-auto">
              <Button
                onClick={handleSave}
                disabled={saving || avatarUploading}
                loading={saving || avatarUploading}
                variant={saved ? 'success' : 'primary'}
                leftIcon={
                  saving || avatarUploading
                    ? undefined
                    : saved
                      ? <Check size={16} />
                      : <Save size={16} />
                }
                fullWidth
              >
                {saved
                  ? 'Saved'
                  : saving || avatarUploading
                    ? 'Saving...'
                    : 'Save changes'}
              </Button>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};
