/**
  * Componente FilterBar
  * 
 * - Ahora es GENÉRICO y acepta filtros personalizados vía props
 * - MANTIENE compatibilidad con uso actual en AdminEvents.jsx y Events.jsx
 * - Si no se pasan filtros custom, usa los de eventos por defecto
 * - Mismo diseño, mismos estilos, solo más flexible
 * 
 * USO:
 * 
 * 1. MODO EVENTOS (actual, sin cambios):
 *    <FilterBar 
 *      filters={{ status: 'all', featured: false }} 
 *      onFilterChange={(f) => setFilters(f)} 
 *    />
 * 
 * 2. MODO GENÉRICO (nuevo):
 *    <FilterBar
 *      customFilters={[
 *        { value: 'all', label: 'Todos', count: 10 },
 *        { value: 'confirmada', label: 'Confirmadas', count: 5 }
 *      ]}
 *      activeFilter="all"
 *      onFilterChange={(value) => setFilter(value)}
 *    />
 */

import React from "react";


const FilterBar = ({ 
  filters,           // Para modo eventos 
  onFilterChange,    // Callback
  customFilters,     // Para modo genérico 
  activeFilter,      // Para modo genérico 
  showCounts = false // Opcional: mostrar contadores
}) => {
  
  // MODO GENÉRICO 

  if (customFilters) {
    return (
      <div className="flex flex-wrap gap-4">
        {customFilters.map(filter => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeFilter === filter.value
                ? "bg-primary-600 text-white shadow-glow"
                : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
            }`}
          >
            {filter.label}
            {showCounts && filter.count !== undefined && ` (${filter.count})`}
          </button>
        ))}
      </div>
    );
  }

  // MODO EVENTOS (mantiene compatibilidad)

  const handleStatusChange = (status) => {
    onFilterChange({ ...filters, status, featured: undefined });
  };

  const handleFeaturedClick = () => {
    onFilterChange({ ...filters, status: undefined, featured: true });
  };

  const isActiveFilter = (filterStatus) => {
    return filters.status === filterStatus && !filters.featured;
  };

  const isFeaturedActive = filters.featured === true;

  return (
    <div className="flex flex-wrap gap-4">
      <button
        onClick={() => handleStatusChange("all")}
        className={`px-6 py-3 rounded-lg font-medium transition-all ${
          isActiveFilter("all")
            ? "bg-primary-600 text-white shadow-glow"
            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
        }`}
      >
        Todos
      </button>

      <button
        onClick={() => handleStatusChange("upcoming")}
        className={`px-6 py-3 rounded-lg font-medium transition-all ${
          isActiveFilter("upcoming")
            ? "bg-primary-600 text-white shadow-glow"
            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
        }`}
      >
        Próximos Eventos
      </button>

      <button
        onClick={() => handleStatusChange("past")}
        className={`px-6 py-3 rounded-lg font-medium transition-all ${
          isActiveFilter("past")
            ? "bg-primary-600 text-white shadow-glow"
            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
        }`}
      >
        Eventos Pasados
      </button>

      <button
        onClick={handleFeaturedClick}
        className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
          isFeaturedActive
            ? "bg-primary-600 text-white shadow-glow"
            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
        }`}
      >
        Destacados
      </button>
    </div>
  );
};

export default FilterBar;