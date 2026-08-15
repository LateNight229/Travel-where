import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { appConfig } from "./app-config";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (appConfig.demoMode) return null;
  client ??= createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}

export async function sendMagicLink(email: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase chưa được cấu hình.");
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
  if (error) throw error;
}

export async function saveTripDocument(userId: string, tripId: string, trip: unknown): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const title = typeof trip === "object" && trip && "title" in trip ? String((trip as { title: unknown }).title) : "Chuyến đi";
  const { error: tripError } = await supabase.from("trips").upsert({ id: tripId, owner_id: userId, title, updated_at: new Date().toISOString() });
  if (tripError) throw tripError;
  const { error } = await supabase.from("trip_documents").upsert({ trip_id: tripId, owner_id: userId, document: trip, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function loadLatestTripDocument(userId: string): Promise<{ tripId: string; document: unknown } | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("trip_documents").select("trip_id, document").eq("owner_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? { tripId: data.trip_id as string, document: data.document } : null;
}

export async function uploadTripPhoto(userId: string, tripId: string, file: File): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) return URL.createObjectURL(file);
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${userId}/${tripId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("trip-photos").upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  const { data, error: signedUrlError } = await supabase.storage.from("trip-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signedUrlError) throw signedUrlError;
  return data.signedUrl;
}
