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
} from "@/services/emergencyMessageService";
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

      // Get initial location
      const location = await getCurrentLocation();
      if (location) {
        setLastLocation(location);
      } else {
        console.log("[SOS Context] Location unavailable, continuing without");
      }

      // Start audio recording if enabled
      let audioPath: string | null = null;
      if (FEATURE_FLAGS.DISCRETE_RECORDING) {
        const recordingStarted = await startDiscreteAudioRecording();
        
        if (recordingStarted) {
          // Record for initial duration
          await new Promise(resolve => setTimeout(resolve, RECORDING_DURATION_MS));
          
          const audioBlob = await stopAudioRecording();
          if (audioBlob && audioBlob.size > 0) {
            audioPath = await uploadAudioRecording(user.id, audioBlob);
          }
        }
      }

      // Create SOS alert
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

      // Start continuous location tracking
      if (FEATURE_FLAGS.LIVE_LOCATION_TRACKING && location) {
        startLocationTracking(
          (loc) => handleLocationUpdate(alert.id, user.id, loc),
          (err) => console.error("[SOS Context] Tracking error:", err)
        );
      }

      // Prepare emergency messages (not sent yet - feature flag disabled)
      const messages = await prepareEmergencyMessages(
        user.id,
        alert.id,
        location?.latitude || null,
        location?.longitude || null
      );

      // Attempt to send (will log only if feature flag is off)
      await sendEmergencyMessages(messages);

      toast({
        title: "🚨 SOS Alert Active",
        description: location 
          ? "Your location is being tracked. Stay safe." 
          : "Alert sent. Location unavailable.",
      });

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

      const success = await resolveSOSAlert(activeAlert.id, userIdRef.current || undefined);

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

      const { error } = await supabase
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
