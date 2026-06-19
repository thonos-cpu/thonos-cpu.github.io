CREATE TABLE IF NOT EXISTS analytics_sessions (
  session_id TEXT PRIMARY KEY,
  visitor_hash TEXT NOT NULL,
  entry_path TEXT NOT NULL,
  exit_path TEXT,
  referrer TEXT,
  device_class TEXT,
  country_code TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS analytics_sessions_first_seen_idx ON analytics_sessions (first_seen DESC);
CREATE INDEX IF NOT EXISTS analytics_sessions_last_seen_idx ON analytics_sessions (last_seen DESC);
CREATE INDEX IF NOT EXISTS analytics_sessions_visitor_idx ON analytics_sessions (visitor_hash);

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES analytics_sessions(session_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'section_view', 'heartbeat', 'duration')),
  path TEXT NOT NULL,
  section TEXT,
  duration_seconds INTEGER,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_events_occurred_idx ON analytics_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_path_idx ON analytics_events (path, event_type);
CREATE INDEX IF NOT EXISTS analytics_events_section_idx ON analytics_events (section, event_type);

CREATE TABLE IF NOT EXISTS analytics_sensitive_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('gpt', 'compiler')),
  encrypted_payload TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_sensitive_logs_occurred_idx ON analytics_sensitive_logs (occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_sensitive_logs_kind_idx ON analytics_sensitive_logs (kind, occurred_at DESC);
