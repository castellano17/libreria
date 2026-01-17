export default function Pagination({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  const pageSizes = [5, 10, 20, 30, 50, 100];

  // Generar páginas visibles: primera, última, y cercanas a la actual
  const getVisiblePages = () => {
    const pages = [];
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const siblings = isMobile ? 1 : 2;

    // Siempre mostrar página 1
    pages.push(1);

    // Páginas alrededor de la actual
    const start = Math.max(2, page - siblings);
    const end = Math.min(totalPages - 1, page + siblings);

    // Agregar "..." si hay gap después de 1
    if (start > 2) {
      pages.push("...");
    }

    // Agregar páginas del rango
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    // Agregar "..." si hay gap antes de la última
    if (end < totalPages - 1) {
      pages.push("...");
    }

    // Siempre mostrar última página
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 mt-6 sm:mt-8 pb-6 sm:pb-8 px-2">
      {/* Selector de cantidad */}
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <span className="text-gray-500 dark:text-gray-400">Mostrar</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="appearance-none px-2 sm:px-3 py-1 sm:py-1.5 pr-6 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-0 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: "right 0.25rem center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "1.25em 1.25em",
          }}
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="text-gray-500 dark:text-gray-400">por página</span>
      </div>

      {/* Paginación */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {/* Botón anterior */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Anterior"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Números de página */}
        {visiblePages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">
              ...
            </span>
          ) : (
            <button
              key={`page-${p}`}
              onClick={() => onPageChange(p)}
              className={`h-8 sm:h-10 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                p === page
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {p.toLocaleString()}
            </button>
          ),
        )}

        {/* Botón siguiente */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Siguiente"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Info de página */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Página {page.toLocaleString()} de {totalPages.toLocaleString()}
      </p>
    </div>
  );
}
