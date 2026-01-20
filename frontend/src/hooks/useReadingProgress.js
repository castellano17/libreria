import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export function useReadingProgress() {
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Cargar progreso de lectura del usuario
  useEffect(() => {
    if (user) {
      loadReadingProgress();
    } else {
      // Si no hay usuario, cargar desde localStorage
      const localProgress = localStorage.getItem("readingProgress");
      setProgress(localProgress ? JSON.parse(localProgress) : {});
    }
  }, [user]);

  const loadReadingProgress = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_reading_progress")
        .select("book_id, current_page, total_pages, progress_percentage")
        .eq("user_id", user.id);

      if (error) throw error;

      // Convertir array a objeto con book_id como key
      const progressMap = {};
      data.forEach((item) => {
        progressMap[item.book_id] = {
          currentPage: item.current_page,
          totalPages: item.total_pages,
          percentage: item.progress_percentage,
        };
      });

      setProgress(progressMap);
    } catch (error) {
      console.error("Error loading reading progress:", error);
      // Fallback a localStorage
      const localProgress = localStorage.getItem("readingProgress");
      setProgress(localProgress ? JSON.parse(localProgress) : {});
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (bookId, currentPage, totalPages) => {
    const percentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

    if (!user) {
      console.log("No user logged in, saving progress to localStorage");
      // Fallback a localStorage si no hay usuario
      const newProgress = {
        ...progress,
        [bookId]: {
          currentPage,
          totalPages,
          percentage,
        },
      };
      setProgress(newProgress);
      localStorage.setItem("readingProgress", JSON.stringify(newProgress));
      return;
    }

    console.log(
      "Updating reading progress for user:",
      user.id,
      "book:",
      bookId,
      "progress:",
      percentage + "%",
    );
    try {
      const { error } = await supabase.from("user_reading_progress").upsert(
        {
          user_id: user.id,
          book_id: bookId,
          current_page: currentPage,
          total_pages: totalPages,
          progress_percentage: percentage,
          last_read_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,book_id",
        },
      );

      if (error) {
        console.error("Supabase error updating progress:", error);
        throw error;
      }

      console.log("Reading progress updated successfully");
      setProgress((prev) => ({
        ...prev,
        [bookId]: {
          currentPage,
          totalPages,
          percentage,
        },
      }));
    } catch (error) {
      console.error("Error updating reading progress:", error);
      throw error;
    }
  };

  const getBookProgress = (bookId) => {
    return (
      progress[bookId] || {
        currentPage: 0,
        totalPages: 0,
        percentage: 0,
      }
    );
  };

  // Migrar progreso de localStorage a Supabase cuando el usuario se loguea
  const migrateProgressToSupabase = async () => {
    if (!user) return;

    const localProgress = localStorage.getItem("readingProgress");
    if (!localProgress) return;

    const progressData = JSON.parse(localProgress);
    const bookIds = Object.keys(progressData);

    if (bookIds.length === 0) return;

    try {
      // Insertar progreso en Supabase
      const progressToInsert = bookIds.map((bookId) => ({
        user_id: user.id,
        book_id: parseInt(bookId),
        current_page: progressData[bookId].currentPage || 0,
        total_pages: progressData[bookId].totalPages || 0,
        progress_percentage: progressData[bookId].percentage || 0,
        last_read_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("user_reading_progress")
        .upsert(progressToInsert, { onConflict: "user_id,book_id" });

      if (error) throw error;

      // Limpiar localStorage después de migrar
      localStorage.removeItem("readingProgress");

      // Recargar progreso desde Supabase
      loadReadingProgress();
    } catch (error) {
      console.error("Error migrating reading progress:", error);
    }
  };

  // Ejecutar migración cuando el usuario se loguea
  useEffect(() => {
    if (user) {
      migrateProgressToSupabase();
    }
  }, [user]);

  return {
    progress,
    loading,
    updateProgress,
    getBookProgress,
  };
}
