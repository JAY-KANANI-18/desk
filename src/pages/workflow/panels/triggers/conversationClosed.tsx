import { useState } from "react";
import { Info, Plus, Trash2 } from "@/components/ui/icons";
import { Button } from "../../../../components/ui/Button";
import { DisclosureButton } from "../../../../components/ui/button/DisclosureButton";
import { IconButton } from "../../../../components/ui/button/IconButton";
import { BaseInput } from "../../../../components/ui/inputs";
import { BaseSelect, MultiSelect } from "../../../../components/ui/select";
import type {
  FieldDef,
  Props,
  TriggerCondition,
} from "../../workflow.types";
import {
  FIELD_DEFS_BY_TRIGGER,
  MULTI_OPERATORS,
  SINGLE_OPERATORS,
} from "../../workflow.types";

interface ConditionBuilderProps {
  conditions: TriggerCondition[];
  onChange: (next: TriggerCondition[]) => void;
  triggerType: string;
  emptyMessage?: string;
}

const createId = () => Math.random().toString(36).slice(2, 8);

export function ConditionBuilder({
  conditions,
  onChange,
  triggerType,
  emptyMessage = "No conditions - triggers on every event.",
}: ConditionBuilderProps) {
  const [open, setOpen] = useState(true);
  const fieldDefs: FieldDef[] = FIELD_DEFS_BY_TRIGGER[triggerType] ?? [];

  const getFieldDef = (field: string) =>
    fieldDefs.find((fieldDef) => fieldDef.value === field);

  const add = () => {
    const firstField = fieldDefs[0];
    const withLogic =
      conditions.length > 0
        ? conditions.map((condition, index) =>
            index === conditions.length - 1 && !condition.logicalOperator
              ? { ...condition, logicalOperator: "AND" as const }
              : condition,
          )
        : conditions;

    onChange([
      ...withLogic,
      {
        id: createId(),
        field: firstField?.value ?? "source",
        operator: firstField?.multi ? "has_any_of" : "is_equal_to",
        value: firstField?.multi ? [] : "",
      },
    ]);
  };

  const remove = (id: string) =>
    onChange(conditions.filter((condition) => condition.id !== id));

  const update = (id: string, patch: Partial<TriggerCondition>) =>
    onChange(
      conditions.map((condition) =>
        condition.id === id ? { ...condition, ...patch } : condition,
      ),
    );

  return (
    <div className="border-b border-gray-100">
      <DisclosureButton
        open={open}
        onClick={() => setOpen((value) => !value)}
        appearance="plain"
        tone="primary"
        leadingIcon={
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-700 text-white">
            <Info size={10} />
          </span>
        }
      >
        Trigger Conditions
      </DisclosureButton>

      {open ? (
        <div className="space-y-2 px-4 pb-4">
          {conditions.length === 0 ? (
            <p className="py-1 text-xs italic text-gray-400">
              {emptyMessage}
            </p>
          ) : null}

          {conditions.map((condition, index) => {
            const isLast = index === conditions.length - 1;
            const fieldDef = getFieldDef(condition.field);
            const isMulti = fieldDef?.multi ?? false;
            const operators = isMulti ? MULTI_OPERATORS : SINGLE_OPERATORS;
            const valueOptions = fieldDef?.options ?? [];
            const multiValues = Array.isArray(condition.value)
              ? condition.value
              : [];
            const singleValue =
              typeof condition.value === "string" ? condition.value : "";

            return (
              <div key={condition.id}>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <BaseSelect
                      value={condition.field}
                      options={fieldDefs.map((field) => ({
                        value: field.value,
                        label: field.label,
                      }))}
                      onChange={(value) => {
                        const nextFieldDef = getFieldDef(value);

                        update(condition.id, {
                          field: value,
                          operator: nextFieldDef?.multi
                            ? "has_any_of"
                            : "is_equal_to",
                          value: nextFieldDef?.multi ? [] : "",
                        });
                      }}
                      size="sm"
                    />
                  </div>

                  <div className="w-36 flex-shrink-0">
                    <BaseSelect
                      value={condition.operator}
                      options={operators}
                      onChange={(value) =>
                        update(condition.id, {
                          operator: value as TriggerCondition["operator"],
                        })
                      }
                      size="sm"
                    />
                  </div>

                  <IconButton
                    aria-label="Remove condition"
                    icon={<Trash2 size={13} />}
                    variant="danger-ghost"
                    size="xs"
                    onClick={() => remove(condition.id)}
                  />
                </div>

                {valueOptions.length > 0 ? (
                  <div className="mt-1.5">
                    {isMulti ? (
                      <MultiSelect
                        value={multiValues}
                        options={valueOptions}
                        onChange={(value) =>
                          update(condition.id, { value })
                        }
                        placeholder="Select values..."
                        size="sm"
                      />
                    ) : (
                      <BaseSelect
                        value={singleValue}
                        options={valueOptions}
                        onChange={(value) =>
                          update(condition.id, { value })
                        }
                        placeholder="Select value..."
                        size="sm"
                      />
                    )}
                  </div>
                ) : null}

                {!isMulti && valueOptions.length === 0 ? (
                  <div className="mt-1.5">
                    <BaseInput
                      value={singleValue}
                      onChange={(event) =>
                        update(condition.id, { value: event.target.value })
                      }
                      placeholder="Enter value..."
                      size="sm"
                    />
                  </div>
                ) : null}

                {!isLast ? (
                  <div className="mb-1 mt-2 flex items-center gap-1">
                    {(["AND", "OR"] as const).map((operator) => (
                      <Button
                        key={operator}
                        variant={
                          (condition.logicalOperator ?? "AND") === operator
                            ? "soft-primary"
                            : "secondary"
                        }
                        size="2xs"
                        onClick={() =>
                          update(condition.id, {
                            logicalOperator: operator,
                          })
                        }
                      >
                        {operator === "AND" ? "And" : "Or"}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          <Button
            variant="secondary"
            size="xs"
            leftIcon={<Plus size={13} />}
            onClick={add}
          >
            Add filter
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function ConversationClosedConfig({ trigger, onChange }: Props) {
  return (
    <ConditionBuilder
      triggerType="conversation_closed"
      conditions={trigger.conditions}
      onChange={(conditions) => onChange({ conditions })}
    />
  );
}
