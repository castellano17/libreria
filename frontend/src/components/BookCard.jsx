import { useState } from "react";

const PLACEHOLDER_COVER =
  "data:image/svg+xml," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
    <rect fill="#1f2937" width="200" height="300"/>
    <text x="100" y="150" text-anchor="middle" fill="#6b7280" font-family="system-ui" font-size="14">Sin portada</text>
  </svg>
`);

export default function BookCard({ book, onClick }) {
  const [imgError, setImgError] = useState(false);
  const coverUrl =
    book.cover_path && !imgError
      ? `/covers/${book.cover_path}`
      : PLACEHOLDER_COVER;

  return (
    <article className="book-card group" onClick={onClick}>
      <div className="aspect-[2/3] relative overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={coverUrl}
          alt={`Portada de ${book.title}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
            {book.title}
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
      </div>
    </article>
  );
}
