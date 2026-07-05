
-- Restore EXECUTE on warranty helper functions to authenticated/anon so RLS policies and RPC calls work.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon, service_role;

REVOKE ALL ON FUNCTION public.get_user_branch(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_branch(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.generate_warranty_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_warranty_number() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.compute_expiry_date(date, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_expiry_date(date, integer) TO authenticated, anon, service_role;

REVOKE ALL ON FUNCTION public.verify_warranty_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_warranty_public(text) TO authenticated, anon, service_role;

-- Ensure admin role exists for the primary admin account (idempotent).
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'mycarzain28@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
