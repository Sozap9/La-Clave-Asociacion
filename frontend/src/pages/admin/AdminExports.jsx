import { useState } from 'react';
import Alert from '../../components/common/Alert';
import { 
  exportSocios, 
  exportUsuarios, 
  exportEventos, 
  exportReservas 
} from '../../api/adminApi';
import { Download, Users, Calendar, Ticket, UserCheck, Info } from 'lucide-react';

const AdminExports = () => {
  const [loading, setLoading] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Filtros para reservas
  const [reservasFilters, setReservasFilters] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    event_id: ''
  });

  const handleExport = async (type) => {
    setLoading(type);
    setError('');
    setSuccess('');

    try {
      let result;
      switch (type) {
        case 'socios':
          result = await exportSocios();
          break;
        case 'usuarios':
          result = await exportUsuarios();
          break;
        case 'eventos':
          result = await exportEventos();
          break;
        case 'reservas':
          result = await exportReservas(reservasFilters);
          break;
        default:
          throw new Error('Tipo de exportación no válido');
      }

      if (result.success) {
        setSuccess(`Exportación de ${type} completada exitosamente`);
      } else {
        setError(result.message || 'Error en la exportación');
      }
    } catch (err) {
      console.error(`Error exportando ${type}:`, err);
      setError(`Error al exportar ${type}.`);
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Exportaciones CSV</h1>
        <p className="text-gray-400">Descarga datos en formato CSV compatible con Excel y Google Sheets</p>
      </div>

      {/* Alertas */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} persistent />}

      {/* Info */}
      <div className="bg-blue-500/20 border border-blue-500 text-blue-200 px-4 py-3 rounded-lg mb-8 flex items-start gap-3">
        <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold mb-1">Información sobre las exportaciones</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Los archivos se generan con codificación UTF-8 y separador de punto y coma (;)</li>
            <li>Compatibles con Excel, Google Sheets y otras aplicaciones</li>
            <li>El archivo se descargará automáticamente con la fecha actual en el nombre</li>
          </ul>
        </div>
      </div>

      {/* Cards de exportación */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Exportar Socios */}
        <ExportCard
          title="Exportar Socios CSV"
          description="Lista completa de socios con datos personales, cuotas y estado"
          icon={UserCheck}
          iconColor="text-purple-400"
          fields={['Número socio', 'Nombre', 'Email', 'Teléfono', 'Cuota mensual', 'Estado', 'Fecha alta']}
          loading={loading === 'socios'}
          onExport={() => handleExport('socios')}
        />

        {/* Exportar Usuarios */}
        <ExportCard
          title="Exportar Usuarios CSV"
          description="Todos los usuarios registrados (básicos, socios y admins)"
          icon={Users}
          iconColor="text-blue-400"
          fields={['ID', 'Username', 'Nombre', 'Email', 'Rol', 'Estado', 'Fecha registro']}
          loading={loading === 'usuarios'}
          onExport={() => handleExport('usuarios')}
        />

        {/* Exportar Eventos */}
        <ExportCard
          title="Exportar Eventos CSV"
          description="Lista de eventos con fechas, aforo y estadísticas"
          icon={Calendar}
          iconColor="text-green-400"
          fields={['Título', 'Fecha evento', 'Ubicación', 'Aforo máximo', 'Entradas vendidas', 'Estado', 'Fecha alta']}
          loading={loading === 'eventos'}
          onExport={() => handleExport('eventos')}
        />

        {/* Exportar Reservas (con filtros) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-primary-500/50 transition-colors">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <Ticket className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-1">Exportar Reservas CSV</h3>
              <p className="text-gray-400 text-sm">
                Todas las reservas con datos de usuario y evento
              </p>
            </div>
          </div>

          {/* Filtros de fecha */}
          <div className="mb-4 space-y-3 bg-gray-800/50 p-4 rounded-lg">
            <p className="text-white text-sm font-medium">Filtrar por fecha de reserva (opcional):</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Desde:</label>
                <input
                  type="date"
                  value={reservasFilters.fecha_desde}
                  onChange={(e) => setReservasFilters({ ...reservasFilters, fecha_desde: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Hasta:</label>
                <input
                  type="date"
                  value={reservasFilters.fecha_hasta}
                  onChange={(e) => setReservasFilters({ ...reservasFilters, fecha_hasta: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <button
              onClick={() => setReservasFilters({ fecha_desde: '', fecha_hasta: '', event_id: '' })}
              className="text-primary-400 text-sm hover:text-primary-300 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>

          {/* Campos incluidos */}
          <div className="mb-4">
            <p className="text-gray-400 text-sm font-medium mb-2">Campos incluidos:</p>
            <div className="flex flex-wrap gap-2">
              {['Código reserva', 'Nombre socio', 'Email', 'Evento', 'Fecha evento', 'Entradas', 'Estado', 'Fecha reserva'].map(field => (
                <span key={field} className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
                  {field}
                </span>
              ))}
            </div>
          </div>

          {/* Botón de descarga */}
          <button
            onClick={() => handleExport('reservas')}
            disabled={loading === 'reservas'}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading === 'reservas' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Descargar CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instrucciones de uso */}
      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Cómo usar los archivos CSV</h3>
        <ol className="space-y-2 text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-primary-400 font-bold">1.</span>
            <span>Haz clic en "Descargar CSV" en la exportación que necesites</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400 font-bold">2.</span>
            <span>El archivo se descargará automáticamente con la fecha actual en el nombre</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400 font-bold">3.</span>
            <span>Abre el archivo con Excel, Google Sheets o tu aplicación preferida</span>
          </li>
        </ol>
      </div>
    </div>
  );
};

// Componente reutilizable para cards de exportación
const ExportCard = ({ title, description, icon: Icon, iconColor, fields, loading, onExport }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-primary-500/50 transition-colors">
      <div className="flex items-start gap-4 mb-4">
        <div className="bg-gray-800 p-3 rounded-lg">
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-1">{title}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-400 text-sm font-medium mb-2">Campos incluidos:</p>
        <div className="flex flex-wrap gap-2">
          {fields.map(field => (
            <span key={field} className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
              {field}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={onExport}
        disabled={loading}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Exportando...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Descargar CSV
          </>
        )}
      </button>
    </div>
  );
};

export default AdminExports;
