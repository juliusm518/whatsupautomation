create extension if not exists pgcrypto;

create table if not exists public.replypilot_businesses (
  id text primary key,
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  type text not null,
  owner_name text not null,
  whatsapp_number text not null,
  appointment_label text not null default 'booking',
  auto_reply_enabled boolean not null default true,
  escalation_enabled boolean not null default true,
  business_hours jsonb not null default '{"timeZone":"Asia/Singapore","days":[1,2,3,4,5,6],"open":"09:00","close":"18:00"}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.replypilot_business_members (
  business_id text not null references public.replypilot_businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'operator')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table if not exists public.replypilot_faqs (
  id uuid primary key default gen_random_uuid(),
  business_id text not null references public.replypilot_businesses(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, question)
);

create table if not exists public.replypilot_conversations (
  id text primary key,
  business_id text not null references public.replypilot_businesses(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  status text not null check (status in ('auto-replied', 'qualified-lead', 'needs-human')),
  intent text not null check (intent in ('general', 'faq', 'lead', 'appointment', 'escalation')),
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.replypilot_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null references public.replypilot_conversations(id) on delete cascade,
  business_id text not null references public.replypilot_businesses(id) on delete cascade,
  sender text not null check (sender in ('customer', 'assistant', 'operator')),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.replypilot_leads (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null unique references public.replypilot_conversations(id) on delete cascade,
  business_id text not null references public.replypilot_businesses(id) on delete cascade,
  name text,
  phone text,
  service text,
  preferred_time text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.replypilot_webhook_events (
  id uuid primary key default gen_random_uuid(),
  business_id text references public.replypilot_businesses(id) on delete set null,
  provider text not null default 'whatsapp',
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists replypilot_faqs_business_id_idx on public.replypilot_faqs(business_id);
create index if not exists replypilot_conversations_business_created_idx on public.replypilot_conversations(business_id, created_at desc);
create index if not exists replypilot_messages_conversation_created_idx on public.replypilot_messages(conversation_id, created_at asc);
create index if not exists replypilot_leads_business_id_idx on public.replypilot_leads(business_id);

alter table public.replypilot_businesses enable row level security;
alter table public.replypilot_business_members enable row level security;
alter table public.replypilot_faqs enable row level security;
alter table public.replypilot_conversations enable row level security;
alter table public.replypilot_messages enable row level security;
alter table public.replypilot_leads enable row level security;
alter table public.replypilot_webhook_events enable row level security;

create or replace function public.replypilot_is_business_member(target_business_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.replypilot_business_members
    where replypilot_business_members.business_id = target_business_id
      and replypilot_business_members.user_id = auth.uid()
  );
$$;

drop policy if exists "members can view businesses" on public.replypilot_businesses;
create policy "members can view businesses"
on public.replypilot_businesses
for select
to authenticated
using (public.replypilot_is_business_member(id));

drop policy if exists "members can view business members" on public.replypilot_business_members;
create policy "members can view business members"
on public.replypilot_business_members
for select
to authenticated
using (public.replypilot_is_business_member(business_id));

drop policy if exists "members can manage faqs" on public.replypilot_faqs;
create policy "members can manage faqs"
on public.replypilot_faqs
for all
to authenticated
using (public.replypilot_is_business_member(business_id))
with check (public.replypilot_is_business_member(business_id));

drop policy if exists "members can view conversations" on public.replypilot_conversations;
create policy "members can view conversations"
on public.replypilot_conversations
for select
to authenticated
using (public.replypilot_is_business_member(business_id));

drop policy if exists "members can view messages" on public.replypilot_messages;
create policy "members can view messages"
on public.replypilot_messages
for select
to authenticated
using (public.replypilot_is_business_member(business_id));

drop policy if exists "members can view leads" on public.replypilot_leads;
create policy "members can view leads"
on public.replypilot_leads
for select
to authenticated
using (public.replypilot_is_business_member(business_id));

insert into public.replypilot_businesses (
  id,
  name,
  type,
  owner_name,
  whatsapp_number,
  appointment_label,
  business_hours
) values
  (
    'tuition-hub',
    'BrightPath Tuition',
    'Tuition Centre',
    'Alicia Tan',
    '+65 8123 4567',
    'trial lesson',
    '{"timeZone":"Asia/Singapore","days":[1,2,3,4,5,6],"open":"09:00","close":"19:00"}'
  ),
  (
    'aircon-pro',
    'CoolFix Aircon',
    'Aircon Servicing',
    'Ravi Menon',
    '+65 8899 1020',
    'service slot',
    '{"timeZone":"Asia/Singapore","days":[1,2,3,4,5,6],"open":"08:30","close":"18:00"}'
  ),
  (
    'plumbing-care',
    'PipeWise Plumbing',
    'Plumbing',
    'Mei Wong',
    '+65 8777 2030',
    'repair visit',
    '{"timeZone":"Asia/Singapore","days":[1,2,3,4,5,6],"open":"08:00","close":"20:00"}'
  ),
  (
    'reno-studio',
    'HomeCraft Renovation',
    'Renovation',
    'Darren Koh',
    '+65 8555 4412',
    'renovation consultation',
    '{"timeZone":"Asia/Singapore","days":[1,2,3,4,5,6],"open":"10:00","close":"18:30"}'
  ),
  (
    'hawker-kitchen',
    'Uncle Lim Chicken Rice',
    'Hawker Stall',
    'Lim Ah Seng',
    '+65 8666 5108',
    'bulk order pickup',
    '{"timeZone":"Asia/Singapore","days":[1,2,3,4,5,6],"open":"10:30","close":"15:00"}'
  ),
  (
    'bakery-bites',
    'SweetCrumb Bakery',
    'Bakery',
    'Nur Aisyah',
    '+65 8444 7788',
    'cake order',
    '{"timeZone":"Asia/Singapore","days":[2,3,4,5,6,0],"open":"09:00","close":"17:30"}'
  )
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  owner_name = excluded.owner_name,
  whatsapp_number = excluded.whatsapp_number,
  appointment_label = excluded.appointment_label,
  business_hours = excluded.business_hours,
  updated_at = now();

insert into public.replypilot_faqs (business_id, question, answer, sort_order) values
  ('tuition-hub', 'What subjects do you teach?', 'We cover Primary English, Math, Science, and lower-secondary Math.', 1),
  ('tuition-hub', 'How much are classes?', 'Group classes start from $180/month. Trial lessons are available this week.', 2),
  ('tuition-hub', 'Where are you located?', 'We are at Tampines Central, a 5-minute walk from the MRT.', 3),
  ('aircon-pro', 'How much is aircon servicing?', 'General servicing starts from $35/unit, with discounts for 3 or more units.', 1),
  ('aircon-pro', 'Do you handle urgent repairs?', 'Yes, urgent repair slots are available depending on technician location.', 2),
  ('aircon-pro', 'Which areas do you cover?', 'We cover all HDB and condo estates islandwide in Singapore.', 3),
  ('plumbing-care', 'Do you handle urgent leaks?', 'Yes, we handle urgent leaks when a plumber is available. Please share your block, unit type, and a photo if possible.', 1),
  ('plumbing-care', 'How much is plumbing repair?', 'Inspection starts from $40, and repair pricing depends on the issue after the plumber checks it.', 2),
  ('plumbing-care', 'Which plumbing services do you provide?', 'We handle leaking pipes, clogged sinks, toilet flush issues, tap replacement, and water heater connections.', 3),
  ('reno-studio', 'Do you provide renovation quotes?', 'Yes, we can prepare a quote after reviewing your floor plan, scope, preferred style, and timeline.', 1),
  ('reno-studio', 'Can you handle HDB renovations?', 'Yes, we handle HDB, condo, and landed renovation work, including carpentry, flooring, and kitchen upgrades.', 2),
  ('reno-studio', 'How long does renovation take?', 'Small upgrades can take 2 to 4 weeks, while full-home projects usually need 8 to 12 weeks after approvals.', 3),
  ('hawker-kitchen', 'Can I place a bulk order?', 'Yes, bulk orders are available with at least one day''s notice. Please share the number of packets and pickup time.', 1),
  ('hawker-kitchen', 'What dishes do you sell?', 'We sell steamed chicken rice, roasted chicken rice, char siew rice, and soup add-ons while stocks last.', 2),
  ('hawker-kitchen', 'Where is your stall?', 'We are at Bedok Food Centre, stall 18, usually open for lunch from Monday to Saturday.', 3),
  ('bakery-bites', 'Do you make custom cakes?', 'Yes, we make custom birthday and celebration cakes with 3 to 5 days'' notice depending on design.', 1),
  ('bakery-bites', 'How much are cakes?', 'Standard 6-inch cakes start from $48. Custom cakes are quoted based on size, flavor, and decoration.', 2),
  ('bakery-bites', 'Do you deliver?', 'Delivery is available islandwide from $12, or customers can self-collect from our Tampines bakery.', 3)
on conflict (business_id, question) do update set
  answer = excluded.answer,
  sort_order = excluded.sort_order,
  updated_at = now();
