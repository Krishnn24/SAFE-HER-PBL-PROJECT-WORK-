/**
 * Emergency Message Service
 * Prepares and manages emergency messages for trusted contacts
 * 
 * NOTE: Actual SMS/Email sending is disabled behind feature flags
 * Enable FEATURE_FLAGS.SMS_NOTIFICATIONS_ENABLED when Twilio is integrated
 */

import { supabase } from "@/integrations/supabase/client";
import { FEATURE_FLAGS } from "./sosService";

export interface TrustedContact {
  id: string;
  name: string;
  phone_number: string;
  email: string | null;
  is_primary: boolean | null;
}

export interface EmergencyMessage {
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string | null;
  userName: string;
  message: string;
  location: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    googleMapsUrl: string | null;
  };
  timestamp: string;
  alertId: string;
}

/**
 * Fetch all trusted contacts for a user
 */
export const fetchTrustedContacts = async (
  userId: string
): Promise<TrustedContact[]> => {
  try {
    const { data, error } = await supabase
      .from("trusted_contacts")
      .select("*")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("[Emergency Message] Failed to fetch contacts:", err);
    return [];
  }
};

/**
 * Fetch user profile for emergency message personalization
 */
export const fetchUserProfile = async (
  userId: string
): Promise<{ full_name: string | null; emergency_message: string | null; phone_number: string | null }> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, emergency_message, phone_number")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data || { full_name: null, emergency_message: null, phone_number: null };
  } catch (err) {
    console.error("[Emergency Message] Failed to fetch profile:", err);
    return { full_name: null, emergency_message: null, phone_number: null };
  }
};

/**
 * Generate Google Maps URL from coordinates
 */
export const generateMapsUrl = (
  latitude: number | null,
  longitude: number | null
): string | null => {
  if (!latitude || !longitude) return null;
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
};

/**
 * Reverse geocode coordinates to address
 * Uses Nominatim (OpenStreetMap) - free, no API key required
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "ShieldHaven-SafetyApp/1.0",
        },
      }
    );

    if (!response.ok) throw new Error("Geocoding failed");

    const data = await response.json();
    return data.display_name || null;
  } catch (err) {
    console.error("[Emergency Message] Reverse geocoding failed:", err);
    return null;
  }
};

/**
 * Prepare emergency messages for all trusted contacts
 */
export const prepareEmergencyMessages = async (
  userId: string,
  alertId: string,
  latitude: number | null,
  longitude: number | null
): Promise<EmergencyMessage[]> => {
  const [contacts, profile] = await Promise.all([
    fetchTrustedContacts(userId),
    fetchUserProfile(userId),
  ]);

  if (contacts.length === 0) {
    console.log("[Emergency Message] No trusted contacts found");
    return [];
  }

  // Get address from coordinates
  let address: string | null = null;
  if (latitude && longitude) {
    address = await reverseGeocode(latitude, longitude);
  }

  const timestamp = new Date().toISOString();
  const mapsUrl = generateMapsUrl(latitude, longitude);
  const userName = profile.full_name || "A SafeHer user";
  const customMessage = profile.emergency_message || "I need help! This is an emergency.";

  const messages: EmergencyMessage[] = contacts.map((contact) => ({
    recipientName: contact.name,
    recipientPhone: contact.phone_number,
    recipientEmail: contact.email,
    userName,
    message: customMessage,
    location: {
      latitude,
      longitude,
      address,
      googleMapsUrl: mapsUrl,
    },
    timestamp,
    alertId,
  }));

  console.log(`[Emergency Message] Prepared ${messages.length} messages`);
  return messages;
};

/**
 * Format SMS message text
 */
export const formatSMSMessage = (msg: EmergencyMessage): string => {
  let sms = `🚨 EMERGENCY ALERT 🚨\n`;
  sms += `${msg.userName} needs help!\n\n`;
  sms += `Message: ${msg.message}\n\n`;

  if (msg.location.address) {
    sms += `📍 Location: ${msg.location.address}\n`;
  }

  if (msg.location.googleMapsUrl) {
    sms += `🗺️ Map: ${msg.location.googleMapsUrl}\n`;
  }

  if (!msg.location.latitude && !msg.location.longitude) {
    sms += `⚠️ Location unavailable\n`;
  }

  sms += `\nTime: ${new Date(msg.timestamp).toLocaleString()}`;
  sms += `\n\nSent via SafeHer Safety App`;

  return sms;
};

/**
 * Send emergency messages to all contacts
 * 
 * ⚠️ DISABLED: This function is prepared but not active
 * Enable FEATURE_FLAGS.SMS_NOTIFICATIONS_ENABLED when Twilio is integrated
 * 
 * @param messages - Array of prepared emergency messages
 * @returns Object with success status and sent count
 */
export const sendEmergencyMessages = async (
  messages: EmergencyMessage[]
): Promise<{ success: boolean; sentCount: number; errors: string[] }> => {
  const errors: string[] = [];
  let sentCount = 0;

  // Check feature flag
  if (!FEATURE_FLAGS.SMS_NOTIFICATIONS_ENABLED) {
    console.log("[Emergency Message] SMS notifications disabled - feature flag off");
    console.log("[Emergency Message] Would send to:", messages.map(m => m.recipientName));
    
    // Log prepared messages for debugging
    messages.forEach((msg) => {
      console.log(`[Emergency Message] Prepared for ${msg.recipientName}:`, formatSMSMessage(msg));
    });

    return {
      success: true,
      sentCount: 0, // No messages actually sent
      errors: ["SMS notifications not enabled - messages prepared but not sent"],
    };
  }

  // TODO: Integrate with Twilio/SMS service
  // for (const msg of messages) {
  //   try {
  //     await twilioClient.messages.create({
  //       body: formatSMSMessage(msg),
  //       to: msg.recipientPhone,
  //       from: TWILIO_PHONE_NUMBER,
  //     });
  //     sentCount++;
  //   } catch (err) {
  //     errors.push(`Failed to send to ${msg.recipientName}: ${err}`);
  //   }
  // }

  return {
    success: errors.length === 0,
    sentCount,
    errors,
  };
};
