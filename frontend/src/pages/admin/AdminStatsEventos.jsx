import { useState, useEffect } from "react";
import { getEventsStats, getDashboardStats } from "../../api/adminApi";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
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
        console.error("Stats fetch failed", generalResult, detailedResult);
        const msg =
          generalResult.message ||
          detailedResult.message ||
          "Error al cargar estadísticas";
        setError(msg);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(
        err?.message || "No se pudieron cargar las estadísticas de eventos"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8 bg-black min-h-screen">
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-4xl">
          Estadísticas de Eventos
        </h1>
        <p className="text-gray-400">
          Análisis detallado de eventos y ocupación
        </p>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError("")} />
      )}

      {stats && (
        <>
          {/* Stats principales */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Eventos"
              value={stats.total_eventos || 0}
              icon={Calendar}
            />
            <StatCard
              title="Publicados"
              value={stats.publicados || 0}
              icon={Calendar}
              color="green"
            />
            <StatCard
              title="Próximos"
              value={stats.proximos || 0}
              icon={TrendingUp}
              color="blue"
            />
            <StatCard
              title="Promedio Reservas"
              value={stats.promedio_reservas || 0}
              icon={Users}
              color="primary"
            />
          </div>

          {/* Top Eventos */}
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              Top 5 Eventos (últimos 90 días)
            </h3>
            <div className="space-y-3">
              {stats.top_eventos?.map((evento, index) => (
                <div
                  key={evento.id}
                  className="flex items-center gap-4 p-3 bg-[#0f0f10] rounded-lg"
                >
                  <span className="text-2xl font-bold text-primary-300">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{evento.titulo}</h4>
                    <p className="text-gray-400 text-sm">
                      {new Date(evento.fecha_evento).toLocaleDateString(
                        "es-ES"
                      )}{" "}
                      •{evento.entradas_reservadas}/{evento.aforo_maximo}{" "}
                      entradas
                    </p>
                  </div>
                  <span className="text-primary-300 font-semibold">
                    {evento.porcentaje_ocupacion}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Próximos Eventos */}
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Próximos Eventos
            </h3>
            <div className="space-y-3">
              {stats.proximos_eventos?.map((evento) => (
                <div
                  key={evento.id}
                  className="flex items-center justify-between p-3 bg-[#0f0f10] rounded-lg"
                >
                  <div>
                    <h4 className="text-white font-medium">{evento.titulo}</h4>
                    <p className="text-gray-400 text-sm">
                      {new Date(evento.fecha_evento).toLocaleDateString(
                        "es-ES"
                      )}{" "}
                      • {evento.hora_evento}
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
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color = "blue" }) => (
  <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-primary-300 text-3xl font-bold">{value}</p>
      </div>
      <Icon className="w-8 h-8 text-primary-400" />
    </div>
  </div>
);

export default AdminStatsEventos;