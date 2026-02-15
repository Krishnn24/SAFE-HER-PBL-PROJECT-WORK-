-- Create user_settings table with RLS
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_message TEXT,
  shake_enabled BOOLEAN DEFAULT false,
  discreet_recording_enabled BOOLEAN DEFAULT true,
  pattern_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Require authentication (restrictive base policy)
CREATE POLICY "Require authentication for user_settings"
ON public.user_settings AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- Users can view their own settings
CREATE POLICY "Users can view own settings"
ON public.user_settings FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
ON public.user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
ON public.user_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete own settings"
ON public.user_settings FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create private storage bucket for SOS recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('sos-recordings', 'sos-recordings', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage RLS policies for sos-recordings bucket
CREATE POLICY "Users can upload their own recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sos-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'sos-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'sos-recordings' AND public.has_role(auth.uid(), 'admin'));