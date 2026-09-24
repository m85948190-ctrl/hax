CREATE TABLE IF NOT EXISTS haxbro_public_traffic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_key text NOT NULL,
  path text NOT NULL DEFAULT '/',
  created_at timestamptz NOT NULL DEFAULT now()
)