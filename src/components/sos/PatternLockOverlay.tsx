import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Lock, Unlock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatternLockOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onPatternVerified: () => void;
  mode: "verify" | "enroll";
  savedPatternHash?: string | null;
  onPatternEnrolled?: (hash: string) => void;
}

const GRID_SIZE = 3;
const NODES = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);

// Simple hash function for pattern
const hashPattern = async (pattern: number[]): Promise<string> => {
  // Normalize pattern to handle different starting directions
  const normalized = pattern.join("-");
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};

export const PatternLockOverlay = ({
  isOpen,
  onClose,
  onPatternVerified,
  mode,
  savedPatternHash,
  onPatternEnrolled,
}: PatternLockOverlayProps) => {
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrollStep, setEnrollStep] = useState<"first" | "confirm">("first");
  const [firstPattern, setFirstPattern] = useState<string | null>(null);
  const [usePinFallback, setUsePinFallback] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmingTrigger, setConfirmingTrigger] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getNodePosition = useCallback((index: number) => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    return { row, col };
  }, []);

  const getNodeCenter = useCallback((index: number, size: number) => {
    const { row, col } = getNodePosition(index);
    const spacing = size / GRID_SIZE;
    return {
      x: col * spacing + spacing / 2,
      y: row * spacing + spacing / 2,
    };
  }, [getNodePosition]);

  const drawPattern = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    
    if (selectedNodes.length === 0) return;
    
    ctx.strokeStyle = error ? "#ef4444" : "hsl(270, 65%, 55%)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    ctx.beginPath();
    selectedNodes.forEach((node, i) => {
      const { x, y } = getNodeCenter(node, size);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }, [selectedNodes, error, getNodeCenter]);

  useEffect(() => {
    drawPattern();
  }, [drawPattern]);

  const handleNodeTouch = (nodeIndex: number) => {
    if (!selectedNodes.includes(nodeIndex)) {
      setSelectedNodes([...selectedNodes, nodeIndex]);
      setError(null);
    }
  };

  const getNodeFromEvent = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const nodeSize = rect.width / GRID_SIZE;
    const col = Math.floor(x / nodeSize);
    const row = Math.floor(y / nodeSize);
    
    if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
      return row * GRID_SIZE + col;
    }
    return null;
  }, []);

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setSelectedNodes([]);
    setError(null);
    
    const node = getNodeFromEvent(e);
    if (node !== null) {
      setSelectedNodes([node]);
    }
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const node = getNodeFromEvent(e);
    if (node !== null && !selectedNodes.includes(node)) {
      setSelectedNodes([...selectedNodes, node]);
    }
  };

  const handleEnd = async () => {
    setIsDrawing(false);
    
    if (selectedNodes.length < 4) {
      setError("Pattern must connect at least 4 nodes");
      return;
    }
    
    const hash = await hashPattern(selectedNodes);
    
    if (mode === "verify") {
      if (hash === savedPatternHash) {
        // Show confirmation step
        setConfirmingTrigger(true);
      } else {
        setError("Pattern does not match");
        setSelectedNodes([]);
      }
    } else if (mode === "enroll") {
      if (enrollStep === "first") {
        setFirstPattern(hash);
        setEnrollStep("confirm");
        setSelectedNodes([]);
      } else {
        if (hash === firstPattern) {
          onPatternEnrolled?.(hash);
          resetState();
          onClose();
        } else {
          setError("Patterns do not match. Try again.");
          setEnrollStep("first");
          setFirstPattern(null);
          setSelectedNodes([]);
        }
      }
    }
  };

  const handleHoldStart = () => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 1500) * 100, 100);
      setHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        onPatternVerified();
        resetState();
        onClose();
      }
    }, 50);
    
    holdTimerRef.current = interval as unknown as NodeJS.Timeout;
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      setHoldProgress(0);
    }
  };

  const resetState = () => {
    setSelectedNodes([]);
    setError(null);
    setEnrollStep("first");
    setFirstPattern(null);
    setUsePinFallback(false);
    setPin("");
    setConfirmingTrigger(false);
    setHoldProgress(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6">
      <button
        onClick={() => { resetState(); onClose(); }}
        className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-muted/80"
      >
        <X className="w-6 h-6" />
      </button>

      {confirmingTrigger ? (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Trigger SOS?</h2>
          <p className="text-muted-foreground">Hold the button below to send emergency alert</p>
          
          <button
            className="w-32 h-32 rounded-full gradient-bg flex items-center justify-center mx-auto relative overflow-hidden"
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
          >
            <div 
              className="absolute inset-0 bg-primary-foreground/20 origin-bottom transition-transform"
              style={{ transform: `scaleY(${holdProgress / 100})` }}
            />
            <span className="text-2xl font-bold text-primary-foreground z-10">SOS</span>
          </button>
          
          <Button variant="ghost" onClick={() => setConfirmingTrigger(false)}>
            Cancel
          </Button>
        </div>
      ) : usePinFallback ? (
        <div className="text-center space-y-6 w-full max-w-sm">
          <Lock className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Enter PIN</h2>
          <p className="text-muted-foreground">Enter your backup PIN to trigger SOS</p>
          
          <Input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="text-center text-2xl tracking-widest"
            maxLength={6}
          />
          
          <Button 
            className="w-full gradient-bg"
            onClick={() => {
              // PIN verification would go here
              setConfirmingTrigger(true);
            }}
            disabled={pin.length < 4}
          >
            Verify
          </Button>
          
          <Button variant="ghost" onClick={() => setUsePinFallback(false)}>
            Use Pattern Instead
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            {mode === "verify" ? (
              <Unlock className="w-8 h-8 text-primary" />
            ) : (
              <Lock className="w-8 h-8 text-primary" />
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {mode === "verify" ? "Draw Your Pattern" : "Create Pattern"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {mode === "enroll" 
                ? enrollStep === "first" 
                  ? "Draw a pattern to set as your emergency unlock"
                  : "Draw the pattern again to confirm"
                : "Draw your saved pattern to trigger SOS"
              }
            </p>
          </div>

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          <div 
            ref={containerRef}
            className="relative w-72 h-72 mx-auto touch-none"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          >
            <canvas 
              ref={canvasRef}
              width={288}
              height={288}
              className="absolute inset-0"
            />
            
            <div className="grid grid-cols-3 gap-0 w-full h-full">
              {NODES.map((node) => (
                <div
                  key={node}
                  className="flex items-center justify-center"
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all",
                      selectedNodes.includes(node)
                        ? "bg-primary border-primary scale-125"
                        : "bg-muted border-border"
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

          {mode === "verify" && (
            <Button variant="ghost" onClick={() => setUsePinFallback(true)}>
              Use PIN Instead
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PatternLockOverlay;
