import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Users } from "@/components/ui/icons";
import { Avatar } from "../../../components/ui/Avatar";
import { AvatarGroup } from "../../../components/ui/avatar/AvatarGroup";
import { Button } from "../../../components/ui/Button";
import { IconButton } from "../../../components/ui/button/IconButton";
import { CheckboxInput } from "../../../components/ui/inputs/CheckboxInput";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";
import { TextareaInput } from "../../../components/ui/inputs/TextareaInput";
import { CenterModal } from "../../../components/ui/modal/CenterModal";
import { Tag } from "../../../components/ui/Tag";
import { Tooltip } from "../../../components/ui/Tooltip";
import { TruncatedText } from "../../../components/ui/TruncatedText";
import { workspaceApi } from "../../../lib/workspaceApi";
import { DataLoader } from "../../Loader";
import { SectionError } from "../components/SectionError";
import type { Team, TeamMember } from "../types";

interface TeamModalProps {
  team: Team | null;
  members: TeamMember[];
  onClose: () => void;
  onSave: (name: string, description: string, memberIds: string[]) => Promise<void>;
}

const getRoleColor = (role: string) => {
  if (role === "Admin") return "tag-purple";
  if (role === "Manager") return "tag-blue";
  return "gray";
};

const TeamModal = ({ team, members, onClose, onSave }: TeamModalProps) => {
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(team?.memberIds ?? []),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Team name is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim(), description.trim(), [...selected]);
      onClose();
    } catch {
      setError("Failed to save team.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CenterModal
      isOpen
      onClose={onClose}
      title={team ? "Edit team" : "Create team"}
      size="md"
      secondaryAction={
        <Button onClick={onClose} variant="secondary">
          Cancel
        </Button>
      }
      primaryAction={
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          loading={saving}
          loadingMode="inline"
        >
          {saving ? "Saving..." : team ? "Save changes" : "Create team"}
        </Button>
      }
    >
      <div className="space-y-5">
        <BaseInput
          label="Team name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Support, Sales, Technical"
          required
        />

        <TextareaInput
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What does this team handle?"
          rows={2}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">
            Members <span className="font-normal text-gray-400">({selected.size} selected)</span>
          </p>
          <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200 p-1">
            {members.map((member) => {
              const isSelected = selected.has(member.id);
              return (
                <CheckboxInput
                  key={member.id}
                  checked={isSelected}
                  onChange={() => toggle(member.id)}
                  className={`w-full rounded-lg px-3 py-2 transition-colors ${
                    isSelected ? "bg-[var(--color-primary-light)]" : "hover:bg-gray-50"
                  }`}
                  label={
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={member.name} size="xs" fallbackTone="primary" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-800">
                          {member.name}
                        </span>
                        <span className="block truncate text-xs font-normal text-gray-500">
                          {member.email}
                        </span>
                      </span>
                      <Tag label={member.role} size="sm" bgColor={getRoleColor(member.role)} />
                    </span>
                  }
                />
              );
            })}
          </div>
        </div>

        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </div>
    </CenterModal>
  );
};

export const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalTeam, setModalTeam] = useState<Team | null | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextTeams, nextMembers] = await Promise.all([
        workspaceApi.getTeams(),
        workspaceApi.getTeamMembers(),
      ]);
      setTeams(nextTeams);
      setMembers(nextMembers);
    } catch {
      setError("Failed to load teams.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (name: string, description: string, memberIds: string[]) => {
    if (modalTeam) {
      setTeams((prev) =>
        prev.map((team) =>
          team.id === modalTeam.id ? { ...team, name, description, memberIds } : team,
        ),
      );
      await workspaceApi.updateTeam(modalTeam.id, { name, description, memberIds });
    } else {
      const newTeam = await workspaceApi.createTeam({ name, description, memberIds });
      setTeams((prev) => [...prev, newTeam]);
    }
  };

  const handleDelete = async (id: string) => {
    setTeams((prev) => prev.filter((team) => team.id !== id));
    try {
      await workspaceApi.deleteTeam(id);
    } catch {
      void load();
    }
  };

  const getMemberById = (id: string) => members.find((member) => member.id === id);

  if (loading) return <DataLoader type="teams" />;
  if (error && teams.length === 0) return <SectionError message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Teams</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {teams.length} team{teams.length !== 1 ? "s" : ""} - Organise agents into groups for routing and reporting
            </p>
          </div>
          <Button onClick={() => setModalTeam(null)} leftIcon={<Plus size={16} />}>
            Create team
          </Button>
        </div>

        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)]">
              <Users size={22} className="text-[var(--color-primary)]" />
            </div>
            <p className="mb-1 text-sm font-medium text-gray-700">No teams yet</p>
            <p className="max-w-xs text-xs text-gray-500">
              Create your first team to organise agents and route conversations more efficiently.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {teams.map((team) => {
              const teamMembers = team.memberIds
                .map(getMemberById)
                .filter(Boolean) as TeamMember[];
              return (
                <div key={team.id} className="group flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-light)]">
                    <Users size={18} className="text-[var(--color-primary)]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{team.name}</p>
                    {team.description ? (
                      <TruncatedText
                        text={team.description}
                        maxLines={1}
                        className="mt-0.5 text-xs text-gray-500"
                      />
                    ) : null}
                    <div className="mt-2 flex items-center gap-1.5">
                      <AvatarGroup
                        avatars={teamMembers.map((member) => ({
                          name: member.name,
                          alt: member.name,
                          fallbackTone: "primary",
                        }))}
                        size="sm"
                        max={5}
                      />
                      <span className="text-xs text-gray-500">
                        {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <Tooltip content="Edit team">
                      <IconButton
                        onClick={() => setModalTeam(team)}
                        icon={<Pencil size={15} />}
                        variant="ghost"
                        size="xs"
                        aria-label="Edit team"
                      />
                    </Tooltip>
                    <Tooltip content="Delete team">
                      <IconButton
                        onClick={() => handleDelete(team.id)}
                        icon={<Trash2 size={15} />}
                        variant="danger-ghost"
                        size="xs"
                        aria-label="Delete team"
                      />
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {modalTeam !== undefined ? (
        <TeamModal
          team={modalTeam}
          members={members}
          onClose={() => setModalTeam(undefined)}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
};
