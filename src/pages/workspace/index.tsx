import { WorkspaceSettingsProvider, useWorkspaceSettings } from './WorkspaceContext';
import { menuSections } from './menuConfig';
import { GeneralInfo }      from './sections/GeneralInfo';
import { UserSettings }     from './sections/UserSettings';
import { TeamSettings }     from './sections/TeamSettings';
import { Teams }            from './sections/Teams';
import { ChannelsSettings } from './sections/ChannelsSettings';
import { Integrations }     from './sections/Integrations';
import { GrowthWidgets }    from './sections/GrowthWidgets';
import { ContactFields }    from './sections/ContactFields';
import { Lifecycle }        from './sections/Lifecycle';
import { ClosingNotes }     from './sections/ClosingNotes';
import { Snippets }         from './sections/Snippets';
import { Tags }             from './sections/Tags';
import { AIAssist }         from './sections/AIAssist';
import { AIPrompts }        from './sections/AIPrompts';
import { Calls }            from './sections/Calls';

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT ROUTER
// ─────────────────────────────────────────────────────────────────────────────
const SectionContent = () => {
  const { activeItem } = useWorkspaceSettings();

  switch (activeItem) {
    case 'General info':      return <GeneralInfo />;
    case 'Personal Settings': return <UserSettings />;
    case 'User settings':     return <TeamSettings />;
    case 'Teams':             return <Teams />;
    case 'Channels':       return <ChannelsSettings />;
    case 'Integrations':   return <Integrations />;
    case 'Growth widgets': return <GrowthWidgets />;
    case 'Contact fields': return <ContactFields />;
    case 'Lifecycle':      return <Lifecycle />;
    case 'Closing notes':  return <ClosingNotes />;
    case 'Snippets':       return <Snippets />;
    case 'Tags':           return <Tags />;
    case 'AI Assist':      return <AIAssist />;
    case 'AI Prompts':     return <AIPrompts />;
    case 'Calls':          return <Calls />;
    default:               return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const SettingsSidebar = () => {
  const { activeItem, setActiveItem } = useWorkspaceSettings();

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 overflow-y-auto shrink-0">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Workspace settings</h2>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-5">
        {menuSections.map(section => (
          <div key={section.title}>
            <p className="text-xs text-gray-400 font-medium px-2 mb-1">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map(item => {
                const isActive = activeItem === item.name;
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => setActiveItem(item.name)}
                      className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? 'text-indigo-600' : 'text-gray-400'}>{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded">{item.badge}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const WorkspaceSettingsInner = () => {
  const { activeItem } = useWorkspaceSettings();

  return (
    <div className="h-full flex bg-gray-50 flex-col md:flex-row">
      <SettingsSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">{activeItem}</h1>
          <SectionContent />
        </div>
      </div>
    </div>
  );
};

export const WorkspaceSettings = () => (
  <WorkspaceSettingsProvider>
    <WorkspaceSettingsInner />
  </WorkspaceSettingsProvider>
);
