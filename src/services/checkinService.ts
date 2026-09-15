/**
 * Check-in Timer Service
 * "Journey mode": start a timer before doing something (a cab ride, walking
 * home, meeting someone new). If you don't check in as safe before it
 * expires, it auto-triggers the existing SOS pipeline.
 *
 * Backed by the `checkin_timers` table (see
 * supabase/migrations/20260914134005_checkin_timers.sql). That table isn't
 * in the generated Supabase types yet — run `supabase gen types typescript`
 * after deploying to get full type safety and remove the `as any` casts
 * below.
 */

import { supabase } from "@/integrations/supabase/client";

export type CheckinStatus = "active" | "checked_in" | "expired";

export interface CheckinTimer {
  id: string;
  user_id: string;
  duration_minutes: number;
  started_at: string;
  expires_at: string;
  status: CheckinStatus;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  resulting_alert_id: string | null;
  created_at: string;
}

const checkinTable = () => (supabase as any).from("checkin_timers");

/**
 * Start a new check-in timer. Fails loudly if you already have one active —
 * check with getActiveCheckinTimer first.
 */
export const startCheckinTimer = async (
  userId: string,
  durationMinutes: number,
  location?: { latitude: number; longitude: number } | null,
  note?: string
): Promise<{ data: CheckinTimer | null; error: Error | null }> => {
  try {
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60_000);

    const { data, error } = await checkinTable()
      .insert({
        user_id: userId,
        duration_minutes: durationMinutes,
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "active",
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        note: note ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as CheckinTimer, error: null };
  } catch (err) {
    console.error("[Checkin Service] Failed to start timer:", err);
    return { data: null, error: err as Error };
  }
};

/**
 * Get the user's currently active (not yet checked-in or expired) timer, if
 * any. Used on mount to resume a countdown across page reloads/app restarts.
 */
export const getActiveCheckinTimer = async (userId: string): Promise<CheckinTimer | null> => {
  try {
    const { data, error } = await checkinTable()
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as CheckinTimer | null;
  } catch (err) {
    console.error("[Checkin Service] Failed to get active timer:", err);
    return null;
  }
};

/** Mark a timer as safely checked in — cancels the pending auto-SOS. */
export const checkInSafe = async (timerId: string): Promise<boolean> => {
  try {
    const { error } = await checkinTable()
      .update({ status: "checked_in" })
      .eq("id", timerId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[Checkin Service] Failed to check in:", err);
    return false;
  }
};

/** Mark a timer as expired and link it to the SOS alert it triggered. */
export const markCheckinExpired = async (
  timerId: string,
  alertId?: string | null
): Promise<boolean> => {
  try {
    const { error } = await checkinTable()
      .update({ status: "expired", resulting_alert_id: alertId ?? null })
      .eq("id", timerId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[Checkin Service] Failed to mark timer expired:", err);
    return false;
  }
};
