import { useState } from "react";
import {
  Upload,
  CheckCircle,
  FileText,
  User,
  Lock,
  Phone,
  Calendar,
  CreditCard,
  Eye,
  EyeOff,
} from "lucide-react";
import Button from "../components/common/Button";
import DatePickerInput from "../components/common/DatePickerInput";
import { NAV_ROUTES } from "../utils/constants";
import { useLanguage } from "../context/LanguageContext";

const Register = () => {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefono: "",
    fecha_nacimiento: "",
    dni: "",
    artistQuestion: "",
  });

  const [dniFront, setDniFront] = useState(null);
  const [dniFrontPreview, setDniFrontPreview] = useState(null);
  const [esArtista, setEsArtista] = useState(""); // "si" | "no" | ""

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setDniFront(file);
    setDniFrontPreview(preview);
  };

  const handleEsArtistaChange = (value) => {
    setEsArtista(value);
    if (value === "no") {
      setFormData((prev) => ({ ...prev, artistQuestion: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(t("register.errorPasswords"));
      return;
    }
    if (!dniFront) {
      setError(t("register.errorDni"));
      return;
    }

    setLoading(true);

    try {
      const body = new FormData();
      const combinedMotivacion = formData.artistQuestion
        ? `${t("register.artistQuestion")} ${formData.artistQuestion}`
        : "";

      Object.entries(formData).forEach(([key, val]) => {
        if (key !== "confirmPassword" && key !== "artistQuestion") {
          body.append(key, val);
        }
      });
      body.append("motivacion", combinedMotivacion);
      body.append("dni_front", dniFront);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/solicitud-socio`,
        { method: "POST", body },
      );
      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setSuccessEmail(data.data?.email || formData.email);
      } else {
        setError(data.message || "Error al enviar la solicitud");
      }
    } catch (err) {
      console.error("Error en registro:", err);
      setError(t("register.errorConnection"));
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla de éxito ────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle size={48} className="text-green-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {t("register.success.title")}
          </h1>
          <p className="text-gray-300 text-sm sm:text-lg mb-3">
            {t("register.success.text")}
          </p>
          <p className="text-gray-400 mb-8">
            {t("register.success.emailSent")}{" "}
            <span className="text-primary-400 font-semibold">
              {successEmail}
            </span>
            . {t("register.success.emailInfo")}
          </p>
          <a
            href={NAV_ROUTES.HOME}
            className="inline-block bg-primary-600 hover:bg-primary-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            {t("register.success.backHome")}
          </a>
        </div>
      </div>
    );
  }

  // ── Formulario ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-16 px-4 relative overflow-hidden">
      {/* Fondo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black z-10" />
        <img
          src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80"
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      <div className="relative z-20 container-custom max-w-2xl">
        {/* Cabecera */}
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-4xl font-display text-white mb-3">
            {t("register.title")}
          </h1>
          <p className="text-gray-300 leading-relaxed">
            {t("register.subtitle")}
          </p>
        </div>

        <div className="bg-gradient-to-br from-primary-600/20 via-primary-700/10 to-primary-800/20 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-primary-500/20">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Datos personales ── */}
            <p className="text-primary-400 text-xs font-semibold uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> {t("register.sectionPersonal")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  {t("register.name")} {t("register.required")}
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  {t("register.surnames")} {t("register.required")}
                </label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className="input w-full"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  {t("register.phone")} {t("register.required")}
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  {t("register.birthdate")} {t("register.required")}
                </label>
                <DatePickerInput
                  selected={
                    formData.fecha_nacimiento
                      ? new Date(formData.fecha_nacimiento)
                      : null
                  }
                  onChange={(date) => {
                    if (date) {
                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, "0");
                      const d = String(date.getDate()).padStart(2, "0");
                      setFormData({
                        ...formData,
                        fecha_nacimiento: `${y}-${m}-${d}`,
                      });
                    }
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">
                {t("register.dni")} {t("register.required")}
              </label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                className="input w-full"
                maxLength={9}
                required
              />
            </div>

            {/* ── Cuenta ── */}
            <p className="text-primary-400 text-xs font-semibold uppercase tracking-widest flex items-center gap-2 pt-2">
              <Lock size={14} /> {t("register.sectionAccess")}
            </p>

            <div>
              <label className="block text-gray-400 text-sm mb-1">
                {t("register.email")} {t("register.required")}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input w-full"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-gray-400 text-sm mb-1">
                  {t("register.password")} {t("register.required")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input w-full pr-10"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="relative">
                <label className="block text-gray-400 text-sm mb-1">
                  {t("register.confirmPassword")} {t("register.required")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input w-full pr-10"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Preguntas ── */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                {t("register.artistQuestion")}
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleEsArtistaChange("si")}
                  className={`px-6 py-2 rounded-lg font-medium text-sm transition-all border ${
                    esArtista === "si"
                      ? "bg-primary-600 border-primary-600 text-white"
                      : "bg-transparent border-gray-600 text-gray-300 hover:border-primary-500/50"
                  }`}
                >
                  {t("register.artistQuestionYes")}
                </button>
                <button
                  type="button"
                  onClick={() => handleEsArtistaChange("no")}
                  className={`px-6 py-2 rounded-lg font-medium text-sm transition-all border ${
                    esArtista === "no"
                      ? "bg-primary-600 border-primary-600 text-white"
                      : "bg-transparent border-gray-600 text-gray-300 hover:border-primary-500/50"
                  }`}
                >
                  {t("register.artistQuestionNo")}
                </button>
              </div>

              {esArtista === "si" && (
                <div className="mt-3">
                  <label className="block text-gray-400 text-sm mb-1">
                    {t("register.artistQuestionDetail")}
                  </label>
                  <textarea
                    name="artistQuestion"
                    value={formData.artistQuestion}
                    onChange={handleChange}
                    rows={3}
                    className="input w-full resize-none"
                  />
                </div>
              )}
            </div>

            {/* ── DNI fotos ── */}
            <p className="text-primary-400 text-xs font-semibold uppercase tracking-widest flex items-center gap-2 pt-2">
              <CreditCard size={14} /> {t("register.sectionIdentity")}
            </p>
            <p className="text-gray-400 text-sm -mt-3">
              {t("register.identityHelp")}
            </p>

            <div className="max-w-sm mx-auto">
              {/* Foto de DNI (única cara requerida) */}
              <div>
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    required
                  />
                  {dniFrontPreview ? (
                    <img
                      src={dniFrontPreview}
                      alt="DNI"
                      className="w-full h-52 object-cover rounded-xl border-2 border-primary-500/50"
                    />
                  ) : (
                    <div className="w-full h-52 bg-primary-500/5 border-2 border-dashed border-primary-500/40 hover:border-primary-500 hover:bg-primary-500/10 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors">
                      <Upload size={32} className="text-primary-400" />
                      <span className="text-gray-300 text-sm font-medium">
                        {t("register.uploadImage")}
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* ── Submit ── */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full"
              >
                {loading ? t("register.loading") : t("register.submit")}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {t("register.hasAccount")}{" "}
              <a
                href={NAV_ROUTES.LOGIN}
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                {t("register.loginLink")}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;