import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSOSContext } from "@/contexts/SOSContext";
import { AlertTriangle, Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SOSState = "idle" | "confirming" | "sending" | "success" | "error";

interface SOSButtonProps {
  variant?: "floating" | "inline";
  onTrigger?: () => void;
  triggerMethod?: "manual" | "shake" | "pattern";
}

const RATE_LIMIT_MS = 20000;
const HOLD_DURATION = 1500;

// Maps this component's simplified prop values to SOSContext's TriggerMethod
const TRIGGER_METHOD_MAP: Record<string, "manual_button" | "shake" | "pattern"> = {
  manual: "manual_button",
  shake: "shake",
  pattern: "pattern",
};

/**
 * The dashboard's main SOS button. All the actual work — creating the
 * alert, recording audio, tracking location, and notifying contacts
 * (via the notify-sos-contacts edge function, with a device-SMS fallback) —
 * lives in SOSContext.triggerSOS, shared with the check-in timer, shake
 * detection, and pattern-lock triggers. This component only owns the
 * hold-to-confirm gesture and its own visual state.
 */
export const SOSButton = ({
  variant = "floating",
  onTrigger,
  triggerMethod = "manual",
}: SOSButtonProps) => {
  const [state, setState] = useState<SOSState>("idle");
  const [holdProgress, setHoldProgress] = useState(0);
  const [lastTriggerTime, setLastTriggerTime] = useState(0);

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const { triggerSOS: contextTriggerSOS, lastLocation } = useSOSContext();

  const clearTimers = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
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
      setHoldProgress(Math.min((elapsed / HOLD_DURATION) * 100, 100));
    }, 50);

    holdTimerRef.current = setTimeout(() => {
      clearTimers();
      handleTrigger();
    }, HOLD_DURATION);
  };

  const handleHoldEnd = () => {
    if (state === "confirming") {
      clearTimers();
      setState("idle");
    }
  };

  const handleTrigger = async () => {
    setLastTriggerTime(Date.now());
    setState("sending");
    onTrigger?.();

    try {
      const method = TRIGGER_METHOD_MAP[triggerMethod] ?? "manual_button";
      const success = await contextTriggerSOS(method);

      if (!success) {
        throw new Error("SOS trigger returned false");
      }

      // contextTriggerSOS already shows its own toast (with location/offline
      // status and real notification outcome), so nothing extra needed here.
      setState("success");
      setTimeout(() => setState("idle"), 4000);
    } catch (err) {
      console.error("[SOSButton] Trigger failed:", err);
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
        {state === "confirming" ? (
          <AlertTriangle className="animate-pulse text-white" />
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

      {/* Map preview — reads location from the shared SOSContext, so it
          stays in sync with whatever the active alert is actually using */}
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
