import { Plus, Mail, MoreVertical, Shield, User } from 'lucide-react';

const teamMembers = [
  { id: 1, name: 'Sarah Miller', email: 'sarah@company.com', role: 'Admin', status: 'Active', avatar: 'SM' },
  { id: 2, name: 'Mike Johnson', email: 'mike@company.com', role: 'Agent', status: 'Active', avatar: 'MJ' },
  { id: 3, name: 'Emma Wilson', email: 'emma@company.com', role: 'Agent', status: 'Active', avatar: 'EW' },
  { id: 4, name: 'Alex Kim', email: 'alex@company.com', role: 'Manager', status: 'Active', avatar: 'AK' },
];

export const Team = () => {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Team Management</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus size={18} />
            Invite Member
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Member</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                        {member.avatar}
                      </div>
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{member.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {member.role === 'Admin' ? <Shield size={16} className="text-purple-600" /> : <User size={16} className="text-gray-400" />}
                      <span className="text-sm">{member.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <Mail size={16} />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Roles & Permissions</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Admin</span>
                <span className="text-xs text-gray-500">Full access</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Manager</span>
                <span className="text-xs text-gray-500">Team management</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Agent</span>
                <span className="text-xs text-gray-500">Handle conversations</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Team Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Members</span>
                <span className="text-lg font-bold">4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Now</span>
                <span className="text-lg font-bold text-green-600">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending Invites</span>
                <span className="text-lg font-bold text-orange-600">2</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm">
                Manage Permissions
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm">
                View Activity Log
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm">
                Export Team Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
