-- Phase 4: Database Synchronization Trigger
-- This script ensures that any new user signing up via Supabase Auth is automatically synced 
-- into the existing Prisma `User` table, preventing 500 errors across the application.

-- 1. Create a function to handle the new user insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public."User" (
    id, 
    email, 
    "fullName", 
    "name",
    role, 
    "createdAt", 
    "updatedAt"
  )
  values (
    new.id, -- We map the Supabase UUID to the Prisma ID for new users. Prisma accepts this since its ID is just a String.
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'name', new.email),
    'USER',
    now(),
    now()
  )
  on conflict (email) do nothing; -- If they exist (legacy users), DO NOT overwrite their ID. Let Prisma keep the existing relations.
  
  return new;
end;
$$ language plpgsql security definer;

-- 2. Attach the trigger to the auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
