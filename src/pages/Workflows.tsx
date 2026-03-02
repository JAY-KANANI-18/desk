import { useState, useCallback } from 'react';
import {
  Plus,
  ChevronLeft,
  Save,
  Search,
  Sparkles,
  MessageCircle,
  UserPlus,
  ShoppingCart,
  Bell,
  RefreshCw,
  Headphones,
  Megaphone,
  LayoutGrid,
  FileText,
  Zap,
  ArrowRight,
  Star,
  Clock,
  Users,
  Mail,
  Tag,
  Gift,
  ShieldCheck,
  CalendarCheck,
  Bot,
} from 'lucide-react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

/* ─── Types ─── */
interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
  nodes?: Node[];
  edges?: Edge[];
}

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  count: number;
}

/* ─── Template Data ─── */
const TEMPLATES: WorkflowTemplate[] = [
  // Welcome & Onboarding
  {
    id: 'welcome-message',
    name: 'Welcome Message',
    description: 'Send an automated welcome message when a new contact is created.',
    category: 'welcome',
    icon: <MessageCircle size={22} />,
    color: 'bg-blue-500',
    popular: true,
  },
  {
    id: 'onboarding-sequence',
    name: 'Onboarding Drip Sequence',
    description: 'Guide new users through a multi-step onboarding flow over several days.',
    category: 'welcome',
    icon: <CalendarCheck size={22} />,
    color: 'bg-indigo-500',
  },
  {
    id: 'email-verification',
    name: 'Email Verification',
    description: 'Verify new contact email addresses with a confirmation link.',
    category: 'welcome',
    icon: <ShieldCheck size={22} />,
    color: 'bg-cyan-500',
  },
  // Lead Generation
  {
    id: 'lead-qualification',
    name: 'Lead Qualification',
    description: 'Automatically qualify leads based on their responses and assign scores.',
    category: 'leads',
    icon: <UserPlus size={22} />,
    color: 'bg-green-500',
    popular: true,
  },
  {
    id: 'lead-nurture',
    name: 'Lead Nurture Campaign',
    description: 'Nurture cold leads with a series of targeted messages over time.',
    category: 'leads',
    icon: <Sparkles size={22} />,
    color: 'bg-emerald-500',
  },
  {
    id: 'webform-followup',
    name: 'Web Form Follow-up',
    description: 'Instantly follow up when a contact submits a form on your website.',
    category: 'leads',
    icon: <FileText size={22} />,
    color: 'bg-teal-500',
  },
  // Customer Support
  {
    id: 'auto-reply',
    name: 'Auto Reply & Routing',
    description: 'Auto-reply to incoming messages and route to the right team.',
    category: 'support',
    icon: <Headphones size={22} />,
    color: 'bg-purple-500',
    popular: true,
  },
  {
    id: 'csat-survey',
    name: 'CSAT Survey',
    description: 'Send a satisfaction survey after a conversation is closed.',
    category: 'support',
    icon: <Star size={22} />,
    color: 'bg-yellow-500',
  },
  {
    id: 'sla-escalation',
    name: 'SLA Escalation',
    description: 'Escalate conversations that exceed response time thresholds.',
    category: 'support',
    icon: <Clock size={22} />,
    color: 'bg-red-500',
  },
  {
    id: 'ai-chatbot',
    name: 'AI Chatbot',
    description: 'Deploy an AI-powered chatbot to handle common questions automatically.',
    category: 'support',
    icon: <Bot size={22} />,
    color: 'bg-violet-500',
  },
  // Sales & Marketing
  {
    id: 'abandoned-cart',
    name: 'Abandoned Cart Recovery',
    description: 'Recover lost sales by messaging customers who abandoned their cart.',
    category: 'sales',
    icon: <ShoppingCart size={22} />,
    color: 'bg-orange-500',
    popular: true,
  },
  {
    id: 'promo-broadcast',
    name: 'Promotional Broadcast',
    description: 'Send targeted promotions to segmented contact lists.',
    category: 'sales',
    icon: <Megaphone size={22} />,
    color: 'bg-pink-500',
  },
  {
    id: 'upsell-crosssell',
    name: 'Upsell & Cross-sell',
    description: 'Recommend related products after a purchase is completed.',
    category: 'sales',
    icon: <Gift size={22} />,
    color: 'bg-rose-500',
  },
  // Re-engagement
  {
    id: 'win-back',
    name: 'Win-back Campaign',
    description: 'Re-engage inactive contacts with a personalized win-back sequence.',
    category: 'reengagement',
    icon: <RefreshCw size={22} />,
    color: 'bg-amber-500',
  },
  {
    id: 'inactive-reminder',
    name: 'Inactive Contact Reminder',
    description: 'Remind contacts who haven\'t interacted in a set number of days.',
    category: 'reengagement',
    icon: <Bell size={22} />,
    color: 'bg-lime-600',
  },
  // Notifications & Alerts
  {
    id: 'team-notification',
    name: 'Team Notification',
    description: 'Notify team members when specific events or conditions are met.',
    category: 'notifications',
    icon: <Users size={22} />,
    color: 'bg-sky-500',
  },
  {
    id: 'email-alert',
    name: 'Email Alert',
    description: 'Send email alerts to managers for high-priority conversations.',
    category: 'notifications',
    icon: <Mail size={22} />,
    color: 'bg-blue-600',
  },
  {
    id: 'tag-automation',
    name: 'Auto-Tagging',
    description: 'Automatically tag contacts based on keywords or conversation topics.',
    category: 'notifications',
    icon: <Tag size={22} />,
    color: 'bg-fuchsia-500',
  },
];

const CATEGORIES: Category[] = [
  { id: 'all', label: 'All Templates', icon: <LayoutGrid size={18} />, count: TEMPLATES.length },
  { id: 'popular', label: 'Popular', icon: <Star size={18} />, count: TEMPLATES.filter((t) => t.popular).length },
  { id: 'welcome', label: 'Welcome & Onboarding', icon: <MessageCircle size={18} />, count: TEMPLATES.filter((t) => t.category === 'welcome').length },
  { id: 'leads', label: 'Lead Generation', icon: <UserPlus size={18} />, count: TEMPLATES.filter((t) => t.category === 'leads').length },
  { id: 'support', label: 'Customer Support', icon: <Headphones size={18} />, count: TEMPLATES.filter((t) => t.category === 'support').length },
  { id: 'sales', label: 'Sales & Marketing', icon: <ShoppingCart size={18} />, count: TEMPLATES.filter((t) => t.category === 'sales').length },
  { id: 'reengagement', label: 'Re-engagement', icon: <RefreshCw size={18} />, count: TEMPLATES.filter((t) => t.category === 'reengagement').length },
  { id: 'notifications', label: 'Notifications & Alerts', icon: <Bell size={18} />, count: TEMPLATES.filter((t) => t.category === 'notifications').length },
];

/* ─── Trigger options for canvas ─── */
const triggerOptions = [
  { id: 'contact-field', label: 'Contact Field Updated', icon: '🔄' },
  { id: 'contact-tag', label: 'Contact Tag Updated', icon: '🏷️' },
  { id: 'shortcut', label: 'Shortcut', icon: '⚡' },
  { id: 'webhook', label: 'Incoming Webhook', icon: '🔗', upgrade: true },
  { id: 'click-to-chat', label: 'Click-to-Chat Ads', icon: '💬' },
  { id: 'tiktok', label: 'TikTok Messaging Ads', icon: '🎵' },
  { id: 'manual', label: 'Manual Trigger', icon: '👆' },
  { id: 'lifecycle', label: 'Lifecycle Updated', icon: '♻️' },
];

const defaultNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'input',
    data: { label: '⚡ Trigger\nSelect a trigger' },
    position: { x: 400, y: 200 },
    style: {
      background: '#fff',
      border: '2px solid #ef4444',
      borderRadius: '8px',
      padding: '16px',
      width: 200,
    },
  },
];

/* ─── Views ─── */
type View = 'list' | 'templates' | 'canvas';

export const Workflows = () => {
  const [view, setView] = useState<View>('list');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  // Canvas state
  const [showTriggerMenu, setShowTriggerMenu] = useState(false);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSelectTrigger = (trigger: (typeof triggerOptions)[0]) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === 'trigger-1') {
          return {
            ...node,
            data: { label: `${trigger.icon} Trigger\n${trigger.label}` },
            style: { ...node.style, border: '2px solid #3b82f6' },
          };
        }
        return node;
      })
    );
    setShowTriggerMenu(false);
  };

  const addActionNode = () => {
    const newNode: Node = {
      id: `action-${nodes.length}`,
      data: { label: '+ Add Action' },
      position: { x: 400, y: 300 + nodes.length * 100 },
      style: {
        background: '#fff',
        border: '2px dashed #d1d5db',
        borderRadius: '8px',
        padding: '16px',
        width: 200,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const openCanvas = (template: WorkflowTemplate | null) => {
    setSelectedTemplate(template);
    setWorkflowName(template ? template.name : 'Untitled Workflow');
    // Reset canvas nodes
    if (template) {
      setNodes(template.nodes ?? [
        {
          id: 'trigger-1',
          type: 'input',
          data: { label: `⚡ Trigger\nConfigured for: ${template.name}` },
          position: { x: 400, y: 100 },
          style: { background: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '16px', width: 220 },
        },
        {
          id: 'action-1',
          data: { label: `📋 ${template.name}\nPre-configured step` },
          position: { x: 400, y: 260 },
          style: { background: '#fff', border: '2px solid #10b981', borderRadius: '8px', padding: '16px', width: 220 },
        },
      ]);
      setEdges(template.edges ?? [
        { id: 'e-trigger-action', source: 'trigger-1', target: 'action-1', animated: true },
      ]);
    } else {
      setNodes(defaultNodes);
      setEdges([]);
    }
    setView('canvas');
  };

  /* ─── Filtered templates ─── */
  const filteredTemplates = TEMPLATES.filter((t) => {
    const matchesCategory =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'popular'
        ? t.popular
        : t.category === selectedCategory;
    const matchesSearch =
      !templateSearch ||
      t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(templateSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  /* ═══════════════════════════════════════════════════
     VIEW: Canvas (workflow builder)
     ═══════════════════════════════════════════════════ */
  if (view === 'canvas') {
    return (
      <div className="h-full flex bg-white">
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-white">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('list')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-lg font-semibold border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
              />
              <button className="text-gray-400 hover:text-gray-600">✏️</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Last updated a few seconds ago</span>
              <button className="text-gray-400">⚠️</button>
              <button className="text-gray-400">⚙️</button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Save size={18} />
                Save
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Test</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Publish</button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>

            <div className="absolute left-4 top-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex flex-col gap-2">
              <button className="p-2 hover:bg-gray-100 rounded" title="Zoom In">+</button>
              <button className="p-2 hover:bg-gray-100 rounded" title="Zoom Out">−</button>
              <button className="p-2 hover:bg-gray-100 rounded" title="Fit View">⊡</button>
              <button className="p-2 hover:bg-gray-100 rounded" title="Undo">↶</button>
              <button className="p-2 hover:bg-gray-100 rounded" title="Redo">↷</button>
            </div>

            <button
              onClick={addActionNode}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600"
            >
              + Add Action
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-red-500 text-xl">⚡</span>
              <h2 className="text-xl font-semibold">Trigger</h2>
            </div>
            <p className="text-gray-600 mb-6">Choose the Trigger that will start this Workflow for your contacts.</p>

            <div className="relative">
              <button
                onClick={() => setShowTriggerMenu(!showTriggerMenu)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-blue-500"
              >
                <span className="text-gray-500">Select a trigger</span>
                <span>▼</span>
              </button>

              {showTriggerMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                  {triggerOptions.map((trigger) => (
                    <button
                      key={trigger.id}
                      onClick={() => handleSelectTrigger(trigger)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-xl">{trigger.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{trigger.label}</div>
                      </div>
                      {trigger.upgrade && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Upgrade</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8">
              <h3 className="font-semibold mb-4">Advanced Settings</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Trigger once per contact</p>
                  <p className="text-sm text-gray-500">Each contact can only trigger this workflow once</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     VIEW: Template Gallery
     ═══════════════════════════════════════════════════ */
  if (view === 'templates') {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="h-5 w-px bg-gray-300" />
            <h1 className="text-xl font-bold text-gray-900">Create Workflow</h1>
          </div>
          <p className="text-sm text-gray-500 ml-[72px]">
            Choose a template to get started quickly, or build from scratch.
          </p>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Category Sidebar */}
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
            <div className="p-4">
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                />
              </div>

              <nav className="flex flex-col gap-0.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                      selectedCategory === cat.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={selectedCategory === cat.id ? 'text-blue-600' : 'text-gray-400'}>{cat.icon}</span>
                    <span className="flex-1">{cat.label}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        selectedCategory === cat.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Template Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Start from Scratch Card */}
            <button
              onClick={() => openCanvas(null)}
              className="w-full mb-6 group"
            >
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex items-center gap-5 hover:border-blue-400 hover:bg-blue-50/40 transition-all">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-500/25">
                  <Plus size={28} />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    Start from Scratch
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Build a custom workflow from the ground up with a blank canvas.
                  </p>
                </div>
                <ArrowRight size={20} className="text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </div>
            </button>

            {/* Section Title */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? 'Templates'}{' '}
                <span className="text-gray-400">({filteredTemplates.length})</span>
              </h2>
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="text-center py-16">
                <Search size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No templates found</p>
                <p className="text-sm text-gray-400 mt-1">Try a different search or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer flex flex-col"
                    onClick={() => openCanvas(template)}
                  >
                    <div className="p-5 flex-1">
                      <div className="flex items-start gap-3.5 mb-3">
                        <div
                          className={`w-10 h-10 rounded-lg ${template.color} flex items-center justify-center text-white flex-shrink-0`}
                        >
                          {template.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{template.name}</h3>
                            {template.popular && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                <Star size={10} className="fill-amber-500 text-amber-500" />
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 pb-4">
                      <button className="w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Use Template
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     VIEW: Workflow List (default)
     ═══════════════════════════════════════════════════ */
  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 mb-4">
          <h1 className="text-2xl font-bold">Workflows</h1>
          <button
            onClick={() => setView('templates')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} />
            Create Workflow
          </button>
        </div>

        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0">
          <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">All</button>
          <button className="px-4 py-2 hover:bg-gray-50 rounded-lg">Active</button>
          <button className="px-4 py-2 hover:bg-gray-50 rounded-lg">Paused</button>
          <button className="px-4 py-2 hover:bg-gray-50 rounded-lg">Draft</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">⚡</div>
          <h2 className="text-xl font-semibold mb-2">No workflows yet</h2>
          <p className="text-gray-600 mb-6">Create your first workflow to automate your conversations</p>
          <button
            onClick={() => setView('templates')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <Plus size={20} />
            Create Workflow
          </button>
        </div>
      </div>
    </div>
  );
};
