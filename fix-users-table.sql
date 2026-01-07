-- Make center_id nullable to allow registration without a center
ALTER TABLE public.users ALTER COLUMN center_id DROP NOT NULL;

-- Update the foreign key constraint to match your existing centers table
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_center_id_fkey;
ALTER TABLE public.users ADD CONSTRAINT users_center_id_fkey 
    FOREIGN KEY (center_id) REFERENCES public.centers(center_id) ON DELETE SET NULL;