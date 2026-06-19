-- Portfolio analytics, private administration, and abuse-control storage.
-- Browser clients receive only the publishable key. All writes go through
-- Edge Functions using the service role; authenticated administrators read
-- through the guarded portfolio_dashboard function.

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.analytics_sessions (
  session_id uuid primary key,
  visitor_hash text not null,
  entry_path text not null,
  exit_path text,
  referrer text,
  device_class text check (device_class in ('mobile', 'tablet', 'desktop')),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  started_at timestamptz not null default now(),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 86400),
  page_views integer not null default 0 check (page_views >= 0)
);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.analytics_sessions(session_id) on delete cascade,
  event_type text not null check (event_type in ('page_view', 'section_view', 'heartbeat', 'duration')),
  path text not null,
  section text,
  duration_seconds integer check (duration_seconds between 0 and 86400),
  occurred_at timestamptz not null default now()
);

create table public.analytics_sensitive_logs (
  id bigint generated always as identity primary key,
  session_id uuid,
  kind text not null check (kind in ('gpt', 'compiler')),
  encrypted_payload text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.request_rate_limits (
  key_hash text primary key,
  request_count integer not null default 1 check (request_count > 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index analytics_sessions_first_seen_idx on public.analytics_sessions (first_seen desc);
create index analytics_sessions_last_seen_idx on public.analytics_sessions (last_seen desc);
create index analytics_sessions_visitor_idx on public.analytics_sessions (visitor_hash, first_seen desc);
create index analytics_events_occurred_idx on public.analytics_events (occurred_at desc);
create index analytics_events_path_type_idx on public.analytics_events (event_type, path, occurred_at desc);
create index analytics_events_section_type_idx on public.analytics_events (event_type, section, occurred_at desc) where section is not null;
create index analytics_sensitive_logs_kind_occurred_idx on public.analytics_sensitive_logs (kind, occurred_at desc);
create index request_rate_limits_reset_idx on public.request_rate_limits (reset_at);

alter table public.admin_users enable row level security;
alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.analytics_sensitive_logs enable row level security;
alter table public.request_rate_limits enable row level security;

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

create policy admin_users_read_self
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

create policy analytics_sessions_admin_read
on public.analytics_sessions for select to authenticated
using ((select public.is_portfolio_admin()));

create policy analytics_events_admin_read
on public.analytics_events for select to authenticated
using ((select public.is_portfolio_admin()));

create policy analytics_sensitive_logs_admin_read
on public.analytics_sensitive_logs for select to authenticated
using ((select public.is_portfolio_admin()));

create or replace function public.consume_portfolio_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if length(p_key_hash) < 16 or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.request_rate_limits (key_hash, request_count, reset_at, updated_at)
  values (p_key_hash, 1, now() + make_interval(secs => p_window_seconds), now())
  on conflict (key_hash) do update set
    request_count = case
      when public.request_rate_limits.reset_at <= now() then 1
      else public.request_rate_limits.request_count + 1
    end,
    reset_at = case
      when public.request_rate_limits.reset_at <= now() then now() + make_interval(secs => p_window_seconds)
      else public.request_rate_limits.reset_at
    end,
    updated_at = now()
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

create or replace function public.record_portfolio_analytics(
  p_session_id uuid,
  p_visitor_hash text,
  p_event_type text,
  p_path text,
  p_section text default null,
  p_duration_seconds integer default 0,
  p_referrer text default null,
  p_device_class text default null,
  p_country_code text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_duration integer := least(greatest(coalesce(p_duration_seconds, 0), 0), 86400);
begin
  if p_event_type not in ('page_view', 'section_view', 'heartbeat', 'duration') then
    raise exception 'invalid analytics event';
  end if;

  insert into public.analytics_sessions (
    session_id, visitor_hash, entry_path, exit_path, referrer, device_class,
    country_code, duration_seconds, page_views
  ) values (
    p_session_id, p_visitor_hash, left(p_path, 240), left(p_path, 240),
    left(p_referrer, 500), p_device_class, p_country_code, v_duration,
    case when p_event_type = 'page_view' then 1 else 0 end
  )
  on conflict (session_id) do update set
    last_seen = now(),
    exit_path = left(p_path, 240),
    device_class = coalesce(public.analytics_sessions.device_class, excluded.device_class),
    country_code = coalesce(public.analytics_sessions.country_code, excluded.country_code),
    duration_seconds = greatest(public.analytics_sessions.duration_seconds, v_duration),
    ended_at = case when p_event_type = 'duration' then now() else public.analytics_sessions.ended_at end,
    page_views = public.analytics_sessions.page_views + case when p_event_type = 'page_view' then 1 else 0 end;

  insert into public.analytics_events (session_id, event_type, path, section, duration_seconds)
  values (
    p_session_id,
    p_event_type,
    left(p_path, 240),
    nullif(left(coalesce(p_section, ''), 120), ''),
    case when p_event_type = 'duration' then v_duration else null end
  );
end;
$$;

create or replace function public.portfolio_dashboard(p_period text default 'month')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_since timestamptz;
  v_bucket text;
  v_result jsonb;
begin
  if not (select public.is_portfolio_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_since := case p_period
    when 'day' then now() - interval '24 hours'
    when 'month' then now() - interval '30 days'
    when 'year' then now() - interval '365 days'
    when 'all' then '-infinity'::timestamptz
    else now() - interval '30 days'
  end;
  v_bucket := case when p_period = 'day' then 'hour' when p_period = 'month' then 'day' else 'month' end;

  select jsonb_build_object(
    'summary', (
      select jsonb_build_object(
        'liveVisitors', (select count(*) from public.analytics_sessions where last_seen > now() - interval '2 minutes'),
        'uniqueVisitors', count(distinct visitor_hash),
        'sessions', count(*),
        'pageViews', coalesce(sum(page_views), 0),
        'avgDuration', coalesce(avg(duration_seconds)::integer, 0),
        'totalDuration', coalesce(sum(duration_seconds), 0)
      )
      from public.analytics_sessions where first_seen >= v_since
    ),
    'series', coalesce((
      select jsonb_agg(row_data order by bucket)
      from (
        select date_trunc(v_bucket, e.occurred_at) as bucket,
          count(*) filter (where e.event_type = 'page_view') as views,
          count(distinct s.visitor_hash) as visitors,
          jsonb_build_object(
            'bucket', date_trunc(v_bucket, e.occurred_at),
            'views', count(*) filter (where e.event_type = 'page_view'),
            'visitors', count(distinct s.visitor_hash)
          ) as row_data
        from public.analytics_events e
        join public.analytics_sessions s on s.session_id = e.session_id
        where e.occurred_at >= v_since
        group by 1
      ) series_rows
    ), '[]'::jsonb),
    'topPages', coalesce((
      select jsonb_agg(row_data order by views desc)
      from (
        select views.path, views.views, coalesce(durations.avg_seconds, 0) as avg_seconds,
          jsonb_build_object('path', views.path, 'views', views.views, 'avgSeconds', coalesce(durations.avg_seconds, 0)) as row_data
        from (
          select path, count(*) as views
          from public.analytics_events
          where event_type = 'page_view' and occurred_at >= v_since
          group by path order by views desc limit 12
        ) views
        left join (
          select path, avg(duration_seconds)::integer as avg_seconds
          from public.analytics_events
          where event_type = 'duration' and occurred_at >= v_since
          group by path
        ) durations on durations.path = views.path
      ) page_rows
    ), '[]'::jsonb),
    'topSections', coalesce((
      select jsonb_agg(row_data order by views desc)
      from (
        select section, count(*) as views,
          jsonb_build_object('section', section, 'views', count(*)) as row_data
        from public.analytics_events
        where event_type = 'section_view' and section is not null and occurred_at >= v_since
        group by section order by views desc limit 12
      ) section_rows
    ), '[]'::jsonb),
    'sensitive', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', id,
          'kind', kind,
          'encryptedPayload', encrypted_payload,
          'metadata', metadata,
          'occurredAt', occurred_at
        ) order by occurred_at desc
      )
      from (
        select id, kind, encrypted_payload, metadata, occurred_at
        from public.analytics_sensitive_logs
        where occurred_at >= v_since
        order by occurred_at desc limit 100
      ) sensitive_rows
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.delete_expired_portfolio_data(
  p_analytics_days integer default 730,
  p_sensitive_days integer default 30
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.analytics_sensitive_logs
  where occurred_at < now() - make_interval(days => greatest(p_sensitive_days, 1));

  delete from public.analytics_sessions
  where first_seen < now() - make_interval(days => greatest(p_analytics_days, 30));

  delete from public.request_rate_limits where reset_at < now() - interval '1 day';
end;
$$;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.admin_users, public.analytics_sessions, public.analytics_events, public.analytics_sensitive_logs to authenticated;
grant all on public.admin_users, public.analytics_sessions, public.analytics_events, public.analytics_sensitive_logs, public.request_rate_limits to service_role;
grant usage, select on all sequences in schema public to service_role;

revoke all on function public.is_portfolio_admin() from public, anon;
revoke all on function public.consume_portfolio_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.record_portfolio_analytics(uuid, text, text, text, text, integer, text, text, text) from public, anon, authenticated;
revoke all on function public.portfolio_dashboard(text) from public, anon;
revoke all on function public.delete_expired_portfolio_data(integer, integer) from public, anon, authenticated;

grant execute on function public.is_portfolio_admin() to authenticated, service_role;
grant execute on function public.consume_portfolio_rate_limit(text, integer, integer) to service_role;
grant execute on function public.record_portfolio_analytics(uuid, text, text, text, text, integer, text, text, text) to service_role;
grant execute on function public.portfolio_dashboard(text) to authenticated, service_role;
grant execute on function public.delete_expired_portfolio_data(integer, integer) to service_role;

comment on table public.analytics_sensitive_logs is 'AES-GCM encrypted GPT and compiler submissions. Decryption occurs only in the authenticated admin Edge Function.';
comment on function public.portfolio_dashboard(text) is 'Returns private portfolio analytics only to an authenticated user listed in admin_users.';
