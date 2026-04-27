import { Plus, X } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { IconButton } from "../../../../components/ui/button/IconButton";
import { BaseInput, CheckboxInput } from "../../../../components/ui/inputs";
import {
  DateTimeData,
  HttpRequestData,
  SP,
  WaitData,
  genId,
  HTTP_METHODS,
  TIMEZONES,
  WEEKDAYS,
} from "../../workflow.types";
import {
  DurationInput,
  Field,
  InfoBox,
  Section,
  Select,
  Textarea,
  TextInput,
  ToggleRow,
} from "../PanelShell";

export { SendMessageConfig } from "./sendMessageConfig";
export { AskQuestionConfig } from "./askQuestionConfig";
export { AssignToConfig } from "./assignToConfig";
export { BranchConfig } from "./branchConfig";
export { UpdateContactTagConfig } from "./updateContactTagConfig";
export { UpdateContactFieldConfig } from "./updateContactFieldConfig";
export { OpenConversationConfig } from "./openConversationConfig";
export { CloseConversationConfig } from "./CloseConversationConfig";
export { AddCommentConfig } from "./addCommentConfig";
export { JumpToConfig } from "./jumpToConfig";
export { TriggerAnotherWorkflowConfig } from "./triggerAnotherWorkflowConfig";

function formatDay(day: string) {
  return `${day.charAt(0).toUpperCase()}${day.slice(1)}`;
}

export function WaitConfig({ step, onChange }: SP) {
  const data = step.data as WaitData;
  const u = (p: Partial<WaitData>) => onChange({ ...data, ...p });

  return (
    <Section title="Configuration">
      <Field
        label="Wait Duration"
        required
        hint="Maximum 7 days. Total workflow execution cannot exceed 7 days."
      >
        <DurationInput
          value={data.value}
          unit={data.unit}
          onValueChange={(value) => u({ value })}
          onUnitChange={(unit) => u({ unit })}
          max={data.unit === "days" ? 7 : undefined}
        />
      </Field>
      <InfoBox type="warning">
        If the total workflow run time reaches 7 days, the workflow ends
        automatically.
      </InfoBox>
    </Section>
  );
}

export function DateTimeConfig({ step, onChange }: SP) {
  const data = step.data as DateTimeData;
  const u = (p: Partial<DateTimeData>) => onChange({ ...data, ...p });

  const toggleDay = (day: string) => {
    const current = data.businessHours?.[day] ?? {
      enabled: false,
      startTime: "09:00",
      endTime: "18:00",
    };

    u({
      businessHours: {
        ...data.businessHours,
        [day]: { ...current, enabled: !current.enabled },
      },
    });
  };

  const updateDay = (
    day: string,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    const current = data.businessHours?.[day] ?? {
      enabled: true,
      startTime: "09:00",
      endTime: "18:00",
    };

    u({
      businessHours: {
        ...data.businessHours,
        [day]: { ...current, [field]: value },
      },
    });
  };

  return (
    <>
      <Section title="Timezone">
        <Select
          value={data.timezone}
          onChange={(timezone) => u({ timezone })}
          options={TIMEZONES}
        />
      </Section>

      <Section title="Mode">
        <div className="mb-3 flex gap-2">
          {(["business_hours", "date_range"] as const).map((mode) => (
            <div key={mode} className="flex-1">
              <Button
                variant={data.mode === mode ? "dark" : "secondary"}
                size="sm"
                fullWidth
                onClick={() => u({ mode })}
              >
                {mode === "business_hours" ? "Business Hours" : "Date Range"}
              </Button>
            </div>
          ))}
        </div>

        {data.mode === "business_hours" ? (
          <div className="space-y-2">
            {WEEKDAYS.map((day) => {
              const businessHours = data.businessHours?.[day];
              const enabled = businessHours?.enabled ?? false;

              return (
                <div key={day} className="flex items-center gap-2">
                  <div className="w-28 shrink-0">
                    <CheckboxInput
                      checked={enabled}
                      onChange={() => toggleDay(day)}
                      size="sm"
                      label={formatDay(day)}
                    />
                  </div>

                  {enabled ? (
                    <div className="flex flex-1 items-center gap-1">
                      <BaseInput
                        type="time"
                        value={businessHours?.startTime ?? "09:00"}
                        onChange={(event) =>
                          updateDay(day, "startTime", event.target.value)
                        }
                        size="sm"
                      />
                      <span className="text-xs text-gray-300">-</span>
                      <BaseInput
                        type="time"
                        value={businessHours?.endTime ?? "18:00"}
                        onChange={(event) =>
                          updateDay(day, "endTime", event.target.value)
                        }
                        size="sm"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {data.mode === "date_range" ? (
          <div className="space-y-3">
            <Field label="Start Date">
              <TextInput
                type="date"
                value={data.dateRangeStart ?? ""}
                onChange={(dateRangeStart) => u({ dateRangeStart })}
              />
            </Field>
            <Field label="End Date">
              <TextInput
                type="date"
                value={data.dateRangeEnd ?? ""}
                onChange={(dateRangeEnd) => u({ dateRangeEnd })}
              />
            </Field>
          </div>
        ) : null}
      </Section>

      <InfoBox>Contacts outside set hours/range go to the Failure Branch.</InfoBox>
    </>
  );
}

export function HttpRequestConfig({ step, onChange }: SP) {
  const data = step.data as HttpRequestData;
  const u = (p: Partial<HttpRequestData>) => onChange({ ...data, ...p });

  const addHeader = () => {
    if (data.headers.length < 10) {
      u({ headers: [...data.headers, { id: genId(), key: "", value: "" }] });
    }
  };
  const updateHeader = (
    id: string,
    field: "key" | "value",
    value: string,
  ) =>
    u({
      headers: data.headers.map((header) =>
        header.id === id ? { ...header, [field]: value } : header,
      ),
    });
  const deleteHeader = (id: string) =>
    u({ headers: data.headers.filter((header) => header.id !== id) });

  const addMapping = () => {
    if (data.responseMappings.length < 10) {
      u({
        responseMappings: [
          ...data.responseMappings,
          { id: genId(), jsonKey: "", variableName: "" },
        ],
      });
    }
  };
  const updateMapping = (
    id: string,
    field: "jsonKey" | "variableName",
    value: string,
  ) =>
    u({
      responseMappings: data.responseMappings.map((mapping) =>
        mapping.id === id ? { ...mapping, [field]: value } : mapping,
      ),
    });
  const deleteMapping = (id: string) =>
    u({
      responseMappings: data.responseMappings.filter(
        (mapping) => mapping.id !== id,
      ),
    });

  return (
    <>
      <Section title="Request">
        <Field label="Method" required>
          <div className="flex flex-wrap gap-1">
            {HTTP_METHODS.map((method) => (
              <Button
                key={method}
                variant={data.method === method ? "dark" : "secondary"}
                size="xs"
                onClick={() =>
                  u({ method: method as HttpRequestData["method"] })
                }
              >
                {method}
              </Button>
            ))}
          </div>
        </Field>

        <Field
          label="URL"
          required
          hint="Include http:// or https://. Supports $variables."
        >
          <TextInput
            value={data.url}
            onChange={(url) => u({ url })}
            placeholder="https://api.example.com/endpoint"
          />
        </Field>

        {["POST", "PUT", "PATCH"].includes(data.method) ? (
          <>
            <Field label="Content-Type">
              <Select
                value={data.contentType ?? "application/json"}
                onChange={(contentType) => u({ contentType })}
                options={[
                  { value: "application/json", label: "application/json" },
                  {
                    value: "application/x-www-form-urlencoded",
                    label: "form-urlencoded",
                  },
                  { value: "text/plain", label: "text/plain" },
                ]}
              />
            </Field>
            <Field label="Body">
              <Textarea
                value={data.body ?? ""}
                onChange={(body) => u({ body })}
                placeholder='{"key": "value"}'
                rows={4}
              />
            </Field>
          </>
        ) : null}
      </Section>

      <Section
        title={`Headers (${data.headers.length}/10)`}
        collapsible
        defaultOpen={data.headers.length > 0}
      >
        <div className="space-y-2">
          {data.headers.map((header) => (
            <div key={header.id} className="flex items-center gap-2">
              <TextInput
                value={header.key}
                onChange={(value) => updateHeader(header.id, "key", value)}
                placeholder="Name"
                className="flex-1"
              />
              <TextInput
                value={header.value}
                onChange={(value) => updateHeader(header.id, "value", value)}
                placeholder="Value"
                className="flex-1"
              />
              <IconButton
                aria-label="Remove header"
                icon={<X size={12} />}
                variant="danger-ghost"
                size="xs"
                onClick={() => deleteHeader(header.id)}
              />
            </div>
          ))}

          {data.headers.length < 10 ? (
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              leftIcon={<Plus size={12} />}
              onClick={addHeader}
            >
              Add Header
            </Button>
          ) : null}
        </div>
      </Section>

      <Section
        title={`Response Mapping (${data.responseMappings.length}/10)`}
        collapsible
        defaultOpen={data.responseMappings.length > 0}
      >
        <InfoBox>Map JSON response keys to variables. Use $.field syntax.</InfoBox>
        <div className="mt-3 space-y-2">
          {data.responseMappings.map((mapping) => (
            <div key={mapping.id} className="flex items-center gap-2">
              <TextInput
                value={mapping.jsonKey}
                onChange={(value) =>
                  updateMapping(mapping.id, "jsonKey", value)
                }
                placeholder="$.phone"
                className="flex-1"
              />
              <span className="shrink-0 text-xs text-gray-300">- $</span>
              <TextInput
                value={mapping.variableName}
                onChange={(value) =>
                  updateMapping(mapping.id, "variableName", value)
                }
                placeholder="variable"
                className="flex-1"
              />
              <IconButton
                aria-label="Remove mapping"
                icon={<X size={12} />}
                variant="danger-ghost"
                size="xs"
                onClick={() => deleteMapping(mapping.id)}
              />
            </div>
          ))}

          {data.responseMappings.length < 10 ? (
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              leftIcon={<Plus size={12} />}
              onClick={addMapping}
            >
              Add Mapping
            </Button>
          ) : null}
        </div>
      </Section>

      <Section title="Response Status" collapsible defaultOpen={false}>
        <ToggleRow
          label="Save response status as variable"
          description="Saves HTTP status code (e.g. 200, 404)"
          checked={data.saveResponseStatus}
          onChange={(saveResponseStatus) => u({ saveResponseStatus })}
        />
        {data.saveResponseStatus ? (
          <div className="mt-2">
            <TextInput
              value={data.responseStatusVariableName ?? ""}
              onChange={(responseStatusVariableName) =>
                u({ responseStatusVariableName })
              }
              placeholder="e.g. api_status_code"
            />
          </div>
        ) : null}
      </Section>
    </>
  );
}
