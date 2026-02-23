-- Create storage buckets for file uploads
-- These buckets will store missions, avatars, and submission proofs

-- Insert mission logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('mission-images', 'mission-images', true)
ON CONFLICT (id) DO NOTHING;

-- Insert user avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Insert submission proofs bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('submission-proofs', 'submission-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for mission-images bucket
CREATE POLICY "Anyone can read mission images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mission-images');

CREATE POLICY "Only admins can upload mission images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'mission-images' AND
    auth.jwt() ->> 'is_admin' = 'true'
  );

-- Create RLS policies for user-avatars bucket
CREATE POLICY "Anyone can read user avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars' AND
    auth.uid() IS NOT NULL
  );

-- Create RLS policies for submission-proofs bucket
CREATE POLICY "Users can read their own submission proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submission-proofs' AND
    (auth.uid() = owner OR auth.jwt() ->> 'is_admin' = 'true')
  );

CREATE POLICY "Authenticated users can upload submission proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'submission-proofs' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins can manage submission proofs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'submission-proofs' AND
    auth.jwt() ->> 'is_admin' = 'true'
  );
