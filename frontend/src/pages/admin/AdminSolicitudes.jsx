import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  X,
  Calendar,
  Mail,
  CreditCard,
} from "lucide-react";
import {
  getSolicitudes,
  getSolicitudDetails,
  aprobarSolicitud,
  rechazarSolicitud,
  eliminarSolicitud,
} from "../../api/adminApi";
import FilterBar from "../../components/UI/FilterBar";
import SearchInput from "../../components/UI/SearchInput";
import AdminCard from "../../components/admin/AdminCard";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

const solicitudFilters = [
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "rechazada", label: "Rechazadas" },
  { value: "all", label: "Todas" },
];

const ESTADO_CONFIG = {
  pendiente: {
    label: "Pendiente",
    color: "yellow",
    icon: <Clock size={11} />,
  },
  aprobada: {
    label: "Aprobada",
    color: "green",
    icon: <CheckCircle size={11} />,
  },
  rechazada: {
    label: "Rechazada",
    color: "red",
    icon: <XCircle size={11} />,
  },
};

// ── Modal Detalle ────────────────────────────────────────────────────────────
const SolicitudModal = ({ solicitud, onClose, onAprobar, onRechazar }) => {
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAprobar = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await aprobarSolicitud(solicitud.id);
      if (res.success) onAprobar(solicitud.id);
      else setError(res.message || "Error al aprobar");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async () => {
    if (!motivoRechazo.trim()) {
      setError("El motivo es obligatorio");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await rechazarSolicitud(solicitud.id, motivoRechazo.trim());
      if (res.success) onRechazar(solicitud.id);
      else setError(res.message || "Error al rechazar");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const imgUrl = (path) => (path ? `${BACKEND_URL}/${path}` : null);
  const cfg = ESTADO_CONFIG[solicitud.estado] || ESTADO_CONFIG.pendiente;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#262626]">
          <div>
            <h2 className="text-xl font-bold text-white">
              {solicitud.nombre} {solicitud.apellidos}
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Solicitud #{solicitud.id}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                solicitud.estado === "pendiente"
                  ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                  : solicitud.estado === "aprobada"
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : "bg-red-500/20 text-red-300 border-red-500/30"
              }`}
            >
              {cfg.icon}
              {cfg.label}
            </span>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Datos personales */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Datos personales
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Email", solicitud.email],
                ["Teléfono", solicitud.telefono],
                ["DNI / NIE", solicitud.dni],
                [
                  "Fecha nacimiento",
                  solicitud.fecha_nacimiento
                    ? new Date(solicitud.fecha_nacimiento).toLocaleDateString(
                        "es-ES",
                      )
                    : "—",
                ],
                ["IP solicitud", solicitud.ip_solicitud || "—"],
                [
                  "Fecha solicitud",
                  solicitud.created_at
                    ? new Date(solicitud.created_at).toLocaleString("es-ES")
                    : "—",
                ],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#111] rounded-xl p-3 border border-[#262626]">
                  <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                  <p className="text-white font-medium break-all">
                    {value || "—"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Motivación */}
          {solicitud.motivacion && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Motivación
              </h3>
              <div className="bg-[#111] border border-[#262626] rounded-xl p-4 text-gray-300 text-sm leading-relaxed">
                {solicitud.motivacion}
              </div>
            </section>
          )}

          {/* DNI Imágenes */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Documento de identidad
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Cara delantera", solicitud.dni_front_url],
                ["Cara trasera", solicitud.dni_back_url],
              ].map(([label, path]) => (
                <div key={label}>
                  <p className="text-gray-500 text-xs mb-2">{label}</p>
                  {imgUrl(path) ? (
                    <a href={imgUrl(path)} target="_blank" rel="noreferrer">
                      <img
                        src={imgUrl(path)}
                        alt={label}
                        className="w-full h-36 object-cover rounded-xl border border-[#262626] hover:border-primary-500/50 transition-colors"
                      />
                    </a>
                  ) : (
                    <div className="w-full h-36 bg-[#111] rounded-xl border border-[#262626] flex items-center justify-center text-gray-600 text-sm">
                      Sin imagen
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Info revisión */}
          {solicitud.estado !== "pendiente" && (
            <section className="bg-[#111] border border-[#262626] rounded-xl p-4 text-sm">
              <p className="text-gray-500 text-xs mb-2">
                Revisada el{" "}
                {solicitud.fecha_revision
                  ? new Date(solicitud.fecha_revision).toLocaleString("es-ES")
                  : "—"}
              </p>
              {solicitud.motivo_rechazo && (
                <p className="text-red-400">
                  <span className="text-gray-500">Motivo: </span>
                  {solicitud.motivo_rechazo}
                </p>
              )}
            </section>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Acciones — solo si está pendiente */}
          {solicitud.estado === "pendiente" && (
            <section className="space-y-3 pt-2 border-t border-[#262626]">
              {!showReject ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleAprobar}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    <CheckCircle size={18} />
                    {loading ? "Aprobando..." : "Aprobar solicitud"}
                  </button>
                  <button
                    onClick={() => setShowReject(true)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold py-3 rounded-xl transition-colors"
                  >
                    <XCircle size={18} />
                    Rechazar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    placeholder="Motivo del rechazo (obligatorio)..."
                    rows={3}
                    className="w-full bg-[#111] border border-[#262626] focus:border-red-500/50 text-white rounded-xl p-3 text-sm resize-none outline-none placeholder-gray-600"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowReject(false);
                        setError("");
                      }}
                      className="flex-1 py-3 rounded-xl border border-[#262626] text-gray-400 hover:bg-[#2a2a2a] transition-colors font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleRechazar}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                      <XCircle size={18} />
                      {loading ? "Rechazando..." : "Confirmar rechazo"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Página principal ─────────────────────────────────────────────────────────
const AdminSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    estado: "pendiente",
    search: "",
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState("");

  const [selected, setSelected] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ── Cargar datos ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getSolicitudes(filters);
      if (res.success) {
        setSolicitudes(res.data.solicitudes || []);
        setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
      } else {
        setError(res.message || "Error al cargar solicitudes");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleEstado = (estado) =>
    setFilters((f) => ({ ...f, estado, page: 1 }));

  const handleSearch = (value) =>
    setFilters((f) => ({ ...f, search: value, page: 1 }));

  const handleAprobar = (id) => {
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado: "aprobada" } : s)),
    );
    setSelected((prev) =>
      prev?.id === id ? { ...prev, estado: "aprobada" } : prev,
    );
  };

  const handleRechazar = (id) => {
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado: "rechazada" } : s)),
    );
    setSelected((prev) =>
      prev?.id === id ? { ...prev, estado: "rechazada" } : prev,
    );
  };

  const openModal = async (id) => {
    try {
      const res = await getSolicitudDetails(id);
      if (res.success) setSelected(res.data);
    } catch {
      /* usa los datos de la lista si falla */
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await eliminarSolicitud(id);
      if (res.success) {
        setSolicitudes((prev) => prev.filter((s) => s.id !== id));
        setDeleteConfirm(null);
        if (selected?.id === id) setSelected(null);
      }
    } catch {
      /* silencioso */
    }
  };

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-gradient mb-2 text-2xl md:text-4xl">
              Solicitudes de Socio
            </h1>
            <p className="text-gray-200 text-sm md:text-lg">
              Gestiona las solicitudes de membresía
            </p>
            <p className="text-gray-400 text-sm md:text-lg">
              {pagination.total} solicitud
              {pagination.total !== 1 ? "es" : ""} en total
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#262626] text-gray-400 hover:text-white rounded-lg transition-colors text-sm mt-2"
          >
            <RefreshCw size={15} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <FilterBar
          customFilters={solicitudFilters}
          activeFilter={filters.estado}
          onFilterChange={handleEstado}
        />
        <div className="w-full sm:flex-1 sm:max-w-md sm:ml-auto">
          <SearchInput
            value={searchInput}
            onChange={(v) => setSearchInput(v)}
            onDebounced={handleSearch}
            onClear={() => {
              setSearchInput("");
              handleSearch("");
            }}
            placeholder="Buscar por nombre, email o DNI..."
            debounceMs={350}
          />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <RefreshCw size={20} className="animate-spin mr-3" /> Cargando...
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
          <UserCheck className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 text-lg">
            No hay solicitudes para mostrar
          </p>
        </div>
      ) : (
        <>
        <div className="space-y-4">
          {solicitudes.map((s) => {
            const cfg = ESTADO_CONFIG[s.estado] || ESTADO_CONFIG.pendiente;
            return (
              <AdminCard
                key={s.id}
                avatar={
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {s.nombre?.charAt(0).toUpperCase() ||
                        s.email?.charAt(0).toUpperCase() ||
                        "?"}
                    </span>
                  </div>
                }
                title={`${s.nombre || ""} ${s.apellidos || ""}`.trim() || s.email}
                subtitle={s.telefono || ""}
                badges={[
                  {
                    text: cfg.label,
                    color: cfg.color,
                    icon: cfg.icon,
                  },
                ]}
                fields={[
                  {
                    icon: <Mail size={13} />,
                    label: "Email",
                    value: s.email || "—",
                  },
                  {
                    icon: <CreditCard size={13} />,
                    label: "DNI / NIE",
                    value: s.dni || "—",
                  },
                  {
                    icon: <Calendar size={13} />,
                    label: "Fecha solicitud",
                    value: s.created_at
                      ? new Date(s.created_at).toLocaleDateString("es-ES")
                      : "—",
                  },
                ]}
                columns={3}
                actions={[
                  {
                    icon: <Eye size={20} />,
                    onClick: () => openModal(s.id),
                    color: "primary",
                    title: "Ver detalle",
                  },
                  {
                    icon: <Trash2 size={20} />,
                    onClick: () => setDeleteConfirm(s.id),
                    color: "red",
                    title: "Eliminar",
                  },
                ]}
              />
            );
          })}
        </div>
        </>
      )}

      {/* Paginación */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6 text-sm">
          <span className="text-gray-500">
            Página {pagination.page} de {pagination.pages} ({pagination.total}{" "}
            total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              disabled={filters.page <= 1}
              className="p-2 rounded-lg border border-[#262626] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              disabled={filters.page >= pagination.pages}
              className="p-2 rounded-lg border border-[#262626] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {selected && (
        <SolicitudModal
          solicitud={selected}
          onClose={() => setSelected(null)}
          onAprobar={handleAprobar}
          onRechazar={handleRechazar}
        />
      )}

      {/* Confirm eliminar */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 max-w-sm w-full text-center space-y-4">
            <Trash2 size={32} className="text-red-400 mx-auto" />
            <h3 className="text-white font-bold text-lg">
              ¿Eliminar solicitud?
            </h3>
            <p className="text-gray-400 text-sm">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#262626] text-gray-400 hover:bg-[#2a2a2a] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSolicitudes;