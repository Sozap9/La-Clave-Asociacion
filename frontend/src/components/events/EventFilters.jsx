import FilterBar from "../UI/FilterBar";
import SearchInput from "../UI/SearchInput";

const EventFilters = ({ filters, onFilterChange }) => {
  const handleSearchChange = (val) => {
    onFilterChange({ ...filters, search: val });
  };

  return (
    <div className="mb-12">
      {/* Filtros a la izquierda, búsqueda a la derecha */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <FilterBar filters={filters} onFilterChange={onFilterChange} />

        <div className="flex-1 max-w-md ml-auto">
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
