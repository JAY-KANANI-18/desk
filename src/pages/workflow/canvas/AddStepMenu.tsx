import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { MobileSheet } from '../../../components/topbar/MobileSheet';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { STEP_LIST, STEPS_BY_CATEGORY, StepMeta } from './stepTypes';
import { StepType } from '../workflow.types';

interface AddStepMenuProps {
  onSelect: (type: StepType) => void;
  onClose: () => void;
}

export function AddStepMenu({ onSelect, onClose }: AddStepMenuProps) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isMobile, onClose]);

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

  const content = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-gray-100 px-3 py-2.5">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search steps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setSearch('');
              }}
              className={`inline-flex flex-shrink-0 rounded-2xl px-3 py-2 text-xs font-medium transition-colors ${
                activeCategory === cat.id && !search
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1.5">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">No steps found</div>
        ) : (
          filtered.map((step) => {
            const { Icon } = step;
            return (
              <button
                key={step.type}
                onClick={() => {
                  onSelect(step.type);
                  onClose();
                }}
                className="group flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 transition-colors group-hover:bg-gray-200">
                  <Icon size={15} className="text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800">{step.label}</p>
                    {step.upgradeRequired && (
                      <span className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                        Upgrade
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-400">{step.description}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileSheet
        open
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
    <div
      ref={ref}
      className="fixed z-50 flex max-h-[520px] w-[480px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
      style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="text-sm font-medium text-gray-900">Add Step</span>
        <button onClick={onClose} className="rounded-md p-1 transition-colors hover:bg-gray-100">
          <X size={14} className="text-gray-400" />
        </button>
      </div>

      {content}
    </div>
  );
}
