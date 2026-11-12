// Paginación de toda la web: centrada, máximo 5 números y nada si hay una sola página

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const MAX_NUMEROS = 5;

// Hasta 5 páginas seguidas con la actual en medio: 8 de 20 → 6 7 8 9 10
const getPageNumbers = (page, pages) => {
  const count = Math.min(MAX_NUMEROS, pages);
  let start = Math.max(1, page - Math.floor(count / 2));
  start = Math.min(start, pages - count + 1);
  return Array.from({ length: count }, (_, i) => start + i);
};

const arrowClass =
  "p-2 rounded-lg border border-[#262626] text-gray-400 hover:text-white hover:border-primary-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors";

const Pagination = ({ page, pages, total, onPageChange, itemLabel = "resultados" }) => {
  if (!pages || pages <= 1) return null;

  const goTo = (p) => {
    if (p < 1 || p > pages || p === page) return;
    onPageChange(p);
  };

  // Primera y última solo si hay más de 5 páginas
  const showEdges = pages > MAX_NUMEROS;

  return (
    <div className="flex flex-col items-center gap-3 mt-6 pt-4 border-t border-[#262626] text-sm">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {showEdges && (
          <button
            onClick={() => goTo(1)}
            disabled={page <= 1}
            aria-label="Primera página"
            className={arrowClass}
          >
            <ChevronsLeft size={16} />
          </button>
        )}
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className={arrowClass}
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers(page, pages).map((item) => (
            <button
              key={item}
              onClick={() => goTo(item)}
              aria-current={item === page ? "page" : undefined}
              className={`min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-medium transition-colors ${
                item === page
                  ? "bg-primary-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= pages}
          aria-label="Página siguiente"
          className={arrowClass}
        >
          <ChevronRight size={16} />
        </button>
        {showEdges && (
          <button
            onClick={() => goTo(pages)}
            disabled={page >= pages}
            aria-label="Última página"
            className={arrowClass}
          >
            <ChevronsRight size={16} />
          </button>
        )}
      </div>

      <span className="text-gray-500 text-center">
        Página {page} de {pages}
        {typeof total === "number" ? ` (${total} ${itemLabel})` : ""}
      </span>
    </div>
  );
};

export default Pagination;
