import { useState, useEffect, useRef } from "react";
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
import AdminCard from "../../components/admin/AdminCard";
import PrivateImage from "../../components/common/PrivateImage";
import EditarDatosSocio from "../../components/admin/EditarDatosSocio";
import { respuestasRegistro } from "../../utils/registroRespuestas";


// Socios por página (paginación en el servidor)
const PER_PAGE = 20;

// Mínimo 2 letras: el backend rechaza 1
const MIN_SEARCH_LENGTH = 2;

// Filtros; el valor va tal cual al backend
const socioFilters = [
  { value: "all", label: "Todos" },
  { value: "socio", label: "Socios Activos" },
  { value: "inactivo", label: "Socios Inactivos" },
  { value: "admin", label: "Administradores" },
];

const emptyMessages = {
  all: "No hay socios ni administradores para mostrar",
  socio: "No hay socios activos para mostrar",
  inactivo: "No hay socios inactivos",
  admin: "No hay administradores",
};

const AdminSocios = () => {
  const [socios, setSocios] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  // Lo escrito en el buscador y lo que se busca
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("socio");
  // Tras la primera carga solo se atenúa la lista, para no perder el buscador
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSocio, setSelectedSocio] = useState(null);
  // Edición de datos verificados dentro del detalle
  const [editandoDatos, setEditandoDatos] = useState(false);
  const [avisoDatos, setAvisoDatos] = useState("");
  const [roleSelections, setRoleSelections] = useState({});

  // Que una respuesta lenta no pise a una más nueva
  const requestIdRef = useRef(0);

  useEffect(() => {
    fetchSocios();
    // eslint-disable-next-line
  }, [page, search, activeFilter]);

  const fetchSocios = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const result = await getAllSocios({
        page,
        limit: PER_PAGE,
        filtro: activeFilter,
        search: search || undefined,
      });

      if (requestId !== requestIdRef.current) return;

      if (result.success) {
        const sociosData = Array.isArray(result.data?.socios)
          ? result.data.socios
          : [];
        const pag = result.data?.pagination || {};
        const pages = Math.max(1, pag.pages || 1);

        // Página vacía tras borrar: se vuelve a la anterior
        if (sociosData.length === 0 && page > pages) {
          setPage(pages);
          return;
        }

        setSocios(sociosData);
        setPagination({ total: pag.total || 0, page: pag.page || page, pages });

        const initialRoles = {};
        sociosData.forEach((s) => {
          initialRoles[s.user_id] = s.role || "socio";
        });
        setRoleSelections(initialRoles);
      } else {
        setError(result.message || "Error al cargar socios");
        setSocios([]);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("Error en fetchSocios:", err);
      setError("Error de conexión");
      setSocios([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setInitialLoading(false);
      }
    }
  };

  const handleSearchChange = (value) => {
    setSearchText(value);
    const term = value.trim();
    const effective = term.length >= MIN_SEARCH_LENGTH ? term : "";
    if (effective !== search) {
      setSearch(effective);
      setPage(1);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handleOpenDetails = async (socioId) => {
    setLoading(true);
    setError("");
    try {
      const result = await getSocioDetails(socioId);
      if (result.success) {
        setEditandoDatos(false);
        setAvisoDatos("");
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
      "¿Dar de baja a este socio? No podrá iniciar sesión y se cancelarán sus reservas de eventos próximos. Se puede reactivar más adelante.",
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
      "¿Eliminar los datos personales de este socio?\n\nSe borran su nombre, email, teléfono y DNI, y se cancelan sus reservas de eventos próximos. Sus pagos y reservas pasadas se conservan de forma anónima para las cuentas.\n\nNo se puede deshacer.",
    );
    if (!confirm) return;

    setLoading(true);
    setError("");
    try {
      const result = await deleteSocioPermanent(socioId);
      if (!result.success) {
        setError(result.message || "Error al eliminar los datos del socio");
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
        // Si no se guarda, el selector vuelve al rol que tenía
        setRoleSelections((prev) => ({ ...prev, [userId]: currentRole }));
        setError(result.message || "Error al cambiar el rol");
      } else {
        await fetchSocios();
      }
    } catch (err) {
      setRoleSelections((prev) => ({ ...prev, [userId]: currentRole }));
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

  if (initialLoading) return <Loader fullScreen />;

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      {/* Cabecera */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Gestión de Socios</h1>
          <p className="text-gray-200 text-sm md:text-lg">Administra tu lista de socios</p>
          <p className="text-gray-400 text-sm md:text-lg">
            {pagination.total} resultado{pagination.total !== 1 ? "s" : ""}
            {search ? ` para «${search}»` : ""}
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:pt-1">
          <FilterBar
            customFilters={socioFilters}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
          />

          <div className="w-full sm:w-80">
            <SearchInput
              value={searchText}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre, email, teléfono o nº..."
              debounceMs={500}
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

      {/* Socios */}
      {socios.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
          <Users className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 text-lg">
            {loading
              ? "Cargando..."
              : search
                ? `No hay resultados para «${search}»`
                : emptyMessages[activeFilter]}
          </p>
        </div>
      ) : (
        <div
          className={`space-y-4 transition-opacity ${loading ? "opacity-50 pointer-events-none" : ""}`}
          aria-busy={loading}
        >
          {socios.map((socio) => (
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
                // Necesitan fila en socios: un admin sin membresía no las tiene
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
                        title: "Eliminar datos del socio",
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
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            itemLabel="resultados"
          />
        </div>
      )}

      {/* Detalle */}
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
              {!editandoDatos && !selectedSocio.user?.email?.endsWith("@laclave.invalid") && (
                <button
                  onClick={() => {
                    setAvisoDatos("");
                    setEditandoDatos(true);
                  }}
                  className="px-3 py-1.5 text-sm border border-primary-500/40 text-white rounded-lg hover:bg-[#262626] transition-colors sm:ml-auto"
                >
                  Editar datos
                </button>
              )}
              <button
                onClick={() => setSelectedSocio(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {avisoDatos && (
              <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-sm mb-4">
                {avisoDatos}
              </div>
            )}

            {editandoDatos ? (
              <EditarDatosSocio
                socioId={selectedSocio.socio.id}
                user={selectedSocio.user}
                onCancelar={() => setEditandoDatos(false)}
                onGuardado={async (mensaje) => {
                  await handleOpenDetails(selectedSocio.socio.id);
                  await fetchSocios();
                  setAvisoDatos(mensaje);
                }}
              />
            ) : (
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

              {/* Respuestas del registro */}
              <div className="pt-2">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
                  Respuestas del registro
                </p>
                {selectedSocio.solicitud ? (
                  <div className="space-y-3">
                    {respuestasRegistro(selectedSocio.solicitud).map(([pregunta, respuesta]) => (
                      <div
                        key={pregunta}
                        className="bg-[#111] border border-[#262626] rounded-xl p-3"
                      >
                        <p className="text-gray-500 text-xs mb-0.5">{pregunta}</p>
                        <p className="text-white text-sm leading-relaxed whitespace-pre-line break-words">
                          {respuesta || "—"}
                        </p>
                      </div>
                    ))}
                    {selectedSocio.solicitud.created_at && (
                      <p className="text-gray-500 text-xs">
                        Solicitud enviada el{" "}
                        {new Date(
                          selectedSocio.solicitud.created_at,
                        ).toLocaleDateString("es-ES")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Sin respuestas: este socio no se registró con el formulario
                    de solicitud (alta manual o anterior al formulario).
                  </p>
                )}
              </div>

              {/* Documento de identidad */}
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
                  Documento de identidad
                </p>
                <div className="grid grid-cols-1 max-w-[220px] gap-4">
                  <div>
                    <p className="text-gray-500 text-xs mb-2">Cara delantera</p>
                    <PrivateImage
                      endpoint={
                        selectedSocio.user?.dni_front_url
                          ? `/admin/socios/${selectedSocio.socio.id}/dni`
                          : null
                      }
                      alt="Cara delantera"
                      link
                      className="w-full h-36 object-cover rounded-xl border border-[#262626] hover:border-primary-500/50 transition-colors"
                      fallback={
                        <div className="w-full h-36 bg-[#111] rounded-xl border border-[#262626] flex items-center justify-center text-gray-600 text-sm">
                          Sin imagen
                        </div>
                      }
                    />
                  </div>
                </div>
              </div>

            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSocios;