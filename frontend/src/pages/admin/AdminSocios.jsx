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
import AdminCard from "../../components/admin/AdminCard";

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

  useEffect(() => {
    fetchSocios();
    // eslint-disable-next-line
  }, [search, activeFilter]);

  const fetchSocios = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};

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
          sociosData = sociosData.filter((s) => s.role === "socio");
        } else if (activeFilter === "inactivo") {
          sociosData = sociosData.filter(
            (s) => s.role === "socio" && !s.activo,
          );
        } else if (activeFilter === "admin") {
          sociosData = sociosData.filter((s) => s.role === "admin");
        }

        setSocios(Array.isArray(sociosData) ? sociosData : []);
        const initialRoles = {};
        (Array.isArray(sociosData) ? sociosData : []).forEach((s) => {
          initialRoles[s.id] = s.role || "socio";
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
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-4xl">Gestión de Socios</h1>
        <p className="text-gray-200 text-lg">Administra tu lista de socios</p>
        <p className="text-gray-400 text-lg">
          {socios.length} socio{socios.length !== 1 ? "s" : ""} registrado
          {socios.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        {/* Filtros a la izquierda */}
        <FilterBar
          customFilters={socioFilters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* Búsqueda a la derecha */}
        <div className="flex-1 max-w-md ml-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            placeholder="Buscar por nombre, email..."
            debounceMs={350}
          />
        </div>
      </div>

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
          {socios.map((socio) => (
            <AdminCard
              key={socio.id}
              avatar={
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {socio.nombre?.charAt(0).toUpperCase() ||
                      socio.username?.charAt(0).toUpperCase() ||
                      "?"}
                  </span>
                </div>
              }
              title={
                socio.nombre && socio.apellidos
                  ? `${socio.nombre} ${socio.apellidos}`
                  : socio.username
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
                {
                  type: "role",
                  element: (
                    <div className="flex items-center gap-2 mt-2">
                      <select
                        className="bg-[#101010] border border-gray-700 text-white px-2 py-1 rounded-lg focus:outline-none focus:border-violet-500"
                        value={
                          roleSelections[socio.id] || socio.role || "socio"
                        }
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setRoleSelections((prev) => ({
                            ...prev,
                            [socio.id]: newRole,
                          }));
                          handleChangeRole(
                            socio.user_id || socio.id,
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
        </div>
      )}

      {/* Modal de detalles */}
      {selectedSocio && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSocio(null)}
        >
          <div
            className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
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
                      : selectedSocio.user?.username || ""}
                  </p>
                </div>

              <div>
                <p className="text-gray-500 text-sm">DNI</p>
                <p className="text-white">
                  {selectedSocio.user?.telefono || "—"}
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

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSocios;