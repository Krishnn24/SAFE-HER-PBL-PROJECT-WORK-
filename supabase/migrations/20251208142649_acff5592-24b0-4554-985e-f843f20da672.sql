-- Add DELETE policy for emergency_incidents so users can delete their own incidents
CREATE POLICY "Users can delete their own incidents"
ON public.emergency_incidents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);