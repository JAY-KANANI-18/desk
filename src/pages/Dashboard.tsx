import { TrendingUp, TrendingDown, Users, MessageSquare, CheckCircle, Clock } from 'lucide-react';

const stats = [
  { label: 'Total Conversations', value: '1,234', change: '+12%', trend: 'up', icon: MessageSquare },
  { label: 'Active Contacts', value: '856', change: '+8%', trend: 'up', icon: Users },
  { label: 'Resolved Today', value: '45', change: '-3%', trend: 'down', icon: CheckCircle },
  { label: 'Avg Response Time', value: '2.5m', change: '-15%', trend: 'up', icon: Clock },
];

export const Dashboard = () => {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <stat.icon className="text-blue-600" size={24} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Conversation Volume</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {[40, 65, 45, 80, 55, 70, 60].map((height, i) => (
                <div key={i} className="flex-1 bg-blue-100 rounded-t" style={{ height: `${height}%` }}></div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Channel Distribution</h3>
            <div className="space-y-4">
              {[
                { name: 'WhatsApp', value: 45, color: 'bg-green-500' },
                { name: 'Instagram', value: 25, color: 'bg-pink-500' },
                { name: 'Facebook', value: 15, color: 'bg-blue-500' },
                { name: 'Email', value: 10, color: 'bg-purple-500' },
                { name: 'SMS', value: 5, color: 'bg-yellow-500' },
              ].map((channel) => (
                <div key={channel.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{channel.name}</span>
                    <span className="font-semibold">{channel.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${channel.color} h-2 rounded-full`} style={{ width: `${channel.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { user: 'Sarah M.', action: 'closed conversation with', contact: 'John Doe', time: '2 min ago' },
              { user: 'Mike J.', action: 'assigned conversation to', contact: 'Team Support', time: '15 min ago' },
              { user: 'Emma W.', action: 'sent broadcast to', contact: '250 contacts', time: '1 hour ago' },
              { user: 'Alex K.', action: 'created workflow', contact: 'Lead Nurture', time: '2 hours ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 pb-4 border-b border-gray-100 last:border-0">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold">
                  {activity.user.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{activity.user}</span> {activity.action} <span className="font-semibold">{activity.contact}</span>
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
