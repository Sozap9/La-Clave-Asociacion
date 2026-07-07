import { Calendar, Ticket, UserCheck } from "lucide-react";

const AdminStats = ({ stats }) => {
  const statsData = [
    {
      label: "Total Socios",
      value: stats?.totalSocios || 0,
      icon: UserCheck,
    },
    {
      label: "Total Eventos",
      value: stats?.totalEventos || 0,
      icon: Calendar,
    },
    {
      label: "Total Reservas",
      value: stats?.totalReservas || 0,
      icon: Ticket,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <Icon size={24} className="text-primary-300" />
              </div>
              <p className="text-white font-semibold">{stat.label}</p>
            </div>
            <p className="text-3xl font-bold text-primary-300">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStats;