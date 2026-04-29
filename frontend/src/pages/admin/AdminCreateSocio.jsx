import { useState, useEffect } from "react";
import { UserPlus, Search, CheckCircle } from "lucide-react";
import Button from "../../components/common/Button";
import { useNavigate } from "react-router-dom";
import SearchInput from "../../components/UI/SearchInput";

const API_URL = import.meta.env.VITE_API_URL;

const AdminCreateSocio = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: seleccionar usuario, 2: confirmar
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [cuotaMensual, setCuotaMensual] = useState("10.00");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("${API_URL}/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        let usersData = [];
        if (Array.isArray(result.data)) {
          usersData = result.data;
        } else if (result.data.users) {
          usersData = result.data.users;
        } else if (result.data.items) {
          usersData = result.data.items;
        }

        // Filtrar solo usuarios básicos que no sean socios
        setUsers(usersData.filter((u) => u.role === "basico"));
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSocio = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("${API_URL}/admin/socios", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          cuota_mensual: parseFloat(cuotaMensual),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/admin/socios");
        }, 2000);
      } else {
        alert(result.message || "Error al crear socio");
      }
    } catch (err) {
      console.error("Error al crear socio:", err);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.nombre?.toLowerCase().includes(searchLower) ||
      user.apellidos?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower)
    );
  });

  if (success) {
    return (
      <div className="p-4 md:p-8 bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-6 bg-green-500/20 rounded-full mb-6">
            <CheckCircle size={64} className="text-green-400" />
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-3">
            ¡Socio Creado Exitosamente!
          </h2>
          <p className="text-gray-400 mb-6">
            Redirigiendo a la gestión de socios...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary-500/20 rounded-lg">
            <UserPlus size={32} className="text-primary-400" />
          </div>
          <div>
            <h1 className="text-gradient mb-2 text-2xl md:text-4xl">
              Crear Socio Manual
            </h1>
            <p className="text-gray-400 text-sm md:text-lg">
              Registra un socio sin necesidad de pago previo
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-4 mt-6">
          <div
            className={`flex items-center gap-2 ${
              step >= 1 ? "text-primary-400" : "text-gray-600"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? "bg-primary-600 text-white" : "bg-[#262626]"
              }`}
            >
              1
            </div>
            <span className="font-medium">Seleccionar Usuario</span>
          </div>
          <div
            className={`h-0.5 w-12 ${
              step >= 2 ? "bg-primary-600" : "bg-[#262626]"
            }`}
          />
          <div
            className={`flex items-center gap-2 ${
              step >= 2 ? "text-primary-400" : "text-gray-600"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? "bg-primary-600 text-white" : "bg-[#262626]"
              }`}
            >
              2
            </div>
            <span className="font-medium">Confirmar Datos</span>
          </div>
        </div>
      </div>

      {/* Seleccionar usuario */}
      {step === 1 && (
        <div>
          {/* Búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder="Buscar por nombre, email, número de socio..."
            debounceMs={350}
              />
          </div>
        </div>

        {/* Lista de usuarios */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
              <UserPlus className="mx-auto mb-4 text-gray-600" size={48} />
              <p className="text-gray-400 text-lg">
                {search
                  ? "No se encontraron usuarios"
                  : "No hay usuarios básicos disponibles"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`bg-[#1a1a1a] border rounded-xl p-4 cursor-pointer transition-all ${
                    selectedUser?.id === user.id
                      ? "border-primary-600 shadow-glow"
                      : "border-[#262626] hover:border-primary-600/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {user.nombre?.charAt(0).toUpperCase() ||
                            user.username?.charAt(0).toUpperCase() ||
                            "?"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          {user.nombre && user.apellidos
                            ? `${user.nombre} ${user.apellidos}`
                            : user.username}
                        </h3>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                    {selectedUser?.id === user.id && (
                      <CheckCircle className="text-primary-400" size={24} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botón siguiente */}
          <div className="mt-8 flex justify-end">
            <Button
              variant="primary"
              disabled={!selectedUser}
              onClick={() => setStep(2)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Paso 2: Confirmar datos */}
      {step === 2 && selectedUser && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Confirmar Datos del Socio
            </h2>

            {/* Datos del usuario */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-[#262626]">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {selectedUser.nombre?.charAt(0).toUpperCase() ||
                      selectedUser.username?.charAt(0).toUpperCase() ||
                      "?"}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedUser.nombre && selectedUser.apellidos
                      ? `${selectedUser.nombre} ${selectedUser.apellidos}`
                      : selectedUser.username}
                  </h3>
                  <p className="text-gray-400">{selectedUser.email}</p>
                </div>
              </div>

              {/* Información adicional */}
              <div className="grid grid-cols-2 gap-4">
                {selectedUser.telefono && (
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Teléfono</p>
                    <p className="text-white">{selectedUser.telefono}</p>
                  </div>
                )}
                {selectedUser.fecha_nacimiento && (
                  <div>
                    <p className="text-gray-500 text-sm mb-1">
                      Fecha de Nacimiento
                    </p>
                    <p className="text-white">
                      {new Date(
                        selectedUser.fecha_nacimiento
                      ).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                )}
              </div>

              {/* Cuota mensual */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Cuota Mensual (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cuotaMensual}
                  onChange={(e) => setCuotaMensual(e.target.value)}
                  className="w-full bg-[#262626] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none transition-colors"
                />
                <p className="text-gray-500 text-sm mt-2">
                  Cuota por defecto: €10.00/mes
                </p>
              </div>

              {/* Advertencia */}
              <div className="bg-primary-500/20 border border-primary-500/50 rounded-lg p-4">
                <p className="text-primary-200 text-sm">
                  ⚠️ <strong>Importante:</strong> Este usuario se convertirá en
                  socio inmediatamente sin necesidad de pago. Se le asignará
                  automáticamente un número de socio y su rol cambiará de
                  "básico" a "socio".
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="mt-8 flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setSelectedUser(null);
                }}
                disabled={loading}
                className="flex-1"
              >
                Atrás
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateSocio}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Creando..." : "Crear Socio"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCreateSocio;