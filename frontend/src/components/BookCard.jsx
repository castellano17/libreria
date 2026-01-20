import { useState } from "react";

const PLACEHOLDER_COVER =
  "data:image/svg+xml," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
    <rect fill="#374151" width="200" height="300"/>
    <text x="100" y="140" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="16">📚</text>
    <text x="100" y="160" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="11">Sin portada</text>
  </svg>
`);

export default function BookCard({
  book,
  onClick,
  favorites,
  onToggleFavorite,
}) {
  const [imgError, setImgError] = useState(false);

  // Limpiar título de prefijos no deseados
  const cleanTitle = book.title?.replace(/^\[CORRUPTO\]\s*/, "") || book.title;

  const isFavorite = favorites.includes(book.id);

  const coverUrl =
    book.cover_path && !imgError
      ? `/covers/${book.cover_path}`
      : PLACEHOLDER_COVER;

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(book.id);
  };

  return (
    <article className="book-card group" onClick={onClick}>
      <div className="aspect-[2/3] relative overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={coverUrl}
          alt={`Portada de ${cleanTitle}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Botón de favorito */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors z-10"
          aria-label={
            isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
          }
        >
          <svg
            className={`w-4 h-4 transition-colors ${
              isFavorite ? "text-red-500 fill-current" : "text-white"
            }`}
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-2 mb-1">
          <svg
            className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
            {cleanTitle}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
            {book.author}
          </p>
        </div>

        {/* Indicadores de estado - solo para libros válidos */}
        <div className="flex items-center gap-2 mt-2 text-xs">
          {!book.cover_path && (
            <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
              📚 Sin portada
            </span>
          )}
          {!book.description && (
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
              📝 Sin descripción
            </span>
          )}
        </div>

        {book.file_size && (
          <div className="flex items-center gap-2 mt-2">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {(book.file_size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
        )}

        {/* Contador de descargas */}
        {book.download_count > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {book.download_count}{" "}
              {book.download_count === 1 ? "descarga" : "descargas"}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
