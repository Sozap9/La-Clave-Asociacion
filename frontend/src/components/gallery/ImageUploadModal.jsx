import { useState, useRef } from 'react';
import { X, Upload, FolderUp, Trash2, Eye, Star, Image as ImageIcon } from 'lucide-react';
import * as galleryApi from '../../api/galleryApi';
import Button from '../common/Button';

const ImageUploadModal = ({ folderId, onClose, onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  
  // Opciones por defecto para todas las imágenes
  const [defaultVisible, setDefaultVisible] = useState(true);
  const [defaultFeatured, setDefaultFeatured] = useState(false);
  
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const handleFolderSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError('No se encontraron imágenes válidas');
      return;
    }

    // Validar tamaño
    const oversizedFiles = imageFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`${oversizedFiles.length} archivo(s) superan los 10MB`);
      return;
    }

    setError('');
    setSelectedFiles(prev => [...prev, ...imageFiles]);

    // Crear previews
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, {
          file: file,
          url: e.target.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Selecciona al menos una imagen');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Preparar datos para upload múltiple
      const imagesData = selectedFiles.map(file => ({
        file,
        visible: defaultVisible,
        destacado: defaultFeatured
      }));

      const result = await galleryApi.uploadMultipleImages(folderId, imagesData, (progress) => {
        setUploadProgress(progress);
      });

      if (result.success) {
        onUploadComplete();
      } else {
        setError(result.message || 'Error al subir imágenes');
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Error al subir imágenes');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Subir Imágenes</h2>
            <p className="text-gray-400 text-sm mt-1">
              Puedes subir múltiples imágenes o una carpeta completa
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={uploading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center hover:border-primary-500 transition-colors"
          >
            <Upload size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">
              Arrastra imágenes o carpeta aquí
            </h3>
            <p className="text-gray-400 mb-6">
              O selecciona archivos desde tu ordenador
            </p>
            
            <div className="flex gap-3 justify-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <ImageIcon size={20} />
                Seleccionar Archivos
              </button>

              <input
                ref={folderInputRef}
                type="file"
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={handleFolderSelect}
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => folderInputRef.current?.click()}
                disabled={uploading}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <FolderUp size={20} />
                Seleccionar Carpeta
              </button>
            </div>
          </div>

          {/* Opciones por Defecto */}
          {selectedFiles.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="text-white font-semibold mb-3">
                Opciones para todas las imágenes:
              </h3>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={defaultVisible}
                  onChange={(e) => setDefaultVisible(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-primary-600 focus:ring-primary-500"
                  disabled={uploading}
                />
                <div className="flex items-center gap-2">
                  <Eye size={18} className="text-gray-400" />
                  <span className="text-white">Visibles por defecto</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={defaultFeatured}
                  onChange={(e) => setDefaultFeatured(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-primary-600 focus:ring-primary-500"
                  disabled={uploading}
                />
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-gray-400" />
                  <span className="text-white">Destacadas por defecto</span>
                </div>
              </label>
            </div>
          )}

          {/* Preview de Imágenes */}
          {previews.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">
                  Archivos seleccionados: {previews.length}
                </h3>
                {!uploading && (
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                      setPreviews([]);
                    }}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                      <img
                        src={preview.url}
                        alt={preview.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {!uploading && (
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      {uploading && uploadProgress[index] !== undefined && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                          <div className="text-white text-sm font-semibold">
                            {uploadProgress[index]}%
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-1 truncate" title={preview.name}>
                      {preview.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-gray-400 text-sm">
            {selectedFiles.length > 0 && (
              <span>
                {selectedFiles.length} {selectedFiles.length === 1 ? 'imagen' : 'imágenes'} lista{selectedFiles.length === 1 ? '' : 's'} para subir
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Upload size={20} />
              {uploading ? 'Subiendo...' : `Subir ${selectedFiles.length} ${selectedFiles.length === 1 ? 'imagen' : 'imágenes'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;