import FilterBar from "../UI/FilterBar";
import SearchInput from "../UI/SearchInput";

const EventFilters = ({ filters, onFilterChange }) => {
  const handleSearchChange = (val) => {
    onFilterChange({ ...filters, search: val });
  };

  return (
    <div className="mb-12">
      {/* Filtros a la izquierda, búsqueda a la derecha */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-8">
        <FilterBar filters={filters} onFilterChange={onFilterChange} />

        <div className="w-full sm:flex-1 sm:max-w-md sm:ml-auto">
          <SearchInput
            value={filters.search || ""}
            onChange={handleSearchChange}
            onClear={() => onFilterChange({ ...filters, search: "" })}
            placeholder="Buscar eventos por nombre..."
            debounceMs={0}
          />
        </div>
      </div>
    </div>
  );
};

export default EventFilters;
