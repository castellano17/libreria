import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import Filters from "./components/Filters";
import BookGrid from "./components/BookGrid";
import Pagination from "./components/Pagination";
import BookModal from "./components/BookModal";
import Settings from "./components/Settings";
import Reader from "./components/Reader";
import AuthModal from "./components/AuthModal";
import { useBooks, useScanStatus } from "./hooks/useBooks";
import { useSupabaseFavorites } from "./hooks/useSupabaseFavorites";
import { useUserSettings } from "./hooks/useUserSettings";
import { useReadingProgress } from "./hooks/useReadingProgress";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

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
  const { settings, saveKindleEmail } = useUserSettings();
  const { favorites, toggleFavorite } = useSupabaseFavorites();
  const { progress, updateProgress, getBookProgress } = useReadingProgress();

  const [selectedBook, setSelectedBook] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
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

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario logueado, mostrar pantalla de login
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header
          stats={stats}
          scanStatus={scanStatus}
          onStartScan={startScan}
          onCancelScan={cancelScan}
          onOpenSettings={() => setShowSettings(true)}
          onOpenAuth={() => setShowAuth(true)}
        />

        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto text-blue-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Bienvenido a tu Biblioteca
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Accede a miles de libros digitales
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Para acceder a la biblioteca necesitas iniciar sesión
              </p>
              <button
                onClick={() => setShowAuth(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </main>

        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header
        stats={stats}
        scanStatus={scanStatus}
        onStartScan={startScan}
        onCancelScan={cancelScan}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAuth={() => setShowAuth(true)}
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
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
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
          kindleEmail={settings.kindleEmail}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* Modal de autenticación */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />

      {/* Configuración */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        kindleEmail={settings.kindleEmail}
        onSaveKindleEmail={saveKindleEmail}
      />

      {/* Lector */}
      {readingBook && (
        <Reader book={readingBook} onClose={() => setReadingBook(null)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
