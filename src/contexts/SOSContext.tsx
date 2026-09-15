/**
 * SOS Context - Global state management for active SOS alerts
 * Provides app-wide access to SOS status and controls
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  createSOSAlert,
  resolveSOSAlert,
  updateAlertLocation,
  addLocationHistory,
  uploadAudioRecording,
  getActiveAlert,
  type TriggerMethod,
  type SOSAlert,
  type LocationUpdate,
  FEATURE_FLAGS,
} from "@/services/sosService";
import {
  prepareEmergencyMessages,
  sendEmergencyMessages,
  buildOfflineEmergencyMessages,
} from "@/services/emergencyMessageService";
import { isOnline, sendOfflineSMSFallback } from "@/services/smsFallbackService";
import {
  startLocationTracking,
  stopLocationTracking,
  getCurrentLocation,
} from "@/services/locationTrackingService";
import {
  startDiscreteAudioRecording,
  stopRecording as stopAudioRecording,
} from "@/services/discreteRecordingService";
import { useToast } from "@/hooks/use-toast";

interface SOSContextValue {
  isSOSActive: boolean;
  activeAlert: SOSAlert | null;
  isTriggering: boolean;
  lastLocation: LocationUpdate | null;
  triggerSOS: (method: TriggerMethod) => Promise<boolean>;
  endSOS: () => Promise<boolean>;
  cancelSOS: () => Promise<boolean>;
}

const SOSContext = createContext<SOSContextValue | null>(null);

const RECORDING_DURATION_MS = 5000; // 5 seconds initial recording

export const SOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [activeAlert, setActiveAlert] = useState<SOSAlert | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastLocation, setLastLocation] = useState<LocationUpdate | null>(null);
  const userIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Check for existing active alert on mount
  useEffect(() => {
    const checkActiveAlert = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      userIdRef.current = user.id;
      const alert = await getActiveAlert(user.id);
      
      if (alert) {
        console.log("[SOS Context] Found existing active alert:", alert.id);
        setActiveAlert(alert);
        setIsSOSActive(true);
        
        // Resume location tracking
        if (FEATURE_FLAGS.LIVE_LOCATION_TRACKING) {
          startLocationTracking(
            (location) => handleLocationUpdate(alert.id, user.id, location),
            (error) => console.error("[SOS Context] Location error:", error)
          );
        }
      }
    };

    checkActiveAlert();
    
    return () => {
      stopLocationTracking();
    };
  }, []);

  // Handle location updates during active SOS
  const handleLocationUpdate = useCallback(async (
    alertId: string,
    userId: string,
    location: LocationUpdate
  ) => {
    setLastLocation(location);
    
    // Update alert with latest location
    await updateAlertLocation(alertId, location);
    
    // Add to location history
    await addLocationHistory(userId, alertId, location);
  }, []);

  // Trigger SOS alert
  const triggerSOS = useCallback(async (method: TriggerMethod): Promise<boolean> => {
    if (isSOSActive || isTriggering) {
      console.log("[SOS Context] SOS already active or triggering");
      return false;
    }

    setIsTriggering(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to use SOS",
          variant: "destructive",
        });
        return false;
      }

      userIdRef.current = user.id;
      const online = isOnline();

      // Get initial location (works offline via GPS — no network needed)
      const location = await getCurrentLocation();
      if (location) {
        setLastLocation(location);
      } else {
        console.log("[SOS Context] Location unavailable, continuing without");
      }

      // Start audio recording if enabled (recording itself is local; only
      // the upload afterward needs network)
      let audioPath: string | null = null;
      if (FEATURE_FLAGS.DISCRETE_RECORDING) {
        const recordingStarted = await startDiscreteAudioRecording();

        if (recordingStarted) {
          // Record for initial duration
          await new Promise(resolve => setTimeout(resolve, RECORDING_DURATION_MS));

          const audioBlob = await stopAudioRecording();
          if (audioBlob && audioBlob.size > 0 && online) {
            audioPath = await uploadAudioRecording(user.id, audioBlob);
          } else if (audioBlob && audioBlob.size > 0) {
            console.log("[SOS Context] Offline — skipping audio upload, recording kept locally only");
          }
        }
      }

      if (online) {
        // ---- ONLINE PATH ----
        const { data: alert, error } = await createSOSAlert(
          user.id,
          method,
          location,
          audioPath
        );

        if (error || !alert) {
          throw error || new Error("Failed to create alert");
        }

        setActiveAlert(alert);
        setIsSOSActive(true);

        if (FEATURE_FLAGS.LIVE_LOCATION_TRACKING && location) {
          startLocationTracking(
            (loc) => handleLocationUpdate(alert.id, user.id, loc),
            (err) => console.error("[SOS Context] Tracking error:", err)
          );
        }

        const messages = await prepareEmergencyMessages(
          user.id,
          alert.id,
          location?.latitude || null,
          location?.longitude || null
        );

        const sendResult = await sendEmergencyMessages(messages);

        // Twilio isn't actually wired up yet (feature-flagged off), which
        // means contacts never get notified at all otherwise — fall back to
        // direct device SMS so the alert really goes out.
        if (sendResult.sentCount === 0 && messages.length > 0) {
          const fallback = await sendOfflineSMSFallback(messages);
          console.log("[SOS Context] SMS fallback result:", fallback);
        }

        toast({
          title: "🚨 SOS Alert Active",
          description: location
            ? "Your location is being tracked. Stay safe."
            : "Alert sent. Location unavailable.",
        });
      } else {
        // ---- OFFLINE PATH ----
        // No network at all — skip the DB entirely (it would just hang/fail)
        // and go straight to sending SMS directly from the device using the
        // last cached trusted-contacts list. The alert is tracked locally
        // only for this session; it won't appear in SOS Alert History until
        // you're back online and trigger a fresh alert, or a future update
        // syncs it retroactively.
        const offlineAlertId = `offline-${Date.now()}`;

        setActiveAlert({
          id: offlineAlertId,
          user_id: user.id,
          status: "active",
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          address: null,
          trigger_method: method,
          audio_url: null,
          created_at: new Date().toISOString(),
        });
        setIsSOSActive(true);

        const messages = buildOfflineEmergencyMessages(
          offlineAlertId,
          location?.latitude ?? null,
          location?.longitude ?? null
        );

        const fallback = await sendOfflineSMSFallback(messages);

        if (fallback.attempted === 0) {
          toast({
            title: "🚨 SOS Active — but no contacts cached",
            description: "Connect to the internet at least once so contacts can be reached without data next time.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "🚨 SOS Alert Active (Offline)",
            description: "No connection — SMS sent directly to your contacts' phones.",
          });
        }
      }

      return true;
    } catch (err) {
      console.error("[SOS Context] Trigger failed:", err);
      toast({
        title: "SOS Failed",
        description: "Could not send alert. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsTriggering(false);
    }
  }, [isSOSActive, isTriggering, toast, handleLocationUpdate]);

  // End SOS (mark as resolved/safe)
  const endSOS = useCallback(async (): Promise<boolean> => {
    if (!isSOSActive || !activeAlert) {
      return false;
    }

    try {
      stopLocationTracking();

      // Offline-triggered alerts were never written to the DB — nothing to
      // resolve there, just clear local state.
      const isOfflineOnlyAlert = activeAlert.id.startsWith("offline-");
      const success = isOfflineOnlyAlert
        ? true
        : await resolveSOSAlert(activeAlert.id, userIdRef.current || undefined);

      if (success) {
        setIsSOSActive(false);
        setActiveAlert(null);
        setLastLocation(null);

        toast({
          title: "You're Safe",
          description: "SOS alert ended. Your contacts have been notified.",
        });

        return true;
      }

      return false;
    } catch (err) {
      console.error("[SOS Context] End SOS failed:", err);
      toast({
        title: "Error",
        description: "Failed to end SOS. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [isSOSActive, activeAlert, toast]);

  // Cancel SOS (false alarm)
  const cancelSOS = useCallback(async (): Promise<boolean> => {
    if (!isSOSActive || !activeAlert) {
      return false;
    }

    try {
      stopLocationTracking();

      // Offline-triggered alerts were never written to the DB — nothing to
      // cancel there, just clear local state.
      const isOfflineOnlyAlert = activeAlert.id.startsWith("offline-");
      const { error } = isOfflineOnlyAlert
        ? { error: null }
        : await supabase
            .from("sos_alerts")
            .update({
              status: "cancelled",
              resolved_at: new Date().toISOString(),
            })
            .eq("id", activeAlert.id);

      if (!error) {
        setIsSOSActive(false);
        setActiveAlert(null);
        setLastLocation(null);

        toast({
          title: "Alert Cancelled",
          description: "False alarm - SOS has been cancelled.",
        });

        return true;
      }

      return false;
    } catch (err) {
      console.error("[SOS Context] Cancel failed:", err);
      return false;
    }
  }, [isSOSActive, activeAlert, toast]);

  return (
    <SOSContext.Provider
      value={{
        isSOSActive,
        activeAlert,
        isTriggering,
        lastLocation,
        triggerSOS,
        endSOS,
        cancelSOS,
      }}
    >
      {children}
    </SOSContext.Provider>
  );
};

export const useSOSContext = (): SOSContextValue => {
  const context = useContext(SOSContext);
  if (!context) {
    throw new Error("useSOSContext must be used within SOSProvider");
  }
  return context;
};
