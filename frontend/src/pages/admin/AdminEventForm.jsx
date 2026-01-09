import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";
import { createEvent, updateEvent } from "../../api/adminApi";
import { getEventById } from "../../api/eventsApi";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";

// Registrar locale español
registerLocale("es", es);

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
      const result = await getEventById(id);
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
          hora_inicio: event.hora_evento || event.hora_inicio || "",
          hora_fin: event.hora_fin || "",
          ubicacion: event.ubicacion || "",
          aforo_maximo: event.aforo_maximo || "",
          precio: event.precio_socio || event.precio || "",
          imagen: null,
        });

        setSelectedDate(fecha);
        setImagePreview(event.imagen_cartel_url || event.imagen_url);
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

  // Manejar blur (cuando el usuario sale del campo) para autocompletar minutos
  const handleTimeBlur = (e) => {
    const { name, value } = e.target;

    if (value && !value.includes(":")) {
      // Si solo escribió la hora sin minutos
      const hora = value.trim().padStart(2, "0");
      const horaNum = parseInt(hora);

      if (horaNum >= 0 && horaNum <= 23) {
        setFormData((prev) => ({ ...prev, [name]: `${hora}:00` }));
      }
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();

      // Mapear a los nombres de la BD
      formDataToSend.append("titulo", formData.nombre);
      formDataToSend.append("descripcion", formData.descripcion);
      formDataToSend.append("fecha_evento", formData.fecha);
      formDataToSend.append("hora_evento", formData.hora_inicio); // Usar hora_inicio como hora del evento
      formDataToSend.append("ubicacion", formData.ubicacion);
      formDataToSend.append("aforo_maximo", formData.aforo_maximo);
      formDataToSend.append("precio_socio", formData.precio || "0");
      formDataToSend.append("precio_invitado", formData.precio || "0");
      formDataToSend.append("permite_invitados", "true");

      if (formData.imagen) {
        formDataToSend.append("imagen", formData.imagen);
      }

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
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-4xl">
          {isEditMode ? "Editar Evento" : "Crear Evento"}
        </h1>
        <p className="text-gray-400 text-lg">
          {isEditMode
            ? "Actualiza la información del evento"
            : "Completa los datos del nuevo evento"}
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6">
          ¡Evento guardado exitosamente! Redirigiendo...
        </div>
      )}

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="card p-8 space-y-6 max-w-4xl mx-auto"
      >
        {/* Nombre */}
        <div>
          <label className="label">Nombre del Evento *</label>
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
          <label className="label">Descripción *</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            className="input min-h-[120px]"
            required
          />
        </div>

        {/* Fecha y Horarios */}
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="label">Fecha *</label>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              locale="es"
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              placeholderText=""
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="label">Hora Inicio *</label>
            <input
              type="time"
              name="hora_inicio"
              value={formData.hora_inicio}
              onChange={handleChange}
              onBlur={handleTimeBlur}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Hora Fin *</label>
            <input
              type="time"
              name="hora_fin"
              value={formData.hora_fin}
              onChange={handleChange}
              onBlur={handleTimeBlur}
              className="input"
              required
            />
          </div>
        </div>

        {/* Ubicación y Aforo */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="label">Ubicación *</label>
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
            <label className="label">Aforo Máximo *</label>
            <input
              type="number"
              name="aforo_maximo"
              value={formData.aforo_maximo}
              onChange={handleChange}
              className="input"
              min="1"
              required
            />
          </div>
        </div>

        {/* Precio */}
        <div>
          <label className="label">Precio (€) - Opcional</label>
          <input
            type="number"
            name="precio"
            value={formData.precio}
            onChange={handleChange}
            className="input"
            min="0"
            step="0.01"
          />
        </div>

        {/* Imagen */}
        <div>
          <label className="label">Imagen del Evento</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="input"
          />
          {imagePreview && (
            <div className="mt-4">
              <p className="text-gray-400 text-sm mb-2">Vista previa:</p>
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