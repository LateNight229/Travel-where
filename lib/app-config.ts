type PublicRuntime = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  hotelApiUrl: string;
  demoMode: boolean;
};

type ViteImportMeta = ImportMeta & {
  env: {
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
    VITE_HOTEL_API_URL?: string;
  };
};

function readNextEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY" | "NEXT_PUBLIC_HOTEL_API_URL"): string {
  if (typeof process === "undefined") return "";
  if (name === "NEXT_PUBLIC_SUPABASE_URL") return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (name === "NEXT_PUBLIC_SUPABASE_ANON_KEY") return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return process.env.NEXT_PUBLIC_HOTEL_API_URL ?? "";
}

const supabaseUrl =
  readNextEnv("NEXT_PUBLIC_SUPABASE_URL") ||
  (import.meta as ViteImportMeta).env.VITE_SUPABASE_URL ||
  "";

const supabaseAnonKey =
  readNextEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
  (import.meta as ViteImportMeta).env.VITE_SUPABASE_ANON_KEY ||
  "";

const hotelApiUrl =
  readNextEnv("NEXT_PUBLIC_HOTEL_API_URL") ||
  (import.meta as ViteImportMeta).env.VITE_HOTEL_API_URL ||
  "";

export const appConfig: PublicRuntime = {
  supabaseUrl,
  supabaseAnonKey,
  hotelApiUrl,
  demoMode: !supabaseUrl || !supabaseAnonKey,
};
