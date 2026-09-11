CREATE TABLE IF NOT EXISTS haxbro_marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_videos integer NOT NULL DEFAULT 20,
  target_views integer NOT NULL DEFAULT 40000,
  start_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
)