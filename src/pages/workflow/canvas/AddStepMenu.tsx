import { useEffect, useState } from 'react';
import { CenterModal, MobileSheet } from '../../../components/ui/modal';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { STEP_LIST, STEPS_BY_CATEGORY, type StepMeta } from './stepTypes';
import type { StepType } from '../workflow.types';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/ui/inputs';
import { Tag } from '../../../components/ui/Tag';

interface AddStepMenuProps {
  isOpen: boolean;
  onSelect: (type: StepType) => void;
  onClose: () => void;
}

export function AddStepMenu({ isOpen, onSelect, onClose }: AddStepMenuProps) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setActiveCategory('all');
    }
  }, [isOpen]);

  const filtered: StepMeta[] = search
    ? STEP_LIST.filter((s) =>
        s.label.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()),
      )
    : activeCategory === 'all'
      ? STEP_LIST
      : STEP_LIST.filter((s) => s.category === activeCategory);

  const categories = [
    { id: 'all', label: 'All' },
    ...STEPS_BY_CATEGORY
      .filter((c) => c.steps?.length > 0)
      .map((c) => ({ id: c.id, label: c.label })),
  ];
  const contentHeightClass = isMobile
    ? 'h-full'
    : 'max-h-[min(420px,calc(100vh-10rem))]';

  const content = (
    <div className={`flex min-h-0 flex-col overflow-hidden ${contentHeightClass}`}>
      <div className="border-b border-gray-100 px-3 py-2.5">
        <SearchInput
          autoFocus={isOpen}
          placeholder="Search steps..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          appearance="toolbar"
          size="sm"
          searchIconSize={13}
          onClear={() => setSearch('')}
          clearAriaLabel="Clear step search"
        />

        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSearch('');
              }}
              variant={activeCategory === cat.id && !search ? 'soft-primary' : 'soft'}
              selected={activeCategory === cat.id && !search}
              size="xs"
              radius="full"
              className="flex-shrink-0"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1.5">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">No steps found</div>
        ) : (
          filtered.map((step) => {
            const { Icon } = step;
            const color = step.color;

            return (
              <Button
                key={step.type}
                onClick={() => {
                  onSelect(step.type);
                  onClose();
                }}
                variant="inherit-ghost"
                radius="none"
                fullWidth
                contentAlign="start"
                preserveChildLayout
                className="group"
              >
                <div className="flex w-full items-center gap-3 text-left">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center transition-transform group-hover:scale-[1.04]">
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{step.label}</p>
                      {step.upgradeRequired ? <Tag label="Upgrade" bgColor="gray" size="sm" /> : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-400">{step.description}</p>
                  </div>
                </div>
              </Button>
            );
          })
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileSheet
        isOpen={isOpen}
        onClose={onClose}
        fullScreen
        title={
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Workflow
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">Add step</h2>
          </div>
        }
      >
        {content}
      </MobileSheet>
    );
  }

  return (
    <CenterModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Step"
      size="md"
      width={480}
      bodyPadding="none"
    >
      {content}
    </CenterModal>
  );
}
