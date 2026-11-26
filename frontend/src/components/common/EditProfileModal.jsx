import { useState, useEffect, useRef } from "react";
import { X, Camera, Check, Lock, Mail } from "lucide-react";
import api from "../../api/axios";
import { mediaUrl } from "../../utils/mediaUrl";
import PrivateImage from "./PrivateImage";

// Nombre, apellidos, fecha de nacimiento y DNI los verificó la asociación:
// aquí solo se ven. El socio cambia su foto y su teléfono, y el email con
// confirmación desde el nuevo correo.
const EditProfileModal = ({ isOpen, onClose, userData, onUpdate }) => {
  const [telefono, setTelefono] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Cambio de email
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [passwordEmail, setPasswordEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (userData && isOpen) {
      setTelefono(userData.telefono || "");
      setAvatarFile(null);
      setAvatarPreview(mediaUrl(userData.avatar_url));
      setError("");
      setSuccess("");
      setNuevoEmail("");
      setPasswordEmail("");
      setEmailError("");
      setEmailSuccess("");
    }
  }, [userData, isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen debe ser menor a 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen");
      return;
    }

    setError("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const telefonoLimpio = telefono.trim();
    const telefonoCambiado = telefonoLimpio !== (userData?.telefono || "");

    if (!telefonoCambiado && !avatarFile) {
      setError("No hay cambios para guardar");
      return;
    }

    if (telefonoLimpio && !/^[0-9+\s()-]{6,20}$/.test(telefonoLimpio)) {
      setError("El teléfono no es válido");
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      if (telefonoCambiado) body.append("telefono", telefonoLimpio);
      if (avatarFile) body.append("avatar", avatarFile);

      const response = await api.put("/users/profile", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setSuccess("Perfil actualizado correctamente");
        setTimeout(() => {
          setSuccess("");
          if (onUpdate) onUpdate();
          onClose();
        }, 1500);
      } else {
        setError(response.data.message || "Error al actualizar");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al actualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEmail = async () => {
    setEmailError("");
    setEmailSuccess("");

    const email = nuevoEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Escribe un email válido");
      return;
    }
    if (!passwordEmail) {
      setEmailError("Escribe tu contraseña para confirmar que eres tú");
      return;
    }

    setEmailLoading(true);
    try {
      const response = await api.put("/users/profile/email", {
        nuevoEmail: email,
        password: passwordEmail,
      });
      setEmailSuccess(response.data.message);
      setNuevoEmail("");
      setPasswordEmail("");
      if (onUpdate) onUpdate();
    } catch (err) {
      setEmailError(err.response?.data?.message || "No se pudo solicitar el cambio");
    } finally {
      setEmailLoading(false);
    }
  };

  const fechaNacimiento = userData?.fecha_nacimiento
    ? new Date(userData.fecha_nacimiento).toLocaleDateString("es-ES")
    : "—";

  const inputClass =
    "w-full px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* El scroll va por dentro, no en el modal */}
      <div className="relative bg-[#0a0a0a]/95 backdrop-blur-md rounded-2xl border border-primary-500/20 w-full max-w-6xl max-h-[90vh] shadow-2xl flex flex-col">
        {/* Cabecera fija */}
        <div className="bg-[#0a0a0a]/95 backdrop-blur-md border-b border-primary-500/20 p-4 sm:p-6 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-[#1a1a1a]/50 flex items-center justify-center transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-800">
              <div
                className="relative cursor-pointer group"
                onClick={() => avatarInputRef.current?.click()}
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl sm:text-4xl font-bold overflow-hidden shadow-xl">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {userData?.nombre?.charAt(0)}
                      {userData?.apellidos?.charAt(0)}
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
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />

              <p className="text-sm text-gray-400 text-center">
                Haz clic en la imagen para cambiar tu avatar
                <br />
                <span className="text-xs text-gray-500">
                  Máximo 5MB - JPG, PNG, WEBP
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

            {/* Teléfono */}
            <div className="max-w-sm">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className={inputClass}
                placeholder="612345678"
              />
            </div>

            {/* Datos verificados: solo lectura */}
            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" />
                Datos verificados
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                La asociación comprobó estos datos al aprobar tu alta. Si hay
                algún error, contacta con la asociación para corregirlo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ["Nombre", userData?.nombre],
                  ["Apellidos", userData?.apellidos],
                  ["Fecha de nacimiento", fechaNacimiento],
                  ["DNI / NIE", userData?.dni],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta}>
                    <p className="text-xs text-gray-500 mb-1">{etiqueta}</p>
                    <p className="text-white bg-[#111] border border-[#262626] rounded-lg px-4 py-3">
                      {valor || "—"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 max-w-xs">
                <p className="text-xs text-gray-500 mb-1">DNI (cara delantera)</p>
                {/* El DNI guardado no es público: se pide con la sesión */}
                <PrivateImage
                  endpoint={userData?.dni_front_url ? "/users/profile/dni" : null}
                  alt="DNI Frente"
                  className="w-full h-32 object-contain rounded border border-[#262626]"
                  fallback={
                    <div className="flex items-center justify-center h-32 text-gray-500 text-sm border border-[#262626] rounded">
                      Sin imagen
                    </div>
                  }
                />
              </div>
            </div>

            {/* Email: se cambia con confirmación desde el nuevo correo */}
            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                Email
              </h3>
              <p className="text-sm text-gray-300 mb-1">
                Actual: <span className="text-white">{userData?.email}</span>
              </p>
              {userData?.email_pendiente && !emailSuccess && (
                <p className="text-xs text-amber-300 mb-3">
                  Pendiente de confirmar: {userData.email_pendiente}. Revisa ese
                  correo y pulsa el enlace.
                </p>
              )}
              <p className="text-xs text-gray-500 mb-4">
                Te enviaremos un enlace al nuevo correo. Hasta que lo confirmes,
                seguirás entrando con el actual.
              </p>

              {emailError && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm mb-4">
                  {emailError}
                </div>
              )}
              {emailSuccess && (
                <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-sm mb-4">
                  {emailSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nuevo email
                  </label>
                  <input
                    type="email"
                    value={nuevoEmail}
                    onChange={(e) => setNuevoEmail(e.target.value)}
                    className={inputClass}
                    placeholder="nuevo@email.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tu contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordEmail}
                    onChange={(e) => setPasswordEmail(e.target.value)}
                    className={inputClass}
                    placeholder="Para confirmar que eres tú"
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCambiarEmail}
                  disabled={emailLoading}
                  className="px-6 py-3 bg-[#1a1a1a] hover:bg-[#262626] border border-primary-500/40 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {emailLoading ? "Enviando..." : "Cambiar email"}
                </button>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 px-6 py-3 bg-[#1a1a1a] hover:bg-[#262626] text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
              >
                {loading ? "Guardando..." : "Guardar foto y teléfono"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;