import {
  LayoutGrid, UserCog, Users, UsersRound, MessageCircle, RefreshCw, Smile,
  Contact, Settings, CheckCircle, AlignLeft, Tag as TagIcon,
  Wand2, Sparkles, Phone,
} from 'lucide-react';

export type MenuItem = { name: string; icon: React.ReactNode; badge?: string };
export type MenuSection = { title: string; items: MenuItem[] };

export const menuSections: MenuSection[] = [
  {
    title: 'General settings',
    items: [{ name: 'General info', icon: <LayoutGrid size={16} /> }],
  },
  {
    title: 'User role settings',
    items: [
      { name: 'User settings',     icon: <Users size={16} /> },
      // { name: 'Teams',             icon: <UsersRound size={16} /> },
    ],
  },
  // {
  //   title: 'Apps',
  //   items: [
  //     { name: 'Channels',       icon: <MessageCircle size={16} /> },
  //     // { name: 'Integrations',   icon: <RefreshCw size={16} />     },
  //     // { name: 'Growth widgets', icon: <Smile size={16} />         },
  //   ],
  // },
  {
    title: 'Inbox settings',
    items: [
      // { name: 'Contact fields', icon: <Contact size={16} />                           },
      { name: 'Lifecycle',      icon: <Settings size={16} />                          },
      // { name: 'Closing notes',  icon: <CheckCircle size={16} />                       },
      // { name: 'Snippets',       icon: <AlignLeft size={16} />                         },
      { name: 'Tags',           icon: <TagIcon size={16} />                           },
      // { name: 'AI Assist',      icon: <Wand2 size={16} />                             },
      // { name: 'AI Prompts',     icon: <Sparkles size={16} />                          },
      // { name: 'Calls',          icon: <Phone size={16} />, badge: 'New'               },
    ],
  },
];
