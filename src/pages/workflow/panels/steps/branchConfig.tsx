import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlignStartVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  Plus,
  Trash2,
} from "@/components/ui/icons";
import { Button } from "../../../../components/ui/Button";
import { IconButton } from "../../../../components/ui/button/IconButton";
import { BaseInput } from "../../../../components/ui/inputs/BaseInput";
import { BaseSelect, WorkspaceTagManager } from "../../../../components/ui/select";
import { Tooltip } from "../../../../components/ui/Tooltip";
import {
  ALL_OPERATORS,
  ASSIGNEE_STATUS_OPTIONS,
  BRANCH_CATS,
  NO_VALUE_OPS,
  OPERATORS_BY_CAT,
  OUTGOING_SOURCE_OPTIONS,
  SP,
  SUB_FIELDS,
  TIME_OPS,
  TIME_UNITS,
  type BranchCategory,
  type BranchCondition,
  type ConditionOperator,
  type StepConfig,
  type Tag,
} from "../../workflow.types";
import { useWorkflow } from "../../WorkflowContext";
import { workspaceApi } from "../../../../lib/workspaceApi";
import { isElseBranchConnector } from "../../canvas/branchConnectors";

type BranchConnectorStep = StepConfig & {
  parentId?: string;
  data: StepConfig["data"] & {
    conditions?: BranchCondition[];
    isElse?: boolean;
  };
};

function getConnectorIds(step: StepConfig, connectors: BranchConnectorStep[]) {
  const data = step.data as { connectors?: string[] };
  return data.connectors ?? connectors.map((connector) => connector.id);
}

function Select<T extends string>({
  value,
  options,
  onChange,
  placeholder = "Select...",
  className = "",
}: {
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <BaseSelect
        value={value}
        options={options}
        onChange={(nextValue) => onChange(nextValue as T)}
        placeholder={placeholder}
        size="xs"
      />
    </div>
  );
}

function TagSelect({
  values,
  tags,
  loading,
  onChange,
  className = "mt-1.5",
}: {
  values: string[];
  tags: Tag[];
  loading: boolean;
  onChange: (v: string[]) => void;
  className?: string;
}) {
  const options = useMemo(() => {
    const mapped = tags.map((tag) => ({
      value: tag.id,
      label: tag.name,
      color: tag.color,
    }));
    const existingValues = new Set(mapped.map((option) => option.value));

    values.forEach((value) => {
      if (!existingValues.has(value)) {
        mapped.unshift({
          value,
          label: value,
        });
      }
    });

    return mapped;
  }, [tags, values]);

  return (
    <div className={className}>
      <WorkspaceTagManager
        label="Tags"
        options={options}
        value={values}
        onChange={onChange}
        searchPlaceholder="Search tags"
        emptyMessage={loading ? "Loading tags..." : "No tags found"}
        selectedAppearance="tag"
        optionAppearance="tag"
        clearActionLabel="Clear all"
        emptySelectedContent={
          <p className="text-xs text-gray-400">No tags selected.</p>
        }
      />
    </div>
  );
}

function DateTimeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <BaseInput
      type="datetime-local"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      size="sm"
    />
  );
}

function ValueInput({
  operator,
  category,
  value,
  onChange,
  tags,
  tagsLoading,
  flushTop = false,
}: {
  operator: ConditionOperator;
  category: BranchCategory;
  value: string | string[] | number;
  onChange: (v: string | string[] | number) => void;
  tags: Tag[];
  tagsLoading: boolean;
  flushTop?: boolean;
}) {
  const [touched, setTouched] = useState(false);
  const fieldClassName = flushTop ? "" : "mt-1.5";

  if (NO_VALUE_OPS.includes(operator)) {
    return null;
  }

  const strVal = String(value ?? "");
  const isEmpty = strVal.trim() === "" && !Array.isArray(value);
  const showError = touched && isEmpty && !Array.isArray(value);

  if (category === "contact_tags") {
    return (
      <TagSelect
        values={Array.isArray(value) ? value : []}
        tags={tags}
        loading={tagsLoading}
        onChange={onChange}
        className={fieldClassName}
      />
    );
  }

  if (category === "assignee_status") {
    return (
      <div className={fieldClassName}>
        <Select
          value={strVal as any}
          options={ASSIGNEE_STATUS_OPTIONS as any}
          onChange={onChange as any}
          placeholder="Select status..."
        />
      </div>
    );
  }

  if (category === "last_outgoing_message_source") {
    return (
      <div className={fieldClassName}>
        <Select
          value={strVal as any}
          options={OUTGOING_SOURCE_OPTIONS as any}
          onChange={onChange as any}
          placeholder="Select source..."
        />
      </div>
    );
  }

  if (operator === "is_between") {
    const parts = strVal.includes("|") ? strVal.split("|") : [strVal, ""];

    return (
      <div className={`${fieldClassName} flex items-center gap-1.5`}>
        <BaseInput
          type="number"
          value={parts[0]}
          onChange={(event) => onChange(`${event.target.value}|${parts[1]}`)}
          placeholder="From"
          size="sm"
          className="flex-1"
        />
        <span className="text-xs text-gray-400">-</span>
        <BaseInput
          type="number"
          value={parts[1]}
          onChange={(event) => onChange(`${parts[0]}|${event.target.value}`)}
          placeholder="To"
          size="sm"
          className="flex-1"
        />
      </div>
    );
  }

  if (operator === "is_timestamp_between") {
    const parts = strVal.includes("|") ? strVal.split("|") : [strVal, ""];

    return (
      <div className={`${fieldClassName} flex flex-col gap-1.5`}>
        <DateTimeInput
          value={parts[0]}
          onChange={(nextValue) => onChange(`${nextValue}|${parts[1]}`)}
        />
        <DateTimeInput
          value={parts[1]}
          onChange={(nextValue) => onChange(`${parts[0]}|${nextValue}`)}
        />
      </div>
    );
  }

  if (operator === "is_between_time") {
    const parts = strVal.includes("|")
      ? strVal.split("|")
      : [strVal, "", "minutes"];

    return (
      <div className={`${fieldClassName} flex items-center gap-1.5`}>
        <BaseInput
          type="number"
          min={0}
          value={parts[0]}
          onChange={(event) =>
            onChange(`${event.target.value}|${parts[1]}|${parts[2]}`)
          }
          placeholder="From"
          size="sm"
          className="flex-1"
        />
        <span className="text-xs text-gray-400">-</span>
        <BaseInput
          type="number"
          min={0}
          value={parts[1]}
          onChange={(event) =>
            onChange(`${parts[0]}|${event.target.value}|${parts[2]}`)
          }
          placeholder="To"
          size="sm"
          className="flex-1"
        />
        <Select
          value={parts[2] as any}
          options={TIME_UNITS as any}
          onChange={(unit) => onChange(`${parts[0]}|${parts[1]}|${unit}`)}
          className="w-24"
        />
      </div>
    );
  }

  if (TIME_OPS.includes(operator)) {
    const parts = strVal.includes("|") ? strVal.split("|") : [strVal, "minutes"];

    return (
      <div className={`${fieldClassName} flex items-center gap-1.5`}>
        <BaseInput
          type="number"
          min={0}
          value={parts[0]}
          onChange={(event) => onChange(`${event.target.value}|${parts[1]}`)}
          onBlur={() => setTouched(true)}
          placeholder="Amount"
          size="sm"
          className="flex-1"
        />
        <Select
          value={parts[1] as any}
          options={TIME_UNITS as any}
          onChange={(unit) => onChange(`${parts[0]}|${unit}`)}
          className="w-28"
        />
      </div>
    );
  }

  if (["is_timestamp_after", "is_timestamp_before"].includes(operator)) {
    return (
      <div className={fieldClassName}>
        <DateTimeInput value={strVal} onChange={onChange as any} />
      </div>
    );
  }

  return (
    <div className={fieldClassName}>
      <BaseInput
        type="text"
        value={strVal}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="Value"
        invalid={showError}
        size="sm"
      />
      {showError ? (
        <p className="mt-0.5 text-xs text-red-500">This field is required</p>
      ) : null}
    </div>
  );
}

function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setTags(await workspaceApi.getTags());
    } catch {
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { tags, loading };
}

function ConditionRow({
  cond,
  showLogic,
  onUpdate,
  onRemove,
  tags,
  tagsLoading,
}: {
  cond: BranchCondition;
  showLogic: boolean;
  onUpdate: (patch: Partial<BranchCondition>) => void;
  onRemove: () => void;
  tags: Tag[];
  tagsLoading: boolean;
}) {
  const { state } = useWorkflow();
  const variables =
    state.workflow?.config?.steps
      ?.map((step) => step?.data?.variableName)
      ?.filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      ) ?? [];

  const subFields =
    variables.length > 0
      ? variables.map((value) => ({ value, label: value }))
      : SUB_FIELDS[cond.category];

  const hasSubField = Boolean(subFields?.length);
  const availableOpValues = OPERATORS_BY_CAT[cond.category] ?? [];
  const operators = ALL_OPERATORS.filter((option) =>
    availableOpValues.includes(option.value),
  );

  const handleCategoryChange = (category: BranchCategory) => {
    const nextOpValues = OPERATORS_BY_CAT[category] ?? [];
    const nextOps = ALL_OPERATORS.filter((option) =>
      nextOpValues.includes(option.value),
    );

    onUpdate({
      category,
      field: "",
      operator: nextOps[0]?.value ?? "is_equal_to",
      value: "",
    });
  };

  return (
    <div className="space-y-1.5">
      {showLogic ? (
        <div className="flex items-center gap-1 py-1">
          {(["AND", "OR"] as const).map((operator) => (
            <Button
              key={operator}
              onClick={() => onUpdate({ logicalOperator: operator })}
              variant={
                (cond.logicalOperator ?? "AND") === operator
                  ? "soft-primary"
                  : "secondary"
              }
              size="2xs"
            >
              {operator === "AND" ? "And" : "Or"}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-[minmax(0,1fr)_2.25rem] gap-x-1.5 gap-y-1.5">
        <div className="min-w-0">
          <Select
            value={cond.category}
            options={BRANCH_CATS}
            onChange={handleCategoryChange}
            placeholder="Category"
            className="w-full"
          />
        </div>

        <div className="flex justify-end">
          <IconButton
            aria-label="Remove condition"
            icon={<Trash2 size={12} className="text-red-500" />}
            variant="secondary"
            size="xs"
            onClick={onRemove}
          />
        </div>

        {hasSubField ? (
          <div className="col-start-1 min-w-0">
            <Select
              value={(cond.field ?? "") as string}
              options={subFields as any}
              onChange={(field) => onUpdate({ field })}
              placeholder="Field..."
              className="w-full"
            />
          </div>
        ) : null}

        <div className="col-start-1 min-w-0">
          <Select
            value={cond.operator}
            options={operators}
            onChange={(operator) => onUpdate({ operator, value: "" })}
            placeholder="Operator"
            className="w-full"
          />
        </div>

        <div className="col-start-1 min-w-0">
          <ValueInput
            operator={cond.operator}
            category={cond.category}
            value={cond.value}
            onChange={(nextValue) => onUpdate({ value: nextValue })}
            tags={tags}
            tagsLoading={tagsLoading}
            flushTop
          />
        </div>
      </div>
    </div>
  );
}

function BranchCard({
  conn,
  canClone,
  onRename,
  onClone,
  onRemove,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  tags,
  tagsLoading,
}: {
  conn: BranchConnectorStep;
  canClone: boolean;
  onRename: (name: string) => void;
  onClone: () => void;
  onRemove: () => void;
  onAddCondition: () => void;
  onUpdateCondition: (id: string, patch: Partial<BranchCondition>) => void;
  onRemoveCondition: (id: string) => void;
  tags: Tag[];
  tagsLoading: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conn.name);
  const conditions: BranchCondition[] = conn.data?.conditions ?? [];

  return (
    <div className="rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2.5">
        <AlignStartVertical
          size={14}
          className="shrink-0 text-gray-400"
        />

        {editing ? (
          <div className="min-w-0 flex-1">
            <BaseInput
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => {
                onRename(draft || conn.name);
                setEditing(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onRename(draft);
                  setEditing(false);
                }

                if (event.key === "Escape") {
                  setEditing(false);
                }
              }}
              appearance="inline-edit"
              size="sm"
            />
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <Tooltip content="Double-click to rename">
              <span
                className="block cursor-pointer select-none truncate text-sm font-medium text-gray-700"
                onDoubleClick={() => {
                  setDraft(conn.name);
                  setEditing(true);
                }}
              >
                {conn.name}
              </span>
            </Tooltip>
          </div>
        )}

        <Tooltip content="Clone branch">
          <IconButton
            aria-label="Clone branch"
            icon={<Copy size={13} />}
            variant="ghost"
            size="xs"
            onClick={onClone}
            disabled={!canClone}
          />
        </Tooltip>

        <Tooltip content="Delete branch">
          <IconButton
            aria-label="Delete branch"
            icon={<Trash2 size={13} />}
            variant="danger-ghost"
            size="xs"
            onClick={onRemove}
          />
        </Tooltip>

        <IconButton
          aria-label={open ? "Collapse branch" : "Expand branch"}
          icon={
            open ? (
              <ChevronUp size={13} />
            ) : (
              <ChevronDown size={13} />
            )
          }
          variant="ghost"
          size="xs"
          onClick={() => setOpen((current) => !current)}
        />
      </div>

      {open ? (
        <div className="space-y-1 p-3">
          {conditions.length === 0 ? (
            <p className="py-1 text-xs italic text-gray-400">
              No conditions - always matches.
            </p>
          ) : null}

          {conditions.map((cond, conditionIndex) => (
            <ConditionRow
              key={cond.id}
              cond={cond}
              showLogic={conditionIndex > 0}
              onUpdate={(patch) => onUpdateCondition(cond.id, patch)}
              onRemove={() => onRemoveCondition(cond.id)}
              tags={tags}
              tagsLoading={tagsLoading}
            />
          ))}

          {conditions.length < 10 ? (
            <Button
              variant="secondary"
              size="xs"
              leftIcon={<Plus size={12} />}
              onClick={onAddCondition}
            >
              Add filter
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function BranchConfig({ step, onChange }: SP) {
  const { state, addStep, deleteStep, updateStep } = useWorkflow();
  const { tags, loading: tagsLoading } = useTags();

  const connectors = (state.workflow?.config?.steps ?? []).filter(
    (candidate) =>
      candidate.parentId === step.id && candidate.type === "branch_connector",
  ) as BranchConnectorStep[];
  const branchConnectors = connectors.filter(
    (connector, index) => !isElseBranchConnector(connector, index, connectors),
  );
  const elseConnector = connectors.find((connector, index) =>
    isElseBranchConnector(connector, index, connectors),
  );

  const uid = () =>
    `conn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

  const addConnector = () => {
    if (branchConnectors.length >= 9) {
      return;
    }

    const id = uid();
    const existingConnectorIds = getConnectorIds(step, connectors);
    const nextConnectorIds = elseConnector
      ? [
          ...existingConnectorIds.filter((connectorId) => connectorId !== elseConnector.id),
          id,
          elseConnector.id,
        ]
      : [...existingConnectorIds, id];

    addStep({
      id,
      type: "branch_connector",
      name: `Branch ${branchConnectors.length + 1}`,
      parentId: step.id,
      data: { conditions: [] },
      position: { x: 0, y: 0 },
    });

    updateStep({
      ...step,
      data: {
        ...step.data,
        connectors: nextConnectorIds,
      },
    });
  };

  const removeConnector = (id: string) => {
    const steps = state.workflow?.config?.steps ?? [];
    const collectDescendantIds = (parentId: string): string[] =>
      steps
        .filter((candidate) => candidate.parentId === parentId)
        .flatMap((child) => [child.id, ...collectDescendantIds(child.id)]);

    collectDescendantIds(id).forEach((childId) => deleteStep(childId));

    deleteStep(id);

    updateStep({
      ...step,
      data: {
        ...step.data,
        connectors: getConnectorIds(step, connectors).filter(
          (connectorId) => connectorId !== id,
        ),
      },
    });
  };

  const cloneConnector = (conn: BranchConnectorStep) => {
    if (branchConnectors.length >= 9) {
      return;
    }

    const id = uid();
    const existingConnectorIds = getConnectorIds(step, connectors);
    const nextConnectorIds = elseConnector
      ? [
          ...existingConnectorIds.filter((connectorId) => connectorId !== elseConnector.id),
          id,
          elseConnector.id,
        ]
      : [...existingConnectorIds, id];

    addStep({
      ...conn,
      id,
      name: `${conn.name} (copy)`,
      parentId: step.id,
      data: {
        ...conn.data,
        conditions: (conn.data?.conditions ?? []).map((condition) => ({
          ...condition,
          id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        })),
        isElse: false,
      },
      position: { x: 0, y: 0 },
    });

    updateStep({
      ...step,
      data: {
        ...step.data,
        connectors: nextConnectorIds,
      },
    });
  };

  const renameConnector = (id: string, name: string) => {
    const connector = connectors.find((candidate) => candidate.id === id);
    if (connector) {
      updateStep({ ...connector, name });
    }
  };

  const addCondition = (connId: string) => {
    const connector = connectors.find((candidate) => candidate.id === connId);
    if (!connector) {
      return;
    }

    const conditions = connector.data?.conditions ?? [];
    const firstCategory: BranchCategory = "contact_field";
    const firstOperator = OPERATORS_BY_CAT[firstCategory][0];

    updateStep({
      ...connector,
      data: {
        ...connector.data,
        conditions: [
          ...conditions,
          {
            id: `cond-${Date.now()}`,
            category: firstCategory,
            operator: firstOperator,
            value: "",
            logicalOperator:
              conditions.length > 0 ? ("AND" as const) : undefined,
          },
        ],
      },
    });
  };

  const updateCondition = (
    connId: string,
    condId: string,
    patch: Partial<BranchCondition>,
  ) => {
    const connector = connectors.find((candidate) => candidate.id === connId);
    if (!connector) {
      return;
    }

    updateStep({
      ...connector,
      data: {
        ...connector.data,
        conditions: (connector.data?.conditions ?? []).map(
          (condition: BranchCondition) =>
            condition.id === condId ? { ...condition, ...patch } : condition,
        ),
      },
    });
  };

  const removeCondition = (connId: string, condId: string) => {
    const connector = connectors.find((candidate) => candidate.id === connId);
    if (!connector) {
      return;
    }

    updateStep({
      ...connector,
      data: {
        ...connector.data,
        conditions: (connector.data?.conditions ?? []).filter(
          (condition: BranchCondition) => condition.id !== condId,
        ),
      },
    });
  };

  void onChange;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <p className="min-w-0 text-xs text-gray-500">
          Each branch is a path. Contacts matching no branch go to Else.
        </p>

        {branchConnectors.length < 9 ? (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={13} />}
            onClick={addConnector}
            className="shrink-0"
          >
            Add Branch
          </Button>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        {branchConnectors.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            No branches yet - click <strong>Add Branch</strong> to get started.
          </div>
        ) : null}

        {branchConnectors.map((conn) => (
          <BranchCard
            key={conn.id}
            conn={conn}
            canClone={branchConnectors.length < 9}
            onRename={(name) => renameConnector(conn.id, name)}
            onClone={() => cloneConnector(conn)}
            onRemove={() => removeConnector(conn.id)}
            onAddCondition={() => addCondition(conn.id)}
            onUpdateCondition={(cid, patch) =>
              updateCondition(conn.id, cid, patch)
            }
            onRemoveCondition={(cid) => removeCondition(conn.id, cid)}
            tags={tags}
            tagsLoading={tagsLoading}
          />
        ))}

        <div
          className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2.5"
          title={elseConnector ? "Else path is available on the canvas" : "Fallback path will be created for new branch nodes"}
        >
          <span className="text-xs font-semibold text-gray-400">Else</span>
          <span className="text-xs text-gray-400">
            - fallback if no branch matches
          </span>
        </div>
      </div>
    </div>
  );
}
