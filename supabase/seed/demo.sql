insert into public.organisations (id, name, trading_name)
values ('11111111-1111-4111-8111-111111111111', 'xDealer Demo Group', 'Northgate Vehicle Trading')
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

insert into public.organisations (id, name, trading_name)
values
  ('77777777-7777-4777-8777-777777777777','Harrington Prestige Motors','Harrington German Specialist'),
  ('88888888-8888-4888-8888-888888888888','CarHub Value Supermarket','CarHub Value'),
  ('99999999-9999-4999-8999-999999999999','Midshire Commercial and Estates','Midshire Trade Cars')
on conflict (id) do update set name = excluded.name, trading_name = excluded.trading_name;

insert into public.profiles (id, organisation_id, full_name, email, role, site_team)
values
  ('77777777-7777-4777-8777-000000000001','77777777-7777-4777-8777-777777777777','Oliver Haines','buying@harrington.example','Buyer','Reading PX'),
  ('88888888-8888-4888-8888-000000000001','88888888-8888-4888-8888-888888888888','Maya Patel','stock@carhubvalue.example','Buyer','Coventry Buying'),
  ('99999999-9999-4999-8999-000000000001','99999999-9999-4999-8999-999999999999','Gareth Lewis','buy@midshiretrade.example','Buyer','Nottingham Trade')
on conflict (id) do update set full_name = excluded.full_name, email = excluded.email, role = excluded.role, site_team = excluded.site_team;

insert into public.dealer_profiles (
  id, organisation_id, trading_name, company_number, vat_number, fca_status_note, address, postcode_area,
  contact_name, phone, email, website, description, stock_wanted, stock_not_wanted, preferred_makes,
  excluded_makes, preferred_body_types, preferred_fuel_types, min_vehicle_age, max_vehicle_age, min_mileage,
  max_mileage, min_price, max_price, transport_radius_miles, verified_status, rating, trade_terms
) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','11111111-1111-4111-8111-111111111111','Northgate Vehicle Trading','12884510','GB 391 2048 11','Credit broking handled outside this demo workflow.','Unit 4 Trafford Trade Park, Manchester','M17','Sophie Carter','0161 555 0184','trade@northgate.example','https://northgate.example','Multi-site used vehicle operation buying clean mainstream retail stock and disposing of profile misses quickly.','Retail-ready hatchbacks, SUVs and late plate automatic petrol stock.','High-mileage premium diesels, write-off categories and unresolved mechanical faults.',array['Volkswagen','Toyota','Kia','Ford','Nissan','Mercedes-Benz'],array['Fiat','Maserati'],array['Hatchback','SUV','Estate'],array['Petrol','Hybrid','Electric'],0,7,0,80000,5000,30000,120,'Mock verified',4.70,'Trade sale subject to disclosed condition, cleared funds and collection within three working days.'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','77777777-7777-4777-8777-777777777777','Harrington German Specialist','09188231','GB 274 5221 90',null,'Prestige House, Reading','RG2','Oliver Haines','0118 555 0148','buying@harrington.example','https://harrington.example','Premium German retail specialist focused on strong history, clean HPI and high presentation standards.','BMW, Mercedes-Benz, Audi and Volkswagen stock under 70k with strong service history.','Poor history, Cat S/N, major bodywork or heavy mechanical prep.',array['BMW','Mercedes-Benz','Audi','Volkswagen'],array['Dacia','SsangYong'],array['Hatchback','Saloon','Estate','SUV'],array['Petrol','Diesel','Hybrid','Electric'],0,8,0,70000,9000,45000,180,'Mock verified',4.80,'Subject to clear HPI, V5C confirmation and no undisclosed warning lights at collection.'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','88888888-8888-4888-8888-888888888888','CarHub Value','11028421','GB 318 8741 66',null,'A45 Retail Park, Coventry','CV3','Maya Patel','024 7555 0162','stock@carhubvalue.example','https://carhubvalue.example','Value used car supermarket buying fast-moving, sensibly priced retail-ready stock across mainstream makes.','Clean hatchbacks, SUVs and small automatics from £6k to £18k.','Specialist prestige, high-value EVs over £30k and unresolved HPI issues.',array['Ford','Volkswagen','Kia','Nissan','Toyota','Hyundai','Vauxhall'],array['Land Rover','Maserati'],array['Hatchback','SUV','MPV'],array['Petrol','Diesel','Hybrid'],1,10,5000,95000,4000,20000,160,'Mock verified',4.50,'Collection booked after invoice and cleared funds. Condition disputes must reference listing disclosure.'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','99999999-9999-4999-8999-999999999999','Midshire Trade Cars','08644193','GB 205 9914 02','Trade-to-trade only.','M1 Trade Centre, Nottingham','NG8','Gareth Lewis','0115 555 0129','buy@midshiretrade.example','https://midshiretrade.example','Commercial vehicle and estate specialist buying diesel estates, SUVs and sensible trade stock.','Diesel estates, vans, SUVs and high-mileage profile stock with transparent prep.','Small city cars and high-value performance stock.',array['Audi','Volkswagen','Ford','Skoda','BMW','Mercedes-Benz','Nissan'],array['Smart'],array['Estate','SUV','Van'],array['Diesel','Petrol'],2,12,20000,130000,3000,26000,220,'Mock verified',4.60,'Trade appraisal accepted from xDealer condition disclosure, subject to engine and gearbox as described.')
on conflict (organisation_id) do update set trading_name = excluded.trading_name, stock_wanted = excluded.stock_wanted, stock_not_wanted = excluded.stock_not_wanted;

insert into public.vehicles (
  id, organisation_id, vrm, make, model, derivative, registration_date, mileage, fuel_type, transmission, body_type,
  colour, number_of_keys, v5c_status, service_history, mot_expiry, mot_advisories, hpi_status, source, site_team,
  status, proposed_offer, assigned_user_id
) values
  ('b2000000-0000-4000-8000-000000000001','77777777-7777-4777-8777-777777777777','YD19 EWA','Audi','A6 Avant','40 TDI Sport S tronic','2019-03-19',84200,'Diesel','Automatic','Estate','Mythos Black',2,'Present','Partial','2026-12-15',array['Front brake pads wearing thin','Rear tyre close to legal limit'],'Clear','Part-exchange','Reading PX','Analysed',12600,'77777777-7777-4777-8777-000000000001'),
  ('b2000000-0000-4000-8000-000000000002','88888888-8888-4888-8888-888888888888','KM20 VXC','Hyundai','Tucson','1.6 GDi SE Nav','2020-06-08',51200,'Petrol','Manual','SUV','Stellar Blue',2,'Present','Full','2026-12-15',array[]::text[],'Clear','Dealer stock review','Coventry Retail','Analysed',11100,'88888888-8888-4888-8888-000000000001'),
  ('b2000000-0000-4000-8000-000000000003','99999999-9999-4999-8999-999999999999','NL68 KPA','Skoda','Octavia','2.0 TDI SE Technology Estate','2018-11-27',96500,'Diesel','Manual','Estate','Brilliant Silver',2,'Present','Full','2026-12-15',array['Nearside suspension arm bush deteriorated'],'Clear','Fleet disposal','Nottingham Trade','Analysed',6250,'99999999-9999-4999-8999-000000000001'),
  ('b2000000-0000-4000-8000-000000000004','77777777-7777-4777-8777-777777777777','RJ66 NPF','Mercedes-Benz','C220d','Sport Estate Auto','2016-10-03',108400,'Diesel','Automatic','Estate','Polar White',1,'Present','Partial','2026-12-15',array['Front tyres worn close to legal limit','Brake discs corroded'],'Clear','Part-exchange','Reading PX','Analysed',7400,'77777777-7777-4777-8777-000000000001'),
  ('b2000000-0000-4000-8000-000000000005','88888888-8888-4888-8888-888888888888','WU21 HNA','Ford','Puma','1.0 EcoBoost Titanium','2021-03-30',39800,'Petrol','Manual','SUV','Frozen White',2,'Present','Digital','2026-12-15',array[]::text[],'Clear','Consumer acquisition','Coventry Buying','Analysed',11950,'88888888-8888-4888-8888-000000000001'),
  ('b2000000-0000-4000-8000-000000000006','99999999-9999-4999-8999-999999999999','SD18 YCL','Volkswagen','Transporter','2.0 TDI T30 Highline','2018-05-11',88400,'Diesel','Manual','Van','Reflex Silver',2,'Present','Full','2026-12-15',array['Oil leak but not excessive'],'Clear','Fleet disposal','Nottingham Trade','Analysed',15500,'99999999-9999-4999-8999-000000000001'),
  ('b2000000-0000-4000-8000-000000000007','77777777-7777-4777-8777-777777777777','GX22 AEF','BMW','X1','sDrive18i M Sport','2022-02-14',28600,'Petrol','Automatic','SUV','Mineral Grey',2,'Present','Main dealer','2026-12-15',array[]::text[],'Clear','Lease return','Reading PX','Analysed',23600,'77777777-7777-4777-8777-000000000001'),
  ('b2000000-0000-4000-8000-000000000008','88888888-8888-4888-8888-888888888888','PX17 VHR','Vauxhall','Mokka X','1.4T Active','2017-06-23',77800,'Petrol','Manual','SUV','Sovereign Silver',1,'Present','Partial','2026-12-15',array['Rear brake pads wearing thin'],'Clear','Part-exchange','Coventry Retail','Analysed',5150,'88888888-8888-4888-8888-000000000001'),
  ('b2000000-0000-4000-8000-000000000009','99999999-9999-4999-8999-999999999999','MJ69 RKE','Ford','Focus','1.5 EcoBlue Titanium Estate','2019-10-17',72600,'Diesel','Manual','Estate','Magnetic Grey',2,'Present','Full','2026-12-15',array[]::text[],'Clear','Trade purchase','Nottingham Trade','Analysed',7700,'99999999-9999-4999-8999-000000000001'),
  ('b2000000-0000-4000-8000-000000000010','77777777-7777-4777-8777-777777777777','LC16 TZO','Land Rover','Discovery Sport','2.0 TD4 HSE Auto','2016-07-09',102500,'Diesel','Automatic','SUV','Santorini Black',1,'Present','Partial','2026-12-15',array['Suspension bush worn','Oil leak'],'Clear','Part-exchange','Reading PX','Analysed',8750,'77777777-7777-4777-8777-000000000001')
on conflict (id) do update set mileage = excluded.mileage, status = excluded.status, proposed_offer = excluded.proposed_offer;

insert into public.appraisals (organisation_id, vehicle_id, tyres, alloys, glass, interior, paintwork, mechanical_notes, warning_lights, appraiser_id, quality_score)
select organisation_id, id, 'Minor wear', 'Minor wear', 'Good', 'Good', 'Minor wear', 'Marketplace seed appraisal with trade disclosure.', '', assigned_user_id, 76
from public.vehicles
where id::text like 'b2000000-%'
on conflict (vehicle_id) do update set quality_score = excluded.quality_score;

insert into public.market_inputs (
  organisation_id, vehicle_id, cap_clean, cap_average, cap_below, retail_market_estimate, trade_value_estimate, expected_prep_budget, buyer_fees, vendor_fees
)
values
  ('77777777-7777-4777-8777-777777777777','b2000000-0000-4000-8000-000000000001',13400,12450,11650,15950,13050,780,120,80),
  ('88888888-8888-4888-8888-888888888888','b2000000-0000-4000-8000-000000000002',11600,10900,10100,13995,11250,520,120,80),
  ('99999999-9999-4999-8999-999999999999','b2000000-0000-4000-8000-000000000003',6900,6200,5550,8750,6550,640,120,80),
  ('77777777-7777-4777-8777-777777777777','b2000000-0000-4000-8000-000000000004',7900,7050,6400,9950,7350,900,120,80),
  ('88888888-8888-4888-8888-888888888888','b2000000-0000-4000-8000-000000000005',12600,11800,11050,15150,12350,430,120,80),
  ('99999999-9999-4999-8999-999999999999','b2000000-0000-4000-8000-000000000006',16600,15400,14500,20495,16050,1100,120,80),
  ('77777777-7777-4777-8777-777777777777','b2000000-0000-4000-8000-000000000007',24750,23600,22400,28450,24150,600,120,80),
  ('88888888-8888-4888-8888-888888888888','b2000000-0000-4000-8000-000000000008',5600,5000,4500,7350,5350,580,120,80),
  ('99999999-9999-4999-8999-999999999999','b2000000-0000-4000-8000-000000000009',8350,7600,7050,10450,8050,520,120,80),
  ('77777777-7777-4777-8777-777777777777','b2000000-0000-4000-8000-000000000010',9100,8200,7500,11950,8650,1450,120,80)
on conflict (vehicle_id) do update set cap_clean = excluded.cap_clean, retail_market_estimate = excluded.retail_market_estimate;

insert into public.vehicle_photos (id, organisation_id, vehicle_id, file_name, storage_path, public_url, caption)
select gen_random_uuid(), organisation_id, id, 'vehicle-placeholder.svg', concat(organisation_id, '/', id, '/marketplace.svg'), '/assets/vehicle-placeholder.svg', 'Marketplace seed image'
from public.vehicles
where id::text like 'b2000000-%'
on conflict do nothing;

insert into public.marketplace_listings (
  id, organisation_id, vehicle_id, seller_profile_id, listing_type, status, title, description, asking_price, reserve_price,
  buy_now_price, minimum_offer, bid_increment, current_highest_bid, starts_at, ends_at, visibility_type, location,
  postcode_area, vat_margin_note, buyer_fee_note, seller_declaration_accepted, bodywork_summary, interior_summary,
  mechanical_summary, known_issues, prep_recommendation, audit_notes, documents, views, watchers, published_at, sold_at
) values
  ('e1000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Best offer','Live','BMW 320d M Sport Auto','Premium diesel saloon profile miss for the seller.',15150,14600,null,14250,100,null,now()-interval '4 days',null,'All approved dealers','Manchester','M17','Margin scheme','No platform buyer fee in MVP',true,'Minor paint and alloy prep disclosed.','Good interior, two keys.','Road test fine; service invoices incomplete.','Brake disc advisory.','Disclose history gap and avoid retail prep.','["listing pre-filled from xDealer"]','["Mock appraisal PDF","Mock HPI summary"]',87,11,now()-interval '3 days',null),
  ('e1000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000005','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Timed auction','Live','Range Rover Evoque TD4 HSE','Older premium SUV listed as timed trade auction.',27900,27200,null,26800,100,27500,now()-interval '2 days',now()+interval '2 days','All approved dealers','Manchester','M17','Margin scheme','No platform buyer fee in MVP',true,'Black paint shows scratches and alloy marks.','Minor wear.','Slight knock over rough surface.','Suspension and tyre advisories.','Safety-critical prep only.','["seller declaration accepted"]','["Mock appraisal PDF"]',102,14,now()-interval '2 days',null),
  ('e1000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000008','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Fixed price','Live','Nissan Qashqai 1.5 dCi N-Connecta','High-mileage diesel SUV for value trade buyers.',6150,5800,null,5600,100,null,now()-interval '1 day',null,'All approved dealers','Manchester','M17','Margin scheme',null,true,'Rear bumper crack disclosed.','Needs prep.','Oil misting seen underneath.','Oil leak and tyre advisory.','Trade standard only.','[]','["Mock HPI summary"]',64,8,now()-interval '1 day',null),
  ('e1000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000010','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Buy it now','Live','Audi A4 Avant 2.0 TDI Sport','Estate specialist opportunity with disclosed warning light.',9350,8900,9750,8500,100,null,now()-interval '1 day',null,'Selected dealer groups','Manchester','M17','Margin scheme',null,true,'Tailgate dent disclosed.','Needs prep.','Engine management light present.','Mileage discrepancy and suspension advisory.','Trade only, diagnostic required.','[]','["Mock appraisal PDF"]',44,5,now()-interval '1 day',null),
  ('e1000000-0000-4000-8000-000000000005','77777777-7777-4777-8777-777777777777','b2000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','Timed auction','Live','Audi A6 Avant 40 TDI Sport','Premium dealer trading out a high-mileage diesel estate PX.',8950,8400,null,8200,100,8700,now()-interval '2 days',now()+interval '1 day','All approved dealers','Reading','RG2','Margin scheme',null,true,'Rear bumper scuff disclosed.','Good interior.','Drives well.','Brake and tyre advisories.','Auction-style trade disclosure.','[]','["Mock HPI summary"]',118,18,now()-interval '2 days',null),
  ('e1000000-0000-4000-8000-000000000006','88888888-8888-4888-8888-888888888888','b2000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','Fixed price','Live','Hyundai Tucson 1.6 GDi SE Nav','Clean SUV duplicated locally by car supermarket.',11850,11400,null,11200,100,null,now()-interval '1 day',null,'All approved dealers','Coventry','CV3','Margin scheme',null,true,'Parking dent disclosed.','Good.','No drivetrain concerns.','No MOT advisories.','Retail-ready trade stock.','[]','["Mock appraisal PDF"]',76,10,now()-interval '1 day',null),
  ('e1000000-0000-4000-8000-000000000007','99999999-9999-4999-8999-999999999999','b2000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','Best offer','Live','Skoda Octavia 2.0 TDI Estate','Fleet estate with disclosed mileage and prep.',6650,6200,null,6000,100,null,now()-interval '6 hours',null,'All approved dealers','Nottingham','NG8','Margin scheme',null,true,'Stone chips only.','Good.','High-mileage fleet estate.','Suspension bush advisory.','Price for trade buyers.','[]','["Mock appraisal PDF"]',55,7,now()-interval '6 hours',null),
  ('e1000000-0000-4000-8000-000000000008','77777777-7777-4777-8777-777777777777','b2000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','Timed auction','Live','Mercedes-Benz C220d Sport Estate','Older premium estate listed with clear prep notes.',7350,6900,null,6600,100,7150,now()-interval '8 hours',now()+interval '3 days','All approved dealers','Reading','RG2','Margin scheme',null,true,'Front bumper paint peel.','Minor wear.','Gearbox smooth on road test.','Tyre and brake advisories.','Avoid full retail prep.','[]','["Mock HPI summary"]',48,6,now()-interval '8 hours',null),
  ('e1000000-0000-4000-8000-000000000009','88888888-8888-4888-8888-888888888888','b2000000-0000-4000-8000-000000000005','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','Buy it now','Live','Ford Puma 1.0 EcoBoost Titanium','Clean retail-ready hatchback/SUV crossover.',12350,11900,12750,11600,100,null,now()-interval '12 hours',null,'All approved dealers','Coventry','CV3','Margin scheme',null,true,'Light alloy kerbing.','Good.','No drivetrain concerns.','No advisories.','Retail-critical prep only.','[]','["Mock appraisal PDF"]',70,9,now()-interval '12 hours',null),
  ('e1000000-0000-4000-8000-000000000010','99999999-9999-4999-8999-999999999999','b2000000-0000-4000-8000-000000000006','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','Trade-only enquiry','Live','Volkswagen Transporter T30 Highline','Commercial vehicle trade enquiry with disclosed load bay wear.',16250,15600,null,15200,100,null,now()-interval '10 hours',null,'All approved dealers','Nottingham','NG8','Margin scheme',null,true,'Load bay marks.','Good cab.','Oil leak advisory not excessive.','Oil leak advisory.','Commercial trade disclosure.','[]','["Mock appraisal PDF"]',92,15,now()-interval '10 hours',null),
  ('e1000000-0000-4000-8000-000000000011','77777777-7777-4777-8777-777777777777','b2000000-0000-4000-8000-000000000007','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','Fixed price','Live','BMW X1 sDrive18i M Sport','Good German SUV, duplicated on prestige forecourt.',24450,23800,null,23500,100,null,now()-interval '5 hours',null,'All approved dealers','Reading','RG2','Margin scheme',null,true,'Nearside alloy kerb mark.','Good.','Main dealer history.','No advisories.','Retail-ready.','[]','["Mock HPI summary"]',61,6,now()-interval '5 hours',null),
  ('e1000000-0000-4000-8000-000000000012','88888888-8888-4888-8888-888888888888','b2000000-0000-4000-8000-000000000008','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','Best offer','Live','Vauxhall Mokka X 1.4T Active','Cheap SUV profile stock for value dealers.',5250,4900,null,4700,100,null,now()-interval '3 hours',null,'All approved dealers','Coventry','CV3','Margin scheme',null,true,'Tailgate scratch.','Minor wear.','Cheap SUV trade profile.','Rear brake advisory.','Price with disclosure.','[]','["Mock appraisal PDF"]',37,4,now()-interval '3 hours',null),
  ('e1000000-0000-4000-8000-000000000013','99999999-9999-4999-8999-999999999999','b2000000-0000-4000-8000-000000000009','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','Fixed price','Draft','Ford Focus Estate EcoBlue','Draft estate listing.',7950,7600,null,7350,100,null,now(),null,'All approved dealers','Nottingham','NG8','Margin scheme',null,false,'Draft bodywork.','Draft interior.','Draft mechanical notes.','No advisories.','Draft prep recommendation.','[]','[]',0,0,null,null),
  ('e1000000-0000-4000-8000-000000000014','77777777-7777-4777-8777-777777777777','b2000000-0000-4000-8000-000000000010','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','Timed auction','Draft','Land Rover Discovery Sport TD4','Draft timed auction.',8650,8100,null,7800,100,null,now(),now()+interval '5 days','Selected dealer groups','Reading','RG2','Margin scheme',null,false,'Draft bodywork.','Draft interior.','Draft mechanical notes.','Suspension and oil advisories.','Draft prep recommendation.','[]','[]',0,0,null,null),
  ('e1000000-0000-4000-8000-000000000015','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Best offer','Draft','Ford Fiesta 1.0 EcoBoost Titanium','Draft PX trade listing.',7800,7400,null,7200,100,null,now(),null,'All approved dealers','Manchester','M17','Margin scheme',null,false,'Draft bodywork.','Draft interior.','Draft mechanical notes.','No advisories.','Draft prep recommendation.','[]','[]',0,0,null,null),
  ('e1000000-0000-4000-8000-000000000016','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Fixed price','Draft','Tesla Model 3 Long Range','Draft EV trade listing.',26800,26200,null,25800,100,null,now(),null,'Dealers matching stock profile','Manchester','M17','Margin scheme',null,false,'Draft bodywork.','Draft interior.','Draft mechanical notes.','No advisories.','Draft prep recommendation.','[]','[]',0,0,null,null),
  ('e1000000-0000-4000-8000-000000000017','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000006','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Buy it now','Reserved','Kia Sportage 1.6 CRDi 2','Reserved mock transaction.',12750,12300,13100,12100,100,12300,now()-interval '5 days',null,'All approved dealers','Manchester','M17','Margin scheme',null,true,'Fleet wear disclosed.','Good.','No concerns.','No advisories.','Reserved.','[]','[]',141,18,now()-interval '5 days',null),
  ('e1000000-0000-4000-8000-000000000018','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000007','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Fixed price','Sold','Mercedes-Benz A200 AMG Line','Sold mock transaction.',16950,16500,null,16300,100,16600,now()-interval '8 days',null,'All approved dealers','Manchester','M17','Margin scheme',null,true,'Brake pad advisory.','Good.','Main dealer service.','Front brake pads advisory.','Sold.','[]','[]',164,22,now()-interval '8 days',now()-interval '1 day'),
  ('e1000000-0000-4000-8000-000000000019','11111111-1111-4111-8111-111111111111','a1000000-0000-4000-8000-000000000009','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Best offer','Under offer','Toyota Yaris Hybrid Design','Under-offer clean hybrid hatchback.',16200,15650,null,15400,100,15400,now()-interval '1 day',null,'All approved dealers','Manchester','M17','Margin scheme',null,true,'Clean bodywork.','Good.','No drivetrain concerns.','No advisories.','Retail-ready.','[]','[]',88,13,now()-interval '1 day',null)
on conflict (id) do update set status = excluded.status, asking_price = excluded.asking_price, current_highest_bid = excluded.current_highest_bid;

insert into public.marketplace_bids (id, listing_id, bidder_organisation_id, bidder_user_id, amount, status, message)
values
  ('e2000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000005','99999999-9999-4999-8999-999999999999','99999999-9999-4999-8999-000000000001',8700,'Leading','Estate specialist bid subject to collection this week.'),
  ('e2000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000005','88888888-8888-4888-8888-888888888888','88888888-8888-4888-8888-000000000001',8500,'Outbid','Value pitch bid with transport arranged.'),
  ('e2000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000002','77777777-7777-4777-8777-777777777777','77777777-7777-4777-8777-000000000001',27500,'Leading','Interested if service invoices are present.'),
  ('e2000000-0000-4000-8000-000000000004','e1000000-0000-4000-8000-000000000008','99999999-9999-4999-8999-999999999999','99999999-9999-4999-8999-000000000001',7150,'Leading','Trade diesel estate profile.')
on conflict (id) do update set amount = excluded.amount, status = excluded.status;

insert into public.marketplace_offers (id, listing_id, buyer_organisation_id, buyer_user_id, seller_organisation_id, amount, status, message, counter_amount, counter_message, next_steps, expires_at)
values
  ('e3000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','99999999-9999-4999-8999-999999999999','99999999-9999-4999-8999-000000000001','11111111-1111-4111-8111-111111111111',14500,'Submitted','Can move quickly on the BMW if discs are advisory only.',null,null,'[]',now()+interval '2 days'),
  ('e3000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000019','88888888-8888-4888-8888-888888888888','88888888-8888-4888-8888-000000000001','11111111-1111-4111-8111-111111111111',15400,'Countered','Offer based on retail prep and transport.',15850,'Can agree at £15,850 with collection by Friday.','["Exchange details","Arrange invoice","Arrange collection/transport","Confirm payment outside platform"]',now()+interval '1 day'),
  ('e3000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000017','77777777-7777-4777-8777-777777777777','77777777-7777-4777-8777-000000000001','11111111-1111-4111-8111-111111111111',12300,'Accepted','Accepted at disclosed condition.',null,null,'["Exchange details","Arrange invoice","Arrange collection/transport","Confirm payment outside platform","Mark complete"]',now()+interval '1 day'),
  ('e3000000-0000-4000-8000-000000000004','e1000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','88888888-8888-4888-8888-888888888888',11400,'Submitted','Northgate would retail this Tucson if appraisal photos match.',null,null,'[]',now()+interval '2 days')
on conflict (id) do update set status = excluded.status, amount = excluded.amount;

insert into public.marketplace_questions (id, listing_id, buyer_organisation_id, buyer_user_id, question, answer, answered_by, answered_at, visibility)
values
  ('e4000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000005','99999999-9999-4999-8999-999999999999','99999999-9999-4999-8999-000000000001','Are the front brake pads advisory only, or has a workshop quote been taken?','Advisory only. No workshop quote yet; priced into reserve.','77777777-7777-4777-8777-000000000001',now()-interval '10 hours','Approved dealers'),
  ('e4000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000010','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','Is the Transporter VAT qualifying or margin scheme?',null,null,null,'Private')
on conflict (id) do update set answer = excluded.answer;

insert into public.marketplace_watchlist (id, listing_id, organisation_id, user_id)
values
  ('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'),
  ('e5000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'),
  ('e5000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000008','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222')
on conflict (listing_id, organisation_id, user_id) do nothing;

insert into public.marketplace_analysis (id, listing_id, buyer_organisation_id, fit_score, fit_label, recommended_max_bid, expected_margin, risk_rating, analysis_json)
values
  ('e6000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111',72,'Good fit',8750,1450,'Medium','{"reasons":["Diesel estate demand from trade specialists"],"risksToCheck":["Brake and tyre advisories"]}'),
  ('e6000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111',84,'Excellent fit',11950,1750,'Low','{"reasons":["Matches preferred SUV profile","Strong expected retail margin"],"risksToCheck":["Confirm paintless dent repair"]}'),
  ('e6000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000008','11111111-1111-4111-8111-111111111111',58,'Possible fit',7050,980,'Medium','{"reasons":["Estate demand exists"],"risksToCheck":["Mileage is above usual threshold"]}')
on conflict (listing_id, buyer_organisation_id) do update set fit_score = excluded.fit_score, analysis_json = excluded.analysis_json;

insert into public.marketplace_events (id, listing_id, organisation_id, user_id, event_type, event_json)
values
  ('e7000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','listed','{"source":"decision-pack","declarationAccepted":true}'),
  ('e7000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000017','77777777-7777-4777-8777-777777777777','77777777-7777-4777-8777-000000000001','offer_accepted','{"amount":12300,"nextStepsCreated":true}')
on conflict (id) do update set event_json = excluded.event_json;
