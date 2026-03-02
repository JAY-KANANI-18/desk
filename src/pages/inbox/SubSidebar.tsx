import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Phone, X } from 'lucide-react';
import { subSidebarItems, lifecycleItems } from './data';

export function SubSidebar() {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('All');

  const q = search.toLowerCase();
  const filteredSubItems = subSidebarItems.filter(i => i.label.toLowerCase().includes(q));
  const filteredLifecycle = lifecycleItems.filter(i => i.label.toLowerCase().includes(q));
  const showIncomingCalls = 'incoming calls'.includes(q);

  return (
    <div className="hidden lg:flex flex-shrink-0">
      <div className={`relative bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${open ? 'w-48' : 'w-12'}`}>
        <button
          onClick={() => { setOpen(!open); if (!open) { setSearchOpen(false); setSearch(''); } }}
          className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
        >
          {open ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        {open ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Inbox</h2>
                <button
                  onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearch(''); }}
                  className={`p-1.5 rounded-lg transition-colors ${searchOpen ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <Search size={16} />
                </button>
              </div>
              {searchOpen && (
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    autoFocus type="text" value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search…"
                    className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                {filteredSubItems.map(item => (
                  <button
                    key={item.label}
                    onClick={() => setActiveItem(item.label)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${activeItem === item.label ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 ${item.dot} rounded-full`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {item.count !== null && <span className="text-xs text-gray-500">{item.count}</span>}
                  </button>
                ))}
                {showIncomingCalls && (
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                    <Phone size={16} /><span className="text-sm">Incoming Calls</span>
                  </button>
                )}
              </div>

              {filteredLifecycle.length > 0 && (
                <div className="mt-4 px-2">
                  <div className="text-xs font-semibold text-gray-500 px-3 mb-2">LIFECYCLE</div>
                  {filteredLifecycle.map(item => (
                    <button
                      key={item.label}
                      onClick={() => setActiveItem(item.label)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${activeItem === item.label ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-4 h-4 ${item.bg} rounded flex items-center justify-center`}>
                        <div className={`w-2 h-2 ${item.dot} rounded`} />
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {search && filteredSubItems.length === 0 && filteredLifecycle.length === 0 && !showIncomingCalls && (
                <p className="text-sm text-gray-400 text-center mt-8">No results</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center pt-4 gap-1 w-full px-1">
            <button onClick={() => setOpen(true)} title="Search" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <Search size={15} />
            </button>
            <div className="w-6 border-t border-gray-200 my-1" />
            {subSidebarItems.map(item => (
              <button key={item.label} title={item.label} onClick={() => { setOpen(true); setActiveItem(item.label); }}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${activeItem === item.label ? 'bg-blue-50' : 'hover:bg-gray-100'}`}>
                <div className={`w-2.5 h-2.5 ${item.dot} rounded-full`} />
              </button>
            ))}
            <div className="w-6 border-t border-gray-200 my-1" />
            {lifecycleItems.map(item => (
              <button key={item.label} title={item.label} onClick={() => { setOpen(true); setActiveItem(item.label); }}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${activeItem === item.label ? 'bg-blue-50' : 'hover:bg-gray-100'}`}>
                <div className={`w-4 h-4 ${item.bg} rounded flex items-center justify-center`}>
                  <div className={`w-2 h-2 ${item.dot} rounded`} />
                </div>
              </button>
            ))}
            <button title="Incoming Calls" onClick={() => setOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <Phone size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
