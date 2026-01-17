import { useState, useEffect } from "react";

export default function Filters({ onFilterChange, activeFilters }) {
  const [genres, setGenres] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Cargar opciones de filtros
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [genresRes, languagesRes, publishersRes] = await Promise.all([
          fetch("/api/filters/genres"),
          fetch("/api/filters/languages"),
          fetch("/api/filters/publishers"),
        ]);

        if (genresRes.ok) setGenres(await genresRes.json());
        if (languagesRes.ok) setLanguages(await languagesRes.json());
        if (publishersRes.ok) setPublishers(await publishersRes.json());
      } catch (err) {
        console.error("Error cargando filtros:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, []);

  const handleChange = (key, value) => {
    onFilterChange({ ...activeFilters, [key]: value || null });
  };

  const clearFilters = () => {
    onFilterChange({ genre: null, language: null, publisher: null });
  };

  const hasActiveFilters =
    activeFilters.genre || activeFilters.language || activeFilters.publisher;
  const activeCount = [
    activeFilters.genre,
    activeFilters.language,
    activeFilters.publisher,
  ].filter(Boolean).length;

  // Mapeo de códigos de idioma a nombres
  const languageNames = {
    es: "Español",
    en: "English",
    fr: "Français",
    de: "Deutsch",
    it: "Italiano",
    pt: "Português",
    ca: "Català",
    gl: "Galego",
    eu: "Euskara",
  };

  const getLanguageName = (code) => {
    if (!code) return code;
    const lower = code.toLowerCase().trim();
    return languageNames[lower] || code;
  };

  return (
    <div className="mb-4">
      {/* Botón toggle en móvil */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="sm:hidden flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm w-full justify-center mb-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filtros {activeCount > 0 && `(${activeCount})`}
        <svg
          className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Filtros */}
      <div
        className={`${showFilters ? "block" : "hidden"} sm:flex flex-wrap items-center gap-2 sm:gap-3`}
      >
        {/* Género */}
        <div className="flex-1 min-w-[140px] sm:min-w-[160px] sm:max-w-[200px]">
          <select
            value={activeFilters.genre || ""}
            onChange={(e) => handleChange("genre", e.target.value)}
            disabled={loading}
            className="w-full appearance-none px-3 py-2 pr-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-0 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 0.5rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.25em 1.25em",
            }}
          >
            <option value="">Todos los géneros</option>
            {genres.map((g) => (
              <option key={g.value} value={g.value}>
                {g.value} ({g.count})
              </option>
            ))}
          </select>
        </div>

        {/* Idioma */}
        <div className="flex-1 min-w-[140px] sm:min-w-[160px] sm:max-w-[200px]">
          <select
            value={activeFilters.language || ""}
            onChange={(e) => handleChange("language", e.target.value)}
            disabled={loading}
            className="w-full appearance-none px-3 py-2 pr-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-0 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 0.5rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.25em 1.25em",
            }}
          >
            <option value="">Todos los idiomas</option>
            {languages.map((l) => (
              <option key={l.value} value={l.value}>
                {getLanguageName(l.value)} ({l.count})
              </option>
            ))}
          </select>
        </div>

        {/* Editorial */}
        <div className="flex-1 min-w-[140px] sm:min-w-[160px] sm:max-w-[200px]">
          <select
            value={activeFilters.publisher || ""}
            onChange={(e) => handleChange("publisher", e.target.value)}
            disabled={loading}
            className="w-full appearance-none px-3 py-2 pr-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-0 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 truncate"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 0.5rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.25em 1.25em",
            }}
          >
            <option value="">Todas las editoriales</option>
            {publishers.map((p) => (
              <option key={p.value} value={p.value}>
                {p.value.length > 30
                  ? p.value.substring(0, 30) + "..."
                  : p.value}{" "}
                ({p.count})
              </option>
            ))}
          </select>
        </div>

        {/* Botón limpiar */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
