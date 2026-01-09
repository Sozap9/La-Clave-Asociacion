import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Image, Plus, Trash2, Edit, ArrowLeft, Users, Upload, Star, Eye, EyeOff, 
  ImageIcon, Check, X, Filter, FolderUp
} from 'lucide-react';
import * as galleryApi from '../../api/galleryApi';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import ImageEditModal from '../../components/gallery/ImageEditModal';
import ImageArtistModal from '../../components/gallery/ImageArtistModal';
import ImageUploadModal from '../../components/gallery/ImageUploadModal';

const API_BASE_URL = import.meta.env.VITE_API_URL.replace('/api', '');

const AdminGalleryImages = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  
  const [folder, setFolder] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [filter, setFilter] = useState('all');
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [artistModalOpen, setArtistModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, [folderId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const folderResult = await galleryApi.getFolderImages(folderId, false);
      
      if (folderResult.success && folderResult.data) {
        const folderInfoResult = await galleryApi.getFolderByIdOrSlug(folderId);
        if (folderInfoResult.success && folderInfoResult.data) {
          setFolder(folderInfoResult.data);
        }
        setImages(folderResult.data || []);
      } else {
        setError('Álbum no encontrado');
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

  const handleToggleVisibility = async (image) => {
    try {
      const result = await galleryApi.updateImage(image.id, {
        visible: !image.visible
      });

      if (result.success) {
        setSuccess(image.visible ? 'Imagen ocultada' : 'Imagen visible');
        fetchData();
      } else {
        setError(result.message || 'Error al actualizar visibilidad');
      }
    } catch (err) {
      console.error('Error updating visibility:', err);
      setError('Error al actualizar visibilidad');
    }
  };

  const handleToggleFeatured = async (image) => {
    try {
      const result = await galleryApi.updateImage(image.id, {
        destacado: !image.destacado
      });

      if (result.success) {
        setSuccess(image.destacado ? 'Imagen desmarcada como destacada' : 'Imagen marcada como destacada');
        fetchData();
      } else {
        setError(result.message || 'Error al actualizar destacado');
      }
    } catch (err) {
      console.error('Error updating featured:', err);
      setError('Error al actualizar destacado');
    }
  };

  const handleSetCover = async (image) => {
    if (!window.confirm('¿Establecer esta imagen como portada del álbum?')) {
      return;
    }

    try {
      const result = await galleryApi.setCoverImage(folderId, image.id);
      
      if (result.success) {
        setSuccess('Imagen establecida como portada');
        fetchData();
      } else {
        setError(result.message || 'Error al establecer portada');
      }
    } catch (err) {
      console.error('Error setting cover:', err);
      setError('Error al establecer portada');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar ${selectedImages.length} imágenes?`)) {
      return;
    }

    try {
      const result = await galleryApi.bulkDeleteImages(selectedImages);
      
      if (result.success) {
        setSuccess(`${selectedImages.length} imágenes eliminadas`);
        setSelectedImages([]);
        fetchData();
      } else {
        setError(result.message || 'Error al eliminar imágenes');
      }
    } catch (err) {
      console.error('Error bulk deleting:', err);
      setError('Error al eliminar imágenes');
    }
  };

  const handleBulkToggleVisibility = async (visible) => {
    try {
      const result = await galleryApi.bulkUpdateImages(selectedImages, { visible });
      
      if (result.success) {
        setSuccess(`${selectedImages.length} imágenes ${visible ? 'visibles' : 'ocultadas'}`);
        setSelectedImages([]);
        fetchData();
      } else {
        setError(result.message || 'Error al actualizar visibilidad');
      }
    } catch (err) {
      console.error('Error bulk updating visibility:', err);
      setError('Error al actualizar visibilidad');
    }
  };

  const handleBulkToggleFeatured = async (destacado) => {
    try {
      const result = await galleryApi.bulkUpdateImages(selectedImages, { destacado });
      
      if (result.success) {
        setSuccess(`${selectedImages.length} imágenes ${destacado ? 'destacadas' : 'desmarcadas'}`);
        setSelectedImages([]);
        fetchData();
      } else {
        setError(result.message || 'Error al actualizar destacado');
      }
    } catch (err) {
      console.error('Error bulk updating featured:', err);
      setError('Error al actualizar destacado');
    }
  };

  const handleUploadComplete = () => {
    setSuccess('Imágenes subidas correctamente');
    setUploadModalOpen(false);
    fetchData();
  };

  const handleEditImage = (image) => {
    setSelectedImage(image);
    setEditModalOpen(true);
  };

  const handleManageArtists = (image) => {
    setSelectedImage(image);
    setArtistModalOpen(true);
  };

  const handleSaveEdit = async (imageData) => {
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

  const filteredImages = images.filter(img => {
    if (filter === 'visible') return img.visible;
    if (filter === 'hidden') return !img.visible;
    if (filter === 'featured') return img.destacado;
    return true;
  });

  if (loading) {
    return <Loader />;
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12">
        <div className="container mx-auto px-6">
          <Alert type="error" message="Álbum no encontrado" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-6 space-y-8">
        {/* Header */}
        <button
          onClick={() => navigate('/admin/galeria')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Volver a Álbumes
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gradient mb-2 text-4xl">
              {folder.nombre}
            </h1>
            <p className="text-gray-400 text-lg">
              {filteredImages.length} {filteredImages.length === 1 ? 'imagen' : 'imágenes'}
              {filter !== 'all' && ` (filtradas)`}
            </p>
          </div>

          {/* Botones - SOLO GRIS Y MORADO */}
          <div className="flex gap-3">
            <button
              onClick={toggleSelectionMode}
              className="flex items-center gap-2 px-4 py-3 rounded-lg transition-colors bg-[#262626] hover:bg-[#333333] text-white"
            >
              {isSelectionMode ? <X size={20} /> : <Check size={20} />}
              {isSelectionMode ? 'Cancelar' : 'Seleccionar'}
            </button>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Upload size={20} />
              Subir Imágenes
            </button>
          </div>
        </div>

        {/* Barra de Acciones en Lote */}
        {selectedImages.length > 0 && (
          <BulkActionsBar
            selectedCount={selectedImages.length}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            onBulkShow={() => handleBulkToggleVisibility(true)}
            onBulkHide={() => handleBulkToggleVisibility(false)}
            onBulkFeature={() => handleBulkToggleFeatured(true)}
            onBulkUnfeature={() => handleBulkToggleFeatured(false)}
            onBulkDelete={handleBulkDelete}
            totalImages={filteredImages.length}
          />
        )}

        {/* Mensajes - MÁS ESPACIO (space-y-4) */}
        <div className="space-y-4">
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}
          
          {success && (
            <Alert type="success" message={success} onClose={() => setSuccess('')} />
          )}
        </div>

        {/* Filtros - MÁS ESPACIO (gap-6) */}
        <div className="flex items-center gap-6">
          <Filter size={20} className="text-gray-400" />
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-[#262626] text-gray-400 hover:text-white hover:bg-[#333333]'
            }`}
          >
            Todas ({images.length})
          </button>
          <button
            onClick={() => setFilter('visible')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'visible'
                ? 'bg-primary-600 text-white'
                : 'bg-[#262626] text-gray-400 hover:text-white hover:bg-[#333333]'
            }`}
          >
            Visibles ({images.filter(img => img.visible).length})
          </button>
          <button
            onClick={() => setFilter('hidden')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'hidden'
                ? 'bg-primary-600 text-white'
                : 'bg-[#262626] text-gray-400 hover:text-white hover:bg-[#333333]'
            }`}
          >
            Ocultas ({images.filter(img => !img.visible).length})
          </button>
          <button
            onClick={() => setFilter('featured')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'featured'
                ? 'bg-primary-600 text-white'
                : 'bg-[#262626] text-gray-400 hover:text-white hover:bg-[#333333]'
            }`}
          >
            Destacadas ({images.filter(img => img.destacado).length})
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 mt-8">
        {/* Grid de Imágenes */}
        {filteredImages.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
            <Image size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">
              {filter === 'all' ? 'No hay imágenes en este álbum' : 'No hay imágenes con este filtro'}
            </h3>
            <p className="text-gray-400 mb-6">
              {filter === 'all' ? 'Sube tu primera imagen para comenzar' : 'Prueba con otro filtro'}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <Upload size={20} />
                Subir Primera Imagen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                isSelected={selectedImages.includes(image.id)}
                isSelectionMode={isSelectionMode}
                onSelect={toggleSelectImage}
                onDelete={handleDeleteImage}
                onToggleVisibility={handleToggleVisibility}
                onToggleFeatured={handleToggleFeatured}
                onEdit={handleEditImage}
                onManageArtists={handleManageArtists}
                onSetCover={handleSetCover}
                isCover={folder.imagen_portada_url && folder.imagen_portada_url.includes(image.imagen_url?.split('/').pop())}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      {editModalOpen && selectedImage && (
        <ImageEditModal
          image={selectedImage}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveEdit}
        />
      )}

      {artistModalOpen && selectedImage && (
        <ImageArtistModal
          image={selectedImage}
          onClose={() => setArtistModalOpen(false)}
          onSave={handleSaveArtists}
        />
      )}

      {uploadModalOpen && (
        <ImageUploadModal
          folderId={folderId}
          onClose={() => setUploadModalOpen(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
};

/**
 * Barra de Acciones - SOLO GRIS Y MORADO
 */
const BulkActionsBar = ({ 
  selectedCount, 
  onSelectAll, 
  onDeselectAll,
  onBulkShow, 
  onBulkHide, 
  onBulkFeature,
  onBulkUnfeature,
  onBulkDelete,
  totalImages
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg">
            <Check size={20} className="text-white" />
            <span className="text-white font-semibold">{selectedCount} seleccionadas</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={selectedCount === totalImages ? onDeselectAll : onSelectAll}
              className="px-3 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-sm transition-colors"
            >
              {selectedCount === totalImages ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </button>

            <div className="h-6 w-px bg-gray-700" />

            <button
              onClick={onBulkShow}
              className="px-3 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-sm transition-colors flex items-center gap-1"
            >
              <Eye size={16} />
              Mostrar
            </button>

            <button
              onClick={onBulkHide}
              className="px-3 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-sm transition-colors flex items-center gap-1"
            >
              <EyeOff size={16} />
              Ocultar
            </button>

            <button
              onClick={onBulkFeature}
              className="px-3 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-sm transition-colors flex items-center gap-1"
            >
              <Star size={16} />
              Destacar
            </button>

            <button
              onClick={onBulkUnfeature}
              className="px-3 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-sm transition-colors flex items-center gap-1"
            >
              <Star size={16} fill="currentColor" />
              Quitar
            </button>

            <div className="h-6 w-px bg-gray-700" />

            <button
              onClick={onBulkDelete}
              className="px-3 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-sm transition-colors flex items-center gap-1"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Card de Imagen - SIN BORDES, SIN HOVER, SOLO MORADO/GRIS
 */
const ImageCard = ({ 
  image, 
  isSelected,
  isSelectionMode,
  onSelect,
  onDelete, 
  onToggleVisibility, 
  onToggleFeatured, 
  onEdit, 
  onManageArtists,
  onSetCover,
  isCover
}) => {
  const imageUrl = image.thumbnail_url || image.imagen_url;
  const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;

  return (
    <div className={`bg-gray-900 rounded-xl overflow-hidden relative ${
      isSelected ? 'ring-2 ring-primary-600' : ''
    }`}>
      {/* Checkbox */}
      {isSelectionMode && (
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={() => onSelect(image.id)}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-primary-600 border-primary-600'
                : 'bg-gray-900/80 border-gray-600 hover:border-gray-500'
            }`}
          >
            {isSelected && <Check size={16} className="text-white" />}
          </button>
        </div>
      )}

      {/* Imagen - SIN HOVER */}
      <div className="aspect-square bg-[#262626] relative">
        <img
          src={fullImageUrl}
          alt={image.titulo || 'Imagen'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x400?text=Error+al+cargar';
          }}
        />
        
        {/* Badges - SOLO GRIS Y MORADO */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {isCover && (
            <div className="px-2 py-1 rounded bg-primary-600 text-white text-xs font-semibold">
              PORTADA
            </div>
          )}
          {image.destacado && (
            <div className="px-2 py-1 rounded bg-primary-600 text-white text-xs font-semibold">
              DESTACADO
            </div>
          )}
          <div className="px-2 py-1 rounded bg-primary-600 text-white text-xs font-semibold">
            {image.visible ? 'VISIBLE' : 'OCULTO'}
          </div>
        </div>
      </div>

      {/* Acciones - SIN COLORES */}
      {!isSelectionMode && (
        <div className="p-3 space-y-2">
          {image.titulo && (
            <h4 className="text-white text-sm font-medium line-clamp-1">
              {image.titulo}
            </h4>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onEdit(image)}
              className="px-2 py-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded text-xs transition-colors flex items-center justify-center gap-1"
            >
              <Edit size={14} />
              Editar
            </button>

            <button
              onClick={() => onManageArtists(image)}
              className="px-2 py-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded text-xs transition-colors flex items-center justify-center gap-1"
            >
              <Users size={14} />
              Artistas
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onToggleVisibility(image)}
              className="px-2 py-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded text-xs transition-colors flex items-center justify-center gap-1"
            >
              {image.visible ? <EyeOff size={14} /> : <Eye size={14} />}
              {image.visible ? 'Ocultar' : 'Mostrar'}
            </button>

            <button
              onClick={() => onToggleFeatured(image)}
              className={`px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1 ${
                image.destacado
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-[#262626] hover:bg-[#333333] text-white'
              }`}
            >
              <Star size={14} />
              {image.destacado ? 'Destacado' : 'Destacar'}
            </button>
          </div>

          <button
            onClick={() => onSetCover(image)}
            className={`w-full px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1 ${
              isCover
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-[#262626] hover:bg-[#333333] text-white'
            }`}
          >
            <ImageIcon size={14} />
            {isCover ? 'Es Portada' : 'Portada'}
          </button>
          
          <button
            onClick={() => onDelete(image)}
            className="w-full px-2 py-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded text-xs transition-colors flex items-center justify-center gap-1"
          >
            <Trash2 size={14} />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminGalleryImages;