import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ahnrfdcqqiqmizgnqfel.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnJmZGNxcWlxbWl6Z25xZmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MjE4NzQsImV4cCI6MjA1Mjk5Nzg3NH0.QDJyQjliMwF6TXO4RIrhMg_qO81ajCU-INCOMPLETE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
