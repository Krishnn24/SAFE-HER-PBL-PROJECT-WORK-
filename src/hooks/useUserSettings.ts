import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserSettings {
  user_id: string;
  default_message: string | null;
  shake_enabled: boolean | null;
  discreet_recording_enabled: boolean | null;
  pattern_hash: string | null;
}

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Use raw SQL query since types might not be updated yet
    const { data, error } = await supabase
      .rpc('get_user_settings' as never, { p_user_id: user.id } as never)
      .maybeSingle();

    if (error) {
      // Table might not exist yet, try direct query
      const { data: directData, error: directError } = await supabase
        .from("user_settings" as never)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (directError) {
        console.log("Settings table may not exist yet:", directError);
      } else if (directData) {
        setSettings(directData as unknown as UserSettings);
      }
    } else if (data) {
      setSettings(data as unknown as UserSettings);
    }
    setLoading(false);
  }, []);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from("user_settings" as never)
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      let error;
      if (existing) {
        const result = await supabase
          .from("user_settings" as never)
          .update(updates as never)
          .eq("user_id", user.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("user_settings" as never)
          .insert({ user_id: user.id, ...updates } as never);
        error = result.error;
      }

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update settings",
          variant: "destructive",
        });
        return false;
      }

      // Update local state
      setSettings(prev => prev 
        ? { ...prev, ...updates } 
        : { user_id: user.id, default_message: null, shake_enabled: null, discreet_recording_enabled: null, pattern_hash: null, ...updates }
      );
      return true;
    } catch (err) {
      console.error("Error updating settings:", err);
      return false;
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings,
  };
};
