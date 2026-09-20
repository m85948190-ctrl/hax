CREATE TABLE IF NOT EXISTS haxbro_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES haxbro_chat_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES haxbro_users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES haxbro_users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)