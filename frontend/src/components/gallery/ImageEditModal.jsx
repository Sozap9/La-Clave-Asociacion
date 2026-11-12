import { useState, useEffect } from 'react';
import { X, Edit, Users, ImageIcon, Trash2, Search } from 'lucide-react';
import Alert from '../common/Alert';
import * as galleryApi from '../../api/galleryApi';

const API_BASE_URL = import.meta.env.VITE_API_URL.replace('/api', '');
const API_URL = import.meta.env.VITE_API_URL;

const ImageEditModal = ({ image, onClose, onSave, onSaveArtists, onDelete, onSetCover, isCover }) => {
  const [activeTab, setActiveTab] = useState('info');

  const [formData, setFormData] = useState({
    titulo: image.titulo || '',
    descripcion: image.descripcion || '',
    visible: image.visible !== undefined ? image.visible : true,
    destacado: image.destacado !== undefined ? image.destacado : false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [availableArtists, setAvailableArtists] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [loadingArtists, setLoadingArtists] = useState(false);

  useEffect(() => {
    fetchArtists();
  }, [image.id]);

  const fetchArtists = async () => {
    setLoadingArtists(true);
    try {
      const currentResult = await galleryApi.getImageArtists(image.id);
      if (currentResult.success) {
        setSelectedArtists((currentResult.data || []).map(a => a.id));
      }
      const response = await fetch(`${API_URL}/artists`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setAvailableArtists(result.data);
      }
    } catch (err) {
      console.warn('Error cargando artistas:', err);
    } finally {
      setLoadingArtists(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleToggle = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave(formData);
    } catch (err) {
      setError('Error al guardar los cambios');
      setSaving(false);
    }
  };

  const handleSaveArtistsClick = async () => {
    setSaving(true);
    setError('');
    try {
      await onSaveArtists(selectedArtists);
    } catch (err) {
      setError('Error al guardar artistas');
      setSaving(false);
    }
  };

  const handleToggleArtist = (artistId) => {
    setSelectedArtists(prev =>
      prev.includes(artistId) ? prev.filter(id => id !== artistId) : [...prev, artistId]
    );
  };

  const filteredArtists = availableArtists.filter(a =>
    a.nombre_artistico?.toLowerCase().includes(artistSearch.toLowerCase()) ||
    a.nombre_real?.toLowerCase().includes(artistSearch.toLowerCase())
  );

  const imageUrl = image.imagen_url || image.thumbnail_url;
  const fullImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#0a0a0a]/95 backdrop-blur-md rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-primary-500/20 shadow-2xl">

        {/* Cabecera */}
        <div className="bg-[#0a0a0a]/95 backdrop-blur-md border-b border-primary-500/20 p-4 sm:p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Edit size={22} className="text-primary-400" />
            Gestionar Imagen
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-[#1a1a1a] flex items-center justify-center transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex gap-1 border-b border-[#262626] px-6 pt-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Información
          </button>
          <button
            onClick={() => setActiveTab('artistas')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'artistas'
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            Artistas
            {selectedArtists.length > 0 && (
              <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">
                {selectedArtists.length}
              </span>
            )}
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          {/* Pestaña de información */}
          {activeTab === 'info' && (
            <>
              {/* Vista previa */}
              <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a] aspect-video">
                <img
                  src={fullImageUrl}
                  alt={image.titulo || 'Imagen'}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/800x450?text=Error'; }}
                />
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {!!isCover && (
                    <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-semibold rounded">PORTADA</span>
                  )}
                  {!!formData.destacado && (
                    <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-semibold rounded">DESTACADO</span>
                  )}
                  <span className={`px-2 py-0.5 text-white text-xs font-semibold rounded ${formData.visible ? 'bg-primary-600' : 'bg-[#333333]'}`}>
                    {formData.visible ? 'VISIBLE' : 'OCULTO'}
                  </span>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Título <span className="text-gray-500 text-sm font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Título de la imagen"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  disabled={saving}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Descripción <span className="text-gray-500 text-sm font-normal">(opcional)</span>
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción de la imagen"
                  rows={3}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none"
                  disabled={saving}
                />
              </div>

              {/* Interruptores */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#262626] rounded-lg">
                  <div>
                    <p className="text-white font-medium">Visible</p>
                    <p className="text-gray-500 text-sm">La imagen será visible para los socios</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('visible')}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none ${formData.visible ? 'bg-primary-600' : 'bg-[#262626]'}`}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${formData.visible ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#262626] rounded-lg">
                  <div>
                    <p className="text-white font-medium">Destacado</p>
                    <p className="text-gray-500 text-sm">Aparecerá resaltada en el álbum</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('destacado')}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none ${formData.destacado ? 'bg-primary-600' : 'bg-[#262626]'}`}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${formData.destacado ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Portada + Eliminar */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onSetCover(image)}
                  disabled={saving}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    isCover
                      ? 'bg-primary-600 text-white'
                      : 'bg-[#1a1a1a] border border-[#262626] text-gray-300 hover:bg-[#2a2a2a]'
                  }`}
                >
                  <ImageIcon size={16} />
                  {isCover ? 'Es Portada' : 'Establecer Portada'}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(image)}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#1a1a1a] border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Eliminar Imagen
                </button>
              </div>
            </>
          )}

          {/* Pestaña de artistas */}
          {activeTab === 'artistas' && (
            <>
              {loadingArtists ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4" />
                  <p className="text-gray-400">Cargando artistas...</p>
                </div>
              ) : availableArtists.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-semibold mb-2">No hay artistas disponibles</h3>
                  <p className="text-gray-400 text-sm">No hay artistas configurados en el sistema.</p>
                </div>
              ) : (
                <>
                  {selectedArtists.length > 0 && (
                    <div>
                      <p className="text-gray-300 font-medium mb-2">Seleccionados ({selectedArtists.length})</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedArtists.map(id => {
                          const a = availableArtists.find(x => x.id === id);
                          if (!a) return null;
                          return (
                            <span key={id} className="flex items-center gap-1.5 px-3 py-1 bg-primary-600/20 border border-primary-500/40 text-primary-300 text-sm rounded-full">
                              {a.nombre_artistico || a.nombre_real}
                              <button onClick={() => handleToggleArtist(id)} className="hover:text-white transition-colors">
                                <X size={12} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={artistSearch}
                      onChange={(e) => setArtistSearch(e.target.value)}
                      placeholder="Buscar artistas..."
                      className="w-full pl-9 pr-4 py-2.5 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors text-sm"
                    />
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {filteredArtists.length === 0 ? (
                      <p className="text-gray-400 text-center py-6 text-sm">No se encontraron artistas</p>
                    ) : filteredArtists.map(artist => (
                      <label
                        key={artist.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedArtists.includes(artist.id)
                            ? 'bg-primary-600/20 border border-primary-500/40'
                            : 'bg-[#1a1a1a] border border-[#262626] hover:bg-[#2a2a2a]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedArtists.includes(artist.id)}
                          onChange={() => handleToggleArtist(artist.id)}
                          className="w-4 h-4 text-primary-600 bg-[#1a1a1a] border-[#262626] rounded focus:ring-primary-500"
                        />
                        <div>
                          <p className="text-white text-sm font-medium">{artist.nombre_artistico}</p>
                          {artist.nombre_real && artist.nombre_real !== artist.nombre_artistico && (
                            <p className="text-gray-500 text-xs">{artist.nombre_real}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Pie */}
        <div className="border-t border-[#262626] p-4 sm:p-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-[#1a1a1a] hover:bg-[#262626] text-white rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={activeTab === 'info' ? handleSave : handleSaveArtistsClick}
            disabled={saving || (activeTab === 'artistas' && loadingArtists)}
            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditModal;