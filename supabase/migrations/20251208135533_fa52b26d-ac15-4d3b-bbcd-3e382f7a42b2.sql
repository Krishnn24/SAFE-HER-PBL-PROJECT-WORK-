-- Fix 1: Add RESTRICTIVE authentication policy for sos_alerts table
CREATE POLICY "Require authentication for sos_alerts"
ON public.sos_alerts
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (auth.uid() IS NOT NULL);

-- Fix 2: Add UPDATE policy for emergency_incidents so users can update their own incidents
CREATE POLICY "Users can update their own incidents"
ON public.emergency_incidents
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);