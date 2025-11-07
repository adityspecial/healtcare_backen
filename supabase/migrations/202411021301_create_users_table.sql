-- Create custom types if they don't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'pathologist', 'attendant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  user_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  phone_number character varying NOT NULL UNIQUE,
  role user_role DEFAULT 'patient'::user_role,
  profile_completed boolean DEFAULT false,
  full_name character varying,
  password_hash text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active boolean DEFAULT true,
  CONSTRAINT users_pkey PRIMARY KEY (user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage all users (for backend operations)
CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');