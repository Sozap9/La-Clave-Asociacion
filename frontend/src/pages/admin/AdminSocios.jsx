import { useState, useEffect } from "react";
import {
  getAllSocios,
  getSocioDetails,
  deactivateSocio,
  deleteSocioPermanent,
  updateUserRole,
  reactivateSocio,
} from "../../api/adminApi";
import {
  Users,
  Eye,
  X,
  Phone,
  UserMinus,
  Trash2,
  RotateCcw,
} from "lucide-react";
import Loader from "../../components/common/Loader";
import FilterBar from "../../components/UI/FilterBar";
import SearchInput from "../../components/UI/SearchInput";
import Pagination from "../../components/UI/Pagination";
import { usePagination } from "../../hooks/usePagination";
import AdminCard from "../../components/admin/AdminCard";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

// Filtros disponibles para socios
const socioFilters = [
  { value: "all", label: "Todos" },
  { value: "socio", label: "Socios Activos" },
  { value: "inactivo", label: "Socios Inactivos" },
  { value: "admin", label: "Administradores" },
];

const AdminSocios = () => {
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [roleSelections, setRoleSelections] = useState({});
  const [activeFilter, setActiveFilter] = useState("socio");

  const { pageItems: paginatedSocios, page, pages, total, setPage } =
    usePagination(socios, 20);

  useEffect(() => {
    fetchSocios();
    // eslint-disable-next-line
  }, [search, activeFilter]);

  const fetchSocios = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};

      // Pedimos todos los socios de una vez (límite alto): el filtro
      // por rol/estado se aplica después en el cliente, así que
      // paginar en el propio backend aquí daría contadores incorrectos.
      params.limit = 100;

      if (activeFilter === "socio") {
        params.estado = "activo";
      }
      if (search) {
        params.search = search;
      }

      const result = await getAllSocios(params);
      if (result.success) {
        let sociosData = result.data?.socios || result.data || [];

        if (activeFilter === "socio") {
          // Un socio-admin (role='admin' pero con fila activa en `socios`)
          // debe seguir contando aquí — por eso ya no se filtra por role,
          // el backend ya filtró por estado='activo' al pedir los datos.
          sociosData = sociosData;
        } else if (activeFilter === "inactivo") {
          sociosData = sociosData.filter((s) => !s.activo);
        } else if (activeFilter === "admin") {
          sociosData = sociosData.filter((s) => s.role === "admin");
        }

        setSocios(Array.isArray(sociosData) ? sociosData : []);
        const initialRoles = {};
        (Array.isArray(sociosData) ? sociosData : []).forEach((s) => {
          initialRoles[s.user_id] = s.role || "socio";
        });
        setRoleSelections(initialRoles);
      } else {
        setError(result.message || "Error al cargar socios");
        setSocios([]);
      }
    } catch (err) {
      console.error("Error en fetchSocios:", err);
      setError("Error de conexión");
      setSocios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (socioId) => {
    setLoading(true);
    setError("");
    try {
      const result = await getSocioDetails(socioId);
      if (result.success) {
        setSelectedSocio(result.data);
      } else {
        setError(result.message || "Error al obtener detalles del socio");
      }
    } catch (err) {
      console.error("Error en getSocioDetails:", err);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateSocio = async (socioId) => {
    const confirm = window.confirm(
      "¿Estás seguro de que quieres dar de baja a este socio? Esto lo dejará inactivo.",
    );
    if (!confirm) return;

    setLoading(true);
    setError("");
    try {
      const result = await deactivateSocio(socioId, "Baja administrativa");
      if (!result.success) {
        setError(result.message || "Error al dar de baja al socio");
      } else {
        await fetchSocios();
        setSelectedSocio(null);
      }
    } catch (err) {
      console.error("Error al dar de baja al socio:", err);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSocio = async (socioId) => {
    const confirm = window.confirm(
      "¿Eliminar este usuario? Esta acción es irreversible y eliminará todos sus datos.",
    );
    if (!confirm) return;

    setLoading(true);
    setError("");
    try {
      const result = await deleteSocioPermanent(socioId);
      if (!result.success) {
        setError(result.message || "Error al eliminar al socio");
      } else {
        await fetchSocios();
        setSelectedSocio(null);
      }
    } catch (err) {
      console.error("Error al eliminar al socio:", err);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole, currentRole = "socio") => {
    if (!newRole || newRole === currentRole) return;

    setLoading(true);
    setError("");
    try {
      const result = await updateUserRole(userId, newRole);
      if (!result.success) {
        setError(result.message || "Error al cambiar el rol");
      } else {
        await fetchSocios();
      }
    } catch (err) {
      console.error("Error al cambiar el rol:", err);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSocio = async (socioId) => {
    const confirm = window.confirm(
      "¿Reactivar este socio? Volverá a estar activo en el sistema.",
    );
    if (!confirm) return;

    setLoading(true);
    setError("");
    try {
      const result = await reactivateSocio(socioId);
      if (!result.success) {
        setError(result.message || "Error al reactivar al socio");
      } else {
        await fetchSocios();
        setSelectedSocio(null);
      }
    } catch (err) {
      console.error("Error al reactivar al socio:", err);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Gestión de Socios</h1>
          <p className="text-gray-200 text-sm md:text-lg">Administra tu lista de socios</p>
          <p className="text-gray-400 text-sm md:text-lg">
            {socios.length} socio{socios.length !== 1 ? "s" : ""} registrado
            {socios.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:pt-1">
          <FilterBar
            customFilters={socioFilters}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          <div className="w-full sm:w-80">
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              placeholder="Buscar por nombre, email..."
              debounceMs={350}
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Lista de socios */}
      {socios.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
          <Users className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 text-lg">
            No hay socios activos para mostrar
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedSocios.map((socio) => (
            <AdminCard
              key={socio.user_id}
              avatar={
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {socio.nombre?.charAt(0).toUpperCase() ||
                      socio.email?.charAt(0).toUpperCase() ||
                      "?"}
                  </span>
                </div>
              }
              title={
                socio.nombre && socio.apellidos
                  ? `${socio.nombre} ${socio.apellidos}`
                  : socio.email
              }
              subtitle={
                socio.telefono
                  ? `${socio.email} • ${socio.telefono}`
                  : socio.email
              }
              badges={
                socio.numero_socio
                  ? [
                      {
                        text: `N° ${socio.numero_socio}`,
                        color: "primary",
                      },
                    ]
                  : []
              }
              actions={[
                // Estas 3 acciones requieren una fila real en `socios`
                // (ver/dar de baja/reactivar/eliminar operan sobre
                // socios.id). Un admin sin membresía (ej. la cuenta raíz
                // de gestión) no la tiene, así que no se muestran.
                ...(socio.id
                  ? [
                      {
                        icon: <Eye size={20} />,
                        onClick: () => handleOpenDetails(socio.id),
                        color: "primary",
                        title: "Ver detalles",
                      },
                      socio.activo
                        ? {
                            icon: <UserMinus size={20} />,
                            onClick: () => handleDeactivateSocio(socio.id),
                            color: "primary",
                            title: "Dar de baja",
                          }
                        : {
                            icon: <RotateCcw size={20} />,
                            onClick: () => handleReactivateSocio(socio.id),
                            color: "primary",
                            title: "Reactivar socio",
                          },
                      {
                        icon: <Trash2 size={20} />,
                        onClick: () => handleDeleteSocio(socio.id),
                        color: "primary",
                        title: "Eliminar usuario",
                      },
                    ]
                  : []),
                {
                  type: "role",
                  element: (
                    <div className="flex items-center gap-2">
                      <select
                        className="bg-[#101010] border border-gray-700 text-white px-2 py-1 rounded-lg focus:outline-none focus:border-violet-500"
                        value={
                          roleSelections[socio.user_id] ||
                          socio.role ||
                          "socio"
                        }
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setRoleSelections((prev) => ({
                            ...prev,
                            [socio.user_id]: newRole,
                          }));
                          handleChangeRole(
                            socio.user_id,
                            newRole,
                            socio.role,
                          );
                        }}
                        disabled={loading}
                      >
                        <option value="admin">Administrador</option>
                        <option value="socio">Socio</option>
                      </select>
                    </div>
                  ),
                },
              ]}
              className="p-4"
            ></AdminCard>
          ))}

          <Pagination
            page={page}
            pages={pages}
            total={total}
            onPageChange={setPage}
            itemLabel="socios"
          />
        </div>
      )}

      {/* Modal de detalles */}
      {selectedSocio && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSocio(null)}
        >
          <div
            className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-2xl font-bold text-white">
                Detalles del Socio
              </h2>
              <button
                onClick={() => setSelectedSocio(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Nombre completo</p>
                  <p className="text-white text-lg">
                    {selectedSocio.user?.nombre && selectedSocio.user?.apellidos
                      ? `${selectedSocio.user.nombre} ${selectedSocio.user.apellidos}`
                      : selectedSocio.user?.email || ""}
                  </p>
                </div>

              <div>
                <p className="text-gray-500 text-sm">DNI</p>
                <p className="text-white">
                  {selectedSocio.user?.dni || "—"}
                </p>
              </div>
            </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Email</p>
                  <p className="text-white">{selectedSocio.user?.email}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Teléfono</p>
                  <p className="text-white">
                    {selectedSocio.user?.telefono || "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Número de socio</p>
                  <p className="text-white">
                    {selectedSocio.socio?.numero_socio || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Estado de cuenta</p>
                  <p className="text-white">
                    {selectedSocio.user?.activo ? "Activo" : "Inactivo"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Fecha de alta</p>
                  <p className="text-white">
                    {selectedSocio.socio?.fecha_alta
                      ? new Date(
                          selectedSocio.socio.fecha_alta,
                        ).toLocaleDateString("es-ES")
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Fecha baja</p>
                  <p className="text-white">
                    {selectedSocio.socio?.fecha_baja
                      ? new Date(
                          selectedSocio.socio.fecha_baja,
                        ).toLocaleDateString("es-ES")
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Fecha de nacimiento</p>
                  <p className="text-white">
                    {selectedSocio.user?.fecha_nacimiento
                      ? new Date(
                          selectedSocio.user.fecha_nacimiento,
                        ).toLocaleDateString("es-ES")
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Fecha de registro</p>
                  <p className="text-white">
                    {selectedSocio.user?.created_at
                      ? new Date(
                          selectedSocio.user.created_at,
                        ).toLocaleDateString("es-ES")
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Documento de identidad */}
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
                  Documento de identidad
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Cara delantera", selectedSocio.user?.dni_front_url],
                    ["Cara trasera", selectedSocio.user?.dni_back_url],
                  ].map(([label, path]) => {
                    const url = path ? `${BACKEND_URL}/${path}` : null;
                    return (
                      <div key={label}>
                        <p className="text-gray-500 text-xs mb-2">{label}</p>
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer">
                            <img
                              src={url}
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
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSocios;