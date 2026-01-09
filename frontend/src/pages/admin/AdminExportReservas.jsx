import { useState, useEffect } from 'react';
import Alert from '../../components/common/Alert';
import { exportReservas, getAllEventsAdmin } from '../../api/adminApi';
import { Download, Ticket, Info, Calendar } from 'lucide-react';

const AdminExportReservas = () => {
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    event_id: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const result = await getAllEventsAdmin({ limit: 1000, estado: 'publicado' });
      if (result.success) {
        setEvents(result.data.items || []);
      }
    } catch (err) {
      console.error('Error cargando eventos:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await exportReservas(filters);
      if (result.success) {
        setSuccess('PDF de reservas descargado correctamente');
      } else {
        setError(result.message || 'No se pudo generar el PDF de reservas');
      }
    } catch (err) {
      console.error('Error al exportar reservas:', err);
      setError('Error al descargar el PDF de reservas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ fecha_desde: '', fecha_hasta: '', event_id: '' });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Exportar Reservas PDF</h1>
        <p className="text-gray-400">Descarga reservas filtradas por fecha o evento</p>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} persistent />}

      <div className="bg-blue-500/20 border border-blue-500 text-blue-200 px-4 py-3 rounded-lg mb-8 flex items-start gap-3">
        <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold mb-1">Información</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Formato PDF horizontal para mejor visualización</li>
            <li>Filtra por evento para ver lista de entradas compradas</li>
            <li>Compatible con cualquier dispositivo</li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-yellow-500/20 p-3 rounded-lg">
            <Ticket className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-white mb-2">Lista de Reservas</h3>
            <p className="text-gray-400">
              Exporta reservas con datos de usuario y evento
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 space-y-4 bg-gray-800/50 p-6 rounded-lg">
          <h4 className="text-white font-semibold text-lg mb-3">Filtros (opcional)</h4>
          
          {/* Filtro por Evento */}
          <div>
            <label className="block text-white font-medium mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Filtrar por Evento Publicado:
            </label>
            {eventsLoading ? (
              <div className="text-gray-400 text-sm">Cargando eventos...</div>
            ) : (
              <select
                value={filters.event_id}
                onChange={(e) => setFilters({ ...filters, event_id: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Todos los eventos</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.titulo} - {new Date(event.fecha_evento).toLocaleDateString('es-ES')}
                  </option>
                ))}
              </select>
            )}
            <p className="text-gray-400 text-sm mt-1">
              Selecciona un evento para ver todas las entradas compradas
            </p>
          </div>

          {/* Filtro por Fechas */}
          <div className="border-t border-gray-700 pt-4">
            <label className="block text-white font-medium mb-2">
              Filtrar por Fecha de Reserva:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Desde:</label>
                <input
                  type="date"
                  value={filters.fecha_desde}
                  onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Hasta:</label>
                <input
                  type="date"
                  value={filters.fecha_hasta}
                  onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="text-primary-400 text-sm hover:text-primary-300 transition-colors font-medium"
          >
            Limpiar todos los filtros
          </button>
        </div>

        {/* Campos incluidos */}
        <div className="mb-6">
          <p className="text-white font-medium mb-3">Campos incluidos:</p>
          <div className="flex flex-wrap gap-2">
            {['Código reserva', 'Evento', 'Socio', 'Fecha evento', 'Hora', 'Acompañantes', 'Estado', 'Fecha reserva'].map(field => (
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
              Generando PDF...
            </>
          ) : (
            <>
              <Download className="w-6 h-6" />
              Descargar PDF de Reservas
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminExportReservas;
