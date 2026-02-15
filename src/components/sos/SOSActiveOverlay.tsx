/**
 * SOS Active Overlay
 * Displays when an SOS alert is active with status and controls
 */

import { useState } from "react";
import { useSOSContext } from "@/contexts/SOSContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, MapPin, Loader2, X, Check, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export const SOSActiveOverlay = () => {
  const { isSOSActive, activeAlert, lastLocation, endSOS, cancelSOS } = useSOSContext();
  const [isEnding, setIsEnding] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState<"end" | "cancel" | null>(null);

  if (!isSOSActive || !activeAlert) return null;

  const handleEndSOS = async () => {
    setIsEnding(true);
    await endSOS();
    setIsEnding(false);
    setShowConfirm(null);
  };

  const handleCancelSOS = async () => {
    setIsCancelling(true);
    await cancelSOS();
    setIsCancelling(false);
    setShowConfirm(null);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="fixed inset-x-0 top-20 z-40 px-4 animate-slide-up">
      <Card className="max-w-md mx-auto border-destructive/50 bg-destructive/5 backdrop-blur-lg shadow-lg">
        <CardContent className="p-4">
          {/* Active Status */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-destructive flex items-center gap-2">
                <Radio className="w-4 h-4 animate-pulse" />
                SOS ACTIVE
              </h3>
              <p className="text-sm text-muted-foreground">
                Started at {formatTime(activeAlert.created_at)}
              </p>
            </div>
          </div>

          {/* Location Status */}
          <div className="flex items-center gap-2 text-sm mb-4 p-2 bg-muted/50 rounded-lg">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            {lastLocation ? (
              <span className="text-foreground">
                Location tracking active ({lastLocation.latitude.toFixed(4)}, {lastLocation.longitude.toFixed(4)})
              </span>
            ) : (
              <span className="text-muted-foreground">
                Location unavailable
              </span>
            )}
          </div>

          {/* Confirm Dialog */}
          {showConfirm && (
            <div className="mb-4 p-3 bg-card border border-border rounded-lg">
              <p className="text-sm text-foreground mb-3">
                {showConfirm === "end" 
                  ? "Are you safe? This will end the SOS alert."
                  : "Cancel this alert? (False alarm)"
                }
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfirm(null)}
                  className="flex-1"
                >
                  Go Back
                </Button>
                <Button
                  size="sm"
                  variant={showConfirm === "end" ? "default" : "destructive"}
                  onClick={showConfirm === "end" ? handleEndSOS : handleCancelSOS}
                  disabled={isEnding || isCancelling}
                  className={cn("flex-1", showConfirm === "end" && "bg-green-600 hover:bg-green-700")}
                >
                  {(isEnding || isCancelling) && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {showConfirm === "end" ? "I'm Safe" : "Cancel Alert"}
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!showConfirm && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm("cancel")}
                className="flex-1 text-muted-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                False Alarm
              </Button>
              <Button
                size="sm"
                onClick={() => setShowConfirm("end")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-1" />
                I'm Safe
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SOSActiveOverlay;
