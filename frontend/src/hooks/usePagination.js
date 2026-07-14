import { useState, useMemo, useEffect } from "react";

/**
 * usePagination
 *
 * Pagina un array ya cargado en memoria (para endpoints que no
 * soportan page/limit en el backend). Vuelve a la página 1
 * automáticamente si la lista cambia (nuevo filtro, búsqueda, etc.)
 * y la página actual deja de tener sentido.
 *
 * @param {Array} items - Lista completa ya filtrada/ordenada
 * @param {Number} perPage - Elementos por página
 * @returns {{ pageItems, page, pages, total, setPage }}
 */
export const usePagination = (items = [], perPage = 20) => {
  const [page, setPage] = useState(1);

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));

  // Si la lista se acorta (filtro/búsqueda) y la página actual ya no
  // existe, volvemos a la última página válida.
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [pages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, page, perPage]);

  return { pageItems, page, pages, total, setPage };
};

export default usePagination;