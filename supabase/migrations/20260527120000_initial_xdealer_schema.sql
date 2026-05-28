create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trading_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('Owner','Admin','Buyer','Appraiser','Remarketing Manager','Read-only')),
  site_team text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_organisation_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organisation_id
  from public.profiles
  where auth_user_id = auth.uid() or id = auth.uid()
  limit 1;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where auth_user_id = auth.uid() or id = auth.uid()
  limit 1;
$$;

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  vrm text not null,
  vin text,
  make text not null,
  model text not null,
  derivative text not null,
  registration_date date not null,
  mileage integer not null check (mileage >= 0),
  fuel_type text not null,
  transmission text not null,
  body_type text not null,
  colour text not null,
  number_of_keys integer not null default 1,
  v5c_status text not null,
  service_history text not null,
  mot_expiry date not null,
  mot_advisories text[] not null default '{}',
  hpi_status text not null,
  source text not null,
  site_team text not null,
  status text not null default 'Intake',
  proposed_offer numeric(12,2) not null default 0,
  assigned_user_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appraisals (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  tyres text not null,
  alloys text not null,
  glass text not null,
  interior text not null,
  paintwork text not null,
  mechanical_notes text not null default '',
  warning_lights text not null default '',
  appraiser_id uuid references public.profiles(id),
  quality_score integer not null default 0 check (quality_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vehicle_id)
);

create table public.damage_entries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  panel_location text not null,
  damage_type text not null,
  severity text not null,
  estimated_repair_category text not null,
  estimated_cost numeric(12,2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  public_url text,
  caption text not null default '',
  created_at timestamptz not null default now()
);

create table public.market_inputs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  cap_clean numeric(12,2) not null default 0,
  cap_average numeric(12,2) not null default 0,
  cap_below numeric(12,2) not null default 0,
  retail_market_estimate numeric(12,2) not null default 0,
  trade_value_estimate numeric(12,2) not null default 0,
  expected_prep_budget numeric(12,2) not null default 0,
  buyer_fees numeric(12,2) not null default 0,
  vendor_fees numeric(12,2) not null default 0,
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vehicle_id)
);

create table public.decision_packs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  overall_recommendation text not null,
  recommended_offer_min numeric(12,2) not null,
  recommended_offer_max numeric(12,2) not null,
  maximum_offer numeric(12,2) not null,
  recommended_reserve numeric(12,2) not null,
  suggested_retail_price numeric(12,2) not null,
  suggested_trade_price numeric(12,2) not null,
  preferred_channel text not null,
  alternative_channel text not null,
  confidence_score integer not null check (confidence_score between 0 and 100),
  data_completeness_score integer not null check (data_completeness_score between 0 and 100),
  appraisal_quality_score integer not null check (appraisal_quality_score between 0 and 100),
  expected_margin numeric(12,2) not null,
  expected_prep_cost numeric(12,2) not null,
  expected_days_to_sale integer not null,
  key_risks jsonb not null default '[]',
  missing_information jsonb not null default '[]',
  damage_commercialisation_summary text not null,
  prep_recommendation text not null,
  channel_recommendation text not null,
  suggested_next_actions jsonb not null default '[]',
  draft_messages jsonb not null default '{}',
  audit_trail jsonb not null default '[]',
  accepted_at timestamptz,
  override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index decision_packs_vehicle_created_idx on public.decision_packs(vehicle_id, created_at desc);

create table public.decision_actions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  decision_pack_id uuid not null references public.decision_packs(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  action text not null,
  override_reason text,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.organisation_rules (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade unique,
  risk_appetite text not null check (risk_appetite in ('Conservative','Balanced','Aggressive')),
  minimum_confidence_for_auto_approval integer not null check (minimum_confidence_for_auto_approval between 0 and 100),
  senior_approval_threshold numeric(12,2) not null,
  retail_vs_auction_margin_threshold numeric(12,2) not null,
  stock_age_review_days integer not null,
  excluded_makes_models jsonb not null default '[]',
  value_bands jsonb not null default '[]',
  channel_rules jsonb not null default '[]',
  site_prep_assumptions jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.outcomes (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  decision_pack_id uuid not null references public.decision_packs(id) on delete cascade,
  actual_purchase_price numeric(12,2) not null default 0,
  actual_prep_cost numeric(12,2) not null default 0,
  actual_channel text not null,
  actual_reserve numeric(12,2),
  actual_hammer_price numeric(12,2),
  actual_retail_sale_price numeric(12,2),
  actual_days_to_sale integer not null default 0,
  actual_margin numeric(12,2) not null default 0,
  price_reductions numeric(12,2) not null default 0,
  buyer_vendor_disputes integer not null default 0,
  reappraisal_adjustments numeric(12,2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vehicle_id, decision_pack_id)
);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  status text not null check (status in ('Mocked','Planned','Connected')),
  description text not null,
  required_credentials jsonb not null default '[]',
  last_sync timestamptz,
  category text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index profiles_organisation_idx on public.profiles(organisation_id);
create index vehicles_organisation_status_idx on public.vehicles(organisation_id, status, created_at desc);
create index appraisals_organisation_vehicle_idx on public.appraisals(organisation_id, vehicle_id);
create index damage_entries_organisation_vehicle_idx on public.damage_entries(organisation_id, vehicle_id);
create index vehicle_photos_organisation_vehicle_idx on public.vehicle_photos(organisation_id, vehicle_id);
create index market_inputs_organisation_vehicle_idx on public.market_inputs(organisation_id, vehicle_id);
create index decision_packs_organisation_vehicle_idx on public.decision_packs(organisation_id, vehicle_id, created_at desc);
create index decision_actions_organisation_vehicle_idx on public.decision_actions(organisation_id, vehicle_id, created_at desc);
create index outcomes_organisation_vehicle_idx on public.outcomes(organisation_id, vehicle_id);
create index integrations_organisation_idx on public.integrations(organisation_id);
create index audit_events_organisation_entity_idx on public.audit_events(organisation_id, entity_type, entity_id, created_at desc);

create trigger set_organisations_updated_at before update on public.organisations for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_vehicles_updated_at before update on public.vehicles for each row execute function public.set_updated_at();
create trigger set_appraisals_updated_at before update on public.appraisals for each row execute function public.set_updated_at();
create trigger set_damage_entries_updated_at before update on public.damage_entries for each row execute function public.set_updated_at();
create trigger set_market_inputs_updated_at before update on public.market_inputs for each row execute function public.set_updated_at();
create trigger set_decision_packs_updated_at before update on public.decision_packs for each row execute function public.set_updated_at();
create trigger set_organisation_rules_updated_at before update on public.organisation_rules for each row execute function public.set_updated_at();
create trigger set_outcomes_updated_at before update on public.outcomes for each row execute function public.set_updated_at();
create trigger set_integrations_updated_at before update on public.integrations for each row execute function public.set_updated_at();

alter table public.organisations enable row level security;
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.appraisals enable row level security;
alter table public.damage_entries enable row level security;
alter table public.vehicle_photos enable row level security;
alter table public.market_inputs enable row level security;
alter table public.decision_packs enable row level security;
alter table public.decision_actions enable row level security;
alter table public.organisation_rules enable row level security;
alter table public.outcomes enable row level security;
alter table public.integrations enable row level security;
alter table public.audit_events enable row level security;

create policy "organisation members can read their organisation"
on public.organisations for select
using (id = public.current_organisation_id());

create policy "authenticated users can create organisations"
on public.organisations for insert
with check (auth.uid() is not null);

create policy "organisation owners can update their organisation"
on public.organisations for update
using (id = public.current_organisation_id() and public.current_user_role() in ('Owner','Admin'))
with check (id = public.current_organisation_id() and public.current_user_role() in ('Owner','Admin'));

create policy "profiles are tenant scoped"
on public.profiles for select
using (organisation_id = public.current_organisation_id());

create policy "profiles can be inserted for tenant"
on public.profiles for insert
with check (
  auth_user_id = auth.uid()
  or (organisation_id = public.current_organisation_id() and public.current_user_role() in ('Owner','Admin'))
);

create policy "profiles can be updated for tenant"
on public.profiles for update
using (organisation_id = public.current_organisation_id() and (public.current_user_role() in ('Owner','Admin') or auth_user_id = auth.uid()))
with check (organisation_id = public.current_organisation_id() and (public.current_user_role() in ('Owner','Admin') or auth_user_id = auth.uid()));

create policy "profiles can be deleted for tenant"
on public.profiles for delete
using (organisation_id = public.current_organisation_id() and public.current_user_role() in ('Owner','Admin'));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'vehicles',
    'appraisals',
    'damage_entries',
    'vehicle_photos',
    'market_inputs',
    'decision_packs',
    'decision_actions',
    'organisation_rules',
    'outcomes',
    'integrations',
    'audit_events'
  ]
  loop
    execute format('create policy "%1$s tenant select" on public.%1$I for select using (organisation_id = public.current_organisation_id())', table_name);
    execute format('create policy "%1$s tenant insert" on public.%1$I for insert with check (organisation_id = public.current_organisation_id() and public.current_user_role() in (''Owner'',''Admin'',''Buyer'',''Appraiser'',''Remarketing Manager''))', table_name);
    execute format('create policy "%1$s tenant update" on public.%1$I for update using (organisation_id = public.current_organisation_id() and public.current_user_role() in (''Owner'',''Admin'',''Buyer'',''Appraiser'',''Remarketing Manager'')) with check (organisation_id = public.current_organisation_id() and public.current_user_role() in (''Owner'',''Admin'',''Buyer'',''Appraiser'',''Remarketing Manager''))', table_name);
    execute format('create policy "%1$s tenant delete" on public.%1$I for delete using (organisation_id = public.current_organisation_id() and public.current_user_role() in (''Owner'',''Admin'',''Buyer'',''Appraiser'',''Remarketing Manager''))', table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', false)
on conflict (id) do nothing;

create policy "vehicle photo objects are tenant scoped"
on storage.objects for select
using (
  bucket_id = 'vehicle-photos'
  and split_part(name, '/', 1)::uuid = public.current_organisation_id()
);

create policy "vehicle photo uploads are tenant scoped"
on storage.objects for insert
with check (
  bucket_id = 'vehicle-photos'
  and split_part(name, '/', 1)::uuid = public.current_organisation_id()
  and public.current_user_role() in ('Owner','Admin','Buyer','Appraiser','Remarketing Manager')
);

create policy "vehicle photo updates are tenant scoped"
on storage.objects for update
using (
  bucket_id = 'vehicle-photos'
  and split_part(name, '/', 1)::uuid = public.current_organisation_id()
  and public.current_user_role() in ('Owner','Admin','Buyer','Appraiser','Remarketing Manager')
)
with check (
  bucket_id = 'vehicle-photos'
  and split_part(name, '/', 1)::uuid = public.current_organisation_id()
  and public.current_user_role() in ('Owner','Admin','Buyer','Appraiser','Remarketing Manager')
);
