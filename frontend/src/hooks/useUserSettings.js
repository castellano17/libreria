import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export function useUserSettings() {
  const [settings, setSettings] = useState({
    kindleEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Cargar configuraciones del usuario
  useEffect(() => {
    console.log("useUserSettings effect triggered, user:", user);
    if (user) {
      console.log("User exists, loading settings...");
      loadUserSettings();
    } else {
      console.log("No user, loading from localStorage");
      // Si no hay usuario, cargar desde localStorage
      const localKindleEmail = localStorage.getItem("kindleEmail");
      console.log("Local kindle email:", localKindleEmail);
      setSettings({
        kindleEmail: localKindleEmail || "",
      });
    }
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;

    console.log("Loading user settings for user:", user.id);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("kindle_email")
        .eq("user_id", user.id)
        .single();

      console.log("User settings query result:", { data, error });

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned, es normal si es la primera vez
        throw error;
      }

      setSettings({
        kindleEmail: data?.kindle_email || "",
      });
      console.log("Settings loaded:", data?.kindle_email || "");
    } catch (error) {
      console.error("Error loading user settings:", error);
      // Fallback a localStorage
      const localKindleEmail = localStorage.getItem("kindleEmail");
      setSettings({
        kindleEmail: localKindleEmail || "",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveKindleEmail = async (email) => {
    if (!user) {
      console.log("No user logged in, saving to localStorage");
      // Fallback a localStorage si no hay usuario
      localStorage.setItem("kindleEmail", email);
      setSettings((prev) => ({ ...prev, kindleEmail: email }));
      return;
    }

    console.log(
      "Saving kindle email to Supabase for user:",
      user.id,
      "email:",
      email,
    );
    setLoading(true);
    try {
      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          kindle_email: email,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

      if (error) {
        console.error("Supabase error saving kindle email:", error);
        throw error;
      }

      console.log("Kindle email saved successfully to Supabase");
      setSettings((prev) => ({ ...prev, kindleEmail: email }));
    } catch (error) {
      console.error("Error saving kindle email:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Migrar email de Kindle de localStorage a Supabase cuando el usuario se loguea
  const migrateKindleEmailToSupabase = async () => {
    if (!user) return;

    const localKindleEmail = localStorage.getItem("kindleEmail");
    if (!localKindleEmail) return;

    try {
      await saveKindleEmail(localKindleEmail);
      // Limpiar localStorage después de migrar
      localStorage.removeItem("kindleEmail");
    } catch (error) {
      console.error("Error migrating kindle email:", error);
    }
  };

  // Ejecutar migración cuando el usuario se loguea
  useEffect(() => {
    if (user) {
      migrateKindleEmailToSupabase();
    }
  }, [user]);

  return {
    settings,
    loading,
    saveKindleEmail,
  };
}
