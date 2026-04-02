import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { STEP_LIST, STEPS_BY_CATEGORY, StepMeta } from './stepTypes';
import { StepType } from '../workflow.types';

interface AddStepMenuProps {
  onSelect: (type: StepType) => void;
  onClose: () => void;
}

export function AddStepMenu({ onSelect, onClose }: AddStepMenuProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const filtered: StepMeta[] = search
    ? STEP_LIST.filter((s) =>
        s.label.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      )
    : activeCategory === 'all'
    ? STEP_LIST
    : STEP_LIST.filter((s) => s.category === activeCategory);

  const categories = [
    { id: 'all', label: 'All' },
    ...STEPS_BY_CATEGORY.filter((c) => c.steps?.length > 0).map((c) => ({ id: c.id, label: c.label })),
  ];

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-[480px] max-h-[520px] flex flex-col overflow-hidden"
      style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-900">Add Step</span>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
          <X size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-gray-100">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search steps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Category sidebar */}
        {/* {!search && (
          <div className="w-36 border-r border-gray-100 overflow-y-auto py-1.5 flex-shrink-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )} */}

        {/* Steps */}
        <div className="flex-1 overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">No steps found</div>
          ) : (
            filtered.map((step) => {
              const { Icon } = step;
              return (
                <button
                  key={step.type}
                  onClick={() => { onSelect(step.type); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                    <Icon size={14} className="text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{step.label}</p>
                      {step.upgradeRequired && (
                        <span className="text-[10px] border border-gray-300 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                          Upgrade
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{step.description}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}