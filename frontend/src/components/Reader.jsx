import { useEffect, useRef, useState } from "react";

// Funciones para guardar/cargar progreso en localStorage
const getStorageKey = (bookId) => `book-progress-${bookId}`;

const saveProgress = (bookId, cfi, percent) => {
  try {
    const progressData = {
      cfi,
      percent,
      timestamp: Date.now(),
      page: cfi, // Guardar también el CFI como referencia de página
    };

    localStorage.setItem(getStorageKey(bookId), JSON.stringify(progressData));

    // Debug: confirmar que se está guardando
    console.log(
      `Progreso guardado: ${percent}% - CFI: ${cfi.substring(0, 50)}...`,
    );
  } catch (e) {
    console.warn("No se pudo guardar el progreso:", e);
  }
};

const loadProgress = (bookId) => {
  try {
    const data = localStorage.getItem(getStorageKey(bookId));
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export default function Reader({ book, onClose }) {
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const bookRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [theme, setTheme] = useState("light");
  const [savedProgress, setSavedProgress] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const themes = {
    light: { bg: "#ffffff", text: "#1a1a1a" },
    dark: { bg: "#1f2937", text: "#e5e7eb" },
    sepia: { bg: "#f5e6c8", text: "#5c4b37" },
  };

  // Detectar cambio de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!book) return;

    let mounted = true;

    const loadBook = async () => {
      try {
        const saved = loadProgress(book.id);
        if (saved && saved.percent > 1) {
          setSavedProgress(saved);
          setShowResumePrompt(true);
        }

        const response = await fetch(`/api/books/${book.id}/download`);
        if (!response.ok) throw new Error("No se pudo descargar");

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const ePub = (await import("epubjs")).default;

        if (!mounted) return;

        const epubBook = ePub(arrayBuffer);
        bookRef.current = epubBook;

        const rendition = epubBook.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          spread: "none",
          flow: "scrolled-doc",
          allowScriptedContent: true,
        });

        renditionRef.current = rendition;

        rendition.themes.register("light", {
          body: { background: "#ffffff", color: "#1a1a1a" },
        });
        rendition.themes.register("dark", {
          body: { background: "#1f2937", color: "#e5e7eb" },
        });
        rendition.themes.register("sepia", {
          body: { background: "#f5e6c8", color: "#5c4b37" },
        });

        // Estilos responsive: 1 columna en móvil, 2 en desktop
        const mobile = window.innerWidth < 768;
        rendition.themes.default({
          body: {
            "font-family": "Georgia, serif !important",
            "line-height": "1.8 !important",
            padding: mobile
              ? "15px 20px !important"
              : "20px 60px 40px 60px !important",
            "column-count": mobile ? "1 !important" : "2 !important",
            "column-gap": "60px !important",
            "column-rule": "1px solid rgba(0,0,0,0.1) !important",
          },
          p: {
            "text-align": "justify !important",
            "text-indent": "1.5em !important",
            orphans: "3 !important",
            widows: "3 !important",
          },
          "h1, h2, h3": {
            "text-align": "center !important",
            "column-span": "all !important",
            "margin-top": "0.5em !important",
          },
          img: {
            "max-width": "100% !important",
            height: "auto !important",
            display: "block !important",
            margin: "20px auto !important",
          },
        });

        const isDark = document.documentElement.classList.contains("dark");
        rendition.themes.select(isDark ? "dark" : "light");
        setTheme(isDark ? "dark" : "light");

        await rendition.display();

        if (!mounted) return;
        setLoading(false);

        epubBook.loaded.navigation.then((nav) => {
          if (mounted) setToc(nav.toc || []);
        });

        epubBook.ready
          .then(() => {
            return epubBook.locations.generate(1600);
          })
          .then(() => {
            if (saved && saved.cfi && saved.percent > 1) {
              rendition.display(saved.cfi);
              setProgress(saved.percent);
            }

            rendition.on("relocated", (location) => {
              if (epubBook.locations && mounted) {
                const pct = epubBook.locations.percentageFromCfi(
                  location.start.cfi,
                );
                const percent = Math.round(pct * 100);

                // Guardar progreso SIEMPRE, no solo cuando cambia el porcentaje
                // Esto asegura que se guarde en cada página, incluso si el % no cambia
                saveProgress(book.id, location.start.cfi, percent);
                setProgress(percent);
              }
            });
          });
      } catch (err) {
        console.error("Error:", err);
        if (mounted) {
          setError("No se pudo cargar el libro");
          setLoading(false);
        }
      }
    };

    loadBook();

    return () => {
      mounted = false;
      if (bookRef.current) {
        bookRef.current.destroy();
        bookRef.current = null;
      }
    };
  }, [book]);

  useEffect(() => {
    renditionRef.current?.themes.select(theme);
  }, [theme]);

  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}%`);
  }, [fontSize]);

  const goPrev = () => renditionRef.current?.prev();
  const goNext = () => renditionRef.current?.next();

  const goToChapter = (href) => {
    renditionRef.current?.display(href);
    setShowToc(false);
  };

  const goToStart = () => {
    renditionRef.current?.display(0);
    setShowResumePrompt(false);
  };

  const handleProgressClick = (e) => {
    if (!bookRef.current?.locations) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const cfi = bookRef.current.locations.cfiFromPercentage(pct);
    if (cfi) renditionRef.current?.display(cfi);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!book) return null;

  const t = themes[theme];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: t.bg, color: t.text }}
    >
      {/* Header - Responsive */}
      <div
        className="flex items-center justify-between px-2 sm:px-4 py-2 border-b gap-2"
        style={{ borderColor: theme === "dark" ? "#374151" : "#e5e7eb" }}
      >
        {/* Izquierda: cerrar, índice, título */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-black/10 rounded-lg flex-shrink-0"
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
          <button
            onClick={() => setShowToc(!showToc)}
            className="p-1.5 sm:p-2 hover:bg-black/10 rounded-lg flex-shrink-0"
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
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </button>
          <span className="text-xs sm:text-sm font-medium truncate">
            {book.title}
          </span>
        </div>

        {/* Derecha: controles */}
        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          {/* Temas - siempre visibles */}
          <div className="flex gap-0.5 sm:gap-1">
            <button
              onClick={() => setTheme("light")}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border ${theme === "light" ? "ring-2 ring-blue-500" : ""}`}
            />
            <button
              onClick={() => setTheme("dark")}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-800 ${theme === "dark" ? "ring-2 ring-blue-500" : ""}`}
            />
            <button
              onClick={() => setTheme("sepia")}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-100 ${theme === "sepia" ? "ring-2 ring-blue-500" : ""}`}
            />
          </div>

          {/* Fuente - oculto en móvil muy pequeño */}
          <div className="hidden xs:flex items-center">
            <button
              onClick={() => setFontSize((s) => Math.max(70, s - 10))}
              className="px-1.5 sm:px-2 text-xs sm:text-sm hover:bg-black/10 rounded"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize((s) => Math.min(150, s + 10))}
              className="px-1.5 sm:px-2 text-xs sm:text-sm hover:bg-black/10 rounded"
            >
              A+
            </button>
          </div>

          {/* Progreso */}
          <span className="text-xs sm:text-sm w-8 sm:w-12 text-right">
            {progress}%
          </span>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* TOC - fullscreen en móvil */}
        {showToc && (
          <div
            className={`${isMobile ? "absolute inset-0 z-30" : "w-64 border-r"} overflow-y-auto flex-shrink-0`}
            style={{
              background: t.bg,
              borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
            }}
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Índice</h3>
                {isMobile && (
                  <button
                    onClick={() => setShowToc(false)}
                    className="p-1 hover:bg-black/10 rounded"
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
                )}
              </div>
              {toc.map((ch, i) => (
                <button
                  key={i}
                  onClick={() => goToChapter(ch.href)}
                  className="block w-full text-left text-sm py-2 px-2 hover:bg-black/5 rounded truncate"
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Visor */}
        <div className="flex-1 relative overflow-hidden">
          {/* Botones navegación - más pequeños en móvil */}
          <button
            onClick={goPrev}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
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

          <button
            onClick={goNext}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
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

          {loading && (
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ background: t.bg }}
            >
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}

          {error && (
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ background: t.bg }}
            >
              <div className="text-center p-4">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {/* Prompt continuar - responsive */}
          {showResumePrompt && savedProgress && !loading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 border mx-4">
              <span className="text-xs sm:text-sm text-center">
                Continuar desde {savedProgress.percent}%?
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResumePrompt(false)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs sm:text-sm hover:bg-blue-600"
                >
                  Sí
                </button>
                <button
                  onClick={goToStart}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs sm:text-sm hover:bg-gray-300"
                >
                  Inicio
                </button>
              </div>
            </div>
          )}

          <div ref={viewerRef} className="w-full h-full overflow-auto" />
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="px-3 sm:px-4 py-2 border-t"
        style={{ borderColor: theme === "dark" ? "#374151" : "#e5e7eb" }}
      >
        <div
          className="h-1.5 bg-black/10 rounded-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
