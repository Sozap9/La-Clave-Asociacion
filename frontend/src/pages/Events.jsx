import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { getAllEvents } from "../api/eventsApi";
import EventCard from "../components/events/EventCard";
import FilterBar from "../components/UI/FilterBar";
import SearchInput from "../components/UI/SearchInput";
import EventDetail from "../components/events/EventDetail";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";
import { useLanguage } from "../context/LanguageContext";

const Events = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "upcoming",
    search: "",
    featured: undefined,
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    setLoading(true);
    setError("");

    try {
      const queryParams = {};

      if (filters.featured) {
        queryParams.featured = "true";
      } else {
        if (filters.status) {
          queryParams.status = filters.status;
        }
      }

      if (filters.search) {
        queryParams.search = filters.search;
      }

      const result = await getAllEvents(queryParams);

      if (result.success) {
        setEvents(result.data || []);
      } else {
        setError(result.message || t('events.errorConnection'));
        setEvents([]);
      }
    } catch (err) {
      setError(t('events.errorConnection'));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (event) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const getEmptyMessage = () => {
    if (filters.featured) return t('events.empty.featured');
    if (filters.status === "upcoming") return t('events.empty.upcoming');
    if (filters.status === "past") return t('events.empty.past');
    if (filters.status === "all") return t('events.empty.all');
    return t('events.empty.default');
  };

  return (
    <div className="min-h-screen py-20 px-4 bg-black">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-gradient mb-2 text-2xl md:text-4xl">{t('events.title')}</h1>
          <p className="text-gray-400 text-sm md:text-lg">
            {t('events.subtitle')}
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
            <FilterBar
              filters={{ status: filters.status, featured: filters.featured }}
              onFilterChange={(f) => setFilters(f)}
            />

            <div className="w-full sm:flex-1 sm:max-w-md sm:ml-auto">
              <SearchInput
                value={filters.search}
                onChange={(val) => setFilters({ ...filters, search: val })}
                onDebounced={(val) =>
                  setFilters((s) => ({ ...s, search: val }))
                }
                onClear={() => setFilters({ ...filters, search: "" })}
                placeholder={t('events.searchPlaceholder')}
                debounceMs={350}
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && <Loader size="lg" />}

        {/* Grid de eventos */}
        {!loading && events.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetail={() => handleViewDetail(event)}
              />
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!loading && events.length === 0 && !error && (
          <EmptyState
            icon={Calendar}
            title={t('events.notFound')}
            subtitle={
              <>
                {getEmptyMessage()}
                {filters.search && (
                  <span className="block text-gray-500 text-xs mt-2">
                    {t('events.trySearch')}
                  </span>
                )}
              </>
            }
          />
        )}
      </div>

      {/* Modal de detalle */}
      <EventDetail
        event={selectedEvent}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
};

export default Events;