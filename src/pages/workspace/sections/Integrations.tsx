import { useState, useEffect, useCallback } from 'react';

import { SectionError } from '../components/SectionError';
import type { Integration } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';
import { DataLoader } from '../../Loader';

export const Integrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [toggling, setToggling]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setIntegrations(await workspaceApi.getIntegrations()); }
    catch { setError('Failed to load integrations.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id: string, currentlyConnected: boolean) => {
    setToggling(id);
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !currentlyConnected } : i));
    try {
      if (currentlyConnected) await workspaceApi.disconnectIntegration(id);
      else await workspaceApi.connectIntegration(id);
    } catch {
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: currentlyConnected } : i));
    } finally { setToggling(null); }
  };

  if (loading) return <DataLoader type={"integrations"} />;
  if (error && integrations.length === 0) return <SectionError message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {integrations.map(int => (
          <div key={int.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl border border-gray-100 flex-shrink-0">{int.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{int.name}</p>
                  <span className="text-xs text-gray-400">{int.category}</span>
                </div>
                <button
                  onClick={() => handleToggle(int.id, int.connected)}
                  disabled={toggling === int.id}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0 transition-colors disabled:opacity-60 ${int.connected ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {toggling === int.id ? '…' : int.connected ? 'Connected' : 'Connect'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">{int.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
