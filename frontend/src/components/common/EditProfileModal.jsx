import { useState, useEffect, useRef } from "react";
import { X, Camera, Check, Upload } from "lucide-react";
import api from "../../api/axios";
import DatePickerInput from "./DatePickerInput";

const EditProfileModal = ({ isOpen, onClose, userData, onUpdate }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    fecha_nacimiento: "",
    dni: "",
    avatar_url: "",
    dni_frente_url: "",
    dni_dorso_url: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [dniFrentePreview, setDniFrentePreview] = useState(null);
  const [dniDorsoPreview, setDniDorsoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const avatarInputRef = useRef(null);
  const dniFrenteInputRef = useRef(null);
  const dniDorsoInputRef = useRef(null);

  useEffect(() => {
    if (userData && isOpen) {
      setFormData({
        nombre: userData.nombre || "",
        apellidos: userData.apellidos || "",
        email: userData.email || "",
        telefono: userData.telefono || "",
        fecha_nacimiento: userData.fecha_nacimiento
          ? userData.fecha_nacimiento.split("T")[0]
          : "",
        dni: userData.dni || "",
        avatar_url: userData.avatar_url || "",
        dni_frente_url: userData.dni_frente_url || "",
        dni_dorso_url: userData.dni_dorso_url || "",
      });
      setAvatarPreview(userData.avatar_url || null);
      setDniFrentePreview(userData.dni_frente_url || null);
      setDniDorsoPreview(userData.dni_dorso_url || null);
      setError("");
      setSuccess("");
    }
  }, [userData, isOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("La imagen debe ser menor a 10MB");
        setTimeout(() => setError(""), 3000);
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("El archivo debe ser una imagen");
        setTimeout(() => setError(""), 3000);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;

        switch (type) {
          case "avatar":
            setAvatarPreview(base64);
            setFormData({ ...formData, avatar_url: base64 });
            break;
          case "dni_frente":
            setDniFrentePreview(base64);
            setFormData({ ...formData, dni_frente_url: base64 });
            break;
          case "dni_dorso":
            setDniDorsoPreview(base64);
            setFormData({ ...formData, dni_dorso_url: base64 });
            break;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const updateData = {};

      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (value !== null && value !== undefined && value !== "") {
          updateData[key] = value;
        }
      });

      if (Object.keys(updateData).length === 0) {
        setError("No hay cambios para guardar");
        setLoading(false);
        return;
      }

      if (updateData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.email)) {
          setError("Email inválido");
          setLoading(false);
          return;
        }
      }

      if (updateData.dni) {
        const dniRegex = /^[0-9]{8}[A-Z]$/i;
        if (!dniRegex.test(updateData.dni)) {
          setError("DNI inválido. Formato: 12345678A");
          setLoading(false);
          return;
        }
      }

      const response = await api.put("/users/profile", updateData);

      if (response.data.success) {
        setSuccess("✓ Perfil actualizado correctamente");

        setTimeout(() => {
          setSuccess("");
          if (onUpdate) onUpdate();
          onClose();
        }, 2000);
      } else {
        setError(response.data.message || "Error al actualizar");
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ Error:", err);
      console.error("❌ Error response:", err.response);
      setError(err.response?.data?.message || "Error al actualizar perfil");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal FIJO - Sin overflow en contenedor principal */}
      <div className="relative bg-[#0a0a0a]/95 backdrop-blur-md rounded-2xl border border-primary-500/20 w-full max-w-6xl max-h-[90vh] shadow-2xl flex flex-col">
        {/* Header FIJO */}
        <div className="bg-[#0a0a0a]/95 backdrop-blur-md border-b border-primary-500/20 p-6 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-[#1a1a1a]/50 flex items-center justify-center transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Contenido con SCROLL INTERNO */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-800">
              <div
                className="relative cursor-pointer group"
                onClick={() => avatarInputRef.current?.click()}
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-4xl font-bold overflow-hidden shadow-xl">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {formData.nombre?.charAt(0)}
                      {formData.apellidos?.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, "avatar")}
                className="hidden"
              />

              <p className="text-sm text-gray-400 text-center">
                Haz clic en la imagen para cambiar tu avatar
                <br />
                <span className="text-xs text-gray-500">
                  Máximo 10MB - JPG, PNG, GIF
                </span>
              </p>
            </div>

            {/* Mensajes */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
                <Check className="w-4 h-4" />
                {success}
              </div>
            )}

            {/* Grid de 3 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Apellidos
                </label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  placeholder="Tus apellidos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  placeholder="612345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha de Nacimiento
                </label>
                <DatePickerInput
                  selected={
                    formData.fecha_nacimiento
                      ? new Date(formData.fecha_nacimiento)
                      : null
                  }
                  onChange={(date) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0",
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      setFormData({
                        ...formData,
                        fecha_nacimiento: `${year}-${month}-${day}`,
                      });
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  DNI
                </label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  maxLength={9}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  placeholder="12345678A"
                />
              </div>
            </div>

            {/* DNI - Fotos */}
            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Documentación DNI
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DNI Frente */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    DNI Frente
                  </label>
                  <div
                    onClick={() => dniFrenteInputRef.current?.click()}
                    className="relative cursor-pointer group border-2 border-dashed border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors"
                  >
                    {dniFrentePreview ? (
                      <img
                        src={dniFrentePreview}
                        alt="DNI Frente"
                        className="w-full h-32 object-contain rounded"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                        <Upload className="w-8 h-8 mb-2" />
                        <p className="text-sm">Click para subir DNI frente</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <input
                    ref={dniFrenteInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, "dni_frente")}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-1">Máximo 10MB</p>
                </div>

                {/* DNI Dorso */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    DNI Dorso
                  </label>
                  <div
                    onClick={() => dniDorsoInputRef.current?.click()}
                    className="relative cursor-pointer group border-2 border-dashed border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors"
                  >
                    {dniDorsoPreview ? (
                      <img
                        src={dniDorsoPreview}
                        alt="DNI Dorso"
                        className="w-full h-32 object-contain rounded"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                        <Upload className="w-8 h-8 mb-2" />
                        <p className="text-sm">Click para subir DNI dorso</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <input
                    ref={dniDorsoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, "dni_dorso")}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-1">Máximo 10MB</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Modifica solo los campos que desees actualizar
            </p>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-[#1a1a1a] hover:bg-[#262626] text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
              >
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
