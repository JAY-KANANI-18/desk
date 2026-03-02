import { createContext, useContext, useState, ReactNode } from 'react';

interface WorkspaceSettingsContextValue {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

const WorkspaceSettingsContext = createContext<WorkspaceSettingsContextValue | null>(null);

export const WorkspaceSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [activeItem, setActiveItem] = useState('General info');
  return (
    <WorkspaceSettingsContext.Provider value={{ activeItem, setActiveItem }}>
      {children}
    </WorkspaceSettingsContext.Provider>
  );
};

export const useWorkspaceSettings = (): WorkspaceSettingsContextValue => {
  const ctx = useContext(WorkspaceSettingsContext);
  if (!ctx) throw new Error('useWorkspaceSettings must be used within WorkspaceSettingsProvider');
  return ctx;
};
