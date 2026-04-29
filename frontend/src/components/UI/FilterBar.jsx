/**
  * Componente FilterBar
  * 
  * En mobile (< sm): muestra un <select> nativo con el filtro activo
  * En desktop (sm+): muestra los botones de siempre
  */

import React from "react";

const FilterBar = ({ 
  filters,
  onFilterChange,
  customFilters,
  activeFilter,
  showCounts = false
}) => {

  // ── MODO GENÉRICO ──
  if (customFilters) {
    const activeLabel = customFilters.find(f => f.value === activeFilter)?.label || customFilters[0]?.label;

    return (
      <div className="w-full sm:w-auto">
        {/* Mobile: select nativo */}
        <select
          className="sm:hidden w-full px-4 py-2.5 bg-[#1a1a1a] text-white text-sm rounded-lg border border-[#262626] focus:outline-none focus:border-primary-500 appearance-none cursor-pointer"
          value={activeFilter}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          {customFilters.map(filter => (
            <option key={filter.value} value={filter.value}>
              {filter.label}{showCounts && filter.count !== undefined ? ` (${filter.count})` : ""}
            </option>
          ))}
        </select>

        {/* Desktop: botones */}
        <div className="hidden sm:flex flex-wrap gap-3">
          {customFilters.map(filter => (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={`px-5 py-3 text-base rounded-lg font-medium transition-all ${
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
      </div>
    );
  }

  // ── MODO EVENTOS ──
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

  // Valor actual para el select mobile
  const currentMobileValue = isFeaturedActive
    ? "featured"
    : filters.status || "upcoming";

  const handleMobileChange = (e) => {
    const val = e.target.value;
    if (val === "featured") {
      handleFeaturedClick();
    } else {
      handleStatusChange(val);
    }
  };

  return (
    <div className="w-full sm:w-auto">
      {/* Mobile: select nativo */}
      <select
        className="sm:hidden w-full px-4 py-2.5 bg-[#1a1a1a] text-white text-sm rounded-lg border border-[#262626] focus:outline-none focus:border-primary-500 appearance-none cursor-pointer"
        value={currentMobileValue}
        onChange={handleMobileChange}
      >
        <option value="all">Todos</option>
        <option value="upcoming">Próximos Eventos</option>
        <option value="past">Eventos Pasados</option>
        <option value="featured">Destacados</option>
      </select>

      {/* Desktop: botones */}
      <div className="hidden sm:flex flex-wrap gap-3">
        <button
          onClick={() => handleStatusChange("all")}
          className={`px-5 py-3 text-base rounded-lg font-medium transition-all ${
            isActiveFilter("all")
              ? "bg-primary-600 text-white shadow-glow"
              : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
          }`}
        >
          Todos
        </button>

        <button
          onClick={() => handleStatusChange("upcoming")}
          className={`px-5 py-3 text-base rounded-lg font-medium transition-all ${
            isActiveFilter("upcoming")
              ? "bg-primary-600 text-white shadow-glow"
              : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
          }`}
        >
          Próximos Eventos
        </button>

        <button
          onClick={() => handleStatusChange("past")}
          className={`px-5 py-3 text-base rounded-lg font-medium transition-all ${
            isActiveFilter("past")
              ? "bg-primary-600 text-white shadow-glow"
              : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
          }`}
        >
          Eventos Pasados
        </button>

        <button
          onClick={handleFeaturedClick}
          className={`px-5 py-3 text-base rounded-lg font-medium transition-all flex items-center gap-2 ${
            isFeaturedActive
              ? "bg-primary-600 text-white shadow-glow"
              : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
          }`}
        >
          Destacados
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
