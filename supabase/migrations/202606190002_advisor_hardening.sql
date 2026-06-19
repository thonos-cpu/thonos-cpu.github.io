-- Run authenticated dashboard reads as the caller so RLS remains authoritative.
alter function public.is_portfolio_admin() security invoker;
alter function public.portfolio_dashboard(text) security invoker;

-- Make the server-only quota table's deny-by-default intent explicit.
create policy request_rate_limits_no_client_access
on public.request_rate_limits
for all
to anon, authenticated
using (false)
with check (false);

-- Cover the analytics event foreign key for joins and session deletion.
create index analytics_events_session_id_idx
on public.analytics_events (session_id);
