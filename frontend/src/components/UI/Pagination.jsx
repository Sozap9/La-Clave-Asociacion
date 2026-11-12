/**
 * Componente Pagination
 *
 * Paginación discreta y consistente para toda la web (admin y público).
 * No se renderiza nada si solo hay 1 página — por diseño, para no
 * ensuciar listados cortos con controles que no hacen falta.
 * Va centrada y muestra como mucho 5 números, con la página actual en
 * medio: 6 7 8 9 10. Con más de 5 páginas añade botones de primera y última.
 *
 * Uso típico (paginación en servidor):
 *   <Pagination page={pagination.page} pages={pagination.pages}
 *     total={pagination.total} onPageChange={(p) => setFilters(f => ({...f, page: p}))} />
 *
 * Uso típico (paginación en cliente, sobre un array ya cargado):
 *   const { pageItems, page, pages, setPage } = usePagination(items, 20);
 *   <Pagination page={page} pages={pages} total={items.length} onPageChange={setPage} />
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

// Máximo de números (casillas) que se muestran a la vez
const MAX_NUMEROS = 5;

/**
 * Devuelve los números de página a mostrar: como mucho 5 seguidos,
 * con la página actual en el centro siempre que se pueda.
 * Ej. con 20 páginas y la 8 activa: 6 7 8 9 10
 *     con 20 páginas y la 1 activa: 1 2 3 4 5
 *     con 20 páginas y la 20 activa: 16 17 18 19 20
 */
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

  // Los botones de primera/última página solo hacen falta si hay más
  // páginas de las que caben en las 5 casillas
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
