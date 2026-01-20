import BookCard from "./BookCard";

export default function BookGrid({
  books,
  loading,
  onBookClick,
  favorites,
  onToggleFavorite,
}) {
  if (!books.length && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
        <svg
          className="w-16 h-16 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <p className="text-lg font-medium">No se encontraron libros</p>
        <p className="text-sm mt-1">
          Intenta con otra búsqueda o inicia un escaneo
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6">
        {books.map((book, index) => (
          <BookCard
            key={`${book.id}-${index}`}
            book={book}
            onClick={() => onBookClick(book)}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      {loading && books.length === 0 && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Cargando...</span>
          </div>
        </div>
      )}
    </>
  );
}
