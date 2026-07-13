import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  UserPlus,
  Calendar,
  TrendingUp,
  TrendingDown,
  Ticket,
  DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";
import Loader from "../../components/common/Loader";
import { getDashboardStats } from "../../api/adminApi";

const AdminStatsDetailed = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDetailedStats();
  }, []);

  const fetchDetailedStats = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getDashboardStats();
      console.debug("getDashboardStats result:", result);
      if (result && result.success) {
        setStats(result.data);
      } else if (result && result.status === 401) {
        setError(
          "No autorizado. Inicia sesión con una cuenta admin para ver las estadísticas."
        );
      } else {
        setError(result?.message || "Error al cargar estadísticas");
      }
    } catch (err) {
      console.error("Error en fetchDetailedStats:", err);
      setError(
        "Error de conexión con el servidor. Verifica que el backend esté corriendo en Error de conexión con el servidor"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <Loader fullScreen />;

  const topEventos = stats?.eventos?.top_eventos || [];
  const proximosEventos = stats?.eventos?.proximos_eventos || [];
  const actividadReciente = stats?.actividad_reciente || [];
  const solicitudesPendientes = stats?.socios?.solicitudes_pendientes || 0;
  const comparativaMes = stats?.ingresos?.comparativa_mes || 0;

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-2xl md:text-4xl">
          Estadísticas Detalladas
        </h1>
        <p className="text-gray-400 text-sm md:text-lg">
          Vista completa del rendimiento del sistema
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-4 rounded-lg mb-6">
          <p className="mb-3">{error}</p>
          <button
            onClick={fetchDetailedStats}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {stats && (
        <>
          {/* Stats principales - Grid 3x2, centradas en salud de la
              asociación (socios), acción pendiente y rendimiento de
              venta de entradas, en vez de conteos genéricos */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
            {/* Socios activos */}
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 hover:border-primary-500/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <Users className="text-primary-300" size={28} />
                <p className="text-gray-400 text-sm">Socios Activos</p>
              </div>
              <p className="text-primary-300 text-2xl md:text-4xl font-bold mb-2">
                {stats.socios?.activos || 0}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-500">
                  {stats.usuarios?.admins || 0} administradores
                </span>
                <span className="text-gray-500">
                  {stats.socios?.total || 0} total
                </span>
              </div>
            </div>

            {/* Solicitudes pendientes — accionable, con link directo */}
            <Link
              to="/admin/solicitudes"
              className={`block rounded-lg p-6 border transition-all ${
                solicitudesPendientes > 0
                  ? "bg-amber-500/10 border-amber-500/50 hover:border-amber-500"
                  : "bg-[#1a1a1a] border-[#262626] hover:border-primary-500/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <UserPlus
                  className={solicitudesPendientes > 0 ? "text-amber-400" : "text-primary-300"}
                  size={28}
                />
                <p className="text-gray-400 text-sm">Solicitudes Pendientes</p>
              </div>
              <p
                className={`text-2xl md:text-4xl font-bold mb-2 ${
                  solicitudesPendientes > 0 ? "text-amber-400" : "text-primary-300"
                }`}
              >
                {solicitudesPendientes}
              </p>
              <p className="text-gray-500 text-sm">
                {solicitudesPendientes > 0 ? "esperando revisión →" : "todo al día"}
              </p>
            </Link>

            {/* Ingresos este mes + comparativa */}
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 hover:border-primary-500/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="text-primary-300" size={28} />
                <p className="text-gray-400 text-sm">Ingresos Este Mes</p>
              </div>
              <p className="text-primary-300 text-2xl md:text-4xl font-bold mb-2">
                {formatCurrency(stats.ingresos?.mes_actual)}
              </p>
              <div className="flex items-center gap-1 text-sm">
                {comparativaMes >= 0 ? (
                  <TrendingUp size={14} className="text-gray-500" />
                ) : (
                  <TrendingDown size={14} className="text-gray-500" />
                )}
                <span className="text-gray-500">
                  {comparativaMes >= 0 ? "+" : ""}
                  {comparativaMes}%
                </span>
                <span className="text-gray-500">vs mes anterior</span>
              </div>
            </div>

            {/* Entradas vendidas este mes */}
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 hover:border-primary-500/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <Ticket className="text-primary-300" size={28} />
                <p className="text-gray-400 text-sm">Entradas Vendidas</p>
              </div>
              <p className="text-primary-300 text-2xl md:text-4xl font-bold mb-2">
                {stats.reservas?.entradas_vendidas_mes || 0}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-500">
                  {stats.reservas?.entradas_vendidas_total || 0} en total
                </span>
              </div>
            </div>

            {/* Próximos eventos */}
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 hover:border-primary-500/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="text-primary-300" size={28} />
                <p className="text-gray-400 text-sm">Próximos Eventos</p>
              </div>
              <p className="text-primary-300 text-2xl md:text-4xl font-bold mb-2">
                {stats.eventos?.proximos || 0}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-500">
                  {stats.eventos?.total || 0} eventos en total
                </span>
              </div>
            </div>

            {/* Ocupación media */}
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 hover:border-primary-500/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="text-primary-300" size={28} />
                <p className="text-gray-400 text-sm">Ocupación Media</p>
              </div>
              <p className="text-primary-300 text-2xl md:text-4xl font-bold mb-2">
                {stats.eventos?.ocupacion_promedio || 0}%
              </p>
              <p className="text-gray-500 text-sm">promedio eventos publicados</p>
            </div>
          </div>

          {/* Top 5 Eventos por entradas vendidas (antes: ranking por
              % ocupación, ahora centrado en volumen de venta real,
              incluye eventos ya pasados) */}
          {topEventos.length > 0 && (
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 size={24} className="text-primary-300" />
                Eventos Destacados por Entradas Vendidas
              </h2>
              <div className="space-y-4">
                {topEventos.map((evento, index) => (
                  <div key={evento.id || index} className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-black"
                          : index === 1
                          ? "bg-gray-400 text-black"
                          : index === 2
                          ? "bg-orange-500 text-black"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">
                        {evento.titulo}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {evento.porcentaje_ocupacion}% de ocupación
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary-300 font-bold">
                        {evento.entradas_reservadas}
                      </p>
                      <p className="text-gray-500 text-sm">
                        de {evento.aforo_maximo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid 2 columnas - Próximos eventos + Actividad reciente */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Próximos Eventos */}
            {proximosEventos.length > 0 && (
              <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Calendar size={20} className="text-primary-300" />
                  Próximos Eventos
                </h2>
                <div className="space-y-4">
                  {proximosEventos.map((evento, index) => (
                    <div
                      key={evento.id || index}
                      className="border-l-4 border-primary-500 pl-4"
                    >
                      <h3 className="text-white font-semibold">
                        {evento.titulo}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {formatDate(evento.fecha_evento)}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {evento.entradas_reservadas || 0} /{" "}
                        {evento.aforo_maximo} entradas
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actividad Reciente */}
            {actividadReciente.length > 0 && (
              <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingUp size={20} className="text-primary-300" />
                  Actividad Reciente
                </h2>
                <div className="space-y-4">
                  {actividadReciente.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="text-white text-sm">
                          {activity.descripcion ||
                            `${activity.accion} en ${activity.entidad}`}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminStatsDetailed;