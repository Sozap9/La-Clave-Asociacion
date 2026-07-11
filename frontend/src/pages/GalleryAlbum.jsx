import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Image, X, ChevronLeft, ChevronRight, Calendar, User, ArrowLeft } from 'lucide-react';
import * as galleryApi from '../api/galleryApi';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import EmptyState from '../components/common/EmptyState';

// URL base sin /api para servir archivos estáticos
const API_BASE_URL = import.meta.env.VITE_API_URL.replace('/api', '');

const GalleryAlbum = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [folder, setFolder] = useState(null);
  const [images, setImages] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageArtists, setImageArtists] = useState([]);

  useEffect(() => {
    fetchAlbumData();
  }, [slug]);

  const fetchAlbumData = async () => {
    setLoading(true);
    setError('');
    try {
      const folderResult = await galleryApi.getFolderByIdOrSlug(slug);
      
      if (folderResult.success && folderResult.data) {
        setFolder(folderResult.data);
        setImages(folderResult.data.images || []);

        const artistsResult = await galleryApi.getFolderArtists(folderResult.data.id);
        if (artistsResult.success) {
          setArtists(artistsResult.data || []);
        }
      } else {
        setError('Álbum no encontrado');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo cargar el álbum');
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = async (image, index) => {
    setSelectedImage(image);
    setSelectedImageIndex(index);
    
    try {
      const result = await galleryApi.getImageArtists(image.id);
      if (result.success) {
        setImageArtists(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching image artists:', error);
    }
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setImageArtists([]);
  };

  const navigateImage = (direction) => {
    const newIndex = direction === 'prev' 
      ? (selectedImageIndex - 1 + images.length) % images.length
      : (selectedImageIndex + 1) % images.length;
    
    openImageModal(images[newIndex], newIndex);
  };

  if (loading) return <Loader fullScreen />;

  if (error || !folder) {
    return (
      <div className="min-h-screen bg-black py-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Álbum no encontrado</h2>
          <button
            onClick={() => navigate('/galeria')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={20} />
            Volver a Galería
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-20 px-4">
      <div className="container-custom">
        {/* Botón volver */}
        <button
          onClick={() => navigate('/galeria')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Volver a Galería
        </button>

        {/* Header del álbum */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
            <div className="flex-1">
              <h1 className="text-gradient text-2xl md:text-4xl mb-2">
                {folder.nombre}
              </h1>
              {folder.descripcion && (
                <p className="text-gray-400 text-sm md:text-lg max-w-3xl">
                  {folder.descripcion}
                </p>
              )}
            </div>
            
            {/* Badge de destacado solo si es 1 o true */}
            {(folder.destacado === 1 || folder.destacado === true) && (
              <div className="bg-primary-600/20 border border-primary-500/50 px-4 py-2 rounded-lg">
                <span className="text-primary-400 font-semibold">DESTACADO</span>
              </div>
            )}
          </div>

          {/* Metadatos */}
          <div className="flex flex-wrap items-center gap-4 text-gray-400">
            {folder.fecha_evento && (
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <span>{new Date(folder.fecha_evento).toLocaleDateString('es-ES')}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Image size={18} />
              <span>{images.length} {images.length === 1 ? 'foto' : 'fotos'}</span>
            </div>
          </div>

          {/* Artistas del álbum */}
          {artists.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <User size={18} className="text-primary-400" />
                <span className="text-gray-300 font-medium">Artistas en este álbum:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {artists.map(artist => (
                  <div
                    key={artist.id}
                    className="px-4 py-2 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:border-primary-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-primary-400" />
                      <span className="text-white font-medium">{artist.nombre}</span>
                    </div>
                    {artist.tipo && (
                      <span className="text-xs text-gray-500">
                        {artist.tipo === 'artista' ? 'Artista' : 'Colectivo'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alert de error */}
        {error && (
          <Alert 
            type="error" 
            message={error} 
            onClose={() => setError('')} 
          />
        )}

        {/* Grid de imágenes */}
        {images.length === 0 ? (
          <EmptyState icon={Image} title="No hay imágenes en este álbum" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {images.map((image, index) => {
              // Construir URL completa
              const imageUrl = image.thumbnail_url || image.imagen_url;
              const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
              
              return (
                <div
                  key={image.id}
                  onClick={() => openImageModal(image, index)}
                  className="aspect-square bg-[#1a1a1a] rounded-lg overflow-hidden cursor-pointer group relative"
                >
                  <img
                    src={fullImageUrl}
                    alt={image.titulo || `Imagen ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      console.error('Error loading image:', fullImageUrl);
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Image size={32} className="text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de imagen */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          {/* Botón cerrar */}
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X size={24} className="text-white" />
          </button>

          {/* Botón anterior */}
          {images.length > 1 && (
            <button
              onClick={() => navigateImage('prev')}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <ChevronLeft size={28} className="text-white" />
            </button>
          )}

          {/* Imagen y detalles */}
          <div className="max-w-6xl w-full">
            {(() => {
              // Construir URL completa para modal
              const modalImageUrl = selectedImage.imagen_url.startsWith('http') 
                ? selectedImage.imagen_url 
                : `${API_BASE_URL}${selectedImage.imagen_url}`;
              
              return (
                <img
                  src={modalImageUrl}
                  alt={selectedImage.titulo || 'Imagen'}
                  className="w-full h-auto max-h-[92vh] object-contain rounded-lg"
                  onError={(e) => {
                    console.error('Error loading modal image:', modalImageUrl);
                    e.target.src = 'https://via.placeholder.com/800x600?text=Error+al+cargar+imagen';
                  }}
                />
              );
            })()}
          </div>

          {/* Botón siguiente */}
          {images.length > 1 && (
            <button
              onClick={() => navigateImage('next')}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <ChevronRight size={28} className="text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GalleryAlbum;