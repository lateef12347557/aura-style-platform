-- Create public bucket 'images' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for storage.objects
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'images');

CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'images');

CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'images');
