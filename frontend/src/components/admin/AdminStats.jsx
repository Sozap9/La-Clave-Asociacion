import { Calendar, Users, Ticket, CheckCircle } from 'lucide-react';

const AdminStats = ({ stats }) => {
  const statsData = [
    {
      label: 'Total Eventos',
      value: stats?.totalEventos || 0,
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      label: 'Total Usuarios',
      value: stats?.totalUsuarios || 0,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      label: 'Total Reservas',
      value: stats?.totalReservas || 0,
      icon: Ticket,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      label: 'Socios Activos',
      value: stats?.sociosActivos || 0,
      icon: CheckCircle,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-primary-500/50 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={stat.color} size={24} />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStats;