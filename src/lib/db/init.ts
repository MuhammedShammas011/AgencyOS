import { query } from '@/lib/db';
import { INITIAL_USERS } from '@/lib/data/initial-data';

let setupPromise: Promise<void> | null = null;

/**
 * Idempotently ensures all required tables, constraints, indexes,
 * and initial profiles exist in PostgreSQL.
 * Safe to call on every request (cached in memory after first success).
 */
export async function ensureMeetingsDatabaseTables(): Promise<void> {
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    try {
      // 1. Profiles table
      await query(`
        CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL DEFAULT 'creative',
          department TEXT NOT NULL,
          title TEXT NOT NULL,
          avatar_url TEXT,
          phone TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // 2. Seed initial profiles so foreign keys and employee lookups always succeed
      for (const u of INITIAL_USERS) {
        await query(
          `INSERT INTO profiles (id, name, email, role, department, title, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             email = EXCLUDED.email,
             role = EXCLUDED.role,
             title = EXCLUDED.title;`,
          [u.id, u.name, u.email, u.role, u.department, u.title]
        );
      }

      // 3. Meetings table
      await query(`
        CREATE TABLE IF NOT EXISTS meetings (
          id TEXT PRIMARY KEY DEFAULT ('mtg_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
          title TEXT NOT NULL,
          description TEXT,
          room_id TEXT NOT NULL UNIQUE,
          organizer_id TEXT NOT NULL,
          organizer_name TEXT NOT NULL,
          scheduled_at TIMESTAMPTZ,
          duration_minutes INT NOT NULL DEFAULT 60,
          status TEXT NOT NULL DEFAULT 'scheduled',
          ended_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // 4. Meeting participants table
      await query(`
        CREATE TABLE IF NOT EXISTS meeting_participants (
          id TEXT PRIMARY KEY DEFAULT ('mprt_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
          meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
          employee_id TEXT NOT NULL,
          employee_name TEXT NOT NULL,
          invitation_status TEXT NOT NULL DEFAULT 'invited',
          joined_at TIMESTAMPTZ,
          left_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (meeting_id, employee_id)
        );
      `);

      // 5. Notifications table
      await query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY DEFAULT ('notif_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
          recipient_profile_id TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          urgency TEXT NOT NULL DEFAULT 'medium',
          link_url TEXT NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // 6. Indexes
      await query(`CREATE INDEX IF NOT EXISTS idx_meetings_org ON meetings(organizer_id);`);
      await query(`CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);`);
      await query(`CREATE INDEX IF NOT EXISTS idx_meetings_sched ON meetings(scheduled_at);`);
      await query(`CREATE INDEX IF NOT EXISTS idx_mp_meeting ON meeting_participants(meeting_id);`);
      await query(`CREATE INDEX IF NOT EXISTS idx_mp_employee ON meeting_participants(employee_id);`);
      await query(`CREATE INDEX IF NOT EXISTS idx_notif_recipient ON notifications(recipient_profile_id, is_read);`);
    } catch (err) {
      console.error('[db:ensureMeetingsDatabaseTables failed]', err);
      setupPromise = null; // Allow retry on next request
      throw err;
    }
  })();

  return setupPromise;
}
