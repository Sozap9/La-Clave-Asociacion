import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, Zap, ZapOff } from "lucide-react";
import {
  createEvent,
  updateEvent,
  getEventDetailsAdmin,
  activateEventTier,
  deactivateEventTier,
} from "../../api/adminApi";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import DatePickerInput from "../../components/common/DatePickerInput";

// Tanda nueva, sin id hasta guardarla
const nuevaTanda = () => ({
  id: null,
  nombre: "",
  precio: "",
  fecha_inicio: null, // Date, solo el día
  hora_inicio: "", // "HH:MM"
  activada_manualmente: false,
});

const AdminEventForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [tandas, setTandas] = useState([]);
  const [tandaActionLoading, setTandaActionLoading] = useState(null); // id de la tanda en acción

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    ubicacion: "",
    aforo_maximo: "",
    precio: "",
    imagen: null,
  });

  useEffect(() => {
    if (isEditMode) {
      fetchEventData();
    }
  }, [id]);

  const fetchEventData = async () => {
    try {
      const result = await getEventDetailsAdmin(id);
      if (result.success) {
        const event = result.data;
        const fecha = new Date(event.fecha_evento || event.fecha);

        setFormData({
          nombre: event.titulo || event.nombre || "",
          descripcion: event.descripcion || "",
          fecha: event.fecha_evento
            ? event.fecha_evento.split("T")[0]
            : event.fecha
              ? event.fecha.split("T")[0]
              : "",
          hora_inicio: (event.hora_evento || event.hora_inicio || "").slice(0, 5),
          hora_fin: (event.hora_fin || "").slice(0, 5),
          ubicacion: event.ubicacion || "",
          aforo_maximo: event.aforo_maximo || "",
          precio: event.precio_socio || event.precio || "",
          imagen: null,
        });

        setSelectedDate(fecha);
        setImagePreview(event.imagen_cartel_url || event.imagen_url);

        // fecha_hora_inicio se separa en día (calendario) y hora (texto)
        setTandas(
          (event.tandas || []).map((t) => {
            const dt = t.fecha_hora_inicio
              ? new Date(t.fecha_hora_inicio.replace(" ", "T"))
              : null;
            return {
              id: t.id,
              nombre: t.nombre,
              precio: t.precio,
              fecha_inicio: dt,
              hora_inicio: dt
                ? `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`
                : "",
              activada_manualmente: !!t.activada_manualmente,
            };
          }),
        );
      }
    } catch (err) {
      setError("Error al cargar el evento");
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Con 2 dígitos se completa la hora: "23" → "23:00"
  const handleHoraInicioChange = (e) => {
    let value = e.target.value;

    value = value.replace(/[^0-9:]/g, "");

    if (value.length === 2 && !value.includes(":")) {
      const hora = parseInt(value);
      if (hora >= 0 && hora <= 23) {
        value = `${value}:00`;
      }
    }

    setFormData((prev) => ({ ...prev, hora_inicio: value }));
  };

  // Igual para hora_fin
  const handleHoraFinChange = (e) => {
    let value = e.target.value;

    value = value.replace(/[^0-9:]/g, "");

    if (value.length === 2 && !value.includes(":")) {
      const hora = parseInt(value);
      if (hora >= 0 && hora <= 23) {
        value = `${value}:00`;
      }
    }

    setFormData((prev) => ({ ...prev, hora_fin: value }));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const fechaFormateada = `${year}-${month}-${day}`;

      setFormData((prev) => ({ ...prev, fecha: fechaFormateada }));
    } else {
      setFormData((prev) => ({ ...prev, fecha: "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, imagen: file }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Tandas
  const handleAddTanda = () => {
    setTandas((prev) => [...prev, nuevaTanda()]);
  };

  const handleRemoveTanda = (index) => {
    setTandas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTandaChange = (index, field, value) => {
    setTandas((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    );
  };

  // Igual para la hora de cada tanda
  const handleTandaHoraChange = (index, e) => {
    let value = e.target.value;
    value = value.replace(/[^0-9:]/g, "");

    if (value.length === 2 && !value.includes(":")) {
      const hora = parseInt(value);
      if (hora >= 0 && hora <= 23) {
        value = `${value}:00`;
      }
    }

    handleTandaChange(index, "hora_inicio", value);
  };

  // Forzar una tanda guardada como vigente ya (solo al editar)
  const handleActivarTanda = async (tandaId) => {
    setTandaActionLoading(tandaId);
    try {
      const result = await activateEventTier(id, tandaId);
      if (result.success) {
        setTandas((prev) =>
          prev.map((t) => ({ ...t, activada_manualmente: t.id === tandaId })),
        );
      } else {
        setError(result.message || "Error al activar el tramo");
      }
    } catch (err) {
      setError("Error de conexión al activar el tramo");
    } finally {
      setTandaActionLoading(null);
    }
  };

  const handleDesactivarTanda = async () => {
    setTandaActionLoading("desactivar");
    try {
      const result = await deactivateEventTier(id);
      if (result.success) {
        setTandas((prev) => prev.map((t) => ({ ...t, activada_manualmente: false })));
      } else {
        setError(result.message || "Error al desactivar el forzado manual");
      }
    } catch (err) {
      setError("Error de conexión al desactivar el forzado manual");
    } finally {
      setTandaActionLoading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("titulo", formData.nombre);
      formDataToSend.append("descripcion", formData.descripcion);
      formDataToSend.append("fecha_evento", formData.fecha);
      formDataToSend.append("hora_evento", formData.hora_inicio);
      formDataToSend.append("hora_fin", formData.hora_fin);
      formDataToSend.append("ubicacion", formData.ubicacion);
      formDataToSend.append("aforo_maximo", formData.aforo_maximo);
      formDataToSend.append("precio_socio", formData.precio || "0");
      formDataToSend.append("precio_invitado", formData.precio || "0");
      formDataToSend.append("permite_invitados", "true");

      if (formData.imagen) {
        formDataToSend.append("imagen", formData.imagen);
      }

      // Solo tandas completas; día y hora se unen en "YYYY-MM-DD HH:MM:SS"
      const combinarFechaHora = (date, horaTexto) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const [hh, mm] = (horaTexto || "00:00").split(":");
        const hours = (hh || "00").padStart(2, "0");
        const minutes = (mm || "00").padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:00`;
      };

      const tandasValidas = tandas
        .filter((t) => t.nombre && t.precio !== "" && t.fecha_inicio && t.hora_inicio)
        .map((t) => ({
          id: t.id,
          nombre: t.nombre,
          precio: parseFloat(t.precio),
          fecha_hora_inicio: combinarFechaHora(t.fecha_inicio, t.hora_inicio),
          activada_manualmente: t.activada_manualmente,
        }));
      formDataToSend.append("tandas", JSON.stringify(tandasValidas));

      const result = isEditMode
        ? await updateEvent(id, formDataToSend)
        : await createEvent(formDataToSend);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/admin/eventos");
        }, 1500);
      } else {
        setError(result.message || "Error al guardar el evento");
      }
    } catch (err) {
      console.error("Error al guardar evento:", err);
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) return <Loader fullScreen />;

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      {/* Cabecera */}
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-2xl md:text-4xl">
          {isEditMode ? "Editar Evento" : "Crear Evento"}
        </h1>
        <p className="text-gray-400 text-sm md:text-lg">
          {isEditMode
            ? "Actualiza la información del evento."
            : "Completa los datos del nuevo evento."}
        </p>
      </div>

      {/* Avisos */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6">
          ¡Evento creado!
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="card p-4 sm:p-8 space-y-6 max-w-4xl mx-auto"
      >
        {/* Nombre */}
        <div>
          <label className="label"> Nombre del Evento </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="label"> Descripción </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            className="input min-h-[120px]"
            required
          />
        </div>

        {/* Fecha y horario */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div>
            <label className="label"> Fecha </label>
            <DatePickerInput
              selected={selectedDate}
              onChange={handleDateChange}
              minDate={new Date()}
              required
            />
          </div>
          <div>
            <label className="label"> Hora Inicio </label>
            <input
              type="text"
              name="hora_inicio"
              placeholder="22:30"
              value={formData.hora_inicio}
              onChange={handleHoraInicioChange}
              className="input"
              maxLength="5"
              required
            />
          </div>
          <div>
            <label className="label"> Hora Fin </label>
            <input
              type="text"
              name="hora_fin"
              placeholder=" 05:30"
              value={formData.hora_fin}
              onChange={handleHoraFinChange}
              className="input"
              maxLength="5"
              required
            />
          </div>
        </div>

        {/* Ubicación y aforo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="label"> Ubicación </label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label"> Aforo Máximo</label>
            <input
              type="number"
              name="aforo_maximo"
              value={formData.aforo_maximo}
              onChange={handleChange}
              className="input [&::-webkit-outer-spin-button]:[-webkit-appearance:none] [&::-webkit-inner-spin-button]:[-webkit-appearance:none] [&[type=number]]:[-moz-appearance:textfield]"
              min="1"
              required
            />
          </div>
        </div>

        {/* Precio */}
        <div>
          <label className="label">Precio (€) </label>
          <input
            type="number"
            name="precio"
            placeholder="0.00 €"
            value={formData.precio}
            onChange={handleChange}
            className="input [&::-webkit-outer-spin-button]:[-webkit-appearance:none] [&::-webkit-inner-spin-button]:[-webkit-appearance:none] [&[type=number]]:[-moz-appearance:textfield]"
            min="0"
            step="0.01"
          />
        </div>

        {/* Tandas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="label mb-0"> Tramos de precio </label>
              <p className="text-gray-500 text-xs mt-1">
                Si añades tramos, el precio de arriba pasa a ser solo el precio
                por defecto antes de que empiece el primer tramo. El precio
                sube automáticamente según la fecha/hora de cada tramo — el
                público solo ve un precio, sin avisos.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleAddTanda}>
              <span className="flex items-center gap-1.5">
                <Plus size={16} /> Añadir tramo
              </span>
            </Button>
          </div>

          {tandas.length > 0 && (
            <div className="space-y-3 mt-3">
              {tandas.map((tanda, index) => {
                const isActiva = isEditMode && tanda.id && tanda.activada_manualmente;
                return (
                  <div
                    key={tanda.id ?? `nueva-${index}`}
                    className={`border p-3 sm:p-4 rounded-lg grid grid-cols-1 sm:grid-cols-[1fr_100px_1fr_90px_auto] gap-3 items-end ${
                      isActiva ? "border-primary-500 bg-primary-500/5" : "border-[#262626]"
                    }`}
                  >
                    <div>
                      <label className="label text-xs"> Nombre </label>
                      <input
                        type="text"
                        placeholder="Últimos reservas"
                        value={tanda.nombre}
                        onChange={(e) => handleTandaChange(index, "nombre", e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label text-xs"> Precio (€) </label>
                      <input
                        type="number"
                        placeholder="0.00 €"
                        min="0"
                        step="0.01"
                        value={tanda.precio}
                        onChange={(e) => handleTandaChange(index, "precio", e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label text-xs"> Empieza el </label>
                      <DatePickerInput
                        selected={tanda.fecha_inicio}
                        onChange={(date) =>
                          handleTandaChange(index, "fecha_inicio", date)
                        }
                        placeholderText="Fecha"
                      />
                    </div>
                    <div>
                      <label className="label text-xs"> Hora </label>
                      <input
                        type="text"
                        placeholder="22:30"
                        value={tanda.hora_inicio}
                        onChange={(e) => handleTandaHoraChange(index, e)}
                        className="input"
                        maxLength="5"
                      />
                    </div>
                    <div className="flex gap-2">
                      {isEditMode && tanda.id && (
                        <button
                          type="button"
                          title={isActiva ? "Volver a modo automático" : "Activar ahora"}
                          onClick={() =>
                            isActiva ? handleDesactivarTanda() : handleActivarTanda(tanda.id)
                          }
                          disabled={tandaActionLoading !== null}
                          className={`p-2 rounded border transition-colors ${
                            isActiva
                              ? "border-primary-500 text-primary-400 hover:bg-primary-500/10"
                              : "border-[#333] text-gray-400 hover:bg-[#1a1a1a]"
                          }`}
                        >
                          {isActiva ? <ZapOff size={16} /> : <Zap size={16} />}
                        </button>
                      )}
                      {/* Las tandas guardadas no se pueden quitar */}
                      {!tanda.id && (
                        <button
                          type="button"
                          title="Quitar tramo"
                          onClick={() => handleRemoveTanda(index)}
                          className="p-2 rounded border border-[#333] text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    {isActiva && (
                      <p className="text-primary-400 text-xs sm:col-span-5 -mt-1">
                        Forzada como vigente manualmente ahora mismo
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Imagen */}
        <div>
          <label className="label"> Imagen del Evento </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="input file:px-3 file:py-1.5 file:text-sm file:font-medium file:bg-primary-600 file:text-white file:border-0 file:rounded file:cursor-pointer file:mr-4 text-xs"
          />
          {imagePreview && (
            <div className="mt-4">
              <p className="text-gray-400 text-sm mb-2"> Vista previa </p>
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-w-md h-48 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-6">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading
              ? "Guardando..."
              : isEditMode
                ? "Actualizar Evento"
                : "Crear Evento"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/eventos")}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminEventForm;