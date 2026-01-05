import { Search, Star } from 'lucide-react';

const EventFilters = ({ filters, onFilterChange }) => {
  const handleStatusChange = (status) => {
    onFilterChange({ ...filters, status, featured: undefined });
  };

  const handleFeaturedClick = () => {
    onFilterChange({ ...filters, status: undefined, featured: true });
  };

  const handleSearchChange = (e) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const isActiveFilter = (filterStatus) => {
    return filters.status === filterStatus && !filters.featured;
  };

  const isFeaturedActive = filters.featured === true;

  return (
    <div className="mb-12 space-y-6">
      {/* Botones de filtro */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => handleStatusChange('upcoming')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            isActiveFilter('upcoming')
              ? 'bg-primary-600 text-white shadow-glow'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Próximos Eventos
        </button>
        
        <button
          onClick={() => handleStatusChange('past')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            isActiveFilter('past')
              ? 'bg-primary-600 text-white shadow-glow'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Eventos Pasados
        </button>

        <button
          onClick={() => handleStatusChange('all')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            isActiveFilter('all')
              ? 'bg-primary-600 text-white shadow-glow'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Todos
        </button>

        <button
          onClick={handleFeaturedClick}
          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            isFeaturedActive
              ? 'bg-yellow-600 text-white shadow-glow'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Star size={18} fill={isFeaturedActive ? 'currentColor' : 'none'} />
          Destacados
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar eventos por nombre..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="input pl-12 w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default EventFilters;
