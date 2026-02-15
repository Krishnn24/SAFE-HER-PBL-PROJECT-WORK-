-- Add policies requiring authentication to block anonymous access

-- Profiles table: require authentication for any access
CREATE POLICY "Require authentication for profiles"
ON public.profiles
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Trusted contacts table: require authentication for any access
CREATE POLICY "Require authentication for trusted_contacts"
ON public.trusted_contacts
FOR ALL
USING (auth.uid() IS NOT NULL);

-- User roles table: require authentication for any access
CREATE POLICY "Require authentication for user_roles"
ON public.user_roles
FOR ALL
USING (auth.uid() IS NOT NULL);