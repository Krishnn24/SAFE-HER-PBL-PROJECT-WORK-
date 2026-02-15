import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/useUserSettings";
import { User, Save, Loader2, Lock, Smartphone, Mic } from "lucide-react";
import { z } from "zod";
import PatternLockOverlay from "@/components/sos/PatternLockOverlay";

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  phone_number: z.string().min(10, "Valid phone number is required").optional().or(z.literal("")),
  address: z.string().optional(),
  emergency_message: z.string().max(500, "Message too long").optional(),
});

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone_number: string | null;
  address: string | null;
  emergency_message: string | null;
  avatar_url: string | null;
}

const ProfileSettingsSection = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    address: "",
    emergency_message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPatternEnroll, setShowPatternEnroll] = useState(false);
  const { toast } = useToast();
  const { settings, updateSettings, loading: settingsLoading } = useUserSettings();

  // Local state for toggles
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const [discreetRecording, setDiscreetRecording] = useState(true);
  const [hasPattern, setHasPattern] = useState(false);

  useEffect(() => {
    if (settings) {
      setShakeEnabled(settings.shake_enabled ?? false);
      setDiscreetRecording(settings.discreet_recording_enabled ?? true);
      setHasPattern(!!settings.pattern_hash);
    }
  }, [settings]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      } else if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          phone_number: data.phone_number || "",
          address: data.address || "",
          emergency_message: data.emergency_message || "I need help! This is an emergency.",
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setSaving(true);
    setErrors({});

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        phone_number: formData.phone_number || null,
        address: formData.address || null,
        emergency_message: formData.emergency_message || null,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    }
    setSaving(false);
  };

  const handleShakeToggle = async (enabled: boolean) => {
    setShakeEnabled(enabled);
    const success = await updateSettings({ shake_enabled: enabled });
    if (success) {
      toast({
        title: enabled ? "Shake Detection Enabled" : "Shake Detection Disabled",
        description: enabled 
          ? "Shake your device to trigger SOS" 
          : "Shake detection is now off",
      });
    }
  };

  const handleRecordingToggle = async (enabled: boolean) => {
    setDiscreetRecording(enabled);
    await updateSettings({ discreet_recording_enabled: enabled });
  };

  const handlePatternEnrolled = async (hash: string) => {
    const success = await updateSettings({ pattern_hash: hash });
    if (success) {
      setHasPattern(true);
      toast({
        title: "Pattern Saved",
        description: "Your emergency pattern has been set",
      });
    }
  };

  const handleResetPattern = async () => {
    const success = await updateSettings({ pattern_hash: null });
    if (success) {
      setHasPattern(false);
      toast({
        title: "Pattern Reset",
        description: "Your emergency pattern has been removed",
      });
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

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your personal information and emergency triggers</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Your full name"
                  className={errors.full_name ? "border-destructive" : ""}
                />
                {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+1234567890"
                  className={errors.phone_number ? "border-destructive" : ""}
                />
                {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Home Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Your home address"
              />
              <p className="text-xs text-muted-foreground">
                This can be shared with emergency contacts during alerts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_message">Default Emergency Message</Label>
              <Textarea
                id="emergency_message"
                value={formData.emergency_message}
                onChange={(e) => setFormData({ ...formData, emergency_message: e.target.value })}
                placeholder="I need help! This is an emergency."
                rows={3}
                className={errors.emergency_message ? "border-destructive" : ""}
              />
              {errors.emergency_message && (
                <p className="text-sm text-destructive">{errors.emergency_message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This message will be sent to your trusted contacts during an SOS alert
              </p>
            </div>

            {/* Emergency Trigger Settings */}
            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="font-semibold text-foreground">Emergency Triggers</h3>
              
              {/* Shake Detection */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Shake Detection</p>
                    <p className="text-sm text-muted-foreground">Shake your device to trigger SOS</p>
                  </div>
                </div>
                <Switch
                  checked={shakeEnabled}
                  onCheckedChange={handleShakeToggle}
                />
              </div>

              {/* Pattern Lock */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Pattern Unlock SOS</p>
                    <p className="text-sm text-muted-foreground">
                      {hasPattern ? "Pattern is set" : "Draw a pattern to trigger SOS"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {hasPattern && (
                    <Button variant="outline" size="sm" onClick={handleResetPattern}>
                      Reset
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPatternEnroll(true)}
                  >
                    {hasPattern ? "Change" : "Set Pattern"}
                  </Button>
                </div>
              </div>

              {/* Discreet Recording */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Audio Recording</p>
                    <p className="text-sm text-muted-foreground">Record audio when SOS is triggered</p>
                  </div>
                </div>
                <Switch
                  checked={discreetRecording}
                  onCheckedChange={handleRecordingToggle}
                />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="gradient-bg">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <PatternLockOverlay
        isOpen={showPatternEnroll}
        onClose={() => setShowPatternEnroll(false)}
        onPatternVerified={() => {}}
        mode="enroll"
        onPatternEnrolled={handlePatternEnrolled}
      />
    </>
  ); 
  const triggerSOS = async (
  triggerMethod: "manual" | "shake" | "pattern"
) => {
  // 1. Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  // 2. Try getting location (optional but recommended)
  let latitude = null;
  let longitude = null;

  try {
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
    );

    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
  } catch (err) {
    console.warn("Location permission denied");
  }

  // 3. Call Edge Function
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-sos`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trigger_method: triggerMethod,
        latitude,
        longitude,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to trigger SOS");
  }

  return data;
};

};

export default ProfileSettingsSection;
