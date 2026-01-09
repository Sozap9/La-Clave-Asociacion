import { Calendar, Users, Ticket, CheckCircle } from "lucide-react";

const AdminStats = ({ stats }) => {
  const statsData = [
    {
      label: "Total Eventos",
      value: stats?.totalEventos || 0,
      icon: Calendar,
    },
    {
      label: "Total Usuarios",
      value: stats?.totalUsuarios || 0,
      icon: Users,
    },
    {
      label: "Total Reservas",
      value: stats?.totalReservas || 0,
      icon: Ticket,
    },
    {
      label: "Socios Activos",
      value: stats?.sociosActivos || 0,
      icon: CheckCircle,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary-500/20 p-3 rounded-lg">
                <Icon className="text-primary-300" size={24} />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-primary-300">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStats;