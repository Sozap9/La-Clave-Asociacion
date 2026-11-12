import React, { useEffect, useState, useRef } from "react";

// Buscador: avisa al dejar de escribir (debounceMs) o al pulsar Enter.
// Guarda el texto dentro para no perder letras si el padre tarda.
const SearchInput = ({
  value = "",
  onChange,
  onDebounced,
  onClear,
  placeholder = "Buscar...",
  debounceMs = 0,
}) => {
  const [internal, setInternal] = useState(value);
  const timeoutRef = useRef(null);
  // Último valor enviado, para no repetir
  const lastSentRef = useRef(value || "");

  // Sincroniza si el padre cambia el valor
  useEffect(() => {
    setInternal(value || "");
    lastSentRef.current = value || "";
  }, [value]);

  const send = (val) => {
    if (val === lastSentRef.current) return;
    lastSentRef.current = val;
    onChange && onChange(val);
    onDebounced && onDebounced(val);
  };

  useEffect(() => {
    if (debounceMs > 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        send(internal);
        timeoutRef.current = null;
      }, debounceMs);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
    send(internal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internal, debounceMs]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      send(internal);
    }
  };

  const handleClear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setInternal("");
    if (onClear) onClear();
    send("");
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        onKeyDown={handleKeyDown}
        enterKeyHint="search"
        className="w-full px-4 py-3 pl-12 pr-12 bg-[#1a1a1a]/60 border border-[#262626] rounded-lg \
                  text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 \
                  focus:ring-2 focus:ring-primary-500/20 backdrop-blur-sm transition-all"
      />

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

      {internal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          aria-label="Borrar búsqueda"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchInput;
