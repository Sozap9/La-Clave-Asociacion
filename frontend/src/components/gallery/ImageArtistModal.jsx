import { useState, useEffect } from "react";
import { X, Users, Plus, Trash2, Search } from "lucide-react";
import Button from "../common/Button";
import Alert from "../common/Alert";
import * as galleryApi from "../../api/galleryApi";

const API_URL = import.meta.env.VITE_API_URL;

const ImageArtistModal = ({ image, onClose, onSave }) => {
  const [currentArtists, setCurrentArtists] = useState([]);
  const [availableArtists, setAvailableArtists] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, [image.id]);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      // Obtener artistas actuales de la imagen
      const currentResult = await galleryApi.getImageArtists(image.id);

      if (currentResult.success) {
        const currentArtistsList = currentResult.data || [];
        setCurrentArtists(currentArtistsList);
        setSelectedArtists(currentArtistsList.map((a) => a.id));
      }

      // Obtener todos los artistas disponibles
      try {
        const response = await fetch(`${API_URL}/artists`);
        const artistsResult = await response.json();

        if (artistsResult.success && Array.isArray(artistsResult.data)) {
          setAvailableArtists(artistsResult.data);
        } else {
          console.warn("No se encontraron artistas o el formato es incorrecto");
          setAvailableArtists([]);
        }
      } catch (artistError) {
        console.warn("Endpoint /api/artists no disponible:", artistError);
        setAvailableArtists([]);
        setError(
          "No se pudo cargar la lista de artistas. Por favor, contacta al administrador."
        );
      }
    } catch (err) {
      console.error("Error fetching artists:", err);
      setError("Error al cargar artistas");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleArtist = (artistId) => {
    setSelectedArtists((prev) => {
      if (prev.includes(artistId)) {
        return prev.filter((id) => id !== artistId);
      } else {
        return [...prev, artistId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSave(selectedArtists);
    } catch (err) {
      setError("Error al guardar artistas");
    } finally {
      setSaving(false);
    }
  };

  // ✅ CORRECCIÓN: Verificar que availableArtists es array antes de filtrar
  const filteredArtists = Array.isArray(availableArtists)
    ? availableArtists.filter(
        (artist) =>
          artist.nombre_artistico
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          artist.nombre_real?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={24} className="text-primary-400" />
            Gestionar Artistas
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={saving}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {error && (
              <Alert
                type="error"
                message={error}
                onClose={() => setError("")}
              />
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <p className="text-gray-400 mt-4">Cargando artistas...</p>
              </div>
            ) : (
              <>
                {availableArtists.length === 0 ? (
                  <div className="text-center py-12">
                    <Users size={48} className="text-gray-600 mx-auto mb-4" />
                    <h3 className="text-white text-lg font-semibold mb-2">
                      No hay artistas disponibles
                    </h3>
                    <p className="text-gray-400 mb-4">
                      El endpoint de artistas no está configurado o no hay
                      artistas en el sistema.
                    </p>
                    <p className="text-gray-500 text-sm">
                      Contacta al administrador para agregar artistas al
                      sistema.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Búsqueda */}
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar artistas..."
                        className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Artistas seleccionados */}
                    {selectedArtists.length > 0 && (
                      <div>
                        <h3 className="text-white font-semibold mb-3">
                          Artistas seleccionados ({selectedArtists.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedArtists.map((artistId) => {
                            const artist = availableArtists.find(
                              (a) => a.id === artistId
                            );
                            if (!artist) return null;
                            return (
                              <div
                                key={artistId}
                                className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-full text-sm"
                              >
                                <span>
                                  {artist.nombre_artistico ||
                                    artist.nombre_real}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleArtist(artistId)}
                                  className="hover:text-red-300 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Lista de artistas disponibles */}
                    <div>
                      <h3 className="text-white font-semibold mb-3">
                        Todos los artistas ({filteredArtists.length})
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredArtists.length === 0 ? (
                          <p className="text-gray-400 text-center py-8">
                            No se encontraron artistas con ese nombre
                          </p>
                        ) : (
                          filteredArtists.map((artist) => (
                            <label
                              key={artist.id}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedArtists.includes(artist.id)
                                  ? "bg-primary-600/20 border-2 border-primary-500"
                                  : "bg-gray-700/50 hover:bg-gray-700 border-2 border-transparent"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedArtists.includes(artist.id)}
                                onChange={() => handleToggleArtist(artist.id)}
                                className="w-5 h-5 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                              />
                              <div className="flex-1">
                                <div className="text-white font-medium">
                                  {artist.nombre_artistico}
                                </div>
                                {artist.nombre_real &&
                                  artist.nombre_real !==
                                    artist.nombre_artistico && (
                                    <div className="text-gray-400 text-sm">
                                      {artist.nombre_real}
                                    </div>
                                  )}
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving || loading || availableArtists.length === 0}
              className="flex-1"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImageArtistModal;
