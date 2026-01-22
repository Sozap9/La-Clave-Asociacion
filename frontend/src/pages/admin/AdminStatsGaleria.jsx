import { useState, useEffect } from 'react';
import { 
  Image, Trash2, Edit, Users, Eye, EyeOff, Star, Filter, FolderUp,
  Check, X, Search, RefreshCw
} from 'lucide-react';
import * as galleryApi from '../../api/galleryApi';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import ImageEditModal from '../../components/gallery/ImageEditModal';
import ImageArtistModal from '../../components/gallery/ImageArtistModal';

const API_BASE_URL = import.meta.env.VITE_API_URL.replace('/api', '');

const AdminGestionImagenes = () => {
  const [images, setImages] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [filter, setFilter] = useState('all');
  const [folderFilter, setFolderFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [artistModalOpen, setArtistModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Obtener todas las imágenes
      const imagesResult = await galleryApi.getAllImagesWithArtists();
      
      if (imagesResult.success && imagesResult.data) {
        setImages(imagesResult.data || []);
      } else {
        setError('Error al cargar imágenes');
      }

      // Obtener todos los álbumes para el filtro
      const foldersResult = await galleryApi.getAllFolders();
      if (foldersResult.success && foldersResult.data) {
        setFolders(foldersResult.data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectImage = (imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const selectAll = () => {
    setSelectedImages(filteredImages.map(img => img.id));
  };

  const deselectAll = () => {
    setSelectedImages([]);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedImages([]);
  };

  const handleDeleteImage = async (image) => {
    if (!window.confirm(`¿Estás seguro de eliminar esta imagen?`)) {
      return;
    }

    try {
      const result = await galleryApi.deleteImage(image.id);
      
      if (result.success) {
        setSuccess('Imagen eliminada correctamente');
        fetchData();
      } else {
        setError(result.message || 'Error al eliminar imagen');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Error al eliminar imagen');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) {
      setError('No hay imágenes seleccionadas');
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar ${selectedImages.length} imágenes?`)) {
      return;
    }

    try {
      const result = await galleryApi.bulkDeleteImages(selectedImages);
      
      if (result.success) {
        setSuccess(`${selectedImages.length} imágenes eliminadas correctamente`);
        setSelectedImages([]);
        setIsSelectionMode(false);
        fetchData();
      } else {
        setError(result.message || 'Error al eliminar imágenes');
      }
    } catch (err) {
      console.error('Error bulk deleting:', err);
      setError('Error al eliminar imágenes');
    }
  };

  const handleBulkToggleVisible = async () => {
    if (selectedImages.length === 0) {
      setError('No hay imágenes seleccionadas');
      return;
    }

    try {
      const result = await galleryApi.bulkUpdateImages(selectedImages, { visible: true });
      
      if (result.success) {
        setSuccess(`${selectedImages.length} imágenes marcadas como visibles`);
        setSelectedImages([]);
        fetchData();
      } else {
        setError(result.message || 'Error al actualizar imágenes');
      }
    } catch (err) {
      console.error('Error bulk updating:', err);
      setError('Error al actualizar imágenes');
    }
  };

  const handleBulkToggleHidden = async () => {
    if (selectedImages.length === 0) {
      setError('No hay imágenes seleccionadas');
      return;
    }

    try {
      const result = await galleryApi.bulkUpdateImages(selectedImages, { visible: false });
      
      if (result.success) {
        setSuccess(`${selectedImages.length} imágenes marcadas como ocultas`);
        setSelectedImages([]);
        fetchData();
      } else {
        setError(result.message || 'Error al actualizar imágenes');
      }
    } catch (err) {
      console.error('Error bulk updating:', err);
      setError('Error al actualizar imágenes');
    }
  };

  const handleEditImage = (image) => {
    setSelectedImage(image);
    setEditModalOpen(true);
  };

  const handleSaveImageEdit = async (imageData) => {
    try {
      const result = await galleryApi.updateImage(selectedImage.id, imageData);
      
      if (result.success) {
        setSuccess('Imagen actualizada correctamente');
        setEditModalOpen(false);
        fetchData();
      } else {
        setError(result.message || 'Error al actualizar imagen');
      }
    } catch (err) {
      console.error('Error updating image:', err);
      setError('Error al actualizar imagen');
    }
  };

  const handleManageArtists = (image) => {
    setSelectedImage(image);
    setArtistModalOpen(true);
  };

  const handleSaveArtists = async (artistIds) => {
    try {
      const result = await galleryApi.updateImageArtists(selectedImage.id, artistIds);
      
      if (result.success) {
        setSuccess('Artistas actualizados correctamente');
        setArtistModalOpen(false);
        fetchData();
      } else {
        setError(result.message || 'Error al actualizar artistas');
      }
    } catch (err) {
      console.error('Error updating artists:', err);
      setError('Error al actualizar artistas');
    }
  };

  // Filtrar imágenes
  const filteredImages = images.filter(img => {
    // Filtro por visibilidad
    if (filter === 'visible' && !img.visible) return false;
    if (filter === 'hidden' && img.visible) return false;
    if (filter === 'destacado' && !img.destacado) return false;

    // Filtro por álbum
    if (folderFilter !== 'all' && img.folder_id !== parseInt(folderFilter)) return false;

    // Filtro por búsqueda (título, descripción, álbum)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const titulo = (img.titulo || '').toLowerCase();
      const descripcion = (img.descripcion || '').toLowerCase();
      const folderName = (img.folder_nombre || '').toLowerCase();
      
      if (!titulo.includes(search) && !descripcion.includes(search) && !folderName.includes(search)) {
        return false;
      }
    }

    return true;
  });

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-4xl">Gestión Global de Imágenes</h1>
        <p className="text-gray-400 text-lg">
          Gestiona todas las imágenes de la galería desde un solo lugar
        </p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Toolbar */}
      <div className="mb-6 space-y-4">
        {/* Búsqueda y Refrescar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, descripción o álbum..."
              className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <Button
            onClick={fetchData}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RefreshCw size={20} />
            Refrescar
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 flex-wrap">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-primary-500"
          >
            <option value="all">Todas las imágenes</option>
            <option value="visible">Visibles</option>
            <option value="hidden">Ocultas</option>
            <option value="destacado">Destacadas</option>
          </select>

          <select
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            className="px-4 py-2 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-primary-500"
          >
            <option value="all">Todos los álbumes</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.nombre} ({folder.total_imagenes || 0})
              </option>
            ))}
          </select>

          <Button
            onClick={toggleSelectionMode}
            variant={isSelectionMode ? 'primary' : 'secondary'}
            className="flex items-center gap-2"
          >
            <Check size={20} />
            {isSelectionMode ? 'Modo Selección ON' : 'Seleccionar Múltiples'}
          </Button>
        </div>

        {/* Acciones múltiples */}
        {isSelectionMode && (
          <div className="flex gap-3 p-4 bg-[#1a1a1a] border border-primary-500/30 rounded-lg">
            <Button onClick={selectAll} variant="secondary" size="sm">
              Seleccionar Todo ({filteredImages.length})
            </Button>
            <Button onClick={deselectAll} variant="secondary" size="sm">
              Deseleccionar Todo
            </Button>
            <div className="flex-1" />
            <span className="text-white self-center">
              {selectedImages.length} seleccionadas
            </span>
            <Button
              onClick={handleBulkToggleVisible}
              variant="secondary"
              size="sm"
              disabled={selectedImages.length === 0}
              className="flex items-center gap-2"
            >
              <Eye size={16} />
              Hacer Visibles
            </Button>
            <Button
              onClick={handleBulkToggleHidden}
              variant="secondary"
              size="sm"
              disabled={selectedImages.length === 0}
              className="flex items-center gap-2"
            >
              <EyeOff size={16} />
              Ocultar
            </Button>
            <Button
              onClick={handleBulkDelete}
              variant="secondary"
              size="sm"
              disabled={selectedImages.length === 0}
              className="flex items-center gap-2 text-red-400 hover:text-red-300"
            >
              <Trash2 size={16} />
              Eliminar ({selectedImages.length})
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total Imágenes</p>
          <p className="text-2xl font-bold text-white">{images.length}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Visibles</p>
          <p className="text-2xl font-bold text-green-400">
            {images.filter(img => img.visible).length}
          </p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Ocultas</p>
          <p className="text-2xl font-bold text-gray-400">
            {images.filter(img => !img.visible).length}
          </p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Mostrando</p>
          <p className="text-2xl font-bold text-primary-400">{filteredImages.length}</p>
        </div>
      </div>

      {/* Grid de imágenes */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-16 bg-[#1a1a1a] border border-[#262626] rounded-xl">
          <Image size={64} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No hay imágenes
          </h3>
          <p className="text-gray-400">
            {searchTerm || folderFilter !== 'all' 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'No hay imágenes en la galería'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className={`relative group bg-[#1a1a1a] border rounded-lg overflow-hidden transition-all ${
                selectedImages.includes(image.id)
                  ? 'border-primary-500 ring-2 ring-primary-500'
                  : 'border-[#262626] hover:border-primary-500/50'
              }`}
            >
              {/* Checkbox de selección */}
              {isSelectionMode && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedImages.includes(image.id)}
                    onChange={() => toggleSelectImage(image.id)}
                    className="w-6 h-6 rounded border-gray-700 bg-gray-800 text-primary-600 focus:ring-primary-500"
                  />
                </div>
              )}

              {/* Imagen */}
              <div className="aspect-square bg-[#0a0a0a]">
                <img
                  src={`${API_BASE_URL}${image.imagen_url}`}
                  alt={image.titulo || 'Imagen'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-white text-sm font-medium truncate mb-1">
                  {image.titulo || 'Sin título'}
                </p>
                <p className="text-gray-500 text-xs truncate mb-2">
                  {image.folder_nombre || 'Sin álbum'}
                </p>

                {/* Badges */}
                <div className="flex gap-1 mb-2">
                  {image.visible ? (
                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                      Visible
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded">
                      Oculta
                    </span>
                  )}
                  {image.destacado && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded flex items-center gap-1">
                      <Star size={10} />
                      Destacada
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditImage(image)}
                    className="flex-1 px-2 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs transition-colors flex items-center justify-center gap-1"
                    title="Editar"
                  >
                    <Edit size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleManageArtists(image)}
                    className="px-2 py-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded text-xs transition-colors"
                    title="Artistas"
                  >
                    <Users size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteImage(image)}
                    className="px-2 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {editModalOpen && selectedImage && (
        <ImageEditModal
          image={selectedImage}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveImageEdit}
        />
      )}

      {artistModalOpen && selectedImage && (
        <ImageArtistModal
          image={selectedImage}
          onClose={() => setArtistModalOpen(false)}
          onSave={handleSaveArtists}
        />
      )}
    </div>
  );
};

export default AdminGestionImagenes;