-- Tighten orders RLS: drop over-permissive INSERT policy; orders are created server-side via service role only.
DROP POLICY IF EXISTS "anyone can create orders" ON public.orders;

-- Drop the broad storage listing policy; public bucket files remain accessible via getPublicUrl, but listing is restricted.
DROP POLICY IF EXISTS "public read media" ON storage.objects;

-- Remove publicly-readable coupon codes from site_content; coupon validation must be server-side.
DELETE FROM public.site_content WHERE key = 'coupons';