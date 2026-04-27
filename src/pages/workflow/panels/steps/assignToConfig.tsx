
// ─── 3. Assign To ─────────────────────────────────────────────────────────────

import { useWorkspace } from "../../../../context/WorkspaceContext";
import { SP, AssignToData } from "../../workflow.types";
import { Field, Select, ToggleRow, TextInput, DurationInput, Section } from "../PanelShell";

export function AssignToConfig({ step, onChange }: SP) {
  const data = step.data as AssignToData;
  const u = (p: Partial<AssignToData>) => onChange({ ...data, ...p });
  const showLogic = data.action === 'user_in_team' || data.action === 'user_in_workspace';

  const {workspaceUsers} = useWorkspace();
  const usersOptions = workspaceUsers?.map(u => ({ value: u.id, label: u.firstName + ' ' + u?.lastName  })) ?? [];
  return (
    <>
      <Section title="Assignment">
        <Field label="Assign To" required>
          <Select value={data.action} onChange={(v) => u({ action: v as AssignToData['action'] })}
            options={[{ value: 'specific_user', label: 'A Specific User' }, 
            // { value: 'user_in_team', label: 'A User in a Team' }, { value: 'user_in_workspace', label: 'A User in the Workspace' }, 
            { value: 'unassign', label: 'Unassign Contact' }]} />
        </Field>
        {data.action === 'specific_user' && <Field label="User" required><Select value={data.userId ?? ''} onChange={(v) => u({ userId: v })} placeholder="Select user..." options={usersOptions} /></Field>}
        {/* {data.action === 'user_in_team'  && <Field label="Team" required><Select value={data.teamId ?? ''} onChange={(v) => u({ teamId: v })} placeholder="Select team..." options={MOCK_TEAMS} /></Field>} */}
        {showLogic && (
          <Field label="Logic" required>
            <Select value={data.assignmentLogic} onChange={(v) => u({ assignmentLogic: v as AssignToData['assignmentLogic'] })}
              options={[{ value: 'round_robin', label: 'Round Robin — distribute equally' }, { value: 'least_open_contacts', label: 'Least Open Contacts — assign to least busy' }]} />
          </Field>
        )}
      </Section>
      {showLogic && (
        <Section title="Advanced" collapsible defaultOpen={false}>
          <ToggleRow label="Online users only" checked={data.onlyOnlineUsers} onChange={(v) => u({ onlyOnlineUsers: v })} />
          <div className="mt-2">
            <ToggleRow label="Limit by open contact count" checked={!!data.maxOpenContacts} onChange={(v) => u({ maxOpenContacts: v ? 10 : undefined })} />
            {data.maxOpenContacts !== undefined && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500 flex-shrink-0">Max open contacts:</span>
                <TextInput type="number" value={String(data.maxOpenContacts)} onChange={(v) => u({ maxOpenContacts: Number(v) })} className="w-24" />
              </div>
            )}
          </div>
          <div className="mt-2">
            <ToggleRow label="Timeout Branch" description="If no assignee found within set time" checked={data.addTimeoutBranch} onChange={(v) => u({ addTimeoutBranch: v })} />
            {data.addTimeoutBranch && <div className="mt-2"><DurationInput value={data.timeoutValue} unit={data.timeoutUnit} onValueChange={(v) => u({ timeoutValue: v })} onUnitChange={(u2) => u({ timeoutUnit: u2 })} max={7} /></div>}
          </div>
        </Section>
      )}
    </>
  );
}
