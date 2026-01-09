import { useState, useEffect } from "react";
import {
  Image,
  Filter,
  X,
  Calendar,
  User,
  Plus,
  Upload,
  Search,
  ArrowUpDown,
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
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

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

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || a.fecha_evento);
      const dateB = new Date(b.created_at || b.fecha_evento);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    setFilteredFolders(filtered);
  };

  const clearFilters = () => {
    setSelectedArtist(null);
    setSelectedEvent(null);
    setSearchTerm("");
    setSortOrder("desc");
  };

  const handleCreateFolder = async (folderData) => {
    try {
      const result = await galleryApi.createFolder(folderData);
      if (result.success) {
        setSuccess("Álbum creado exitosamente");
        setShowCreateFolder(false);
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
    fetchGalleryData();
  };

  const hasActiveFilters =
    selectedArtist ||
    selectedEvent ||
    searchTerm.trim() ||
    sortOrder !== "desc";

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-gradient text-5xl font-bold mb-4">Galería</h1>
            <p className="text-gray-400 text-lg">
              Explora nuestros álbumes de fotos de eventos y conciertos
            </p>
          </div>

          {isAdmin && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadImage(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
              >
                <Upload size={20} />
                Subir Imagen
              </button>
              <button
                onClick={() => setShowCreateFolder(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus size={20} />
                Crear Álbum
              </button>
            </div>
          )}
        </div>

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

        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar álbumes por nombre o descripción..."
              className="w-full pl-12 pr-12 py-3 bg-[#1a1a1a] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-lg transition-colors"
            >
              <Filter size={20} />
              {showFilters ? "Ocultar Filtros" : "Filtros Avanzados"}
            </button>

            <button
              onClick={() =>
                setSortOrder(sortOrder === "desc" ? "asc" : "desc")
              }
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-lg transition-colors"
            >
              <ArrowUpDown size={20} />
              {sortOrder === "desc" ? "Más Reciente" : "Más Antiguo"}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <X size={20} />
                Limpiar Filtros
              </button>
            )}

            <div className="ml-auto text-gray-400 text-sm">
              {filteredFolders.length}{" "}
              {filteredFolders.length === 1 ? "álbum" : "álbumes"}
            </div>
          </div>

          {showFilters && (
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#262626]">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 font-medium mb-3">
                    Filtrar por Artista
                  </label>
                  {allArtists.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No hay artistas disponibles
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {allArtists.map((artist) => (
                        <button
                          key={artist.id}
                          onClick={() =>
                            setSelectedArtist(
                              selectedArtist?.id === artist.id ? null : artist
                            )
                          }
                          className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                            selectedArtist?.id === artist.id
                              ? "bg-primary-600 text-white"
                              : "bg-[#0a0a0a] text-gray-300 hover:bg-[#2a2a2a]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            <span className="truncate">{artist.nombre}</span>
                          </div>
                          <span className="text-xs opacity-70">
                            {artist.tipo === "artista"
                              ? "Artista"
                              : "Colectivo"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-3">
                    Filtrar por Evento
                  </label>
                  {allEvents.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No hay eventos disponibles
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                      {allEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={() =>
                            setSelectedEvent(
                              selectedEvent?.id === event.id ? null : event
                            )
                          }
                          className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                            selectedEvent?.id === event.id
                              ? "bg-primary-600 text-white"
                              : "bg-[#0a0a0a] text-gray-300 hover:bg-[#2a2a2a]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span className="truncate">{event.titulo}</span>
                          </div>
                          <span className="text-xs opacity-70">
                            {new Date(event.fecha).toLocaleDateString("es-ES")}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

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

      {showCreateFolder && (
        <FolderModal
          onClose={() => setShowCreateFolder(false)}
          onSave={handleCreateFolder}
        />
      )}

      {showUploadImage && (
        <QuickImageUploadModal
          folders={folders}
          onClose={() => setShowUploadImage(false)}
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

        {folder.destacado && (
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
