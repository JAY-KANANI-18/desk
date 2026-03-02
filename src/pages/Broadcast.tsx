import { useState } from 'react';
import { Search, Plus, X, Calendar, MoreVertical } from 'lucide-react';

interface Broadcast {
  id: number;
  name: string;
  status: 'Draft' | 'Scheduled' | 'In Progress' | 'Completed' | 'Failed';
  broadcastTime: string;
  labels: string[];
  channel: string;
  segment: string;
  recipients: number;
  totalMessages: number;
}

export const Broadcast = () => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([
    {
      id: 1,
      name: 'campaign 1',
      status: 'Draft',
      broadcastTime: '-',
      labels: ['test'],
      channel: '-',
      segment: 'All',
      recipients: 0,
      totalMessages: 0,
    },
  ]);

  const [showNewBroadcast, setShowNewBroadcast] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [newBroadcast, setNewBroadcast] = useState({
    name: '',
    labels: [] as string[],
  });

  const statusFilters = [
    { name: 'All', color: 'bg-blue-500' },
    { name: 'Draft', color: 'bg-gray-500' },
    { name: 'Scheduled', color: 'bg-orange-500' },
    { name: 'In Progress', color: 'bg-green-500' },
    { name: 'Completed', color: 'bg-green-600' },
    { name: 'Failed', color: 'bg-red-500' },
  ];

  const handleCreateBroadcast = () => {
    if (newBroadcast.name) {
      const broadcast: Broadcast = {
        id: broadcasts.length + 1,
        name: newBroadcast.name,
        status: 'Draft',
        broadcastTime: '-',
        labels: newBroadcast.labels,
        channel: '-',
        segment: 'All',
        recipients: 0,
        totalMessages: 0,
      };
      setBroadcasts([...broadcasts, broadcast]);
      setShowNewBroadcast(false);
      setNewBroadcast({ name: '', labels: [] });
    }
  };

  const filteredBroadcasts = broadcasts.filter((broadcast) => {
    const matchesSearch = broadcast.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || broadcast.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700';
      case 'Scheduled':
        return 'bg-orange-100 text-orange-700';
      case 'In Progress':
        return 'bg-green-100 text-green-700';
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'Failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex h-full bg-gray-50 flex-col md:flex-row">
      {/* Left Sidebar */}
      <div className="hidden md:flex w-full md:w-64 bg-white border-r border-gray-200 flex-col p-4">
        <h2 className="text-lg font-semibold mb-4">Broadcasts</h2>
        <div className="space-y-1">
          {statusFilters.map((filter) => (
            <button
              key={filter.name}
              onClick={() => setSelectedStatus(filter.name)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
                selectedStatus === filter.name ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <div className={`w-3 h-3 ${filter.color} rounded-full`}></div>
              <span>{filter.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  viewMode === 'table' ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                ☰ Table
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  viewMode === 'calendar' ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <Calendar size={18} />
                Calendar
              </button>
              <button
                onClick={() => setShowNewBroadcast(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={18} />
                Add Broadcast
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                  Status <span className="ml-1">↕</span>
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                  Broadcast Time <span className="ml-1">↕</span>
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                  Name <span className="ml-1">↕</span>
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Labels</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Channel</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Segment</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Recipients</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                  Total Messages
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBroadcasts.map((broadcast) => (
                <tr key={broadcast.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(broadcast.status)}`}>
                      {broadcast.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{broadcast.broadcastTime}</td>
                  <td className="px-6 py-4">
                    <button className="text-sm text-blue-600 hover:text-blue-700">{broadcast.name}</button>
                  </td>
                  <td className="px-6 py-4">
                    {broadcast.labels.map((label) => (
                      <span key={label} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded mr-1">
                        {label}
                      </span>
                    ))}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{broadcast.channel}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{broadcast.segment}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{broadcast.recipients}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{broadcast.totalMessages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Broadcasts per page:</span>
            <select className="border border-gray-300 rounded px-2 py-1">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>1 – 1 of 1</span>
            <div className="flex gap-1">
              <button className="p-1 hover:bg-gray-100 rounded disabled:opacity-50" disabled>
                ‹
              </button>
              <button className="p-1 hover:bg-gray-100 rounded disabled:opacity-50" disabled>
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Broadcast Modal */}
      {showNewBroadcast && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">New Broadcast</h2>
              <button onClick={() => setShowNewBroadcast(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Broadcast Name</label>
                <input
                  type="text"
                  placeholder="Name your broadcast (only visible internally)"
                  value={newBroadcast.name}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Labels (optional) <span className="text-gray-400">ⓘ</span>
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Add labels to the broadcast</option>
                </select>
              </div>

              <div>
                <button className="text-blue-600 hover:text-blue-700 text-sm">Learn more</button>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewBroadcast(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBroadcast}
                disabled={!newBroadcast.name}
                className="px-4 py-2 bg-gray-200 text-gray-400 rounded-lg disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
