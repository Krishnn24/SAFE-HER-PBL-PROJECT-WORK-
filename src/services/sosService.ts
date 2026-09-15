/**
 * SOS Service - Core emergency alert system
 * Handles SOS alert creation, location tracking, and status management
 */

import { supabase } from "@/integrations/supabase/client";

export type TriggerMethod = "manual_button" | "shake" | "pattern" | "voice" | "checkin_timeout";
export type AlertStatus = "active" | "resolved" | "cancelled";

export interface SOSAlert {
  id: string;
  user_id: string;
  status: AlertStatus;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  trigger_method: string | null;
  audio_url: string | null;
  created_at: string;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

// Feature flags for future integrations
export const FEATURE_FLAGS = {
  SMS_NOTIFICATIONS_ENABLED: false, // Enable when Twilio is integrated
  EMAIL_NOTIFICATIONS_ENABLED: false, // Enable when email service is integrated
  LIVE_LOCATION_TRACKING: true,
  DISCRETE_RECORDING: true,
};

/**
 * Create a new SOS alert in the database
 */
export const createSOSAlert = async (
  userId: string,
  triggerMethod: TriggerMethod,
  location?: LocationUpdate | null,
  audioPath?: string | null
): Promise<{ data: SOSAlert | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from("sos_alerts")
      .insert({
        user_id: userId,
        status: "active" as AlertStatus,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        trigger_method: triggerMethod,
        audio_url: audioPath || null,
      })
      .select()
      .single();

    if (error) throw error;

    console.log("[SOS Service] Alert created:", data?.id);
    return { data, error: null };
  } catch (err) {
    console.error("[SOS Service] Failed to create alert:", err);
    return { data: null, error: err as Error };
  }
};

/**
 * Update SOS alert location
 */
export const updateAlertLocation = async (
  alertId: string,
  location: LocationUpdate
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("sos_alerts")
      .update({
        latitude: location.latitude,
        longitude: location.longitude,
        updated_at: new Date().toISOString(),
      })
      .eq("id", alertId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[SOS Service] Failed to update location:", err);
    return false;
  }
};

/**
 * Add location to history for continuous tracking
 */
export const addLocationHistory = async (
  userId: string,
  alertId: string,
  location: LocationUpdate
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("location_history").insert({
      user_id: userId,
      alert_id: alertId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    });

    if (error) throw error;
    console.log("[SOS Service] Location history added");
    return true;
  } catch (err) {
    console.error("[SOS Service] Failed to add location history:", err);
    return false;
  }
};

/**
 * Resolve/End an active SOS alert
 */
export const resolveSOSAlert = async (
  alertId: string,
  resolvedBy?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("sos_alerts")
      .update({
        status: "resolved" as AlertStatus,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy || null,
      })
      .eq("id", alertId);

    if (error) throw error;
    console.log("[SOS Service] Alert resolved:", alertId);
    return true;
  } catch (err) {
    console.error("[SOS Service] Failed to resolve alert:", err);
    return false;
  }
};

/**
 * Cancel an SOS alert (false alarm)
 */
export const cancelSOSAlert = async (alertId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("sos_alerts")
      .update({
        status: "cancelled" as AlertStatus,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", alertId);

    if (error) throw error;
    console.log("[SOS Service] Alert cancelled:", alertId);
    return true;
  } catch (err) {
    console.error("[SOS Service] Failed to cancel alert:", err);
    return false;
  }
};

/**
 * Get user's active SOS alert (if any)
 */
export const getActiveAlert = async (
  userId: string
): Promise<SOSAlert | null> => {
  try {
    const { data, error } = await supabase
      .from("sos_alerts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("[SOS Service] Failed to get active alert:", err);
    return null;
  }
};

/**
 * Upload audio recording to storage
 */
export const uploadAudioRecording = async (
  userId: string,
  audioBlob: Blob
): Promise<string | null> => {
  try {
    const fileName = `${userId}/${Date.now()}.webm`;
    const { error } = await supabase.storage
      .from("sos-recordings")
      .upload(fileName, audioBlob, {
        contentType: "audio/webm",
      });

    if (error) throw error;
    console.log("[SOS Service] Audio uploaded:", fileName);
    return fileName;
  } catch (err) {
    console.error("[SOS Service] Failed to upload audio:", err);
    return null;
  }
};
