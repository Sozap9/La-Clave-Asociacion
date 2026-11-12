import { useState, useMemo, useEffect } from "react";

// Pagina en el cliente un array ya cargado (endpoints sin page/limit)
export const usePagination = (items = [], perPage = 20) => {
  const [page, setPage] = useState(1);

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));

  // Si la lista se acorta, se vuelve a la última página que exista
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