// ─── SHARED SUPABASE CLIENT ──────────────────────────────────────────────────
// Both the reading app and the study page import from here, so there is one
// connection and one auth session. Signing in on either side signs you in on
// both.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://mxlpyaebssriqdubjeiu.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bHB5YWVic3NyaXFkdWJqZWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTg5NTQsImV4cCI6MjA4OTk3NDk1NH0.BPz_CWlbEyIQIx63TwPcPYDJcCXteydA3wkTFIlQqYo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
