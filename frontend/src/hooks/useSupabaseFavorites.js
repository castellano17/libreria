import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export function useSupabaseFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Cargar favoritos del usuario
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      // Si no hay usuario, cargar desde localStorage
      const localFavorites = localStorage.getItem("favorites");
      setFavorites(localFavorites ? JSON.parse(localFavorites) : []);
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("book_id")
        .eq("user_id", user.id);

      if (error) throw error;

      const favoriteIds = data.map((item) => item.book_id);
      setFavorites(favoriteIds);
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (bookId) => {
    if (!user) {
      // Fallback a localStorage si no hay usuario
      setFavorites((prev) => {
        const newFavorites = prev.includes(bookId)
          ? prev.filter((id) => id !== bookId)
          : [...prev, bookId];
        localStorage.setItem("favorites", JSON.stringify(newFavorites));
        return newFavorites;
      });
      return;
    }

    const isFavorite = favorites.includes(bookId);

    try {
      if (isFavorite) {
        // Remover de favoritos
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("book_id", bookId);

        if (error) throw error;

        setFavorites((prev) => prev.filter((id) => id !== bookId));
      } else {
        // Agregar a favoritos
        const { error } = await supabase
          .from("user_favorites")
          .insert([{ user_id: user.id, book_id: bookId }]);

        if (error) throw error;

        setFavorites((prev) => [...prev, bookId]);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Migrar favoritos de localStorage a Supabase cuando el usuario se loguea
  const migrateFavoritesToSupabase = async () => {
    if (!user) return;

    const localFavorites = localStorage.getItem("favorites");
    if (!localFavorites) return;

    const favoriteIds = JSON.parse(localFavorites);
    if (favoriteIds.length === 0) return;

    try {
      // Insertar favoritos en Supabase
      const favoritesToInsert = favoriteIds.map((bookId) => ({
        user_id: user.id,
        book_id: bookId,
      }));

      const { error } = await supabase
        .from("user_favorites")
        .upsert(favoritesToInsert, { onConflict: "user_id,book_id" });

      if (error) throw error;

      // Limpiar localStorage después de migrar
      localStorage.removeItem("favorites");

      // Recargar favoritos desde Supabase
      loadFavorites();
    } catch (error) {
      console.error("Error migrating favorites:", error);
    }
  };

  // Ejecutar migración cuando el usuario se loguea
  useEffect(() => {
    if (user) {
      migrateFavoritesToSupabase();
    }
  }, [user]);

  return {
    favorites,
    loading,
    toggleFavorite,
  };
}
