/**
 * Discrete Recording Service
 * Handles hidden audio/video recording for emergency situations
 * 
 * IMPORTANT NOTES:
 * - Audio recording works in modern browsers with user permission
 * - Video recording is prepared but works best on mobile with native access
 * - Recordings are stored locally or in Supabase storage
 * - All recordings require user consent/permission
 */

import { supabase } from "@/integrations/supabase/client";

// Recording configuration
const AUDIO_MIME_TYPE = "audio/webm";
const VIDEO_MIME_TYPE = "video/webm";
const MAX_RECORDING_DURATION_MS = 5 * 60 * 1000; // 5 minutes max

interface RecordingState {
  isRecording: boolean;
  type: "audio" | "video" | null;
  startTime: number | null;
  mediaRecorder: MediaRecorder | null;
  stream: MediaStream | null;
  chunks: Blob[];
}

let state: RecordingState = {
  isRecording: false,
  type: null,
  startTime: null,
  mediaRecorder: null,
  stream: null,
  chunks: [],
};

let maxDurationTimer: NodeJS.Timeout | null = null;

/**
 * Check if audio recording is supported
 */
export const isAudioRecordingSupported = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Check if video recording is supported
 */
export const isVideoRecordingSupported = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Request microphone permission
 */
const requestAudioPermission = async (): Promise<MediaStream | null> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    return stream;
  } catch (err) {
    console.error("[Recording] Audio permission denied:", err);
    return null;
  }
};

/**
 * Request camera + microphone permission
 * NOTE: Camera access is more restricted, especially in background
 */
const requestVideoPermission = async (): Promise<MediaStream | null> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        facingMode: "environment", // Rear camera preferred
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    return stream;
  } catch (err) {
    console.error("[Recording] Video permission denied:", err);
    
    // Fall back to audio only
    console.log("[Recording] Falling back to audio only");
    return requestAudioPermission();
  }
};

/**
 * Start discrete audio recording
 * Records in background without visible UI
 */
export const startDiscreteAudioRecording = async (): Promise<boolean> => {
  if (state.isRecording) {
    console.warn("[Recording] Already recording");
    return false;
  }

  if (!isAudioRecordingSupported()) {
    console.error("[Recording] Audio recording not supported");
    return false;
  }

  const stream = await requestAudioPermission();
  if (!stream) return false;

  try {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: AUDIO_MIME_TYPE,
    });

    state = {
      isRecording: true,
      type: "audio",
      startTime: Date.now(),
      mediaRecorder,
      stream,
      chunks: [],
    };

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        state.chunks.push(event.data);
      }
    };

    mediaRecorder.start(1000); // Collect data every second
    console.log("[Recording] Audio recording started (discrete mode)");

    // Auto-stop after max duration
    maxDurationTimer = setTimeout(() => {
      console.log("[Recording] Max duration reached, stopping");
      stopRecording();
    }, MAX_RECORDING_DURATION_MS);

    return true;
  } catch (err) {
    console.error("[Recording] Failed to start audio recording:", err);
    stream.getTracks().forEach((track) => track.stop());
    return false;
  }
};

/**
 * Start discrete video recording
 * NOTE: Video recording in background has limitations on web
 * Works best with native mobile integration (Capacitor)
 * 
 * For native mobile implementation:
 * - Use @capacitor-community/camera-preview for background video
 * - Or implement native foreground service for continuous recording
 */
export const startDiscreteVideoRecording = async (): Promise<boolean> => {
  if (state.isRecording) {
    console.warn("[Recording] Already recording");
    return false;
  }

  if (!isVideoRecordingSupported()) {
    console.error("[Recording] Video recording not supported");
    return false;
  }

  console.log("[Recording] Requesting video permission...");
  console.log("[Recording] NOTE: Background video recording works best on native mobile");

  const stream = await requestVideoPermission();
  if (!stream) return false;

  // Check if we actually got video or just audio
  const hasVideo = stream.getVideoTracks().length > 0;
  
  try {
    const mimeType = hasVideo ? VIDEO_MIME_TYPE : AUDIO_MIME_TYPE;
    const mediaRecorder = new MediaRecorder(stream, { mimeType });

    state = {
      isRecording: true,
      type: hasVideo ? "video" : "audio",
      startTime: Date.now(),
      mediaRecorder,
      stream,
      chunks: [],
    };

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        state.chunks.push(event.data);
      }
    };

    mediaRecorder.start(1000);
    console.log(`[Recording] ${hasVideo ? "Video" : "Audio (fallback)"} recording started`);

    maxDurationTimer = setTimeout(() => {
      console.log("[Recording] Max duration reached, stopping");
      stopRecording();
    }, MAX_RECORDING_DURATION_MS);

    return true;
  } catch (err) {
    console.error("[Recording] Failed to start video recording:", err);
    stream.getTracks().forEach((track) => track.stop());
    return false;
  }
};

/**
 * Stop current recording and return the recorded blob
 */
export const stopRecording = async (): Promise<Blob | null> => {
  if (!state.isRecording || !state.mediaRecorder) {
    console.warn("[Recording] Not currently recording");
    return null;
  }

  // Clear max duration timer
  if (maxDurationTimer) {
    clearTimeout(maxDurationTimer);
    maxDurationTimer = null;
  }

  return new Promise((resolve) => {
    if (!state.mediaRecorder) {
      resolve(null);
      return;
    }

    state.mediaRecorder.onstop = () => {
      // Stop all tracks
      if (state.stream) {
        state.stream.getTracks().forEach((track) => track.stop());
      }

      // Create blob from chunks
      const mimeType = state.type === "video" ? VIDEO_MIME_TYPE : AUDIO_MIME_TYPE;
      const blob = new Blob(state.chunks, { type: mimeType });

      console.log(`[Recording] Stopped. Duration: ${Date.now() - (state.startTime || 0)}ms, Size: ${blob.size} bytes`);

      // Reset state
      state = {
        isRecording: false,
        type: null,
        startTime: null,
        mediaRecorder: null,
        stream: null,
        chunks: [],
      };

      resolve(blob);
    };

    state.mediaRecorder.stop();
  });
};

/**
 * Get current recording status
 */
export const getRecordingStatus = (): {
  isRecording: boolean;
  type: "audio" | "video" | null;
  durationMs: number;
} => {
  return {
    isRecording: state.isRecording,
    type: state.type,
    durationMs: state.startTime ? Date.now() - state.startTime : 0,
  };
};

/**
 * Upload recording to Supabase storage
 */
export const uploadRecording = async (
  userId: string,
  blob: Blob,
  type: "audio" | "video"
): Promise<string | null> => {
  try {
    const ext = type === "video" ? "webm" : "webm";
    const fileName = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("sos-recordings")
      .upload(fileName, blob, {
        contentType: type === "video" ? VIDEO_MIME_TYPE : AUDIO_MIME_TYPE,
      });

    if (error) throw error;

    console.log(`[Recording] Uploaded ${type} recording:`, fileName);
    return fileName;
  } catch (err) {
    console.error("[Recording] Upload failed:", err);
    return null;
  }
};

/**
 * NATIVE MOBILE INTEGRATION NOTES:
 * 
 * For Capacitor/native implementation:
 * 
 * 1. Audio Recording (Background):
 *    - Use @capacitor-community/native-audio for background audio
 *    - Implement as foreground service on Android for reliability
 * 
 * 2. Video Recording (Background):
 *    - Use @capacitor-community/camera-preview
 *    - Requires foreground service with notification on Android
 *    - iOS has strict background camera restrictions
 * 
 * 3. Storage Strategy:
 *    - Save to device first (faster, works offline)
 *    - Upload to Supabase when network available
 *    - Use @capacitor/filesystem for local storage
 * 
 * 4. Permission Handling:
 *    - Request permissions at app startup or first use
 *    - Gracefully handle denied permissions
 *    - Provide clear explanation for why permissions are needed
 */
