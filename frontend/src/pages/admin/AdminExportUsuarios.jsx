import { useState } from 'react';
import Alert from '../../components/common/Alert';
import { exportUsuarios } from '../../api/adminApi';
import { Download, Users, Info } from 'lucide-react';

const AdminExportUsuarios = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await exportUsuarios();
      if (result.success) {
        setSuccess('PDF de usuarios descargado correctamente');
      } else {
        setError(result.message || 'No se pudo generar el PDF de usuarios');
      }
    } catch (err) {
      console.error('Error al exportar usuarios:', err);
      setError('Error al descargar el PDF de usuarios. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-black min-h-screen">
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-4xl">Exportar Usuarios PDF</h1>
        <p className="text-gray-400 text-lg">Descarga todos los usuarios registrados en formato PDF</p>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} persistent />}

      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-primary-500/20 p-3 rounded-lg">
            <Users className="w-8 h-8 text-primary-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-white mb-2">Lista de Usuarios</h3>
            <p className="text-gray-400">
              Exporta todos los usuarios con sus datos y roles
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-white font-medium mb-3">Campos incluidos:</p>
          <div className="flex flex-wrap gap-2">
            {['Nombre', 'Email', 'Teléfono', 'Rol', 'Estado', 'Email verificado', 'Fecha registro'].map(field => (
              <span key={field} className="bg-[#262626] text-gray-300 px-3 py-1 rounded-full text-sm border border-[#333333]">
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
              Generando PDF...
            </>
          ) : (
            <>
              <Download className="w-6 h-6" />
              Descargar PDF de Usuarios
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminExportUsuarios;