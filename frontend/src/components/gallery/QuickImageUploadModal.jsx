import { useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import * as galleryApi from '../../api/galleryApi';
import Alert from '../common/Alert';

const QuickImageUploadModal = ({ folders, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setError('La imagen no debe superar los 10MB');
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona una imagen');
      return;
    }

    if (!selectedFolder) {
      setError('Por favor selecciona un álbum');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('titulo', '');
      formData.append('descripcion', '');
      formData.append('visible', 'true');
      formData.append('destacado', 'false');

      const result = await galleryApi.uploadImage(selectedFolder, formData);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Error al subir la imagen');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-[#0a0a0a]/95 backdrop-blur-md rounded-2xl border border-primary-500/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-500/20">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Upload size={24} className="text-primary-400" />
            Subir Imagen Rápida
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-gray-800/50 flex items-center justify-center transition-colors"
            disabled={uploading}
            type="button"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <Alert 
              type="error" 
              message={error} 
              onClose={() => setError('')} 
            />
          )}

          {/* Selector de archivo */}
          <div>
            <label className="block text-gray-300 font-medium mb-3">
              Seleccionar Imagen
            </label>
            
            {!previewUrl ? (
              <label className="block cursor-pointer">
                <div className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors">
                  <ImageIcon size={48} className="text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">
                    Haz clic para seleccionar una imagen
                  </p>
                  <p className="text-gray-500 text-sm">
                    PNG, JPG, WEBP (máx. 10MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                  disabled={uploading}
                  type="button"
                >
                  <X size={16} />
                </button>
                <div className="mt-2 text-sm text-gray-400">
                  {selectedFile.name}
                </div>
              </div>
            )}
          </div>

          {/* Selector de álbum */}
          <div>
            <label className="block text-gray-300 font-medium mb-3">
              Álbum de Destino *
            </label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              required
              disabled={uploading}
            >
              <option value="">Selecciona un álbum...</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.nombre} ({folder.total_imagenes || 0} fotos)
                </option>
              ))}
            </select>
            <p className="text-gray-500 text-sm mt-2">
              La imagen se añadirá al final del álbum seleccionado
            </p>
          </div>

          {/* Info adicional */}
          <div className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors">
            <p className="text-gray-300 text-sm">
              <strong>Nota:</strong> Esta es una subida rápida sin título ni descripción. 
              Podrás editar estos detalles más tarde desde la gestión del álbum.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-primary-500/20">
          <button
            onClick={onClose}
            disabled={uploading}
            type="button"
            className="fflex-1 px-6 py-3 bg-[#1a1a1a] hover:bg-[#262626] text-white rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !selectedFolder}
            type="button"
            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Subiendo...' : 'Subir Imagen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickImageUploadModal;