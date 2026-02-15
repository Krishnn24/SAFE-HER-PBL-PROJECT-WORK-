/**
 * Shake Detection Service
 * Abstraction layer for shake-to-trigger SOS functionality
 * 
 * NOTE: Browser DeviceMotion API has limited support
 * This is prepared for Capacitor/native Android integration
 * 
 * For native mobile:
 * - Use @capacitor/motion plugin
 * - Register native shake listeners in native code
 * - Bridge events to web layer via Capacitor
 */

type ShakeCallback = () => void;

// Configuration
const DEFAULT_SHAKE_THRESHOLD = 15; // Acceleration threshold in m/s²
const SHAKE_TIMEOUT_MS = 1000; // Cooldown between shake detections

interface ShakeConfig {
  threshold: number;
  timeout: number;
  enabled: boolean;
}

let config: ShakeConfig = {
  threshold: DEFAULT_SHAKE_THRESHOLD,
  timeout: SHAKE_TIMEOUT_MS,
  enabled: false,
};

let onShakeCallback: ShakeCallback | null = null;
let lastShakeTime = 0;
let lastAcceleration = { x: 0, y: 0, z: 0 };

/**
 * Check if device motion is supported
 * NOTE: Many browsers restrict this API to secure contexts (HTTPS)
 * and may require user permission on iOS
 */
export const isShakeDetectionSupported = (): boolean => {
  return "DeviceMotionEvent" in window;
};

/**
 * Request permission for device motion (required on iOS 13+)
 */
export const requestShakePermission = async (): Promise<boolean> => {
  if (!isShakeDetectionSupported()) {
    console.warn("[Shake] DeviceMotionEvent not supported");
    return false;
  }

  // iOS 13+ requires explicit permission
  // @ts-ignore - DeviceMotionEvent.requestPermission is iOS-specific
  if (typeof DeviceMotionEvent.requestPermission === "function") {
    try {
      // @ts-ignore
      const permission = await DeviceMotionEvent.requestPermission();
      return permission === "granted";
    } catch (err) {
      console.error("[Shake] Permission request failed:", err);
      return false;
    }
  }

  // Other platforms don't need permission
  return true;
};

/**
 * Handle device motion event
 */
const handleMotion = (event: DeviceMotionEvent): void => {
  if (!config.enabled || !onShakeCallback) return;

  const acc = event.accelerationIncludingGravity;
  if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

  // Calculate delta from last reading
  const deltaX = Math.abs(acc.x - lastAcceleration.x);
  const deltaY = Math.abs(acc.y - lastAcceleration.y);
  const deltaZ = Math.abs(acc.z - lastAcceleration.z);

  // Update last acceleration
  lastAcceleration = { x: acc.x, y: acc.y, z: acc.z };

  // Check if shake threshold exceeded
  const totalDelta = deltaX + deltaY + deltaZ;
  if (totalDelta > config.threshold) {
    const now = Date.now();
    if (now - lastShakeTime > config.timeout) {
      lastShakeTime = now;
      console.log("[Shake] Shake detected! Delta:", totalDelta);
      onShakeCallback();
    }
  }
};

/**
 * Enable shake detection
 * 
 * @param callback - Function to call when shake is detected
 * @param threshold - Optional custom threshold (default: 15)
 */
export const enableShakeDetection = (
  callback: ShakeCallback,
  threshold?: number
): boolean => {
  if (!isShakeDetectionSupported()) {
    console.warn("[Shake] Not supported on this device/browser");
    console.log("[Shake] For native mobile, use Capacitor @capacitor/motion plugin");
    return false;
  }

  onShakeCallback = callback;
  config.enabled = true;
  if (threshold) config.threshold = threshold;

  window.addEventListener("devicemotion", handleMotion);
  console.log("[Shake] Detection enabled, threshold:", config.threshold);

  return true;
};

/**
 * Disable shake detection
 */
export const disableShakeDetection = (): void => {
  config.enabled = false;
  onShakeCallback = null;
  window.removeEventListener("devicemotion", handleMotion);
  console.log("[Shake] Detection disabled");
};

/**
 * Update shake detection settings
 */
export const updateShakeConfig = (newConfig: Partial<ShakeConfig>): void => {
  config = { ...config, ...newConfig };
  console.log("[Shake] Config updated:", config);
};

/**
 * Get current shake detection status
 */
export const getShakeStatus = (): {
  supported: boolean;
  enabled: boolean;
  threshold: number;
} => {
  return {
    supported: isShakeDetectionSupported(),
    enabled: config.enabled,
    threshold: config.threshold,
  };
};

/**
 * NATIVE INTEGRATION NOTE:
 * 
 * For Capacitor/native Android integration:
 * 
 * 1. Install: npm install @capacitor/motion
 * 
 * 2. In native Android code (MainActivity.java or similar):
 *    - Register SensorEventListener for ACCELEROMETER
 *    - Detect shake pattern using acceleration delta
 *    - Send event to web layer via Capacitor bridge
 * 
 * 3. In web code:
 *    import { Motion } from '@capacitor/motion';
 *    
 *    Motion.addListener('accel', (event) => {
 *      // Process acceleration data
 *      // Detect shake and trigger SOS
 *    });
 * 
 * 4. The enableShakeDetection/disableShakeDetection functions
 *    can be extended to use native APIs when available
 */
