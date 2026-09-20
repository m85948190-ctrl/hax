CREATE TABLE IF NOT EXISTS haxbro_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES haxbro_users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES haxbro_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_a, user_b),
  CHECK(user_a < user_b)
)