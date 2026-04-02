import {
  Workflow,
  WorkflowStatus,
  WorkflowSettings,
  TriggerConfig,
  StepConfig,
} from './workflow.types';

// ─────────────────────────────────────────────
// In-memory mock store (replace with real API calls)
// ─────────────────────────────────────────────

let mockWorkflows: Workflow[] = [
  {
    id: 'wf-demo-1',
    name: 'Welcome Message',
    description: 'Send a welcome message when a new conversation opens',
    status: 'published',
    trigger: {
      type: 'conversation_opened',
      conditions: [],
      advancedSettings: { triggerOncePerContact: false },
      data: { sources: ['contact'] },
    },
    steps: [],
    settings: {
      allowStopForContact: false,
      exitOnOutgoingMessage: false,
      exitOnIncomingMessage: false,
      exitOnManualAssignment: false,
    },
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastPublishedBy: 'user-1',
    lastPublishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'wf-demo-2',
    name: 'Lead Qualification',
    description: 'Qualify leads based on their responses',
    status: 'draft',
    trigger: null,
    steps: [],
    settings: {
      allowStopForContact: false,
      exitOnOutgoingMessage: false,
      exitOnIncomingMessage: false,
      exitOnManualAssignment: false,
    },
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const generateId = () => `wf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const generateStepId = () => `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─────────────────────────────────────────────
// API FUNCTIONS
// ─────────────────────────────────────────────

export const workflowApi = {
  // LIST
  async list(): Promise<Workflow[]> {
    await delay();
    return [...mockWorkflows];
  },

  // GET ONE
  async get(id: string): Promise<Workflow> {
    await delay();
    const wf = mockWorkflows.find((w) => w.id === id);
    if (!wf) throw new Error(`Workflow ${id} not found`);
    return { ...wf };
  },

  // CREATE
  async create(payload: { name: string; description?: string }): Promise<Workflow> {
    await delay();
    const now = new Date().toISOString();
    const wf: Workflow = {
      id: generateId(),
      name: payload.name,
      description: payload.description ?? '',
      status: 'draft',
      trigger: null,
      steps: [],
      settings: {
        allowStopForContact: false,
        exitOnOutgoingMessage: false,
        exitOnIncomingMessage: false,
        exitOnManualAssignment: false,
      },
      createdBy: 'user-1',
      createdAt: now,
      updatedAt: now,
    };
    mockWorkflows.push(wf);
    return { ...wf };
  },

  // SAVE (full update — trigger + steps)
  async save(
    id: string,
    payload: {
      name?: string;
      description?: string;
      trigger?: TriggerConfig | null;
      steps?: StepConfig[];
      settings?: WorkflowSettings;
    }
  ): Promise<Workflow> {
    await delay();
    const idx = mockWorkflows.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error(`Workflow ${id} not found`);
    mockWorkflows[idx] = {
      ...mockWorkflows[idx],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    return { ...mockWorkflows[idx] };
  },

  // PUBLISH
  async publish(id: string): Promise<Workflow> {
    await delay();
    const idx = mockWorkflows.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error(`Workflow ${id} not found`);
    if (mockWorkflows[idx].status === 'published') throw new Error('Already published');
    const now = new Date().toISOString();
    mockWorkflows[idx] = {
      ...mockWorkflows[idx],
      status: 'published',
      lastPublishedBy: 'user-1',
      lastPublishedAt: now,
      updatedAt: now,
    };
    return { ...mockWorkflows[idx] };
  },

  // STOP
  async stop(id: string): Promise<Workflow> {
    await delay();
    const idx = mockWorkflows.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error(`Workflow ${id} not found`);
    if (mockWorkflows[idx].status !== 'published') throw new Error('Workflow is not published');
    mockWorkflows[idx] = {
      ...mockWorkflows[idx],
      status: 'stopped',
      updatedAt: new Date().toISOString(),
    };
    return { ...mockWorkflows[idx] };
  },

  // CLONE
  async clone(id: string): Promise<Workflow> {
    await delay();
    const original = mockWorkflows.find((w) => w.id === id);
    if (!original) throw new Error(`Workflow ${id} not found`);
    const now = new Date().toISOString();
    const cloned: Workflow = {
      ...JSON.parse(JSON.stringify(original)),
      id: generateId(),
      name: `${original.name} clone`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      lastPublishedBy: undefined,
      lastPublishedAt: undefined,
    };
    mockWorkflows.push(cloned);
    return { ...cloned };
  },

  // DELETE
  async delete(id: string): Promise<void> {
    await delay();
    const wf = mockWorkflows.find((w) => w.id === id);
    if (!wf) throw new Error(`Workflow ${id} not found`);
    if (wf.status === 'published') throw new Error('Cannot delete a published workflow. Stop it first.');
    mockWorkflows = mockWorkflows.filter((w) => w.id !== id);
  },

  // RENAME
  async rename(id: string, name: string, description?: string): Promise<Workflow> {
    await delay(200);
    const idx = mockWorkflows.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error(`Workflow ${id} not found`);
    mockWorkflows[idx] = {
      ...mockWorkflows[idx],
      name,
      description: description ?? mockWorkflows[idx].description,
      updatedAt: new Date().toISOString(),
    };
    return { ...mockWorkflows[idx] };
  },

  // GENERATE STEP ID
  generateStepId,
};

export type { WorkflowStatus };