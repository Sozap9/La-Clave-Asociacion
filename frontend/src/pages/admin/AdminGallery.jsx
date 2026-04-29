import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Plus, Trash2, Edit, Eye, Calendar, EyeOff, X } from 'lucide-react';
import * as galleryApi from '../../api/galleryApi';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import FolderModal from '../../components/gallery/FolderModal';
import DatePickerInput from '../../components/common/DatePickerInput';

// ✅ CORRECCIÓN: Obtener URL base sin /api
const API_BASE_URL = import.meta.env.VITE_API_URL.replace('/api', '');

const AdminGallery = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await galleryApi.getAllFolders();
      
      if (result.success) {
        setFolders(result.data || []);
      } else {
        setError(result.message || 'Error al cargar álbumes');
      }
    } catch (err) {
      console.error('Error en fetchFolders:', err);
      setError('Error de conexión al cargar álbumes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFolder(null);
    setShowModal(true);
  };

  const handleEdit = (folder) => {
    setEditingFolder(folder);
    setShowModal(true);
  };

  const handleSaveFolder = async (folderData, coverFile) => {
    try {
      let result;
      let folderId;

      if (editingFolder) {
        result = await galleryApi.updateFolder(editingFolder.id, folderData);
        folderId = editingFolder.id;
      } else {
        result = await galleryApi.createFolder(folderData);
        folderId = result.data?.id;
      }

      if (!result.success) {
        setError(result.message || 'Error al guardar álbum');
        return;
      }

      // Si hay archivo de portada, subirlo y establecerlo como cover
      if (coverFile && folderId) {
        try {
          const imageFormData = new FormData();
          imageFormData.append('image', coverFile);
          imageFormData.append('titulo', '');
          imageFormData.append('descripcion', '');
          imageFormData.append('visible', 'true');
          imageFormData.append('destacado', 'false');

          const uploadResult = await galleryApi.uploadImage(folderId, imageFormData);
          if (uploadResult.success && uploadResult.data?.id) {
            await galleryApi.setCoverImage(folderId, uploadResult.data.id);
          }
        } catch (coverErr) {
          console.warn('Error subiendo portada:', coverErr);
          // No bloqueamos: el álbum ya se guardó
        }
      }

      setSuccess(editingFolder ? 'Álbum actualizado' : 'Álbum creado');
      setShowModal(false);
      fetchFolders();
    } catch (err) {
      console.error('Error saving folder:', err);
      setError('Error al guardar álbum');
    }
  };

  const handleDelete = async (folder) => {
    if (!window.confirm(`¿Estás seguro de eliminar el álbum "${folder.nombre}"? Se eliminarán también todas sus imágenes.`)) {
      return;
    }

    try {
      const result = await galleryApi.deleteFolder(folder.id);
      
      if (result.success) {
        setSuccess('Álbum eliminado correctamente');
        fetchFolders();
      } else {
        setError(result.message || 'Error al eliminar álbum');
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError('Error al eliminar álbum');
    }
  };

  const handleViewImages = (folder) => {
    navigate(`/admin/galeria/${folder.id}/imagenes`);
  };

  if (loading) return <Loader fullScreen />;

  // Filtrar álbumes
  const filteredFolders = folders.filter(folder => {
    const matchesSearch = !searchTerm.trim() ||
      folder.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (folder.descripcion && folder.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDate = !dateFilter ||
      (folder.fecha_evento &&
        folder.fecha_evento.startsWith(
          `${dateFilter.getFullYear()}-${String(dateFilter.getMonth() + 1).padStart(2, '0')}`
        ));

    return matchesSearch && matchesDate;
  });

  const hasActiveFilters = searchTerm.trim() || dateFilter;

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Gestionar Álbumes</h1>
            <p className="text-gray-400 text-sm md:text-lg">Administra los álbumes de fotos de la asociación</p>
          </div>
          <Button
            variant="primary"
            onClick={handleCreate}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Álbum
          </Button>
        </div>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} />
      )}
      
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess('')} />
      )}

      {/* Filtros y Búsqueda */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        {/* Búsqueda por nombre */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar álbumes por nombre..."
            className="w-full px-4 py-3 pl-10 pr-10 bg-[#1a1a1a]/60 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtro por fecha (mes/año) */}
        <div className="min-w-[180px]">
          <DatePickerInput
            selected={dateFilter}
            onChange={setDateFilter}
            placeholderText="Filtrar por mes..."
            showMonthYearPicker
            dateFormat="MM/yyyy"
            isClearable
          />
        </div>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <button
            onClick={() => { setSearchTerm(''); setDateFilter(null); }}
            className="px-4 py-3 bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg text-sm transition-all flex items-center gap-2"
          >
            <X size={14} />
            Limpiar
          </button>
        )}
      </div>

      {/* Grid de álbumes */}
      {filteredFolders.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
          <Image size={64} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-xl font-semibold mb-2">
            {hasActiveFilters ? 'No se encontraron álbumes' : 'No hay álbumes'}
          </h3>
          <p className="text-gray-400 mb-6">
            {hasActiveFilters ? 'Intenta ajustar los filtros' : 'Crea tu primer álbum para empezar a organizar fotos'}
          </p>
          {!hasActiveFilters && (
            <Button variant="primary" onClick={handleCreate} className="inline-flex items-center gap-2">
              <Plus size={20} />
              Crear Primer Álbum
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {filteredFolders.map((folder) => {
            // ✅ CORRECCIÓN: Construir URL completa
            const coverImageUrl = folder.imagen_portada_url 
              ? (folder.imagen_portada_url.startsWith('http') 
                  ? folder.imagen_portada_url 
                  : `${API_BASE_URL}${folder.imagen_portada_url}`)
              : null;

            return (
              <div
                key={folder.id}
                className="bg-[#1a1a1a] border border-[#262626] rounded-xl overflow-hidden hover:border-primary-500/50 transition-all"
              >
                {/* Imagen de portada */}
                <div className="h-32 bg-[#262626] flex items-center justify-center relative overflow-hidden">
                  {coverImageUrl ? (
                    <img
                      src={coverImageUrl}
                      alt={folder.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Error loading cover image:', coverImageUrl);
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Image size={48} className="text-gray-600" />
                  )}
                  
                  <div className="absolute top-2 right-2 flex gap-2">
                    {/* Badge de visibilidad */}
                    <div className="px-2 py-1 rounded text-white text-xs font-semibold bg-primary-600">
                      {folder.visible ? 'VISIBLE' : 'OCULTO'}
                    </div>
                    
                    {/* Badge de fotos */}
                    <div className="bg-black/60 px-2 py-1 rounded text-white text-xs">
                      {folder.total_imagenes || 0} fotos
                    </div>
                  </div>
                  
                  {/* Badge destacado */}
                  {folder.destacado === 1 && (
                    <div className="absolute top-2 left-2 bg-primary-600 px-2 py-1 rounded text-white text-xs font-semibold">
                      DESTACADO
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-lg mb-1">{folder.nombre}</h3>
                  <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                    {folder.descripcion || 'Sin descripción'}
                  </p>
                  
                  {folder.fecha_evento && (
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
                      <Calendar size={14} />
                      <span>{new Date(folder.fecha_evento).toLocaleDateString('es-ES')}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleViewImages(folder)}
                      className="px-3 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Image size={16} />
                      Ver Fotos
                    </button>
                    <button
                      onClick={() => handleEdit(folder)}
                      className="px-3 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(folder)}
                    className="w-full mt-2 px-3 py-2 bg-[#262626] border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Eliminar Álbum
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Crear/Editar Álbum */}
      {showModal && (
        <FolderModal
          folder={editingFolder}
          onClose={() => setShowModal(false)}
          onSave={handleSaveFolder}
        />
      )}
    </div>
  );
};

export default AdminGallery;