import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllEventsAdmin, 
  deleteEvent,
  togglePublishEvent,
  toggleFeatureEvent 
} from '../../api/adminApi';
import { Calendar, MapPin, Users, Edit, Trash2, Plus, Eye, EyeOff, Star } from 'lucide-react';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

const AdminEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const params = {};
      if (statusFilter !== 'all') params.estado = statusFilter;
      if (search) params.search = search;

      const result = await getAllEventsAdmin(params);
      
      if (result.success) {
        // Backend devuelve array directo en result.data
        setEvents(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.message || 'Error al cargar eventos');
        setEvents([]);
      }
    } catch (err) {
      console.error('Error en fetchEvents:', err);
      setError('Error de conexión');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;

    setDeletingId(id);
    try {
      const result = await deleteEvent(id);
      if (result.success) {
        setSuccess('Evento eliminado exitosamente');
        setEvents(events.filter(e => e.id !== id));
      } else {
        setError(result.message || 'Error al eliminar evento');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const result = await togglePublishEvent(id);
      
      if (result.success) {
        setSuccess(result.message);
        fetchEvents(); // Reload to get updated data
      } else {
        setError(result.message || 'Error al cambiar estado');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      const result = await toggleFeatureEvent(id);
      
      if (result.success) {
        setSuccess(result.message);
        fetchEvents();
      } else {
        setError(result.message || 'Error al cambiar destacado');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (event) => {
    const isPublished = event.visible_desde !== null;
    const estado = event.estado;

    let color, text;
    
    if (estado === 'draft') {
      color = 'bg-gray-500';
      text = 'Borrador';
    } else if (estado === 'scheduled' && isPublished) {
      color = 'bg-green-500';
      text = 'Publicado';
    } else if (estado === 'scheduled' && !isPublished) {
      color = 'bg-blue-500';
      text = 'Programado';
    } else if (estado === 'active') {
      color = 'bg-purple-500';
      text = 'En curso';
    } else if (estado === 'completed') {
      color = 'bg-gray-400';
      text = 'Finalizado';
    } else if (estado === 'cancelled') {
      color = 'bg-red-500';
      text = 'Cancelado';
    } else {
      color = 'bg-gray-500';
      text = estado || 'Desconocido';
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}/20 text-${color.replace('bg-', '')}`}>
        {text}
      </span>
    );
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Gestión de Eventos</h1>
          <p className="text-gray-400">
            {events.length} evento{events.length !== 1 ? 's' : ''} total{events.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/admin/eventos/nuevo')}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Crear Evento
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">×</button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6">
          {success}
          <button onClick={() => setSuccess('')} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título o ubicación..."
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </form>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borradores</option>
            <option value="scheduled">Programados</option>
            <option value="active">En curso</option>
            <option value="completed">Finalizados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Lista de eventos */}
      {events.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Calendar className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 text-lg mb-4">
            {statusFilter === 'all' ? 'No hay eventos creados' : `No hay eventos en estado "${statusFilter}"`}
          </p>
          <Button variant="primary" onClick={() => navigate('/admin/eventos/nuevo')}>
            Crear primer evento
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const isPublished = event.visible_desde !== null;
            const isFeatured = event.destacado === 1;
            
            return (
              <div
                key={event.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  {/* Info del evento */}
                  <div className="flex gap-6 flex-1">
                    {/* Imagen */}
                    {event.imagen_cartel_url && (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${event.imagen_cartel_url}`}
                        alt={event.titulo}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    )}

                    {/* Detalles */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-white">
                          {event.titulo}
                        </h3>
                        {isFeatured && (
                          <Star className="text-yellow-400" size={20} fill="currentColor" />
                        )}
                      </div>
                      
                      <p className="text-gray-400 mb-4 line-clamp-2">{event.descripcion}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar size={16} className="text-purple-400" />
                          <span className="text-sm">
                            {formatDate(event.fecha_evento)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin size={16} className="text-purple-400" />
                          <span className="text-sm">{event.ubicacion || 'No especificada'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-300">
                          <Users size={16} className="text-purple-400" />
                          <span className="text-sm">
                            {event.confirmed_bookings || 0}/{event.aforo_maximo || 0}
                          </span>
                        </div>
                      </div>

                      {/* Estado */}
                      {getStatusBadge(event)}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 ml-4">
                    {/* Toggle Publish */}
                    <button
                      onClick={() => handleTogglePublish(event.id, event.estado)}
                      className={`p-2 rounded-lg transition-colors ${
                        isPublished 
                          ? 'text-orange-400 hover:bg-orange-500/20' 
                          : 'text-green-400 hover:bg-green-500/20'
                      }`}
                      title={isPublished ? 'Despublicar' : 'Publicar'}
                    >
                      {isPublished ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>

                    {/* Toggle Featured */}
                    <button
                      onClick={() => handleToggleFeatured(event.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isFeatured
                          ? 'text-yellow-400 hover:bg-yellow-500/20'
                          : 'text-gray-400 hover:bg-gray-500/20'
                      }`}
                      title={isFeatured ? 'Quitar destacado' : 'Destacar'}
                    >
                      <Star size={20} fill={isFeatured ? 'currentColor' : 'none'} />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => navigate(`/admin/eventos/editar/${event.id}`)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit size={20} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
