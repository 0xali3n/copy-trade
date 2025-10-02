-- Setup Supabase Storage for profile images
-- Run this in your Supabase SQL Editor

-- Create the avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for authenticated users to upload their own profile images
CREATE POLICY "Users can upload their own profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Create policy for authenticated users to update their own profile images
CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Create policy for authenticated users to delete their own profile images
CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Create policy for anyone to view profile images (public read)
CREATE POLICY "Profile images are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Optional: Create a function to automatically delete old profile images when new ones are uploaded
CREATE OR REPLACE FUNCTION delete_old_profile_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old profile image if it exists
  DELETE FROM storage.objects 
  WHERE bucket_id = 'avatars' 
    AND name LIKE 'profile-images/' || NEW.name::text || '-%'
    AND name != NEW.name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically clean up old images
CREATE TRIGGER cleanup_old_profile_images
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'avatars' AND NEW.name LIKE 'profile-images/%')
  EXECUTE FUNCTION delete_old_profile_image();
