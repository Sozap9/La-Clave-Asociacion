import { Star } from 'lucide-react';

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
    <div className="mb-12">
      {/* Filtros a la izquierda, búsqueda a la derecha */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        {/* Botones de filtro */}
        <div className="flex flex-wrap gap-4">
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

        {/* ✅ CORREGIDO: Barra de búsqueda con SVG idéntico a MisEntradas */}
        <div className="flex-1 max-w-md ml-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar eventos por nombre..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="w-full px-4 py-3 pl-12 bg-slate-900/60 border border-purple-500/30 rounded-lg 
                         text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 
                         focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm transition-all"
            />
            {/* ✅ SVG de lupa idéntico a MisEntradas */}
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventFilters;