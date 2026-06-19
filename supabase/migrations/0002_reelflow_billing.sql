-- =====================================================================
-- ReelFlow · 0002 billing (Stripe)
-- Suscripción por usuario. Escrituras vía service_role (webhook); el
-- usuario solo lee la suya. Reusa el trigger reelflow_set_updated_at (0001).
-- =====================================================================

create table if not exists public.reelflow_subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text,
  plan                   text not null default 'free'
                         check (plan in ('free','starter','pro')),
  status                 text not null default 'active'
                         check (status in ('active','trialing','past_due','canceled','incomplete')),
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.reelflow_subscriptions is 'ReelFlow: estado de suscripción Stripe por usuario.';

drop trigger if exists reelflow_subs_set_updated_at on public.reelflow_subscriptions;
create trigger reelflow_subs_set_updated_at
  before update on public.reelflow_subscriptions
  for each row execute function public.reelflow_set_updated_at();

alter table public.reelflow_subscriptions enable row level security;

drop policy if exists reelflow_subs_select_own on public.reelflow_subscriptions;
create policy reelflow_subs_select_own on public.reelflow_subscriptions
  for select to authenticated
  using (auth.uid() = user_id);

revoke all on public.reelflow_subscriptions from anon;
grant select on public.reelflow_subscriptions to authenticated;
grant all on public.reelflow_subscriptions to service_role;
