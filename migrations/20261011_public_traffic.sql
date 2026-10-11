ALTER TABLE haxbro_public_traffic
  ADD COLUMN IF NOT EXISTS visit_date date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE haxbro_public_traffic
  ADD COLUMN IF NOT EXISTS last_seen timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS haxbro_public_traffic_visitor_day_path_uidx
  ON haxbro_public_traffic (visitor_key, visit_date, path);
CREATE INDEX IF NOT EXISTS haxbro_public_traffic_date_idx
  ON haxbro_public_traffic (visit_date);
CREATE INDEX IF NOT EXISTS haxbro_public_traffic_last_seen_idx
  ON haxbro_public_traffic (last_seen);