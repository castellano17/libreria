import { useState, useEffect } from "react";

const PLACEHOLDER_COVER =
  "data:image/svg+xml," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
    <rect fill="#1f2937" width="200" height="300"/>
    <text x="100" y="150" text-anchor="middle" fill="#6b7280" font-family="system-ui" font-size="14">Sin portada</text>
  </svg>
`);

export default function BookModal({
  book,
  onClose,
  onRead,
  kindleEmail,
  favorites,
  onToggleFavorite,
}) {
  const [imgError, setImgError] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Limpiar título de prefijos no deseados
  const cleanTitle =
    book?.title?.replace(/^\[CORRUPTO\]\s*/, "") || book?.title;

  const isFavorite = favorites?.includes(book?.id);

  // Animación de entrada
  useEffect(() => {
    if (book) {
      requestAnimationFrame(() => setIsVisible(true));
    }
  }, [book]);

  // Animación de salida
  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  if (!book && !isClosing) return null;

  const coverUrl =
    book?.cover_path && !imgError
      ? `/covers/${book.cover_path}`
      : PLACEHOLDER_COVER;

  const formatSize = (bytes) => {
    if (!bytes) return "Desconocido";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Desconocida";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDownload = () => {
    window.open(`/api/books/${book.id}/download`, "_blank");
  };

  const handleSendToKindle = async () => {
    if (!kindleEmail) {
      setMessage({
        type: "error",
        text: "Configura tu email de Kindle primero",
      });
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/books/${book.id}/send-kindle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: kindleEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Enviado a Kindle correctamente" });
      } else {
        setMessage({ type: "error", text: data.detail || "Error al enviar" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error de conexión" });
    } finally {
      setSending(false);
    }
  };

  const handleShare = async () => {
    // Crear URL limpia SOLO con ID del libro (sin título)
    const bookUrl = `${window.location.origin}/book/${book.id}`;

    const shareData = {
      title: cleanTitle,
      text: `${cleanTitle} - ${book.author}`,
      url: bookUrl,
    };

    // Usar Web Share API nativo SIEMPRE que esté disponible
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        // Éxito - no mostrar mensaje, el navegador maneja la UI
        return;
      } catch (err) {
        if (err.name === "AbortError") {
          // Usuario canceló - no hacer nada
          return;
        }
        // Si hay error, continuar con fallback
        console.error("Error with Web Share API:", err);
      }
    }

    // Fallback: copiar al portapapeles SOLO si Web Share API no existe o falló
    const fullShareText = `${cleanTitle} - ${book.author}\n${bookUrl}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullShareText);
      } else {
        // Método legacy
        const textArea = document.createElement("textarea");
        textArea.value = fullShareText;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error("execCommand failed");
        }
      }

      setMessage({ type: "success", text: "Enlace copiado al portapapeles" });
    } catch (err) {
      console.error("Error copying to clipboard:", err);
      setMessage({
        type: "info",
        text: `Copia manualmente: ${fullShareText}`,
      });
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-all duration-200 ${
        isVisible ? "bg-black/70 backdrop-blur-sm" : "bg-black/0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl transition-all duration-200 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar - siempre visible */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
          aria-label="Cerrar"
        >
          <svg
            className="w-5 h-5"
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
        </button>

        <div className="flex flex-col sm:flex-row max-h-[95vh] sm:max-h-[90vh]">
          {/* Portada */}
          <div className="sm:w-1/3 bg-gray-100 dark:bg-gray-800 p-4 sm:p-6 flex items-center justify-center flex-shrink-0">
            <img
              src={coverUrl}
              alt={cleanTitle}
              className="max-h-48 sm:max-h-64 md:max-h-80 rounded-lg shadow-lg object-contain"
              onError={() => setImgError(true)}
            />
          </div>

          {/* Detalles */}
          <div className="sm:w-2/3 p-4 sm:p-6 overflow-y-auto flex-1">
            {/* Título */}
            <div className="flex items-start gap-2 sm:gap-3 mb-2 pr-8">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mt-0.5 flex-shrink-0"
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
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white line-clamp-2">
                {cleanTitle}
              </h2>
            </div>

            {/* Autor */}
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
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
              <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400">
                {book?.author}
              </p>
            </div>

            {/* Metadatos */}
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-xs sm:text-sm">
              {book?.publisher && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span className="text-gray-500 dark:text-gray-400 w-16 sm:w-20">
                    Editorial
                  </span>
                  <span className="text-gray-900 dark:text-white truncate">
                    {book.publisher}
                  </span>
                </div>
              )}
              {book?.language && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                  <span className="text-gray-500 dark:text-gray-400 w-16 sm:w-20">
                    Idioma
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {book.language}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 sm:gap-3">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
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
                <span className="text-gray-500 dark:text-gray-400 w-16 sm:w-20">
                  Tamaño
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatSize(book?.file_size)}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-gray-500 dark:text-gray-400 w-16 sm:w-20">
                  Añadido
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatDate(book?.created_at)}
                </span>
              </div>
            </div>

            {/* Descripción - con scroll interno y responsive */}
            {book?.description && (
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Descripción
                  </h3>
                </div>
                <div className="max-h-20 sm:max-h-32 overflow-y-auto pl-6 sm:pl-7">
                  <div
                    className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: book.description
                        .replace(/<p>/g, "")
                        .replace(/<\/p>/g, "<br><br>")
                        .replace(/<br><br>$/, ""),
                    }}
                  />
                </div>
              </div>
            )}

            {/* Mensaje */}
            {message && (
              <div
                className={`mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${
                  message.type === "success"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Botones - 2x3 en móvil con favorito */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg sm:rounded-xl text-sm font-medium transition-colors"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span className="hidden xs:inline">Descargar</span>
                <span className="xs:hidden">Bajar</span>
              </button>

              <button
                onClick={handleSendToKindle}
                disabled={sending}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg sm:rounded-xl text-sm font-medium transition-colors"
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                {sending ? "..." : "Kindle"}
              </button>

              <button
                onClick={() => onRead(book)}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg sm:rounded-xl text-sm font-medium transition-colors"
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Leer
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg sm:rounded-xl text-sm font-medium transition-colors"
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span className="hidden xs:inline">Compartir</span>
                <span className="xs:hidden">Share</span>
              </button>

              {/* Botón favorito - ocupa 2 columnas */}
              <button
                onClick={() => onToggleFavorite(book.id)}
                className={`col-span-2 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-medium transition-colors ${
                  isFavorite
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                }`}
              >
                <svg
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                    isFavorite ? "fill-current" : ""
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
                {isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
