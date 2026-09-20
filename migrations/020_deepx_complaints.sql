CREATE TABLE IF NOT EXISTS haxbro_complaints (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 username text NOT NULL DEFAULT 'anonymous',
 message text NOT NULL,
 priority text NOT NULL DEFAULT 'low',
 category text NOT NULL DEFAULT 'feedback',
 signals jsonb NOT NULL DEFAULT '[]'::jsonb,
 status text NOT NULL DEFAULT 'new',
 triage jsonb NOT NULL DEFAULT '{}'::jsonb,
 resolution text,
 created_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS haxbro_complaints_queue_idx ON haxbro_complaints(status,priority,created_at);