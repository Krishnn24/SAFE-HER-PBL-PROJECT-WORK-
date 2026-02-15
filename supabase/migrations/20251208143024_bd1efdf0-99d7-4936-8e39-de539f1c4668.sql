-- Add RESTRICTIVE authentication policy for emergency_incidents table
-- This ensures defense-in-depth by explicitly blocking unauthenticated access
CREATE POLICY "Require authentication for emergency_incidents"
ON public.emergency_incidents
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (auth.uid() IS NOT NULL);