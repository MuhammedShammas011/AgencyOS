-- ==============================================================================
-- Agency OS — Meetings Module Migration
-- Run: psql -d agency_os -f scripts/meetings-migration.sql
-- ==============================================================================

-- meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id          TEXT PRIMARY KEY DEFAULT ('mtg_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  title       TEXT NOT NULL,
  description TEXT,
  room_id     TEXT NOT NULL UNIQUE,  -- cryptographically random, e.g. "cubstudio-meeting-a8f32c91"
  organizer_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organizer_name TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,          -- NULL = instant meeting
  duration_minutes INT NOT NULL DEFAULT 60,
  status      TEXT NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  ended_at    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- meeting_participants table
CREATE TABLE IF NOT EXISTS meeting_participants (
  id              TEXT PRIMARY KEY DEFAULT ('mprt_' || substr(md5(random()::text), 1, 12)),
  meeting_id      TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  employee_id     TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_name   TEXT NOT NULL,
  invitation_status TEXT NOT NULL DEFAULT 'invited'
                    CHECK (invitation_status IN ('invited', 'accepted', 'declined', 'joined', 'left')),
  joined_at       TIMESTAMPTZ,
  left_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, employee_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meetings_organizer    ON meetings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status       ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting  ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_employee ON meeting_participants(employee_id);
