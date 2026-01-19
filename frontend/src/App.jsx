import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import Filters from "./components/Filters";
import BookGrid from "./components/BookGrid";
import Pagination from "./components/Pagination";
import BookModal from "./components/BookModal";
import Settings from "./components/Settings";
import Reader from "./components/Reader";
import { useBooks, useScanStatus, useSettings } from "./hooks/useBooks";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    books,
    loading,
    page,
    pageSize,
    totalPages,
    total,
    stats,
    filters,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    handleFilterChange,
  } = useBooks();
  const { status: scanStatus, startScan, cancelScan } = useScanStatus();
  const { kindleEmail, saveKindleEmail } = useSettings();

  const [selectedBook, setSelectedBook] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [readingBook, setReadingBook] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Detectar si estamos en una ruta de libro
  useEffect(() => {
    const path = location.pathname;
    const bookMatch = path.match(/^\/book\/(\d+)$/);

    if (bookMatch) {
      const bookId = parseInt(bookMatch[1]);
      // Buscar el libro por ID
      fetchBookById(bookId);
    }
  }, [location.pathname]);

  // Función para obtener un libro por ID
  const fetchBookById = async (bookId) => {
    try {
      const response = await fetch(`/api/books/${bookId}`);
      if (response.ok) {
        const book = await response.json();
        setSelectedBook(book);
      } else {
        console.error("Libro no encontrado");
        // Redirigir a la página principal si el libro no existe
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Error al obtener el libro:", error);
      navigate("/", { replace: true });
    }
  };

  // Mostrar botón scroll cuando se baja
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
    // Actualizar la URL sin recargar la página
    navigate(`/book/${book.id}`, { replace: false });
  };

  const handleCloseModal = () => {
    setSelectedBook(null);
    // Volver a la página principal
    navigate("/", { replace: false });
  };

  const handleRead = (book) => {
    setSelectedBook(null);
    setReadingBook(book);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header
        stats={stats}
        scanStatus={scanStatus}
        onStartScan={startScan}
        onCancelScan={cancelScan}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Barra de búsqueda */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div className="max-w-xl flex-1">
            <SearchBar onSearch={handleSearch} />
          </div>
          {total > 0 && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {total.toLocaleString()} libros encontrados
            </p>
          )}
        </div>

        {/* Filtros */}
        <Filters onFilterChange={handleFilterChange} activeFilters={filters} />

        {/* Grid de libros */}
        <BookGrid
          books={books}
          loading={loading}
          onBookClick={handleBookClick}
        />

        {/* Paginación */}
        <Pagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </main>

      {/* Botón scroll to top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-3 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-all duration-300 z-40 ${
          showScrollTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="Volver arriba"
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
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>

      {/* Modal de detalle */}
      {selectedBook && (
        <BookModal
          book={selectedBook}
          onClose={handleCloseModal}
          onRead={handleRead}
          kindleEmail={kindleEmail}
        />
      )}

      {/* Configuración */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        kindleEmail={kindleEmail}
        onSaveKindleEmail={saveKindleEmail}
      />

      {/* Lector */}
      {readingBook && (
        <Reader book={readingBook} onClose={() => setReadingBook(null)} />
      )}
    </div>
  );
}
