import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Plus, Trash2, Edit, Eye, Calendar, EyeOff } from 'lucide-react';
import * as galleryApi from '../../api/galleryApi';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import FolderModal from '../../components/gallery/FolderModal';

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

  const handleSaveFolder = async (folderData) => {
    try {
      let result;
      if (editingFolder) {
        result = await galleryApi.updateFolder(editingFolder.id, folderData);
      } else {
        result = await galleryApi.createFolder(folderData);
      }

      if (result.success) {
        setSuccess(editingFolder ? 'Álbum actualizado' : 'Álbum creado');
        setShowModal(false);
        fetchFolders();
      } else {
        setError(result.message || 'Error al guardar álbum');
      }
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Gestionar Álbumes</h1>
            <p className="text-gray-400">Administra los álbumes de fotos de la asociación</p>
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

      {/* Grid de álbumes */}
      {folders.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Image size={64} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-xl font-semibold mb-2">No hay álbumes</h3>
          <p className="text-gray-400 mb-6">Crea tu primer álbum para empezar a organizar fotos</p>
          <Button
            variant="primary"
            onClick={handleCreate}
            className="inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Crear Primer Álbum
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map((folder) => {
            // ✅ CORRECCIÓN: Construir URL completa
            const coverImageUrl = folder.imagen_portada_url 
              ? (folder.imagen_portada_url.startsWith('http') 
                  ? folder.imagen_portada_url 
                  : `${API_BASE_URL}${folder.imagen_portada_url}`)
              : null;

            return (
              <div
                key={folder.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-primary-500/50 transition-all"
              >
                {/* Imagen de portada */}
                <div className="aspect-video bg-gray-800 flex items-center justify-center relative">
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
                    <div className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                      folder.visible ? 'bg-green-600' : 'bg-red-600'
                    }`}>
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
                      className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Image size={16} />
                      Ver Fotos
                    </button>
                    <button
                      onClick={() => handleEdit(folder)}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(folder)}
                    className="w-full mt-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
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