import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getAllEventsAdmin, 
  deleteEvent,
  togglePublishEvent,
  toggleFeatureEvent 
} from '../../api/adminApi';
import Alert from '../../components/common/Alert';
import Loader from '../../components/common/Loader';

const AdminEventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchEvents();
  }, [pagination.page, statusFilter, featuredFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm
      };

      if (statusFilter !== 'all') {
        params.estado = statusFilter;
      }

      if (featuredFilter !== 'all') {
        params.destacado = featuredFilter === 'featured';
      }

      const response = await getAllEventsAdmin(params);

      if (response.success) {
        setEvents(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.message || 'Error loading events');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Error loading events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchEvents();
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await deleteEvent(id);
      
      if (response.success) {
        setSuccess('Event deleted successfully');
        fetchEvents();
      } else {
        setError(response.message || 'Error deleting event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Error deleting event. Please try again.');
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const response = await togglePublishEvent(id);
      
      if (response.success) {
        setSuccess(response.message);
        fetchEvents();
      } else {
        setError(response.message || 'Error changing publish status');
      }
    } catch (err) {
      console.error('Error toggling publish:', err);
      setError('Error changing status. Please try again.');
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      const response = await toggleFeatureEvent(id);
      
      if (response.success) {
        setSuccess(response.message);
        fetchEvents();
      } else {
        setError(response.message || 'Error changing featured status');
      }
    } catch (err) {
      console.error('Error toggling featured:', err);
      setError('Error changing status. Please try again.');
    }
  };

  const getStatusBadge = (status, visibleSince) => {
    const isPublished = visibleSince !== null;
    
    const badges = {
      draft: { text: 'Draft', color: 'bg-gray-500' },
      scheduled: { text: isPublished ? 'Published' : 'Scheduled', color: isPublished ? 'bg-green-500' : 'bg-blue-500' },
      active: { text: 'Active', color: 'bg-purple-500' },
      completed: { text: 'Completed', color: 'bg-gray-400' },
      cancelled: { text: 'Cancelled', color: 'bg-red-500' }
    };

    const badge = badges[status] || { text: status, color: 'bg-gray-500' };

    return (
      <span className={`px-2 py-1 text-xs rounded-full text-white ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Event Management</h1>
          <p className="text-gray-400 mt-1">Manage all system events</p>
        </div>
        <Link
          to="/admin/events/create"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          + Create Event
        </Link>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or location..."
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                🔍
              </button>
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Featured Filter */}
          <select
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Events</option>
            <option value="featured">Featured Only</option>
            <option value="not-featured">Not Featured</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-white mb-2">No events created</h3>
          <p className="text-gray-400 mb-6">Start by creating your first event</p>
          <Link
            to="/admin/events/create"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Create first event
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {event.imagen_cartel_url ? (
                            <img
                              src={`${import.meta.env.VITE_API_URL}${event.imagen_cartel_url}`}
                              alt={event.titulo}
                              className="w-12 h-12 object-cover rounded mr-3"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-600 rounded mr-3 flex items-center justify-center">
                              📅
                            </div>
                          )}
                          <div>
                            <div className="text-white font-medium flex items-center gap-2">
                              {event.titulo}
                              {event.destacado === 1 && (
                                <span className="text-yellow-400" title="Featured">⭐</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">{event.ubicacion}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {formatDate(event.fecha_evento)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(event.estado, event.visible_desde)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {event.confirmed_bookings || 0} / {event.aforo_maximo}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Publish/Unpublish Toggle */}
                          <button
                            onClick={() => handleTogglePublish(event.id, event.estado)}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              event.visible_desde 
                                ? 'bg-orange-600 hover:bg-orange-700' 
                                : 'bg-green-600 hover:bg-green-700'
                            } text-white`}
                            title={event.visible_desde ? 'Unpublish' : 'Publish'}
                          >
                            {event.visible_desde ? '👁️ Hide' : '🚀 Publish'}
                          </button>

                          {/* Featured Toggle */}
                          <button
                            onClick={() => handleToggleFeatured(event.id)}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              event.destacado === 1
                                ? 'bg-yellow-600 hover:bg-yellow-700'
                                : 'bg-gray-600 hover:bg-gray-700'
                            } text-white`}
                            title={event.destacado === 1 ? 'Unfeature' : 'Feature'}
                          >
                            {event.destacado === 1 ? '⭐' : '☆'}
                          </button>

                          {/* Edit */}
                          <Link
                            to={`/admin/events/edit/${event.id}`}
                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          >
                            ✏️ Edit
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(event.id, event.titulo)}
                            className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                ← Previous
              </button>
              
              <span className="text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminEventList;
