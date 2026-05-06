import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Returns true only when real credentials are configured */
export function hasSupabase(): boolean {
  return (
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("your-project") &&
    SUPABASE_ANON.length > 20
  );
}

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL  || "https://placeholder.supabase.co",
    SUPABASE_ANON || "placeholder-anon-key",
  );
}

// Singleton for client components
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!client) client = createClient();
  return client;
}
