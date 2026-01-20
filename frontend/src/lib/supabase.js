import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ahnrfdcqqiqmizgnqfel.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnJmZGNxcWlxbWl6Z25xZmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MjE4NzQsImV4cCI6MjA1Mjk5Nzg3NH0.QDJyQjliMwF6TXO4RIrhMg_qO81ajCU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
