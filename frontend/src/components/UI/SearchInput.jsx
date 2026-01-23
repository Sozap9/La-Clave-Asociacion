import React, { useEffect, useState, useRef } from "react";

const SearchInput = ({
  value = "",
  onChange,
  onDebounced, // optional: called after debounce ms with the value
  onClear,
  placeholder = "Buscar...",
  debounceMs = 0,
}) => {
  const [internal, setInternal] = useState(value);

  useEffect(() => {
    setInternal(value || "");
  }, [value]);

  const timeoutRef = useRef(null);

  useEffect(() => {
    if (debounceMs > 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onChange && onChange(internal);
        onDebounced && onDebounced(internal);
        timeoutRef.current = null;
      }, debounceMs);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
    // no debounce
    onChange && onChange(internal);
    onDebounced && onDebounced(internal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internal, debounceMs]);

  const handleClear = () => {
    setInternal("");
    if (onClear) onClear();
    if (debounceMs === 0) onChange && onChange("");
    if (debounceMs === 0) onDebounced && onDebounced("");
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        className="w-full px-4 py-3 pl-12 pr-12 bg-[#1a1a1a]/60 border border-primary-500/30 rounded-lg \
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
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          aria-label="clear-search"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchInput;
