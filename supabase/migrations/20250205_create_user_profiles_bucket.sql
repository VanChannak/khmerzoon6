 -- Create user-profiles storage bucket
 INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
 VALUES (
   'user-profiles',
   'user-profiles',
   true,
   5242880, -- 5MB limit
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
 )
 ON CONFLICT (id) DO NOTHING;
 
 -- Allow authenticated users to upload their own profile images
 CREATE POLICY "Users can upload their own profile images"
 ON storage.objects FOR INSERT
 TO authenticated
 WITH CHECK (
   bucket_id = 'user-profiles' AND
   auth.uid()::text = (storage.foldername(name))[1]
 );
 
 -- Allow authenticated users to update their own profile images
 CREATE POLICY "Users can update their own profile images"
 ON storage.objects FOR UPDATE
 TO authenticated
 USING (
   bucket_id = 'user-profiles' AND
   auth.uid()::text = (storage.foldername(name))[1]
 );
 
 -- Allow authenticated users to delete their own profile images
 CREATE POLICY "Users can delete their own profile images"
 ON storage.objects FOR DELETE
 TO authenticated
 USING (
   bucket_id = 'user-profiles' AND
   auth.uid()::text = (storage.foldername(name))[1]
 );
 
 -- Allow public read access to all profile images
 CREATE POLICY "Public read access for profile images"
 ON storage.objects FOR SELECT
 TO public
 USING (bucket_id = 'user-profiles');