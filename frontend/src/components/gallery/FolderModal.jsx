import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';
import Button from '../common/Button';

// Registrar locale español
registerLocale('es', es);

const FolderModal = ({ folder, onClose, onSave }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha_evento: '',
    imagen_portada_url: '',
    visible: true,
    destacado: false
  });

  useEffect(() => {
    if (folder) {
      setFormData({
        nombre: folder.nombre || '',
        descripcion: folder.descripcion || '',
        fecha_evento: folder.fecha_evento ? folder.fecha_evento.split('T')[0] : '',
        imagen_portada_url: folder.imagen_portada_url || '',
        visible: folder.visible === 1,
        destacado: folder.destacado === 1
      });
      
      // Establecer fecha seleccionada si existe
      if (folder.fecha_evento) {
        setSelectedDate(new Date(folder.fecha_evento));
      }
    }
  }, [folder]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;
      setFormData(prev => ({ ...prev, fecha_evento: fechaFormateada }));
    } else {
      setFormData(prev => ({ ...prev, fecha_evento: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar nombre
    if (!formData.nombre.trim()) {
      alert('El nombre del álbum es obligatorio');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {folder ? 'Editar Álbum' : 'Crear Álbum'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
              placeholder=""
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
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 focus:outline-none resize-none"
              placeholder=""
            />
          </div>

          {/* Fecha del Evento - DatePicker */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              Fecha del Evento
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              locale="es"
              dateFormat="dd/MM/yyyy"
              placeholderText=""
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
              wrapperClassName="w-full"
            />
          </div>

          {/* URL Imagen de Portada */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              URL Imagen de Portada
            </label>
            <input
              type="text"
              name="imagen_portada_url"
              value={formData.imagen_portada_url}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
              placeholder=""
            />
            <p className="text-gray-500 text-sm mt-1">
              Opcional: URL de la imagen de portada del álbum
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="visible"
                checked={formData.visible}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
              />
              <div>
                <span className="text-white font-medium">Visible</span>
                <p className="text-gray-500 text-sm">El álbum será visible para los socios</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="destacado"
                checked={formData.destacado}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
              />
              <div>
                <span className="text-white font-medium">Destacado</span>
                <p className="text-gray-500 text-sm">Aparecerá en la sección de destacados</p>
              </div>
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              {folder ? 'Guardar Cambios' : 'Crear Álbum'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FolderModal;
