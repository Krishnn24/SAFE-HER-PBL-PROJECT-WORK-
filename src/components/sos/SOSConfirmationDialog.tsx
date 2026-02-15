import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SOSConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  triggerMethod: "shake" | "pattern" | "manual";
}

export const SOSConfirmationDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  triggerMethod,
}: SOSConfirmationDialogProps) => {
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const HOLD_DURATION = 1500;

  const clearTimers = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setHoldProgress(0);
    setIsHolding(false);
  };

  const handleHoldStart = () => {
    setIsHolding(true);
    
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);
    }, 50);

    holdTimerRef.current = setTimeout(() => {
      clearTimers();
      onConfirm();
    }, HOLD_DURATION);
  };

  const handleHoldEnd = () => {
    clearTimers();
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      clearTimers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getTriggerText = () => {
    switch (triggerMethod) {
      case "shake":
        return "Shake detected!";
      case "pattern":
        return "Pattern verified!";
      default:
        return "SOS Triggered";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center space-y-6 shadow-lg">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-muted/80"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto animate-pulse">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>

        <div>
          <p className="text-sm text-muted-foreground">{getTriggerText()}</p>
          <h2 className="text-2xl font-bold text-foreground mt-1">
            Send Emergency Alert?
          </h2>
          <p className="text-muted-foreground mt-2">
            Hold the button below to confirm and alert your trusted contacts
          </p>
        </div>

        <button
          className={cn(
            "w-32 h-32 rounded-full gradient-bg flex items-center justify-center mx-auto relative overflow-hidden transition-transform",
            isHolding && "scale-95"
          )}
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
        >
          <div 
            className="absolute inset-0 bg-primary-foreground/20 origin-bottom"
            style={{ transform: `scaleY(${holdProgress / 100})` }}
          />
          <span className="text-2xl font-bold text-primary-foreground z-10">
            SOS
          </span>
        </button>

        <Button 
          variant="ghost" 
          onClick={onCancel}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default SOSConfirmationDialog;
