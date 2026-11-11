/**
 * Componente Pagination
 *
 * Paginación discreta y consistente para toda la web (admin y público).
 * No se renderiza nada si solo hay 1 página — por diseño, para no
 * ensuciar listados cortos con controles que no hacen falta.
 * Con muchas páginas muestra solo las cercanas: 1 … 7 8 9 … 20
 *
 * Uso típico (paginación en servidor):
 *   <Pagination page={pagination.page} pages={pagination.pages}
 *     total={pagination.total} onPageChange={(p) => setFilters(f => ({...f, page: p}))} />
 *
 * Uso típico (paginación en cliente, sobre un array ya cargado):
 *   const { pageItems, page, pages, setPage } = usePagination(items, 20);
 *   <Pagination page={page} pages={pages} total={items.length} onPageChange={setPage} />
 */

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Devuelve la lista de botones a mostrar: siempre la primera y la última
 * página, la actual y sus vecinas, y "…" para los huecos.
 * Ej. con 20 páginas y la 8 activa: 1 … 7 8 9 … 20
 */
const getPageItems = (page, pages) => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const items = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);

  if (start > 2) items.push("…");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < pages - 1) items.push("…");

  items.push(pages);
  return items;
};

const Pagination = ({ page, pages, total, onPageChange, itemLabel = "resultados" }) => {
  if (!pages || pages <= 1) return null;

  const goTo = (p) => {
    if (p < 1 || p > pages || p === page) return;
    onPageChange(p);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-4 border-t border-[#262626] text-sm">
      <span className="text-gray-500">
        Página {page} de {pages}
        {typeof total === "number" ? ` (${total} ${itemLabel})` : ""}
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="p-2 rounded-lg border border-[#262626] text-gray-400 hover:text-white hover:border-primary-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1">
          {getPageItems(page, pages).map((item, i) =>
            item === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-gray-600 select-none">
                …
              </span>
            ) : (
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
            ),
          )}
        </div>

        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= pages}
          aria-label="Página siguiente"
          className="p-2 rounded-lg border border-[#262626] text-gray-400 hover:text-white hover:border-primary-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
