import { useState } from 'react';
import Alert from '../../components/common/Alert';
import { exportEventos } from '../../api/adminApi';
import { Download, Calendar, Info } from 'lucide-react';

const AdminExportEventos = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await exportEventos();
      if (result.success) {
        setSuccess('Exportación de eventos completada exitosamente');
      } else {
        setError(result.message || 'Error en la exportación');
      }
    } catch (err) {
      console.error('Error exportando eventos:', err);
      setError('Error al exportar eventos. Es posible que el endpoint no esté implementado aún.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Exportar Eventos CSV</h1>
        <p className="text-gray-400">Descarga la lista de eventos con estadísticas</p>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} persistent />}

      <div className="bg-blue-500/20 border border-blue-500 text-blue-200 px-4 py-3 rounded-lg mb-8 flex items-start gap-3">
        <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold mb-1">Información</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Incluye todos los eventos (publicados, borradores, cancelados)</li>
            <li>Compatible con Excel y Google Sheets</li>
            <li>Se descargará automáticamente</li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-green-500/20 p-3 rounded-lg">
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-white mb-2">Lista de Eventos</h3>
            <p className="text-gray-400">
              Exporta todos los eventos con fechas, aforo y estadísticas
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-white font-medium mb-3">Campos incluidos:</p>
          <div className="flex flex-wrap gap-2">
            {['Título', 'Fecha evento', 'Ubicación', 'Aforo máximo', 'Entradas vendidas', 'Estado', 'Fecha alta'].map(field => (
              <span key={field} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">
                {field}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              Exportando...
            </>
          ) : (
            <>
              <Download className="w-6 h-6" />
              Descargar CSV de Eventos
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminExportEventos;
