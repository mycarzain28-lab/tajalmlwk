-- Public read access for media bucket; block client-side writes.
-- All writes go through admin server functions using service role (which bypasses RLS).

CREATE POLICY "Public can read media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'media');

CREATE POLICY "Deny client inserts on media"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Deny client updates on media"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny client deletes on media"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (false);
