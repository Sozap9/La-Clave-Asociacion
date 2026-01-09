import React from "react";
import { Star } from "lucide-react";

const FilterBar = ({ filters, onFilterChange }) => {
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
        <Star size={18} fill={isFeaturedActive ? "currentColor" : "none"} />
        Destacados
      </button>
    </div>
  );
};

export default FilterBar;
