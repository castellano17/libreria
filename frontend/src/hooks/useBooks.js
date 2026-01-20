import { useState, useEffect, useCallback } from "react";

const API_BASE = "/api";

export function useBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    genre: null,
    language: null,
    publisher: null,
    recent: null,
    corrupted: null,
    popular: null,
    favorites: null,
  });
  const [stats, setStats] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });

  const fetchBooks = useCallback(
    async (pageNum, searchQuery, size, activeFilters) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: pageNum,
          page_size: size,
        });
        if (searchQuery) params.append("search", searchQuery);
        if (activeFilters?.genre) params.append("genre", activeFilters.genre);
        if (activeFilters?.language)
          params.append("language", activeFilters.language);
        if (activeFilters?.publisher)
          params.append("publisher", activeFilters.publisher);
        if (activeFilters?.recent)
          params.append("recent", activeFilters.recent);
        if (activeFilters?.corrupted)
          params.append("corrupted", activeFilters.corrupted);
        if (activeFilters?.popular)
          params.append("popular", activeFilters.popular);

        const response = await fetch(`${API_BASE}/books?${params}`);
        if (!response.ok) throw new Error("Error al cargar libros");

        const data = await response.json();

        // Filtrar favoritos en el frontend si es necesario
        let filteredBooks = data.items;
        if (activeFilters?.favorites === "only") {
          filteredBooks = data.items.filter((book) =>
            favorites.includes(book.id),
          );
        }

        setBooks(filteredBooks);
        setTotalPages(data.total_pages);
        setTotal(
          activeFilters?.favorites === "only"
            ? filteredBooks.length
            : data.total,
        );
        setPage(pageNum);
      } catch (err) {
        setError(err.message);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    },
    [favorites],
  );

  const toggleFavorite = useCallback((bookId) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId];
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      if (response.ok) {
        setStats(await response.json());
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  const handlePageChange = useCallback(
    (newPage) => {
      setPage(newPage);
      fetchBooks(newPage, search, pageSize, filters);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [search, pageSize, filters, fetchBooks],
  );

  const handlePageSizeChange = useCallback(
    (newSize) => {
      setPageSize(newSize);
      setPage(1);
      fetchBooks(1, search, newSize, filters);
    },
    [search, filters, fetchBooks],
  );

  const handleSearch = useCallback(
    (query) => {
      setSearch(query);
      setPage(1);
      fetchBooks(1, query, pageSize, filters);
    },
    [pageSize, filters, fetchBooks],
  );

  const handleFilterChange = useCallback(
    (newFilters) => {
      setFilters(newFilters);
      setPage(1);
      fetchBooks(1, search, pageSize, newFilters);
    },
    [search, pageSize, fetchBooks],
  );

  useEffect(() => {
    fetchBooks(1, "", pageSize, filters);
    fetchStats();
  }, []);

  return {
    books,
    loading,
    error,
    page,
    pageSize,
    totalPages,
    total,
    stats,
    filters,
    favorites,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    handleFilterChange,
    toggleFavorite,
    search,
    refreshStats: fetchStats,
  };
}

export function useScanStatus() {
  const [status, setStatus] = useState(null);
  const [scanning, setScanning] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/scan/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setScanning(data.status === "running");
      }
    } catch (err) {
      console.error("Error checking scan status:", err);
    }
  }, []);

  const startScan = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/scan`, { method: "POST" });
      if (response.ok) {
        setScanning(true);
        checkStatus();
      }
    } catch (err) {
      console.error("Error starting scan:", err);
    }
  }, [checkStatus]);

  const cancelScan = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/scan/cancel`, { method: "POST" });
    } catch (err) {
      console.error("Error canceling scan:", err);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return { status, scanning, startScan, cancelScan };
}

export function useSettings() {
  const [kindleEmail, setKindleEmail] = useState(() => {
    return localStorage.getItem("kindleEmail") || "";
  });

  const saveKindleEmail = useCallback((email) => {
    localStorage.setItem("kindleEmail", email);
    setKindleEmail(email);
  }, []);

  return { kindleEmail, saveKindleEmail };
}
