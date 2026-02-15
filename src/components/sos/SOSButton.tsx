import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useGeolocation } from "@/hooks/useGeolocation";
import { AlertTriangle, Loader2, Check, X, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

type SOSState =
  | "idle"
  | "confirming"
  | "recording"
  | "sending"
  | "success"
  | "error";

interface SOSButtonProps {
  variant?: "floating" | "inline";
  onTrigger?: () => void;
  triggerMethod?: "manual" | "shake" | "pattern";
}

const RECORDING_DURATION = 5000;
const RATE_LIMIT_MS = 20000;

export const SOSButton = ({
  variant = "floating",
  onTrigger,
  triggerMethod = "manual",
}: SOSButtonProps) => {
  const [state, setState] = useState<SOSState>("idle");
  const [holdProgress, setHoldProgress] = useState(0);
  const [lastTriggerTime, setLastTriggerTime] = useState(0);
  const [lastLocation, setLastLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const { startRecording, stopRecording } = useAudioRecorder();
  const { getLocation } = useGeolocation();

  const HOLD_DURATION = 1500;

  const clearTimers = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressIntervalRef.current)
      clearInterval(progressIntervalRef.current);
    setHoldProgress(0);
  };

  const handleHoldStart = () => {
    if (state !== "idle") return;

    const now = Date.now();
    if (now - lastTriggerTime < RATE_LIMIT_MS) {
      toast({
        title: "Please wait",
        description: "You can trigger SOS again shortly",
        variant: "destructive",
      });
      return;
    }

    setState("confirming");

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setHoldProgress(
        Math.min((elapsed / HOLD_DURATION) * 100, 100)
      );
    }, 50);

    holdTimerRef.current = setTimeout(() => {
      clearTimers();
      triggerSOS();
    }, HOLD_DURATION);
  };

  const handleHoldEnd = () => {
    if (state === "confirming") {
      clearTimers();
      setState("idle");
    }
  };

  // 📍 Improved GPS reliability (2 attempts, no blocking)
  const getReliableLocation = async () => {
    const firstTry = await Promise.race([
      getLocation(),
      new Promise<null>((r) => setTimeout(() => r(null), 2000)),
    ]);

    if (firstTry) return firstTry;

    // retry once
    await new Promise((r) => setTimeout(r, 800));
    return await Promise.race([
      getLocation(),
      new Promise<null>((r) => setTimeout(() => r(null), 2000)),
    ]);
  };

  const triggerSOS = async () => {
    setLastTriggerTime(Date.now());
    setState("recording");
    onTrigger?.();

    try {
      await startRecording();

      const location = await getReliableLocation();
      if (location) {
        setLastLocation(location);
      } else {
        toast({
          title: "Location unavailable",
          description: "SOS sent without live location",
          variant: "destructive",
        });
      }

      await new Promise((r) => setTimeout(r, RECORDING_DURATION));
      const audioBlob = await stopRecording();

      setState("sending");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let audioPath: string | null = null;

      if (audioBlob && audioBlob.size > 0) {
        const fileName = `${user.id}/${Date.now()}.webm`;
        const { error } = await supabase.storage
          .from("sos-recordings")
          .upload(fileName, audioBlob, {
            contentType: "audio/webm",
          });
        if (!error) audioPath = fileName;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("emergency_message")
        .eq("user_id", user.id)
        .maybeSingle();

      const { error } = await supabase
        .from("sos_alerts")
        .insert({
          user_id: user.id,
          status: "active",
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          trigger_method: triggerMethod,
          audio_url: audioPath,
          notes:
            profile?.emergency_message ||
            "Emergency SOS triggered",
        });

      if (error) throw error;

      setState("success");
      toast({
        title: "SOS Sent",
        description: "Emergency alert created successfully",
      });

      setTimeout(() => setState("idle"), 4000);
    } catch (err) {
      console.error(err);
      setState("error");
      toast({
        title: "SOS Failed",
        description: "Please try again",
        variant: "destructive",
      });
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const isFloating = variant === "floating";

  return (
    <div className="flex flex-col items-center gap-4">
  <button
    className={cn(
      "gradient-sos flex items-center justify-center transition-all duration-300 select-none touch-none",
      isFloating
        ? "fixed bottom-6 right-6 w-20 h-20 rounded-full shadow-glow-sos z-50 animate-pulse-glow-sos hover:scale-110"
        : "w-full py-3 rounded-xl"
    )}
    

        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
      >
        {state === "recording" ? (
          <Mic className="animate-pulse text-white" />
        ) : state === "sending" ? (
          <Loader2 className="animate-spin text-white" />
        ) : state === "success" ? (
          <Check className="text-white" />
        ) : state === "error" ? (
          <X className="text-white" />
        ) : (
          <span className="text-white font-bold">SOS</span>
        )}
      </button>

      {/* 🗺️ MAP PREVIEW (UI ONLY) */}
      {lastLocation && (
        <div className="w-full max-w-md rounded-xl overflow-hidden border">
          <iframe
            title="SOS Location"
            width="100%"
            height="220"
            loading="lazy"
            src={`https://www.google.com/maps?q=${lastLocation.latitude},${lastLocation.longitude}&z=15&output=embed`}
          />
        </div>
      )}
    </div>
  );
};

export default SOSButton;
