import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Timer, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSOSContext } from "@/contexts/SOSContext";
import { getCurrentLocation } from "@/services/locationTrackingService";
import {
  startCheckinTimer,
  getActiveCheckinTimer,
  checkInSafe,
  markCheckinExpired,
  type CheckinTimer,
} from "@/services/checkinService";

const PRESET_MINUTES = [5, 15, 30, 60];

const formatRemaining = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const CheckInTimerSection = () => {
  const { triggerSOS } = useSOSContext();
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<CheckinTimer | null>(null);
  const [customMinutes, setCustomMinutes] = useState("");
  const [starting, setStarting] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const hasFiredRef = useRef(false);

  // Auto-trigger SOS once the active timer's expiry passes. Guarded by
  // hasFiredRef so a fast-ticking interval can't fire this twice.
  const handleExpiry = useCallback(
    async (timer: CheckinTimer) => {
      if (hasFiredRef.current) return;
      hasFiredRef.current = true;

      toast.error("Check-in time expired — sending SOS alert");
      const fired = await triggerSOS("checkin_timeout");

      // Best-effort link the resulting alert back to this timer row; not
      // critical if it fails, the alert itself already went out.
      const { data: { user } } = await supabase.auth.getUser();
      let alertId: string | null = null;
      if (user) {
        const { data } = await (supabase as any)
          .from("sos_alerts")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        alertId = data?.id ?? null;
      }

      await markCheckinExpired(timer.id, alertId);
      setActiveTimer(null);

      if (!fired) {
        toast.error("Timer expired but SOS could not be sent — please check manually");
      }
    },
    [triggerSOS]
  );

  // On mount: resume an existing active timer, or catch up immediately if
  // it already expired while the app was closed.
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const timer = await getActiveCheckinTimer(user.id);
      if (timer) {
        const remaining = new Date(timer.expires_at).getTime() - Date.now();
        if (remaining <= 0) {
          setActiveTimer(timer);
          await handleExpiry(timer);
        } else {
          setActiveTimer(timer);
          setRemainingMs(remaining);
        }
      }
      setLoading(false);
    };

    init();
    // Only run once on mount — handleExpiry is stable enough for this purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live countdown while a timer is active
  useEffect(() => {
    if (!activeTimer) return;

    const tick = () => {
      const remaining = new Date(activeTimer.expires_at).getTime() - Date.now();
      setRemainingMs(remaining);
      if (remaining <= 0) {
        handleExpiry(activeTimer);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeTimer, handleExpiry]);

  const handleStart = async (minutes: number) => {
    if (!minutes || minutes <= 0) {
      toast.error("Enter a valid number of minutes");
      return;
    }

    setStarting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to use check-in timers");
        return;
      }

      const location = await getCurrentLocation();
      const { data, error } = await startCheckinTimer(
        user.id,
        minutes,
        location ? { latitude: location.latitude, longitude: location.longitude } : null
      );

      if (error || !data) {
        toast.error("Could not start timer. Please try again.");
        return;
      }

      hasFiredRef.current = false;
      setActiveTimer(data);
      setRemainingMs(minutes * 60_000);
      toast.success(`Journey timer started for ${minutes} min. Check in before it ends.`);
    } finally {
      setStarting(false);
    }
  };

  const handleCheckIn = async () => {
    if (!activeTimer) return;
    const success = await checkInSafe(activeTimer.id);
    if (success) {
      hasFiredRef.current = true; // prevent any in-flight tick from also firing
      setActiveTimer(null);
      toast.success("Checked in — glad you're safe!");
    } else {
      toast.error("Could not check in. Please try again.");
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const totalMs = activeTimer ? activeTimer.duration_minutes * 60_000 : 0;
  const progressPct = totalMs > 0 ? Math.max(0, Math.min(100, (remainingMs / totalMs) * 100)) : 0;
  const isUrgent = activeTimer && remainingMs < 60_000;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Timer className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Check-In Timer</CardTitle>
            <CardDescription>
              Set a timer before a risky trip — if you don't check in, we alert your contacts automatically
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTimer ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className={`text-4xl font-bold tabular-nums ${isUrgent ? "text-destructive animate-pulse" : "text-foreground"}`}>
                {formatRemaining(remainingMs)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                remaining until auto-SOS
              </p>
            </div>
            <Progress value={progressPct} className={isUrgent ? "[&>div]:bg-destructive" : ""} />
            <Button
              onClick={handleCheckIn}
              size="lg"
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <ShieldCheck className="w-5 h-5" />
              I'm Safe — Check In Now
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose a duration:</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_MINUTES.map((min) => (
                <Button
                  key={min}
                  variant="outline"
                  disabled={starting}
                  onClick={() => handleStart(min)}
                >
                  {min}m
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                placeholder="Custom minutes"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                disabled={starting}
              />
              <Button
                disabled={starting || !customMinutes}
                onClick={() => handleStart(parseInt(customMinutes, 10))}
              >
                {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckInTimerSection;
