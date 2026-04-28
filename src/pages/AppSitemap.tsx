import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, LayoutDashboard, Users, Radio, Workflow, BarChart3,
  RadioTower, UsersRound, Building2, CreditCard, Settings, LogIn, UserPlus,
  KeyRound, Mail, ShieldCheck, ExternalLink, Search, X, ChevronRight,
  Inbox, Globe, Phone, Wand2, Sparkles, Tag as TagIcon, AlignLeft, CheckCircle,
  Contact, RefreshCw, Smile, UserCog, LayoutGrid, Map, Zap, ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CountBadge } from '../components/ui/CountBadge';
import { IconButton } from '../components/ui/button/IconButton';
import { BaseInput } from '../components/ui/inputs/BaseInput';
import { Tag } from '../components/ui/Tag';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Category = 'all' | 'core' | 'channels' | 'team' | 'billing' | 'settings' | 'auth';

interface PageEntry {
  id: string;
  title: string;
  description: string;
  url: string;
  category: Exclude<Category, 'all'>;
  icon: React.ReactNode;
  color: string;          // tailwind bg class for icon bg
  textColor: string;      // tailwind text class for icon
  borderColor: string;    // tailwind border-t class
  features: string[];
  badge?: string;
  isExternal?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const PAGES: PageEntry[] = [
  // ── Core ──────────────────────────────────────────────────────────────────
  {
    id: 'inbox',
    title: 'Inbox',
    description: 'Unified multi-channel messaging hub. Handle all customer conversations from WhatsApp, Instagram, Facebook, Email and more in one place.',
    url: '/inbox',
    category: 'core',
    icon: <MessageSquare size={22} />,
    color: 'bg-blue-100',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500',
    features: [
      'Multi-channel conversation list',
      'Reply, Comment & Email modes',
      'Audio recording & attachments',
      'Emoji picker & variable insertion',
      'Message search & snooze',
      'Contact sidebar with edit & merge',
      'Real-time unread badge',
      'Conversation assign & status',
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'At-a-glance analytics overview with KPI cards, conversation volume chart, channel distribution breakdown, and recent team activity.',
    url: '/dashboard',
    category: 'core',
    icon: <LayoutDashboard size={22} />,
    color: 'bg-indigo-100',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-500',
    features: [
      'KPI stat cards (conversations, contacts, resolved, response time)',
      'Weekly conversation volume bar chart',
      'Channel distribution progress bars',
      'Recent team activity feed',
      'Trend indicators (up/down)',
    ],
  },
  {
    id: 'contacts',
    title: 'Contacts',
    description: 'Full contact management with lifecycle stages, segmentation, bulk import/export, and duplicate detection.',
    url: '/contacts',
    category: 'core',
    icon: <Users size={22} />,
    color: 'bg-cyan-100',
    textColor: 'text-cyan-600',
    borderColor: 'border-cyan-500',
    features: [
      'Searchable & sortable contact table',
      'Lifecycle stage filtering (New Lead, Hot Lead, Customer…)',
      'Segment sidebar (inactive, tagged, country…)',
      'Bulk select & delete',
      'CSV import with drag-and-drop & preview',
      'CSV export with active filters',
      'Create contact modal',
      'Pagination (10 per page)',
    ],
  },
  {
    id: 'broadcast',
    title: 'Broadcast',
    description: 'Send mass messages to segmented contact lists across multiple channels with scheduling and template support.',
    url: '/broadcast',
    category: 'core',
    icon: <Radio size={22} />,
    color: 'bg-orange-100',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-500',
    features: [
      'Create broadcast campaigns',
      'Audience segmentation',
      'Multi-channel delivery',
      'Schedule for later',
      'Template message support',
      'Campaign status tracking',
    ],
  },
  {
    id: 'workflows',
    title: 'Workflows',
    description: 'Visual automation builder with a template gallery of 18 pre-built workflows across 8 categories and a drag-and-drop canvas.',
    url: '/workflows',
    category: 'core',
    icon: <Workflow size={22} />,
    color: 'bg-violet-100',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-500',
    features: [
      '18 pre-built templates (Welcome, Leads, Support, Sales…)',
      'Category sidebar with search filter',
      'Visual drag-and-drop canvas',
      'Start from scratch option',
      'Popular badge on trending templates',
      'Three-view state: list → templates → canvas',
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Detailed analytics and performance reports for teams, channels, and conversations with date range filtering.',
    url: '/reports',
    category: 'core',
    icon: <BarChart3 size={22} />,
    color: 'bg-emerald-100',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-500',
    features: [
      'Conversation volume reports',
      'Team performance metrics',
      'Channel-wise breakdown',
      'Response & resolution time',
      'Date range filtering',
      'Export reports',
    ],
  },

  // ── Channels ───────────────────────────────────────────────────────────────
  {
    id: 'channels',
    title: 'Channels',
    description: 'Browse and manage all connected messaging channels. Connect WhatsApp, Instagram, Facebook, Gmail, and Email from a unified catalog.',
    url: '/channels',
    category: 'channels',
    icon: <RadioTower size={22} />,
    color: 'bg-green-100',
    textColor: 'text-green-600',
    borderColor: 'border-green-500',
    features: [
      'Channel catalog with status badges',
      'Connect via modal or dedicated page',
      'WhatsApp Cloud API setup',
      'Instagram & Facebook OAuth',
      'Gmail OAuth & Email SMTP/IMAP',
      'Manage connected channels',
      'Disconnect with confirmation',
    ],
  },
  {
    id: 'connect-channel',
    title: 'Connect Channel',
    description: 'Step-by-step guided setup page for connecting a new channel. Each channel type has its own tailored configuration flow.',
    url: '/channels/connect/:channelId',
    category: 'channels',
    icon: <Globe size={22} />,
    color: 'bg-teal-100',
    textColor: 'text-teal-600',
    borderColor: 'border-teal-500',
    features: [
      'Breadcrumb navigation',
      'Gradient background card layout',
      'Per-channel setup components',
      'WhatsApp: credentials + Meta login',
      'Facebook/Instagram: OAuth flow',
      'Email: SMTP/IMAP form',
      'Post-connect redirect to channels list',
    ],
  },
  {
    id: 'manage-channel',
    title: 'Manage Channel',
    description: 'Full channel management page with sidebar navigation, configuration forms, templates, troubleshooting, and danger zone.',
    url: '/channels/manage/:channelType/:channelId',
    category: 'channels',
    icon: <Settings size={22} />,
    color: 'bg-lime-100',
    textColor: 'text-lime-600',
    borderColor: 'border-lime-500',
    features: [
      'Left sidebar: channel icon, name, ID, status',
      'Nav: Configuration, Templates, Profile, Troubleshoot',
      'Meta Product Catalog link',
      'Chat link with copy & QR code',
      'Callback URL & Verify Token',
      'Danger Zone: disconnect with confirm',
      'Instagram: Private Replies section',
    ],
    badge: 'Instagram: Private Replies',
  },

  // ── Team & Org ─────────────────────────────────────────────────────────────
  {
    id: 'team',
    title: 'Team',
    description: 'Manage team members, roles, and invitations. View all users with their status and resend invites to pending members.',
    url: '/team',
    category: 'team',
    icon: <UsersRound size={22} />,
    color: 'bg-purple-100',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-500',
    features: [
      'All users table with role badges',
      'Active & pending member counts',
      'Invite new team members',
      'Edit user roles (owner, admin, supervisor, agent)',
      'Resend invite to pending users',
      'Role-based access control',
    ],
  },
  {
    id: 'organization',
    title: 'Organization',
    description: 'Organization-level settings including account info, admin controls, security, workspaces, WhatsApp fees, and billing overview.',
    url: '/organization',
    category: 'team',
    icon: <Building2 size={22} />,
    color: 'bg-fuchsia-100',
    textColor: 'text-fuchsia-600',
    borderColor: 'border-fuchsia-500',
    features: [
      'Account info & branding',
      'Admin settings',
      'Security configuration',
      'Workspace management',
      'WhatsApp fees (empty state + connect)',
      'Billing & usage overview',
      'Sidebar nav layout',
    ],
  },

  // ── Billing ────────────────────────────────────────────────────────────────
  {
    id: 'billing',
    title: 'Billing',
    description: 'View your current plan, usage metrics, and manage your subscription. Access invoices and upgrade options.',
    url: '/billing',
    category: 'billing',
    icon: <CreditCard size={22} />,
    color: 'bg-amber-100',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500',
    features: [
      'Current plan display',
      'MACs usage meter',
      'Invoice history',
      'Upgrade / downgrade plan',
      'Payment method management',
      'Link to billing plans page',
    ],
  },
  {
    id: 'billing-plans',
    title: 'Billing Plans',
    description: 'Compare all available subscription plans side-by-side with feature breakdowns, pricing, and one-click upgrade.',
    url: '/billing/plans',
    category: 'billing',
    icon: <Zap size={22} />,
    color: 'bg-yellow-100',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-500',
    features: [
      'Plan comparison table',
      'Feature-by-feature breakdown',
      'Monthly / annual toggle',
      'Highlighted recommended plan',
      'One-click upgrade button',
      'FAQ section',
    ],
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  {
    id: 'workspace-general',
    title: 'Workspace — General Info',
    description: 'Configure workspace name, logo, timezone, and language preferences.',
    url: '/workspace-settings',
    category: 'settings',
    icon: <LayoutGrid size={22} />,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-500',
    features: ['Workspace name & logo', 'Timezone selector', 'Language preference', 'Save changes'],
  },
  {
    id: 'workspace-personal',
    title: 'Workspace — Personal Settings',
    description: 'Manage your own profile, availability status, notification preferences, and password.',
    url: '/workspace-settings',
    category: 'settings',
    icon: <UserCog size={22} />,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-400',
    features: ['Profile photo & display name', 'Availability status', 'Notification preferences', 'Change password form'],
  },
  {
    id: 'workspace-users',
    title: 'Workspace — User Settings',
    description: 'Manage all workspace users, invite new members, and control role assignments.',
    url: '/workspace-settings',
    category: 'settings',
    icon: <Users size={22} />,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-400',
    features: ['User table with roles', 'Invite modal', 'Role management', 'Resend invite'],
  },
  {
    id: 'workspace-teams',
    title: 'Workspace — Teams',
    description: 'Create and manage teams with member assignment, avatar stacks, and team-level routing.',
    url: '/workspace-settings',
    category: 'settings',
    icon: <UsersRound size={22} />,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-400',
    features: ['Create / edit / delete teams', 'Member picker', 'Avatar stack display', 'Member count badge'],
  },
  {
    id: 'workspace-integrations',
    title: 'Workspace — Integrations',
    description: 'Connect third-party tools like CRMs, helpdesks, and analytics platforms.',
    url: '/workspace-settings',
    category: 'settings',
    icon: <RefreshCw size={22} />,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-400',
    features: ['8 integration cards', 'Connect / disconnect toggle', 'OAuth flows', 'Status indicators'],
  },
  {
    id: 'workspace-growth',
    title: 'Workspace — Growth Widgets',
    description: 'Configure and embed website chat widgets with custom colors, positions, and icons.',
    url: '/workspace-settings',
    category: 'settings',
    icon: <Smile size={22} />,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-400',
    features: ['Color picker', 'Widget position selector', 'Icon chooser', 'Embed code snippet'],
  },
  {
    id: 'workspace-contact-fields',
    title: 'Workspace — Contact Fields',
    description: 'Define custom contact fields, mark required fields, and manage field visibility.',
    url: '/workspace-settings',
    category: 'settings',
    icon: <Contact size={22} />,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-400',
    features: ['Add / delete custom fields', 'Toggle required flag', 'Field type selection'],
  },
  {
    id: 'workspace-lifecycle',
    title: 'Workspace — Lifecycle',
    description: 'Customize lifecycle stages with colors, add new stages, and reorder the pipeline.',
    url: '/workspace-settings',
    category: 'settings',
    icon: <Settings size={22} />,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-400',
    features: ['Color-coded stages', 'Add / edit / delete stages', 'Drag to reorder'],
  },
  {
    id: 'workspace-snippets',
    title: 'Workspace — Snippets',
    description: 'Create reusable message snippets for quick replies in conversations.',
    url: '/workspace-settings',
    category: 'settings',
    icon: <AlignLeft size={22} />,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-400',
    features: ['Create / edit / delete snippets', 'Shortcut key assignment', 'Search snippets'],
  },
  {
    id: 'workspace-tags',
    title: 'Workspace — Tags',
    description: 'Manage conversation and contact tags for better organization and filtering.',
    url: '/workspace-settings',
    category: 'settings',
    icon: <TagIcon size={22} />,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-400',
    features: ['Create / delete tags', 'Color assignment', 'Usage count display'],
  },
  {
    id: 'workspace-ai',
    title: 'Workspace — AI Assist',
    description: 'Configure AI-powered reply suggestions and tone adjustments for agents.',
    url: '/workspace-settings',
    category: 'settings',
    icon: <Wand2 size={22} />,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-400',
    features: ['Enable / disable AI suggestions', 'Tone configuration', 'Language model settings'],
    badge: 'AI',
  },
  {
    id: 'workspace-ai-prompts',
    title: 'Workspace — AI Prompts',
    description: 'Create and manage custom AI prompts for automated responses and workflows.',
    url: '/workspace-settings',
    category: 'settings',
    icon: <Sparkles size={22} />,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-400',
    features: ['Create custom prompts', 'Prompt library', 'Test prompt responses'],
    badge: 'AI',
  },
  {
    id: 'workspace-calls',
    title: 'Workspace — Calls',
    description: 'Configure VoIP call settings, incoming call handling, and call recording preferences.',
    url: '/workspace-settings',
    category: 'settings',
    icon: <Phone size={22} />,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-400',
    features: ['Incoming call overlay', 'Active call controls (mute, hold, record)', 'Call timer', 'Note-taking during calls'],
    badge: 'New',
  },

  // ── Auth ───────────────────────────────────────────────────────────────────
  {
    id: 'login',
    title: 'Login',
    description: 'Sign in with email & password or Google OAuth. Demo credentials panel available in development mode.',
    url: '/auth/login',
    category: 'auth',
    icon: <LogIn size={22} />,
    color: 'bg-rose-100',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-500',
    features: [
      'Email & password login',
      'Google OAuth (Continue with Google)',
      'Remember me option',
      'Forgot password link',
      'Demo credentials panel (DUMMY_MODE)',
      'One-click fill for demo accounts',
    ],
  },
  {
    id: 'signup',
    title: 'Sign Up',
    description: 'Two-step registration: account details with password strength meter, then organization setup.',
    url: '/auth/signup',
    category: 'auth',
    icon: <UserPlus size={22} />,
    color: 'bg-rose-100',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-400',
    features: [
      'Step 1: name, email, password + strength meter',
      'Step 2: org name, role, company size, industry',
      'Google SSO option',
      'Animated step indicator',
      'Per-step validation before advancing',
    ],
  },
  {
    id: 'forgot-password',
    title: 'Forgot Password',
    description: 'Request a password reset link via email with a clean single-field form.',
    url: '/auth/forgot-password',
    category: 'auth',
    icon: <KeyRound size={22} />,
    color: 'bg-rose-100',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-400',
    features: ['Email input form', 'Send reset link', 'Back to login link', 'Success confirmation state'],
  },
  {
    id: 'verify-email',
    title: 'Verify Email',
    description: 'Enter the 6-digit OTP sent to your email to verify your account during signup.',
    url: '/auth/verify-email',
    category: 'auth',
    icon: <Mail size={22} />,
    color: 'bg-rose-100',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-400',
    features: ['6-digit OTP input', 'Resend code option', 'Auto-advance on complete', 'Error state handling'],
  },
  {
    id: 'reset-password',
    title: 'Reset Password',
    description: 'Set a new password after clicking the reset link from your email.',
    url: '/auth/reset-password',
    category: 'auth',
    icon: <ShieldCheck size={22} />,
    color: 'bg-rose-100',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-400',
    features: ['New password input', 'Confirm password', 'Password strength indicator', 'Redirect to login on success'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all',      label: 'All Pages' },
  { id: 'core',     label: 'Core' },
  { id: 'channels', label: 'Channels' },
  { id: 'team',     label: 'Team & Org' },
  { id: 'billing',  label: 'Billing' },
  { id: 'settings', label: 'Settings' },
  { id: 'auth',     label: 'Auth' },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const AppSitemap = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = PAGES;
    if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.features.some(f => f.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeCategory, search]);

  const totalFeatures = PAGES.reduce((acc, p) => acc + p.features.length, 0);

  const handleOpen = (page: PageEntry) => {
    // For parameterised routes, navigate to the base path
    const cleanUrl = page.url.replace(/\/:[\w]+/g, '');
    navigate(cleanUrl);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white opacity-5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white opacity-5 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white opacity-5 rounded-full" />

        <div className="relative px-6 py-10 md:px-10 md:py-14">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-6">
            <Map size={14} />
            <span>Meera</span>
            <ChevronRight size={14} />
            <span className="text-white font-medium">App Sitemap</span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
              Everything in one place
            </h1>
            <p className="text-blue-100 text-base md:text-lg leading-relaxed max-w-2xl">
              A complete overview of every page, feature, and capability in Meera.
              Click any card to jump directly to that section.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 mt-8">
            {[
              { label: 'Total Pages', value: PAGES.length },
              { label: 'Features Documented', value: totalFeatures + '+' },
              { label: 'Categories', value: CATEGORIES.length - 1 },
              { label: 'Auth Flows', value: 5 },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-blue-200 text-xs mt-0.5">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky Controls ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3 md:px-10">
          {/* Search */}
          <div className="mb-3">
            <BaseInput
              type="search"
              placeholder="Search pages, features..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="sm"
              appearance="toolbar"
              leftIcon={<Search size={16} />}
              rightIcon={
                search ? (
                  <IconButton
                    type="button"
                    onClick={() => setSearch('')}
                    icon={<X size={14} />}
                    aria-label="Clear sitemap search"
                    size="xs"
                    variant="ghost"
                  />
                ) : undefined
              }
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              const count =
                cat.id === 'all' ? PAGES.length : PAGES.filter(p => p.category === cat.id).length;

              return (
                <div key={cat.id} className="flex-shrink-0">
                  <Button
                    onClick={() => setActiveCategory(cat.id)}
                    variant={isActive ? 'primary' : 'soft'}
                    size="xs"
                    radius="full"
                    preserveChildLayout
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>{cat.label}</span>
                      {cat.id !== 'all' && (
                        <CountBadge
                          count={count}
                          tone={isActive ? 'primary' : 'neutral'}
                          size="xs"
                          showZero
                        />
                      )}
                    </span>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Results count ─────────────────────────────────────────────────── */}
      <div className="px-6 md:px-10 pt-5 pb-2 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filtered.length === PAGES.length
            ? `Showing all ${PAGES.length} pages`
            : `${filtered.length} of ${PAGES.length} pages`}
          {search && <span className="ml-1">matching <strong>"{search}"</strong></span>}
        </p>
        {(search || activeCategory !== 'all') && (
          <Button
            onClick={() => { setSearch(''); setActiveCategory('all'); }}
            variant="link"
            size="xs"
            leftIcon={<X size={12} />}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* ── Cards Grid ────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-10 pb-12">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Search size={40} className="mb-3 text-gray-300" />
            <p className="text-base font-medium text-gray-500">No pages found</p>
            <p className="text-sm mt-1">Try a different search term or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(page => (
              <PageCard key={page.id} page={page} onOpen={handleOpen} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE CARD
// ─────────────────────────────────────────────────────────────────────────────
function PageCard({ page, onOpen }: { page: PageEntry; onOpen: (p: PageEntry) => void }) {
  const [expanded, setExpanded] = useState(false);
  const visibleFeatures = expanded ? page.features : page.features.slice(0, 4);

  const categoryLabel: Record<string, string> = {
    core: 'Core', channels: 'Channels', team: 'Team & Org',
    billing: 'Billing', settings: 'Settings', auth: 'Auth',
  };

  const categoryTagColor: Record<string, string> = {
    core: 'tag-blue',
    channels: 'tag-green',
    team: 'tag-purple',
    billing: 'tag-orange',
    settings: 'tag-grey',
    auth: 'tag-red',
  };

  return (
    <div className={`group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden border-t-4 ${page.borderColor}`}>
      {/* Card header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${page.color} ${page.textColor}`}>
              {page.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{page.title}</h3>
                {page.badge && (
                  <Tag label={page.badge} bgColor="tag-orange" size="sm" />
                )}
              </div>
              <div className="mt-1">
                <Tag
                  label={categoryLabel[page.category]}
                  bgColor={categoryTagColor[page.category]}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* URL badge */}
        <div className="flex items-center gap-1.5 mb-3">
          <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-mono truncate max-w-full">
            {page.url}
          </code>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed">{page.description}</p>
      </div>

      {/* Features */}
      <div className="px-5 pb-4 flex-1">
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Features</p>
          <ul className="space-y-1.5">
            {visibleFeatures.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${page.textColor.replace('text-', 'bg-')}`} />
                {feature}
              </li>
            ))}
          </ul>
          {page.features.length > 4 && (
            <Button
              onClick={() => setExpanded(!expanded)}
              variant="link"
              size="xs"
            >
              {expanded ? (
                <>Show less</>
              ) : (
                <>+{page.features.length - 4} more features</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <Button
          onClick={() => onOpen(page)}
          variant="soft-primary"
          size="sm"
          fullWidth
          rightIcon={<ArrowRight size={14} />}
        >
          Open Page
        </Button>
      </div>
    </div>
  );
}
