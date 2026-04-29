import { useState, useEffect, useRef } from "react";
import { X, Upload } from "lucide-react";
import DatePickerInput from "../common/DatePickerInput";

const API_BASE_URL = import.meta.env.VITE_API_URL.replace('/api', '');

const FolderModal = ({ folder, onClose, onSave }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    fecha_evento: "",
    visible: true,
    destacado: false,
  });

  // Portada como archivo
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (folder) {
      setFormData({
        nombre: folder.nombre || "",
        descripcion: folder.descripcion || "",
        fecha_evento: folder.fecha_evento ? folder.fecha_evento.split("T")[0] : "",
        visible: folder.visible === 1,
        destacado: folder.destacado === 1,
      });
      if (folder.fecha_evento) {
        setSelectedDate(new Date(folder.fecha_evento));
      }
      // Mostrar portada actual si existe
      if (folder.imagen_portada_url) {
        const url = folder.imagen_portada_url.startsWith('http')
          ? folder.imagen_portada_url
          : `${API_BASE_URL}${folder.imagen_portada_url}`;
        setCoverPreview(url);
      }
    }
  }, [folder]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleToggle = (field) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      setFormData((prev) => ({ ...prev, fecha_evento: `${year}-${month}-${day}` }));
    } else {
      setFormData((prev) => ({ ...prev, fecha_evento: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("La imagen no debe superar los 10MB");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      alert("El nombre del álbum es obligatorio");
      return;
    }
    onSave(formData, coverFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#0a0a0a]/95 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-primary-500/20 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-primary-500/20 p-4 sm:p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {folder ? "Editar Álbum" : "Crear Álbum"}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-[#1a1a1a] flex items-center justify-center transition-colors"
            type="button"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              Nombre del Álbum <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
            />
          </div>

          {/* Fecha del Evento */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              Fecha del Evento{" "}
              <span className="text-gray-500 text-sm font-normal">(opcional)</span>
            </label>
            <DatePickerInput
              selected={selectedDate}
              onChange={handleDateChange}
              placeholderText="Sin fecha asignada"
              isClearable
            />
          </div>

          {/* Imagen de Portada — file picker */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              Imagen de Portada{" "}
              <span className="text-gray-500 text-sm font-normal">(opcional)</span>
            </label>

            {!coverPreview ? (
              <label className="block cursor-pointer group">
                <div className="w-full h-36 border-2 border-dashed border-[#262626] group-hover:border-primary-500/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors bg-[#1a1a1a]">
                  <Upload size={28} className="text-gray-500 group-hover:text-primary-400 transition-colors" />
                  <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                    Haz clic para seleccionar una imagen
                  </p>
                  <p className="text-gray-600 text-xs">PNG, JPG, WEBP · máx. 10MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden h-36">
                <img
                  src={coverPreview}
                  alt="Portada"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-end justify-between p-3">
                  {coverFile && (
                    <span className="text-white text-xs bg-black/60 px-2 py-1 rounded truncate max-w-[60%]">
                      {coverFile.name}
                    </span>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <label className="cursor-pointer px-3 py-1.5 bg-[#1a1a1a]/90 hover:bg-[#2a2a2a] text-white text-xs rounded-lg transition-colors flex items-center gap-1.5">
                      <Upload size={12} />
                      Cambiar
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="px-3 py-1.5 bg-red-600/80 hover:bg-red-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <X size={12} />
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Toggles — mismo estilo que modal de imagen */}
          <div className="space-y-3">
            {/* Visible */}
            <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#262626] rounded-lg">
              <div>
                <p className="text-white font-medium">Visible</p>
                <p className="text-gray-500 text-sm">El álbum será visible para los socios</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('visible')}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none ${
                  formData.visible ? 'bg-primary-600' : 'bg-[#262626]'
                }`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${
                  formData.visible ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Destacado */}
            <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#262626] rounded-lg">
              <div>
                <p className="text-white font-medium">Destacado</p>
                <p className="text-gray-500 text-sm">Aparecerá en la sección de destacados</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('destacado')}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none ${
                  formData.destacado ? 'bg-primary-600' : 'bg-[#262626]'
                }`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${
                  formData.destacado ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              {folder ? "Guardar Cambios" : "Crear Álbum"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-[#1a1a1a] hover:bg-[#262626] text-white rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FolderModal;