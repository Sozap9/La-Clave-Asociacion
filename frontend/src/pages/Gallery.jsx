import { useState, useEffect } from "react";
import {
  Image,
  X,
  Calendar,
  User,
  Plus,
  Upload,
} from "lucide-react";
import * as galleryApi from "../api/galleryApi";
import * as eventsApi from "../api/eventsApi";
import { useAuth } from "../hooks/useAuth";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";
import FolderModal from "../components/gallery/FolderModal";
import QuickImageUploadModal from "../components/gallery/QuickImageUploadModal";

// ✅ CORRECCIÓN: URL base sin /api para servir archivos estáticos
const API_BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

const Gallery = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [folders, setFolders] = useState([]);
  const [filteredFolders, setFilteredFolders] = useState([]);
  const [allArtists, setAllArtists] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtros
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("all"); // 'all', 'desc', 'asc'
  
  // Estados para botones admin
  const [activeAdminAction, setActiveAdminAction] = useState(null); // 'upload' | 'create' | null

  // Modales
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadImage, setShowUploadImage] = useState(false);

  useEffect(() => {
    fetchGalleryData();
    if (isAdmin) {
      fetchEvents();
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [folders, selectedArtist, selectedEvent, searchTerm, sortOrder]);

  const fetchGalleryData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { visible: true };
      const result = await galleryApi.getAllFolders(params);

      if (result.success) {
        setFolders(result.data || []);

        const artistsSet = new Set();
        for (const folder of result.data) {
          const artistsResult = await galleryApi.getFolderArtists(folder.id);
          if (artistsResult.success && artistsResult.data) {
            artistsResult.data.forEach((artist) => {
              artistsSet.add(
                JSON.stringify({
                  id: artist.id,
                  nombre: artist.nombre,
                  slug: artist.slug,
                  tipo: artist.tipo,
                })
              );
            });
          }
        }

        const uniqueArtists = Array.from(artistsSet).map((str) =>
          JSON.parse(str)
        );
        setAllArtists(uniqueArtists);
      } else {
        setError(result.message || "Error al cargar la galería");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudo cargar la galería");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const result = await eventsApi.getAllEvents();
      if (result.success) {
        setAllEvents(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  const applyFilters = () => {
    let filtered = [...folders];

    if (selectedEvent) {
      filtered = filtered.filter((f) => f.event_id === selectedEvent.id);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.nombre.toLowerCase().includes(search) ||
          (f.descripcion && f.descripcion.toLowerCase().includes(search))
      );
    }

    // Ordenar solo si no es "all"
    if (sortOrder !== "all") {
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at || a.fecha_evento);
        const dateB = new Date(b.created_at || b.fecha_evento);
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
    }

    setFilteredFolders(filtered);
  };

  const clearFilters = () => {
    setSelectedArtist(null);
    setSelectedEvent(null);
    setSearchTerm("");
    setSortOrder("all");
  };

  const handleCreateFolder = async (folderData) => {
    try {
      const result = await galleryApi.createFolder(folderData);
      if (result.success) {
        setSuccess("Álbum creado exitosamente");
        setShowCreateFolder(false);
        setActiveAdminAction(null);
        fetchGalleryData();
      } else {
        setError(result.message || "Error al crear álbum");
      }
    } catch (err) {
      setError("Error al crear álbum");
    }
  };

  const handleImageUploaded = () => {
    setSuccess("Imagen subida exitosamente");
    setShowUploadImage(false);
    setActiveAdminAction(null);
    fetchGalleryData();
  };

  const handleUploadClick = () => {
    setActiveAdminAction('upload');
    setShowUploadImage(true);
  };

  const handleCreateClick = () => {
    setActiveAdminAction('create');
    setShowCreateFolder(true);
  };

  const hasActiveFilters =
    selectedArtist ||
    selectedEvent ||
    searchTerm.trim() ||
    sortOrder !== "all";

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen py-20 px-4 bg-black">
      <div className="container-custom">
        
        {/* Header con botones a la derecha */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-gradient mb-2 text-4xl">Galería</h1>
            <p className="text-gray-400 text-lg">
              Explora nuestros álbumes de fotos de eventos y conciertos
            </p>
          </div>

          {/* Botones Admin - Estilo filtros (negros) */}
          {isAdmin && (
            <div className="flex gap-4">
              <button
                onClick={handleUploadClick}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeAdminAction === 'upload'
                    ? "bg-primary-600 text-white shadow-glow"
                    : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                }`}
              >
                <Upload size={18} />
                Subir Imagen
              </button>
              <button
                onClick={handleCreateClick}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeAdminAction === 'create'
                    ? "bg-primary-600 text-white shadow-glow"
                    : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                }`}
              >
                <Plus size={18} />
                Crear Álbum
              </button>
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}

        {/* Filtros y Búsqueda */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            
            {/* Filtros */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setSortOrder("all")}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  sortOrder === "all"
                    ? "bg-primary-600 text-white shadow-glow"
                    : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSortOrder("desc")}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  sortOrder === "desc"
                    ? "bg-primary-600 text-white shadow-glow"
                    : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                }`}
              >
                Más Recientes
              </button>
              <button
                onClick={() => setSortOrder("asc")}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  sortOrder === "asc"
                    ? "bg-primary-600 text-white shadow-glow"
                    : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                }`}
              >
                Más Antiguos
              </button>
            </div>

            {/* Barra de búsqueda a la derecha */}
            <div className="flex-1 max-w-md ml-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar álbumes por nombre..."
                  className="w-full px-4 py-3 pl-12 pr-12 bg-[#1a1a1a]/60 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 backdrop-blur-sm transition-all"
                />
                
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>

                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grid de álbumes */}
        {filteredFolders.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
            <Image size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">
              {hasActiveFilters
                ? "No se encontraron álbumes"
                : "No hay álbumes disponibles"}
            </h3>
            <p className="text-gray-400">
              {hasActiveFilters
                ? "Intenta ajustar los filtros de búsqueda"
                : "Pronto subiremos nuevas fotos de nuestros eventos"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFolders.map((folder) => (
              <AlbumCard key={folder.id} folder={folder} />
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      {showCreateFolder && (
        <FolderModal
          onClose={() => {
            setShowCreateFolder(false);
            setActiveAdminAction(null);
          }}
          onSave={handleCreateFolder}
        />
      )}

      {showUploadImage && (
        <QuickImageUploadModal
          folders={folders}
          onClose={() => {
            setShowUploadImage(false);
            setActiveAdminAction(null);
          }}
          onSuccess={handleImageUploaded}
        />
      )}
    </div>
  );
};

const AlbumCard = ({ folder }) => {
  const [artists, setArtists] = useState([]);

  useEffect(() => {
    fetchArtists();
  }, [folder.id]);

  const fetchArtists = async () => {
    try {
      const result = await galleryApi.getFolderArtists(folder.id);
      if (result.success) {
        setArtists(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching folder artists:", error);
    }
  };

  // ✅ CORRECCIÓN: Construir URL completa de imagen de portada
  const coverImageUrl = folder.imagen_portada_url
    ? folder.imagen_portada_url.startsWith("http")
      ? folder.imagen_portada_url
      : `${API_BASE_URL}${folder.imagen_portada_url}`
    : null;

  return (
    <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl overflow-hidden hover:border-primary-500/50 transition-all group">
      <div className="aspect-video bg-[#0a0a0a] relative overflow-hidden">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={folder.nombre}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              console.error("Error loading cover image:", coverImageUrl);
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image size={48} className="text-gray-600" />
          </div>
        )}

        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
          <Image size={14} className="text-primary-400" />
          <span className="text-white text-sm font-medium">
            {folder.total_imagenes || 0} fotos
          </span>
        </div>

        {folder.destacado === 1 && (
          <div className="absolute top-3 left-3 bg-primary-600/90 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-white text-xs font-semibold">DESTACADO</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-white font-bold text-xl mb-2 group-hover:text-primary-400 transition-colors">
          {folder.nombre}
        </h3>

        {folder.descripcion && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {folder.descripcion}
          </p>
        )}

        {folder.fecha_evento && (
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
            <Calendar size={14} />
            <span>
              {new Date(folder.fecha_evento).toLocaleDateString("es-ES")}
            </span>
          </div>
        )}

        {artists.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <User size={14} className="text-primary-400" />
              <span className="text-gray-400 text-xs font-medium">
                ARTISTAS:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {artists.slice(0, 3).map((artist) => (
                <span
                  key={artist.id}
                  className="px-2 py-1 bg-[#0a0a0a] text-gray-300 text-xs rounded-full"
                >
                  {artist.nombre}
                </span>
              ))}
              {artists.length > 3 && (
                <span className="px-2 py-1 bg-[#0a0a0a] text-gray-400 text-xs rounded-full">
                  +{artists.length - 3} más
                </span>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => (window.location.href = `/galeria/${folder.slug}`)}
          className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Image size={18} />
          Ver Álbum
        </button>
      </div>
    </div>
  );
};

export default Gallery;