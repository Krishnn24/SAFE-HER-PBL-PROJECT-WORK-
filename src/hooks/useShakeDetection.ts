import { useState, useEffect, useCallback, useRef } from "react";

interface UseShakeDetectionProps {
  enabled: boolean;
  threshold?: number;
  timeout?: number;
  onShake: () => void;
}

export const useShakeDetection = ({
  enabled,
  threshold = 15,
  timeout = 1000,
  onShake,
}: UseShakeDetectionProps) => {
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const lastShakeRef = useRef<number>(0);
  const lastAccelerationRef = useRef({ x: 0, y: 0, z: 0 });

  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      if (!enabled) return;

      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const { x, y, z } = acceleration;
      if (x === null || y === null || z === null) return;

      const last = lastAccelerationRef.current;
      const deltaX = Math.abs(x - last.x);
      const deltaY = Math.abs(y - last.y);
      const deltaZ = Math.abs(z - last.z);

      const totalDelta = deltaX + deltaY + deltaZ;

      lastAccelerationRef.current = { x, y, z };

      if (totalDelta > threshold) {
        const now = Date.now();
        if (now - lastShakeRef.current > timeout) {
          lastShakeRef.current = now;
          onShake();
        }
      }
    },
    [enabled, threshold, timeout, onShake]
  );

  const requestPermission = useCallback(async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        setHasPermission(permission === "granted");
        return permission === "granted";
      } catch (e) {
        setHasPermission(false);
        return false;
      }
    } else {
      setHasPermission(true);
      return true;
    }
  }, []);

  useEffect(() => {
    const checkSupport = () => {
      setIsSupported(
        typeof window !== "undefined" &&
          "DeviceMotionEvent" in window &&
          typeof DeviceMotionEvent !== "undefined"
      );
    };

    checkSupport();
  }, []);

  useEffect(() => {
    if (!enabled || !isSupported || hasPermission === false) return;

    if (hasPermission === null) {
      // For iOS 13+ we need to request permission on user gesture
      if (typeof (DeviceMotionEvent as any).requestPermission !== "function") {
        setHasPermission(true);
      }
      return;
    }

    window.addEventListener("devicemotion", handleMotion);
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [enabled, isSupported, hasPermission, handleMotion]);

  return {
    isSupported,
    hasPermission,
    requestPermission,
  };
};
