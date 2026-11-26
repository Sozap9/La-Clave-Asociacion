import { useState } from "react";
import { actualizarDatosSocio } from "../../api/adminApi";

// La fecha llega como ISO en UTC: se lee en la zona del navegador para no
// perder un día
const aFechaInput = (valor) => {
  if (!valor) return "";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
};

const CAMPOS = [
  { name: "nombre", label: "Nombre", type: "text" },
  { name: "apellidos", label: "Apellidos", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "telefono", label: "Teléfono", type: "tel" },
  { name: "fecha_nacimiento", label: "Fecha de nacimiento", type: "date" },
  { name: "dni", label: "DNI / NIE", type: "text" },
];

// Corrección de los datos verificados de un socio (solo admin)
const EditarDatosSocio = ({ socioId, user, onGuardado, onCancelar }) => {
  const inicial = {
    nombre: user?.nombre || "",
    apellidos: user?.apellidos || "",
    email: user?.email || "",
    telefono: user?.telefono || "",
    fecha_nacimiento: aFechaInput(user?.fecha_nacimiento),
    dni: user?.dni || "",
  };

  const [datos, setDatos] = useState(inicial);
  const [dniFile, setDniFile] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen debe ser menor a 5MB");
      return;
    }
    setError("");
    setDniFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Solo se envía lo que ha cambiado
    const body = new FormData();
    Object.keys(datos).forEach((campo) => {
      if (datos[campo].trim() !== inicial[campo]) {
        body.append(campo, datos[campo].trim());
      }
    });
    if (dniFile) body.append("dni_front", dniFile);

    if ([...body.keys()].length === 0) {
      setError("No hay cambios para guardar");
      return;
    }

    setGuardando(true);
    try {
      const result = await actualizarDatosSocio(socioId, body);
      if (result.success) {
        onGuardado(result.message);
      } else {
        setError(result.message || "Error al guardar los datos");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CAMPOS.map(({ name, label, type }) => (
          <div key={name}>
            <label className="block text-gray-500 text-sm mb-1">{label}</label>
            <input
              type={type}
              name={name}
              value={datos[name]}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#111] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-primary-500"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-gray-500 text-sm mb-1">
          Nueva foto del DNI (opcional)
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="text-sm text-gray-300"
        />
      </div>

      <p className="text-xs text-gray-500">
        Los cambios quedan en el registro de actividad (qué campos, no sus valores).
        Si cambias el email, el socio entrará con el nuevo.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 px-4 py-2 bg-[#1a1a1a] hover:bg-[#262626] text-white rounded-lg"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar datos"}
        </button>
      </div>
    </form>
  );
};

export default EditarDatosSocio;
