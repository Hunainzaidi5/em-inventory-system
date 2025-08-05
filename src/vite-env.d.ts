/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // Removed VITE_API_BASE_URL as it's not needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
