import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react';
import { useWorkspace } from './WorkspaceContext';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export interface GetStartedSteps {
  connectChannel: boolean;
  inviteTeam:     boolean;
  sendMessage:    boolean;
  setupLifecycle: boolean;
  [key: string]:  boolean;   // ← fixes Record<string, boolean> compatibility
}

interface GetStartedContextType {
  isOpen:         boolean;
  dismissed:      boolean;
  steps:          GetStartedSteps;
  completedCount: number;
  totalCount:     number;
  isComplete:     boolean;
  open:           () => void;
  close:          () => void;
  dismiss:        () => Promise<void>;
}

const GetStartedContext = createContext<GetStartedContextType | null>(null);

const DEFAULT_STEPS: GetStartedSteps = {
  connectChannel: false,
  inviteTeam:     false,
  sendMessage:    false,
  setupLifecycle: false,
};

export const GetStartedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isOpen,    setIsOpen]    = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [steps,     setSteps]     = useState<GetStartedSteps | []>([]);

  useEffect(() => {
    if (!activeWorkspace || !user) return;

    api.get('/workspaces/getstarted/status').then(( data ) => {
      setDismissed(data.dismissed);
      setSteps(data.steps);

      const allDone = Object.values(data.steps).every(Boolean);
      if (!data.dismissed && !allDone) {
        setIsOpen(true);
      }
    }).catch(() => {
      // non-fatal — keep defaults
    });
  }, [activeWorkspace?.id, user?.id]);

  const completedCount = Object.values(steps).filter(Boolean).length;
  const totalCount     = Object.keys(steps).length;
  const isComplete     = completedCount === totalCount;

  const open  = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // ← use api consistently, not apiClient
  const dismiss = useCallback(async () => {
    await api.patch('/workspaces/getstarted/dismiss');
    setDismissed(true);
    setIsOpen(false);
    navigate('/')
    
  }, []);

  const complete = useCallback(async () => {
    await api.patch('/workspaces/getstarted/complete');
    setDismissed(true);
    setIsOpen(false);
    navigate('/')
    
  }, []);

  return (
    <GetStartedContext.Provider value={{
      isOpen, dismissed, steps,
      completedCount, totalCount, isComplete,
      open, close, dismiss,complete
    }}>
      {children}
    </GetStartedContext.Provider>
  );
};

export const useGetStarted = () => {
  const ctx = useContext(GetStartedContext);
  if (!ctx) throw new Error('useGetStarted must be inside GetStartedProvider');
  return ctx;
};