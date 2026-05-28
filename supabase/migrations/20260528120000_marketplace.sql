alter table public.decision_packs
add column if not exists marketplace_recommendation jsonb;

create table public.dealer_profiles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade unique,
  trading_name text not null,
  company_number text not null,
  vat_number text,
  fca_status_note text,
  address text not null,
  postcode_area text not null,
  contact_name text not null,
  phone text not null,
  email text not null,
  website text,
  description text not null,
  stock_wanted text not null,
  stock_not_wanted text not null,
  preferred_makes text[] not null default '{}',
  excluded_makes text[] not null default '{}',
  preferred_body_types text[] not null default '{}',
  preferred_fuel_types text[] not null default '{}',
  min_vehicle_age integer not null default 0,
  max_vehicle_age integer not null default 15,
  min_mileage integer not null default 0,
  max_mileage integer not null default 150000,
  min_price numeric(12,2) not null default 0,
  max_price numeric(12,2) not null default 100000,
  transport_radius_miles integer not null default 100,
  verified_status text not null default 'Pending',
  rating numeric(3,2) not null default 0,
  trade_terms text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  seller_profile_id uuid not null references public.dealer_profiles(id),
  listing_type text not null check (listing_type in ('Fixed price','Best offer','Timed auction','Buy it now','Trade-only enquiry')),
  status text not null default 'Draft' check (status in ('Draft','Live','Under offer','Reserved','Sold','Expired','Withdrawn')),
  title text not null,
  description text not null default '',
  asking_price numeric(12,2) not null default 0,
  reserve_price numeric(12,2) not null default 0,
  buy_now_price numeric(12,2),
  minimum_offer numeric(12,2) not null default 0,
  bid_increment numeric(12,2) not null default 100,
  current_highest_bid numeric(12,2),
  current_highest_bid_id uuid,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  visibility_type text not null check (visibility_type in ('All approved dealers','Selected dealer groups','Local dealers only','Dealers matching stock profile','Private invite-only')),
  location text not null,
  postcode_area text not null,
  vat_margin_note text not null default '',
  buyer_fee_note text,
  seller_declaration_accepted boolean not null default false,
  bodywork_summary text not null default '',
  interior_summary text not null default '',
  mechanical_summary text not null default '',
  known_issues text not null default '',
  prep_recommendation text not null default '',
  audit_notes jsonb not null default '[]',
  documents jsonb not null default '[]',
  views integer not null default 0,
  watchers integer not null default 0,
  published_at timestamptz,
  sold_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marketplace_listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  vehicle_photo_id uuid not null references public.vehicle_photos(id) on delete cascade,
  is_primary boolean not null default false,
  is_visible boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.marketplace_bids (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  bidder_organisation_id uuid not null references public.organisations(id) on delete cascade,
  bidder_user_id uuid references public.profiles(id),
  amount numeric(12,2) not null check (amount >= 0),
  status text not null check (status in ('Draft','Submitted','Leading','Outbid','Accepted','Rejected','Withdrawn','Expired','Sold','Completed')),
  message text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketplace_listings
add constraint marketplace_listings_current_highest_bid_fk
foreign key (current_highest_bid_id) references public.marketplace_bids(id);

create table public.marketplace_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  buyer_organisation_id uuid not null references public.organisations(id) on delete cascade,
  buyer_user_id uuid references public.profiles(id),
  seller_organisation_id uuid not null references public.organisations(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null check (status in ('Draft','Submitted','Accepted','Rejected','Countered','Withdrawn','Expired','Sold','Completed')),
  message text not null default '',
  counter_amount numeric(12,2),
  counter_message text,
  next_steps jsonb not null default '[]',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marketplace_questions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  buyer_organisation_id uuid not null references public.organisations(id) on delete cascade,
  buyer_user_id uuid references public.profiles(id),
  question text not null,
  answer text,
  answered_by uuid references public.profiles(id),
  answered_at timestamptz,
  visibility text not null check (visibility in ('Approved dealers','Private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marketplace_watchlist (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (listing_id, organisation_id, user_id)
);

create table public.marketplace_analysis (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  buyer_organisation_id uuid not null references public.organisations(id) on delete cascade,
  decision_pack_id uuid references public.decision_packs(id) on delete set null,
  fit_score integer not null check (fit_score between 0 and 100),
  fit_label text not null check (fit_label in ('Excellent fit','Good fit','Possible fit','Poor fit')),
  recommended_max_bid numeric(12,2) not null default 0,
  expected_margin numeric(12,2) not null default 0,
  risk_rating text not null check (risk_rating in ('Low','Medium','High','Critical')),
  analysis_json jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_organisation_id)
);

create table public.marketplace_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid references public.profiles(id),
  event_type text not null,
  event_json jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index dealer_profiles_organisation_idx on public.dealer_profiles(organisation_id);
create index marketplace_listings_status_idx on public.marketplace_listings(status, published_at desc);
create index marketplace_listings_organisation_idx on public.marketplace_listings(organisation_id, status, created_at desc);
create index marketplace_listing_photos_listing_idx on public.marketplace_listing_photos(listing_id, sort_order);
create index marketplace_bids_listing_idx on public.marketplace_bids(listing_id, amount desc, created_at desc);
create index marketplace_bids_bidder_idx on public.marketplace_bids(bidder_organisation_id, created_at desc);
create index marketplace_offers_listing_idx on public.marketplace_offers(listing_id, created_at desc);
create index marketplace_offers_buyer_idx on public.marketplace_offers(buyer_organisation_id, created_at desc);
create index marketplace_questions_listing_idx on public.marketplace_questions(listing_id, created_at desc);
create index marketplace_watchlist_org_idx on public.marketplace_watchlist(organisation_id, user_id, created_at desc);
create index marketplace_analysis_buyer_idx on public.marketplace_analysis(buyer_organisation_id, created_at desc);
create index marketplace_events_listing_idx on public.marketplace_events(listing_id, created_at desc);

create trigger set_dealer_profiles_updated_at before update on public.dealer_profiles for each row execute function public.set_updated_at();
create trigger set_marketplace_listings_updated_at before update on public.marketplace_listings for each row execute function public.set_updated_at();
create trigger set_marketplace_bids_updated_at before update on public.marketplace_bids for each row execute function public.set_updated_at();
create trigger set_marketplace_offers_updated_at before update on public.marketplace_offers for each row execute function public.set_updated_at();
create trigger set_marketplace_questions_updated_at before update on public.marketplace_questions for each row execute function public.set_updated_at();

alter table public.dealer_profiles enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_listing_photos enable row level security;
alter table public.marketplace_bids enable row level security;
alter table public.marketplace_offers enable row level security;
alter table public.marketplace_questions enable row level security;
alter table public.marketplace_watchlist enable row level security;
alter table public.marketplace_analysis enable row level security;
alter table public.marketplace_events enable row level security;

create policy "approved organisations can read dealer profiles"
on public.dealer_profiles for select
using (public.current_organisation_id() is not null);

create policy "organisations manage their dealer profile"
on public.dealer_profiles for all
using (organisation_id = public.current_organisation_id() and public.current_user_role() in ('Owner','Admin'))
with check (organisation_id = public.current_organisation_id() and public.current_user_role() in ('Owner','Admin'));

create policy "sellers and approved dealers can read listings"
on public.marketplace_listings for select
using (
  organisation_id = public.current_organisation_id()
  or (
    status = 'Live'
    and public.current_organisation_id() is not null
    and visibility_type in ('All approved dealers','Selected dealer groups','Local dealers only','Dealers matching stock profile')
  )
);

create policy "sellers can create listings"
on public.marketplace_listings for insert
with check (organisation_id = public.current_organisation_id() and public.current_user_role() in ('Owner','Admin','Buyer','Remarketing Manager'));

create policy "sellers can manage listings"
on public.marketplace_listings for update
using (organisation_id = public.current_organisation_id() and public.current_user_role() in ('Owner','Admin','Buyer','Remarketing Manager'))
with check (organisation_id = public.current_organisation_id() and public.current_user_role() in ('Owner','Admin','Buyer','Remarketing Manager'));

create policy "sellers can delete draft listings"
on public.marketplace_listings for delete
using (organisation_id = public.current_organisation_id() and status = 'Draft' and public.current_user_role() in ('Owner','Admin','Buyer','Remarketing Manager'));

create policy "listing photos follow listing visibility"
on public.marketplace_listing_photos for select
using (
  exists (
    select 1 from public.marketplace_listings l
    where l.id = listing_id
    and (
      l.organisation_id = public.current_organisation_id()
      or (l.status = 'Live' and is_visible and public.current_organisation_id() is not null)
    )
  )
);

create policy "sellers manage listing photos"
on public.marketplace_listing_photos for all
using (
  exists (
    select 1 from public.marketplace_listings l
    where l.id = listing_id
    and l.organisation_id = public.current_organisation_id()
    and public.current_user_role() in ('Owner','Admin','Buyer','Remarketing Manager')
  )
)
with check (
  exists (
    select 1 from public.marketplace_listings l
    where l.id = listing_id
    and l.organisation_id = public.current_organisation_id()
    and public.current_user_role() in ('Owner','Admin','Buyer','Remarketing Manager')
  )
);

create policy "buyers and sellers can read bids"
on public.marketplace_bids for select
using (
  bidder_organisation_id = public.current_organisation_id()
  or exists (
    select 1 from public.marketplace_listings l
    where l.id = listing_id and l.organisation_id = public.current_organisation_id()
  )
);

create policy "buyers can place bids"
on public.marketplace_bids for insert
with check (bidder_organisation_id = public.current_organisation_id() and public.current_user_role() in ('Owner','Admin','Buyer','Remarketing Manager'));

create policy "buyers and sellers can update bid workflow"
on public.marketplace_bids for update
using (
  bidder_organisation_id = public.current_organisation_id()
  or exists (
    select 1 from public.marketplace_listings l
    where l.id = listing_id and l.organisation_id = public.current_organisation_id()
  )
)
with check (
  bidder_organisation_id = public.current_organisation_id()
  or exists (
    select 1 from public.marketplace_listings l
    where l.id = listing_id and l.organisation_id = public.current_organisation_id()
  )
);

create policy "buyers and sellers can read offers"
on public.marketplace_offers for select
using (buyer_organisation_id = public.current_organisation_id() or seller_organisation_id = public.current_organisation_id());

create policy "buyers can make offers"
on public.marketplace_offers for insert
with check (buyer_organisation_id = public.current_organisation_id() and public.current_user_role() in ('Owner','Admin','Buyer','Remarketing Manager'));

create policy "buyers and sellers can update offer workflow"
on public.marketplace_offers for update
using (buyer_organisation_id = public.current_organisation_id() or seller_organisation_id = public.current_organisation_id())
with check (buyer_organisation_id = public.current_organisation_id() or seller_organisation_id = public.current_organisation_id());

create policy "questions follow visibility"
on public.marketplace_questions for select
using (
  buyer_organisation_id = public.current_organisation_id()
  or visibility = 'Approved dealers'
  or exists (
    select 1 from public.marketplace_listings l
    where l.id = listing_id and l.organisation_id = public.current_organisation_id()
  )
);

create policy "buyers can ask questions"
on public.marketplace_questions for insert
with check (buyer_organisation_id = public.current_organisation_id() and public.current_user_role() in ('Owner','Admin','Buyer','Remarketing Manager'));

create policy "buyers and sellers can update questions"
on public.marketplace_questions for update
using (
  buyer_organisation_id = public.current_organisation_id()
  or exists (
    select 1 from public.marketplace_listings l
    where l.id = listing_id and l.organisation_id = public.current_organisation_id()
  )
)
with check (
  buyer_organisation_id = public.current_organisation_id()
  or exists (
    select 1 from public.marketplace_listings l
    where l.id = listing_id and l.organisation_id = public.current_organisation_id()
  )
);

create policy "watchlist is private"
on public.marketplace_watchlist for all
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

create policy "marketplace analysis is private to buyer"
on public.marketplace_analysis for all
using (buyer_organisation_id = public.current_organisation_id())
with check (buyer_organisation_id = public.current_organisation_id());

create policy "marketplace events are visible to actor or seller"
on public.marketplace_events for select
using (
  organisation_id = public.current_organisation_id()
  or exists (
    select 1 from public.marketplace_listings l
    where l.id = listing_id and l.organisation_id = public.current_organisation_id()
  )
);

create policy "marketplace events can be inserted by tenant workflows"
on public.marketplace_events for insert
with check (organisation_id = public.current_organisation_id());
