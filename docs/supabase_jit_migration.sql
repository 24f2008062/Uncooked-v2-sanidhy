-- Phase 4: JIT Password Migration
-- Allows our backend to securely migrate old `scrypt` passwords to Supabase's `bcrypt` on the user's first login.

-- Enable pgcrypto if it isn't already enabled
create extension if not exists pgcrypto;

-- Create a secure function to update a user's password directly in auth.users
create or replace function public.update_user_password(user_email text, new_password text)
returns void as $$
begin
  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf'))
  where email = user_email;
end;
$$ language plpgsql security definer;
