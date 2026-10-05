CREATE TABLE IF NOT EXISTS kai_training_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  checksum text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kai_training_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_slug text NOT NULL,
  prompt text NOT NULL,
  response_contract text NOT NULL,
  capability text NOT NULL DEFAULT 'general',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  weight numeric NOT NULL DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kai_training_examples_pack_idx ON kai_training_examples(pack_slug, enabled);
CREATE INDEX IF NOT EXISTS kai_training_examples_capability_idx ON kai_training_examples(capability, enabled);

CREATE TABLE IF NOT EXISTS kai_training_sync_state (
  id integer PRIMARY KEY DEFAULT 1,
  pack_slug text NOT NULL,
  pack_version integer NOT NULL DEFAULT 1,
  checksum text NOT NULL DEFAULT '',
  model_identity text NOT NULL DEFAULT 'KAI 51 / SmolLM2-360M-Instruct',
  source text NOT NULL DEFAULT 'HATCHABLE',
  last_synced_at timestamptz NOT NULL DEFAULT now()
);