
-- MyCar schema
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_desc text,
  long_desc text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  old_price numeric(12,2),
  images text[] not null default '{}',
  video_url text,
  rating numeric(2,1) not null default 5.0,
  is_bestseller boolean not null default false,
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  price text not null,
  old_price text,
  features text[] not null default '{}',
  badge text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_number text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  wallet_name text,
  total numeric(12,2) not null default 0,
  items jsonb not null default '[]',
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- RLS
alter table public.categories enable row level security;
alter table public.service_categories enable row level security;
alter table public.products enable row level security;
alter table public.packages enable row level security;
alter table public.wallets enable row level security;
alter table public.site_content enable row level security;
alter table public.orders enable row level security;

-- Public read for catalog
create policy "public read categories" on public.categories for select using (true);
create policy "public read services" on public.service_categories for select using (true);
create policy "public read products" on public.products for select using (true);
create policy "public read packages" on public.packages for select using (true);
create policy "public read wallets" on public.wallets for select using (true);
create policy "public read content" on public.site_content for select using (true);
-- Orders write open for now (admin reads via service role server-side)
create policy "public insert orders" on public.orders for insert with check (true);
