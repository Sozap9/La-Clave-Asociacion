import { useState, useEffect } from "react";
import { getEventsStats, getDashboardStats } from "../../api/adminApi";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import AdminCard from "../../components/admin/AdminCard.jsx";
import { Calendar, Users, TrendingUp } from "lucide-react";

const AdminStatsEventos = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const [generalResult, detailedResult] = await Promise.all([
        getEventsStats(),
        getDashboardStats(),
      ]);

      if (generalResult.success && detailedResult.success) {
        setStats({
          ...generalResult.data,
          top_eventos: detailedResult.data.eventos.top_eventos,
          proximos_eventos: detailedResult.data.eventos.proximos_eventos,
        });
      } else {
        const msg =
          generalResult.message ||
          detailedResult.message ||
          "Error al cargar estadísticas";
        setError(msg);
      }
    } catch (err) {
      setError(
        err?.message || "No se pudieron cargar las estadísticas de eventos"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-2xl md:text-4xl">
          Estadísticas de Eventos
        </h1>
        <p className="text-gray-400">
          Estadísticas detalladas sobre el rendimiento y la participación en los
          eventos.
        </p>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError("")} />
      )}

      {stats && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
            <StatCard
              title="Total Eventos"
              value={stats.total_eventos || 0}
              icon={Calendar}
            />
            <StatCard
              title="Publicados"
              value={stats.publicados || 0}
              icon={Calendar}
            />
            <StatCard
              title="Próximos"
              value={stats.proximos || 0}
              icon={TrendingUp}
            />
            <StatCard
              title="Promedio Reservas"
              value={stats.promedio_reservas || 0}
              icon={Users}
            />
          </div>

          {/* Top eventos */}
          <AdminCard
            title="Top eventos"
            subtitle="Eventos con mayor ocupación"
          >
            <div className="space-y-3 mt-4">
              {stats.top_eventos?.map((evento, index) => (
                <div
                  key={evento.id}
                  className="flex items-center gap-4 p-3 bg-[#0f0f10] rounded-lg"
                >
                  <span className="text-2xl font-bold text-primary-300">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">
                      {evento.titulo}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {new Date(evento.fecha_evento).toLocaleDateString(
                        "es-ES"
                      )}{" "}
                      • {evento.entradas_reservadas}/{evento.aforo_maximo}{" "}
                      entradas
                    </p>
                  </div>
                  <span className="text-primary-300 font-semibold">
                    {evento.porcentaje_ocupacion}%
                  </span>
                </div>
              ))}
            </div>
          </AdminCard>

          {/* Próximos eventos */}
          <div className="mt-8">
            <AdminCard
              title="Agenda"
              subtitle="Eventos que se celebrarán próximamente"
            >
              <div className="space-y-3 mt-4">
                {stats.proximos_eventos?.map((evento) => (
                  <div
                    key={evento.id}
                    className="flex items-center justify-between p-3 bg-[#0f0f10] rounded-lg"
                  >
                    <div>
                      <h4 className="text-white font-medium">
                        {evento.titulo}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {new Date(evento.fecha_evento).toLocaleDateString(
                          "es-ES"
                        )}{" "}
                        • {evento.hora_evento?.slice(0, 5)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        {evento.entradas_reservadas}/{evento.aforo_maximo}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {evento.entradas_disponibles} disponibles
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </AdminCard>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-primary-300 text-xl sm:text-3xl font-bold">{value}</p>
      </div>
      <Icon className="w-8 h-8 text-primary-400" />
    </div>
  </div>
);

export default AdminStatsEventos;