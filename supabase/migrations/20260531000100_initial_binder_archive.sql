create extension if not exists "pgcrypto";

create type public.card_image_side as enum ('front', 'back');
create type public.card_image_status as enum ('missing', 'pending', 'approved', 'rejected');
create type public.collection_state as enum ('had', 'have', 'want', 'favorite');
create type public.moderation_decision as enum ('submitted', 'approved', 'rejected', 'needs_changes');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  year int not null,
  manufacturer text not null,
  total_cards int not null check (total_cards > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.sets(id) on delete cascade,
  card_number int not null,
  slug text not null unique,
  player_name text not null,
  team text not null,
  team_slug text not null,
  position text,
  is_rookie boolean not null default false,
  is_hall_of_famer boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (set_id, card_number)
);

create table public.card_images (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  side public.card_image_side not null,
  image_url text,
  storage_path text,
  status public.card_image_status not null default 'missing',
  contributor_id uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (card_id, side)
);

create table public.user_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  state public.collection_state not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, card_id, state)
);

create table public.scan_submissions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  side public.card_image_side not null,
  submitted_by uuid references public.profiles(id) on delete set null,
  contributor_email text,
  storage_path text not null,
  image_url text not null,
  status public.card_image_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  scan_submission_id uuid not null references public.scan_submissions(id) on delete cascade,
  moderator_id uuid references public.profiles(id) on delete set null,
  decision public.moderation_decision not null,
  reason text,
  created_at timestamptz not null default now()
);

create index cards_set_id_idx on public.cards(set_id);
create index cards_team_slug_idx on public.cards(team_slug);
create index cards_player_name_idx on public.cards using gin (to_tsvector('english', player_name));
create index card_images_card_id_idx on public.card_images(card_id);
create index scan_submissions_status_idx on public.scan_submissions(status);
create index user_collections_user_id_idx on public.user_collections(user_id);

alter table public.profiles enable row level security;
alter table public.sets enable row level security;
alter table public.cards enable row level security;
alter table public.card_images enable row level security;
alter table public.user_collections enable row level security;
alter table public.scan_submissions enable row level security;
alter table public.moderation_events enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.sets, public.cards, public.card_images to anon, authenticated;
grant select, insert, update, delete on public.user_collections to authenticated;
grant select, insert on public.scan_submissions to authenticated;
grant select, insert on public.moderation_events to authenticated;
grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;

create policy "Public can read sets" on public.sets for select using (true);
create policy "Public can read cards" on public.cards for select using (true);
create policy "Public can read approved or missing card images" on public.card_images
  for select using (status in ('approved', 'missing'));

create policy "Users can read their own profile" on public.profiles
  for select to authenticated using (auth.uid() = id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id and is_admin = false);

create policy "Users can manage their collection states" on public.user_collections
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can submit scans" on public.scan_submissions
  for insert to authenticated with check (auth.uid() = submitted_by);
create policy "Users can read their scan submissions" on public.scan_submissions
  for select to authenticated using (
    auth.uid() = submitted_by
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "Admins can record moderation events" on public.moderation_events
  for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
create policy "Admins can read moderation events" on public.moderation_events
  for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('card-scans', 'card-scans', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Authenticated users can upload card scans" on storage.objects
  for insert to authenticated with check (bucket_id = 'card-scans');
create policy "Public can read card scans" on storage.objects
  for select using (bucket_id = 'card-scans');
