insert into public.organisations (id, name, trading_name)
values ('11111111-1111-4111-8111-111111111111', 'Xdealer Demo Group', 'Northgate Vehicle Trading')
on conflict (id) do update set name = excluded.name, trading_name = excluded.trading_name;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '22222222-2222-4222-8222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo@xdealer.local',
  crypt('demo-password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Sophie Carter"}',
  false,
  '',
  '',
  '',
  ''
) on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-222222222222',
  '{"sub":"22222222-2222-4222-8222-222222222222","email":"demo@xdealer.local"}',
  'email',
  'demo@xdealer.local',
  now(),
  now(),
  now()
) on conflict (provider, provider_id) do update set updated_at = now();

insert into public.profiles (id, auth_user_id, organisation_id, full_name, email, role, site_team)
values
  ('22222222-2222-4222-8222-222222222222','22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','Sophie Carter','demo@xdealer.local','Owner','Group Buying'),
  ('33333333-3333-4333-8333-333333333333',null,'11111111-1111-4111-8111-111111111111','Dan Price','dan.price@northgate.example','Buyer','Midlands PX'),
  ('44444444-4444-4444-8444-444444444444',null,'11111111-1111-4111-8111-111111111111','Amara Khan','amara.khan@northgate.example','Remarketing Manager','Auction Lane'),
  ('55555555-5555-4555-8555-555555555555',null,'11111111-1111-4111-8111-111111111111','Lewis Morgan','lewis.morgan@northgate.example','Appraiser','Manchester Prep')
on conflict (id) do update set
  auth_user_id = excluded.auth_user_id,
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  site_team = excluded.site_team;

insert into public.organisation_rules (
  id,
  organisation_id,
  risk_appetite,
  minimum_confidence_for_auto_approval,
  senior_approval_threshold,
  retail_vs_auction_margin_threshold,
  stock_age_review_days,
  excluded_makes_models,
  value_bands,
  channel_rules,
  site_prep_assumptions
) values (
  '66666666-6666-4666-8666-666666666666',
  '11111111-1111-4111-8111-111111111111',
  'Balanced',
  74,
  25000,
  1200,
  55,
  '["Fiat 500 TwinAir", "Vauxhall Insignia 2.0 CDTi high mileage"]',
  '[
    {"label":"Under £10k","minValue":0,"maxValue":10000,"targetMargin":950,"maxPrepSpend":850},
    {"label":"£10k to £20k","minValue":10000,"maxValue":20000,"targetMargin":1450,"maxPrepSpend":1350},
    {"label":"£20k to £35k","minValue":20000,"maxValue":35000,"targetMargin":2100,"maxPrepSpend":1900},
    {"label":"Over £35k","minValue":35000,"targetMargin":3000,"maxPrepSpend":2600}
  ]',
  '[
    {"label":"Clean desirable retail stock","condition":"Under 6 years, under 60k miles, clear HPI, appraisal quality above 78","preferredChannel":"Retail"},
    {"label":"Older or high mileage stock","condition":"Over 8 years or over 95k miles","preferredChannel":"Auction"},
    {"label":"HPI or mechanical exposure","condition":"Write-off marker, finance marker, warning light or unresolved mechanical note","preferredChannel":"Trade out"}
  ]',
  '[
    {"siteTeam":"Manchester Prep","smartRepair":150,"alloyRefurb":85,"paintPerPanel":280,"mechanicalInspection":95},
    {"siteTeam":"Midlands PX","smartRepair":165,"alloyRefurb":95,"paintPerPanel":310,"mechanicalInspection":110},
    {"siteTeam":"Auction Lane","smartRepair":120,"alloyRefurb":75,"paintPerPanel":250,"mechanicalInspection":80}
  ]'
) on conflict (organisation_id) do update set
  risk_appetite = excluded.risk_appetite,
  minimum_confidence_for_auto_approval = excluded.minimum_confidence_for_auto_approval,
  senior_approval_threshold = excluded.senior_approval_threshold,
  retail_vs_auction_margin_threshold = excluded.retail_vs_auction_margin_threshold,
  stock_age_review_days = excluded.stock_age_review_days,
  excluded_makes_models = excluded.excluded_makes_models,
  value_bands = excluded.value_bands,
  channel_rules = excluded.channel_rules,
  site_prep_assumptions = excluded.site_prep_assumptions;

insert into public.vehicles (
  id, organisation_id, vrm, make, model, derivative, registration_date, mileage, fuel_type, transmission, body_type,
  colour, number_of_keys, v5c_status, service_history, mot_expiry, mot_advisories, hpi_status, source, site_team,
  status, proposed_offer, assigned_user_id
) values
  ('a1000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','BK21 XDL','Volkswagen','Golf','1.5 TSI Style DSG','2021-04-12',37280,'Petrol','Automatic','Hatchback','Moonstone Grey',2,'Present','Full','2027-04-11',array['Nearside front tyre worn close to legal limit'],'Clear','Part-exchange','Midlands PX','Analysed',14750,'33333333-3333-4333-8333-333333333333'),
  ('a1000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','LR70 BMO','BMW','320d','M Sport Auto','2020-09-21',64210,'Diesel','Automatic','Saloon','Black Sapphire',2,'Present','Partial','2026-10-03',array['Brake discs worn but not seriously weakened'],'Clear','Consumer acquisition','Group Buying','Senior review',18900,'22222222-2222-4222-8222-222222222222'),
  ('a1000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','MJ69 FST','Ford','Fiesta','1.0 EcoBoost Titanium','2019-11-04',41860,'Petrol','Manual','Hatchback','Deep Impact Blue',1,'Awaiting','Full','2026-11-02',array[]::text[],'Clear','Dealer stock review','Manchester Prep','Analysed',8450,'33333333-3333-4333-8333-333333333333'),
  ('a1000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','LV22 TSL','Tesla','Model 3','Long Range','2022-03-18',28820,'Electric','Automatic','Saloon','Pearl White',2,'Present','Digital','2027-03-17',array[]::text[],'Clear','Lease return','Group Buying','Analysed',26500,'44444444-4444-4444-8444-444444444444'),
  ('a1000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','RO18 EVO','Range Rover','Evoque','TD4 HSE','2018-07-02',81240,'Diesel','Automatic','SUV','Santorini Black',1,'Present','Missing','2026-08-08',array['Rear suspension bush has slight play','Front tyres worn on inner edge'],'Clear','Part-exchange','Midlands PX','Senior review',15850,'22222222-2222-4222-8222-222222222222'),
  ('a1000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','YK21 KIA','Kia','Sportage','1.6 CRDi 2','2021-06-10',52400,'Diesel','Manual','SUV','Lunar Silver',2,'Present','Full','2027-06-09',array[]::text[],'Clear','Fleet disposal','Auction Lane','Analysed',13750,'44444444-4444-4444-8444-444444444444'),
  ('a1000000-0000-4000-8000-000000000007','11111111-1111-4111-8111-111111111111','KM20 AMG','Mercedes-Benz','A200','AMG Line','2020-02-28',45890,'Petrol','Automatic','Hatchback','Mountain Grey',2,'Present','Main dealer','2027-02-27',array['Front brake pads wearing thin'],'Clear','Trade purchase','Group Buying','Analysed',19800,'22222222-2222-4222-8222-222222222222'),
  ('a1000000-0000-4000-8000-000000000008','11111111-1111-4111-8111-111111111111','NL17 QSH','Nissan','Qashqai','1.5 dCi N-Connecta','2017-05-05',103220,'Diesel','Manual','SUV','Gun Metallic',1,'Not present','Partial','2026-06-21',array['Oil leak, but not excessive','Rear tyre close to legal limit'],'Clear','Auction entry','Auction Lane','Analysed',6100,'44444444-4444-4444-8444-444444444444'),
  ('a1000000-0000-4000-8000-000000000009','11111111-1111-4111-8111-111111111111','GF23 YRS','Toyota','Yaris','1.5 Hybrid Design','2023-01-12',18420,'Hybrid','Automatic','Hatchback','Pure White',2,'Present','Full','2027-01-11',array[]::text[],'Clear','Consumer acquisition','Group Buying','Analysed',15100,'33333333-3333-4333-8333-333333333333'),
  ('a1000000-0000-4000-8000-000000000010','11111111-1111-4111-8111-111111111111','SJ16 AAV','Audi','A4 Avant','2.0 TDI Sport','2016-09-14',109870,'Diesel','Manual','Estate','Monsoon Grey',1,'Present','Partial','2026-10-14',array['Engine management light illuminated at test','Front suspension arm pin or bush worn'],'Mileage discrepancy','Part-exchange','Midlands PX','Senior review',7600,'22222222-2222-4222-8222-222222222222')
on conflict (id) do update set
  status = excluded.status,
  proposed_offer = excluded.proposed_offer,
  updated_at = now();

insert into public.appraisals (
  id, organisation_id, vehicle_id, tyres, alloys, glass, interior, paintwork, mechanical_notes, warning_lights, appraiser_id, quality_score
) values
  ('b1000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000001','Good','Minor wear','Good','Good','Minor wear','Road test completed. No drivetrain concerns reported.','', '55555555-5555-4555-8555-555555555555',86),
  ('b1000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000002','Minor wear','Needs prep','Good','Good','Needs prep','Road test fine. Service invoices incomplete for 2023 and 2024.','', '55555555-5555-4555-8555-555555555555',69),
  ('b1000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000003','Good','Good','Good','Minor wear','Minor wear','Road test completed. No drivetrain concerns reported.','', '55555555-5555-4555-8555-555555555555',88),
  ('b1000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000004','Good','Minor wear','Good','Good','Minor wear','Battery health report supplied. No warning messages shown.','', '55555555-5555-4555-8555-555555555555',91),
  ('b1000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000005','Needs prep','Needs prep','Good','Minor wear','Needs prep','Short road test only. Slight knock over rough surface.','', '55555555-5555-4555-8555-555555555555',61),
  ('b1000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000006','Minor wear','Minor wear','Good','Good','Minor wear','Road test completed. No drivetrain concerns reported.','', '55555555-5555-4555-8555-555555555555',83),
  ('b1000000-0000-4000-8000-000000000007','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000007','Good','Minor wear','Good','Good','Good','Main dealer service record verified. Brake pad advisory priced.','', '55555555-5555-4555-8555-555555555555',87),
  ('b1000000-0000-4000-8000-000000000008','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000008','Needs prep','Poor','Minor wear','Needs prep','Needs prep','Oil misting seen underneath. No extended mechanical inspection completed.','', '55555555-5555-4555-8555-555555555555',55),
  ('b1000000-0000-4000-8000-000000000009','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000009','Good','Good','Good','Good','Good','Road test completed. No drivetrain concerns reported.','', '55555555-5555-4555-8555-555555555555',94),
  ('b1000000-0000-4000-8000-000000000010','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000010','Needs prep','Needs prep','Minor wear','Needs prep','Poor','Engine management light present. Needs diagnostic before any retail consideration.','Engine management light', '55555555-5555-4555-8555-555555555555',44)
on conflict (vehicle_id) do update set quality_score = excluded.quality_score, mechanical_notes = excluded.mechanical_notes, warning_lights = excluded.warning_lights;

insert into public.market_inputs (
  id, organisation_id, vehicle_id, cap_clean, cap_average, cap_below, retail_market_estimate, trade_value_estimate, expected_prep_budget, buyer_fees, vendor_fees
) values
  ('c1000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000001',15300,14550,13800,17750,15050,475,120,80),
  ('c1000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000002',19200,18100,16900,22250,18800,950,120,80),
  ('c1000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000003',8800,8250,7600,10450,8700,320,120,80),
  ('c1000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000004',27000,25800,24400,30995,26750,550,120,80),
  ('c1000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000005',16000,14900,13650,19250,15450,1550,120,80),
  ('c1000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000006',14100,13400,12650,16695,13950,540,120,80),
  ('c1000000-0000-4000-8000-000000000007','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000007',20100,19050,17950,23450,19950,700,120,80),
  ('c1000000-0000-4000-8000-000000000008','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000008',6500,5900,5200,8295,6200,980,120,80),
  ('c1000000-0000-4000-8000-000000000009','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000009',15600,14950,14100,18195,15400,260,120,80),
  ('c1000000-0000-4000-8000-000000000010','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000010',7900,7050,6200,10495,7600,1450,120,80)
on conflict (vehicle_id) do update set cap_clean = excluded.cap_clean, retail_market_estimate = excluded.retail_market_estimate;

insert into public.damage_entries (id, organisation_id, vehicle_id, panel_location, damage_type, severity, estimated_repair_category, estimated_cost, notes)
values
  ('d1000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000001','Front bumper','Stone chips','Light','Smart repair',160,'Retail visible but sensible smart repair.'),
  ('d1000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000002','Offside rear alloy','Kerb damage','Medium','Alloy refurb',95,'Refurb required for retail.'),
  ('d1000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000002','Bonnet','Paint chips','Medium','Paint',310,'Visible on black paint.'),
  ('d1000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000004','Rear bumper','Light scuff','Light','Smart repair',140,'Low-cost smart repair before retail photography.'),
  ('d1000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000005','Nearside doors','Scratches','Medium','Paint',520,'Black paint shows scratches clearly.'),
  ('d1000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000005','Two alloys','Kerb damage','Medium','Alloy refurb',190,'Both visible for retail.'),
  ('d1000000-0000-4000-8000-000000000007','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000006','Load lip','Scuff','Light','Smart repair',120,'Typical fleet use mark.'),
  ('d1000000-0000-4000-8000-000000000008','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000008','Rear bumper','Crack and scrape','Heavy','Replace',520,'Poor retail candidate.'),
  ('d1000000-0000-4000-8000-000000000009','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000010','Tailgate','Dent and paint crack','Heavy','Panel repair',650,'Would need repair for retail photography.')
on conflict (id) do nothing;

insert into public.vehicle_photos (organisation_id, vehicle_id, file_name, storage_path, public_url, caption)
select
  '11111111-1111-4111-8111-111111111111',
  id,
  'vehicle-placeholder.svg',
  concat('11111111-1111-4111-8111-111111111111/', id, '/vehicle-placeholder.svg'),
  '/assets/vehicle-placeholder.svg',
  'Demo appraisal image'
from public.vehicles
where organisation_id = '11111111-1111-4111-8111-111111111111'
on conflict do nothing;

insert into public.integrations (organisation_id, name, status, description, required_credentials, last_sync, category)
values
  ('11111111-1111-4111-8111-111111111111','CAP/HPI valuation data','Mocked','CAP-style clean, average and below valuations with HPI provenance markers.','["CAP account ID","HPI API key"]',now(),'Valuation'),
  ('11111111-1111-4111-8111-111111111111','DVSA MOT history','Planned','Future MOT expiry, mileage, pass/fail and advisory history via DVSA.','["DVSA client ID","DVSA client secret"]',null,'Compliance'),
  ('11111111-1111-4111-8111-111111111111','Auto Trader style retail market data','Mocked','Retail market estimate, comparable supply and advertised days.','["Retail market API key"]',now(),'Market'),
  ('11111111-1111-4111-8111-111111111111','Auction platform','Mocked','Auction entry, reserve management and hammer result capture.','["Auction platform token"]',now(),'Disposal'),
  ('11111111-1111-4111-8111-111111111111','DMS','Planned','Stock records, purchase orders and sold vehicle outcomes.','["DMS endpoint","OAuth client"]',null,'Operations'),
  ('11111111-1111-4111-8111-111111111111','CRM','Planned','Customer acquisition source, vendor comms and buyer notes.','["CRM workspace ID","OAuth client"]',null,'Customer'),
  ('11111111-1111-4111-8111-111111111111','Refurbishment/bodyshop','Planned','Prep estimates, booking status and actual repair invoices.','["Bodyshop endpoint","API key"]',null,'Prep'),
  ('11111111-1111-4111-8111-111111111111','Transport provider','Planned','Collection, delivery and inter-site movement updates.','["Transport provider token"]',null,'Logistics'),
  ('11111111-1111-4111-8111-111111111111','Webhooks','Planned','Outbound decision pack and outcome events for downstream systems.','["Webhook signing secret"]',null,'Platform'),
  ('11111111-1111-4111-8111-111111111111','CSV import/export','Mocked','Bulk vehicle intake, decision pack export and outcome upload.','["No credentials required"]',now(),'Data');
