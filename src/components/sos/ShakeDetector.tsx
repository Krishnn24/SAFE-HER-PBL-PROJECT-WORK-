import { useEffect, useState, useCallback } from "react";
import { useShakeDetection } from "@/hooks/useShakeDetection";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Smartphone, AlertTriangle } from "lucide-react";
import SOSConfirmationDialog from "./SOSConfirmationDialog";

interface ShakeDetectorProps {
  enabled: boolean;
  onSOSTrigger: () => void;
}

export const ShakeDetector = ({ enabled, onSOSTrigger }: ShakeDetectorProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [shakeDetected, setShakeDetected] = useState(false);
  const { toast } = useToast();

  const handleShake = useCallback(() => {
    if (!enabled) return;
    
    setShakeDetected(true);
    setShowConfirmation(true);
    
    // Auto-dismiss after 10 seconds if no action
    setTimeout(() => {
      setShakeDetected(false);
      setShowConfirmation(false);
    }, 10000);
  }, [enabled]);

  const { isSupported, hasPermission, requestPermission } = useShakeDetection({
    enabled,
    threshold: 25, // Adjust sensitivity
    timeout: 2000, // Debounce
    onShake: handleShake,
  });

  const handleConfirmSOS = () => {
    setShowConfirmation(false);
    setShakeDetected(false);
    onSOSTrigger();
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setShakeDetected(false);
  };

  // Request permission on iOS if needed
  useEffect(() => {
    if (enabled && isSupported && hasPermission === null) {
      // Will be triggered by user gesture in settings
    }
  }, [enabled, isSupported, hasPermission]);

  if (!enabled || !isSupported) return null;

  return (
    <>
      <SOSConfirmationDialog
        isOpen={showConfirmation}
        onConfirm={handleConfirmSOS}
        onCancel={handleCancel}
        triggerMethod="shake"
      />
      
      {shakeDetected && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-full animate-pulse flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Shake detected!
        </div>
      )}
    </>
  );
};

export default ShakeDetector;
