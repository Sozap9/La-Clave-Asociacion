// Filtros: <select> nativo en móvil y desplegable en escritorio

import React, { useState, useRef, useEffect } from "react";
import { Filter } from "lucide-react";

const FilterBar = ({
  filters,
  onFilterChange,
  customFilters,
  activeFilter,
  showCounts = false,
  includeCancelled = false,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Se cierra al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Modo genérico (galería)
  if (customFilters) {
    const activeLabel =
      customFilters.find((f) => f.value === activeFilter)?.label ||
      customFilters[0]?.label;

    return (
      <div className="w-full sm:w-auto" ref={containerRef}>
        {/* Móvil */}
        <select
          className="sm:hidden w-full px-4 py-2.5 bg-[#1a1a1a] text-white text-sm rounded-lg border border-[#262626] focus:outline-none focus:border-primary-500 appearance-none cursor-pointer"
          value={activeFilter}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          {customFilters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
              {showCounts && filter.count !== undefined ? ` (${filter.count})` : ""}
            </option>
          ))}
        </select>

        {/* Escritorio */}
        <div className="hidden sm:block relative">
          <button
            onClick={() => setOpen((v) => !v)}
            title={activeLabel}
            aria-label="Filtrar"
            className={`flex items-center justify-center w-9 h-9 transition-colors ${
              open ? "text-primary-300" : "text-gray-500 hover:text-primary-300"
            }`}
          >
            <Filter size={19} />
          </button>

          {open && (
            <div className="absolute z-20 mt-2 w-56 bg-[#1a1a1a] border border-[#262626] rounded-lg shadow-lg overflow-hidden">
              {customFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => {
                    onFilterChange(filter.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3 text-base font-medium transition-colors ${
                    activeFilter === filter.value
                      ? "bg-primary-600 text-white"
                      : "text-gray-300 hover:bg-[#2a2a2a]"
                  }`}
                >
                  {filter.label}
                  {showCounts && filter.count !== undefined && ` (${filter.count})`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modo eventos
  const handleStatusChange = (status) => {
    onFilterChange({ ...filters, status, featured: undefined });
    setOpen(false);
  };

  const handleFeaturedClick = () => {
    onFilterChange({ ...filters, status: undefined, featured: true });
    setOpen(false);
  };

  const isActiveFilter = (filterStatus) => {
    return filters.status === filterStatus && !filters.featured;
  };

  const isFeaturedActive = filters.featured === true;

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

  const eventOptions = [
    { value: "all", label: "Todos" },
    { value: "upcoming", label: "Próximos Eventos" },
    { value: "past", label: "Eventos Pasados" },
    { value: "featured", label: "Destacados" },
    ...(includeCancelled ? [{ value: "cancelled", label: "Cancelados" }] : []),
  ];

  const activeEventLabel =
    eventOptions.find((o) => o.value === currentMobileValue)?.label || "Todos";

  return (
    <div className="w-full sm:w-auto" ref={containerRef}>
      {/* Móvil */}
      <select
        className="sm:hidden w-full px-4 py-2.5 bg-[#1a1a1a] text-white text-sm rounded-lg border border-[#262626] focus:outline-none focus:border-primary-500 appearance-none cursor-pointer"
        value={currentMobileValue}
        onChange={handleMobileChange}
      >
        <option value="all">Todos</option>
        <option value="upcoming">Próximos Eventos</option>
        <option value="past">Eventos Pasados</option>
        <option value="featured">Destacados</option>
        {includeCancelled && <option value="cancelled">Cancelados</option>}
      </select>

      {/* Escritorio */}
      <div className="hidden sm:block relative">
        <button
          onClick={() => setOpen((v) => !v)}
          title={activeEventLabel}
          aria-label="Filtrar"
          className={`flex items-center justify-center w-9 h-9 transition-colors ${
            open ? "text-primary-300" : "text-gray-500 hover:text-primary-300"
          }`}
        >
          <Filter size={19} />
        </button>

        {open && (
          <div className="absolute z-20 mt-2 w-56 bg-[#1a1a1a] border border-[#262626] rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => handleStatusChange("all")}
              className={`w-full text-left px-5 py-3 text-base font-medium transition-colors ${
                isActiveFilter("all")
                  ? "bg-primary-600 text-white"
                  : "text-gray-300 hover:bg-[#2a2a2a]"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => handleStatusChange("upcoming")}
              className={`w-full text-left px-5 py-3 text-base font-medium transition-colors ${
                isActiveFilter("upcoming")
                  ? "bg-primary-600 text-white"
                  : "text-gray-300 hover:bg-[#2a2a2a]"
              }`}
            >
              Próximos Eventos
            </button>
            <button
              onClick={() => handleStatusChange("past")}
              className={`w-full text-left px-5 py-3 text-base font-medium transition-colors ${
                isActiveFilter("past")
                  ? "bg-primary-600 text-white"
                  : "text-gray-300 hover:bg-[#2a2a2a]"
              }`}
            >
              Eventos Pasados
            </button>
            <button
              onClick={handleFeaturedClick}
              className={`w-full text-left px-5 py-3 text-base font-medium transition-colors ${
                isFeaturedActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-300 hover:bg-[#2a2a2a]"
              }`}
            >
              Destacados
            </button>
            {includeCancelled && (
              <button
                onClick={() => handleStatusChange("cancelled")}
                className={`w-full text-left px-5 py-3 text-base font-medium transition-colors ${
                  isActiveFilter("cancelled")
                    ? "bg-primary-600 text-white"
                    : "text-gray-300 hover:bg-[#2a2a2a]"
                }`}
              >
                Cancelados
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;