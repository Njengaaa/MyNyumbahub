-- NyumbaHub database schema
-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run

-- ============================================================
-- PROFILES  (extends Supabase's built-in auth.users with role info)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'tenant' check (role in ('tenant', 'landlord')),
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row whenever someone signs up.
-- full_name and role are passed in from the sign-up form as user metadata.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'tenant')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- LISTINGS
-- ============================================================
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid references public.profiles (id) on delete set null,
  title text not null,
  area text not null,
  city text not null,
  lat double precision not null,
  lng double precision not null,
  rent_amount integer not null,
  bedrooms integer not null default 1,
  bathrooms integer not null default 1,
  description text,
  images text[] default '{}',
  created_at timestamp with time zone default now()
);

alter table public.listings enable row level security;

create policy "Listings are viewable by everyone"
  on public.listings for select
  using (true);

create policy "Landlords can create their own listings"
  on public.listings for insert
  with check (auth.uid() = landlord_id);

create policy "Landlords can update their own listings"
  on public.listings for update
  using (auth.uid() = landlord_id);

create policy "Landlords can delete their own listings"
  on public.listings for delete
  using (auth.uid() = landlord_id);

-- ============================================================
-- BOOKINGS  (a tenant requesting to book a listing)
-- ============================================================
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete cascade,
  tenant_id uuid references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamp with time zone default now()
);

alter table public.bookings enable row level security;

create policy "Tenants can view their own bookings"
  on public.bookings for select
  using (auth.uid() = tenant_id);

create policy "Landlords can view bookings on their listings"
  on public.bookings for select
  using (
    exists (
      select 1 from public.listings
      where listings.id = bookings.listing_id
      and listings.landlord_id = auth.uid()
    )
  );

create policy "Tenants can create bookings"
  on public.bookings for insert
  with check (auth.uid() = tenant_id);

create policy "Landlords can update status on their own listings' bookings"
  on public.bookings for update
  using (
    exists (
      select 1 from public.listings
      where listings.id = bookings.listing_id
      and listings.landlord_id = auth.uid()
    )
  );
