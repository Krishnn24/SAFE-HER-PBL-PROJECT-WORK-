/**
 * SMS Fallback Service
 * Sends emergency SMS directly from the device, completely bypassing the
 * internet — no Supabase call, no Twilio, no backend of any kind. This is
 * what keeps SOS working when there's no data connection, which is common
 * during exactly the situations this app exists for (parking garages,
 * remote areas, crowded events overloading cell data).
 *
 * Two delivery paths:
 *  - Native (installed Android/iOS APK via Capacitor): uses the device's
 *    own SMS radio through @byteowls/capacitor-sms. Sends silently, same as
 *    a normal text message — works with zero data connection, only needs
 *    cellular signal for SMS (which works even when data doesn't).
 *  - Browser (testing in a normal browser, or installed as a PWA): falls
 *    back to the `sms:` URI scheme, which opens the device's Messages app
 *    pre-filled. Browsers can't send SMS silently, so this still needs one
 *    tap to hit Send — but it requires no network call to get there.
 */

import { Capacitor } from "@capacitor/core";
import { SmsManager } from "@byteowls/capacitor-sms";
import { formatSMSMessage, type EmergencyMessage } from "./emergencyMessageService";

export const isOnline = (): boolean =>
  typeof navigator === "undefined" ? true : navigator.onLine;

export interface SMSFallbackResult {
  attempted: number;
  method: "native" | "uri" | "none";
  error?: string;
}

/**
 * Send the SOS message directly via device SMS, no internet required.
 */
export const sendOfflineSMSFallback = async (
  messages: EmergencyMessage[]
): Promise<SMSFallbackResult> => {
  if (messages.length === 0) {
    return { attempted: 0, method: "none", error: "No trusted contacts available offline" };
  }

  if (Capacitor.isNativePlatform()) {
    const numbers = messages.map((m) => m.recipientPhone).filter(Boolean);
    // Sent as one batch with a shared body. If per-contact personalization
    // is ever needed, loop and call SmsManager.send once per contact instead.
    const body = formatSMSMessage(messages[0]);

    try {
      await SmsManager.send({ numbers, text: body });
      return { attempted: numbers.length, method: "native" };
    } catch (err) {
      console.error("[SMS Fallback] Native SMS send failed:", err);
      return {
        attempted: 0,
        method: "none",
        error: err instanceof Error ? err.message : "Native SMS failed",
      };
    }
  }

  // Browser fallback — the sms: URI reliably supports only one recipient
  // across devices/OSes, so open it for the primary contact.
  const primary = messages[0];
  const body = encodeURIComponent(formatSMSMessage(primary));
  window.location.href = `sms:${primary.recipientPhone}?body=${body}`;
  return { attempted: 1, method: "uri" };
};
