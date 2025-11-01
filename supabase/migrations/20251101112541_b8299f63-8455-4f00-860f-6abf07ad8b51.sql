-- Create conversations table for one-to-one messaging
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

-- Create unique index to ensure unique conversation between two users (order independent)
CREATE UNIQUE INDEX unique_conversation_participants 
ON conversations (LEAST(participant_1_id, participant_2_id), GREATEST(participant_1_id, participant_2_id));

CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id, read) WHERE read = false;

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Conversations
CREATE POLICY "Users can view their own conversations with accepted buddies"
ON public.conversations FOR SELECT
USING (
  (auth.uid() = participant_1_id OR auth.uid() = participant_2_id)
  AND EXISTS (
    SELECT 1 FROM buddy_connections
    WHERE status = 'accepted'
    AND (
      (requester_id = participant_1_id AND receiver_id = participant_2_id)
      OR (requester_id = participant_2_id AND receiver_id = participant_1_id)
    )
  )
);

CREATE POLICY "Users can create conversations with accepted buddies"
ON public.conversations FOR INSERT
WITH CHECK (
  (auth.uid() = participant_1_id OR auth.uid() = participant_2_id)
  AND EXISTS (
    SELECT 1 FROM buddy_connections
    WHERE status = 'accepted'
    AND (
      (requester_id = participant_1_id AND receiver_id = participant_2_id)
      OR (requester_id = participant_2_id AND receiver_id = participant_1_id)
    )
  )
);

CREATE POLICY "Users can update their conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- RLS Policies for Messages
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
  )
);

CREATE POLICY "Users can update messages in their conversations"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
  )
);

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id UUID;
BEGIN
  SELECT id INTO conv_id
  FROM conversations
  WHERE 
    (participant_1_id = user1_id AND participant_2_id = user2_id)
    OR (participant_1_id = user2_id AND participant_2_id = user1_id);
  
  IF conv_id IS NULL THEN
    INSERT INTO conversations (participant_1_id, participant_2_id)
    VALUES (user1_id, user2_id)
    RETURNING id INTO conv_id;
  END IF;
  
  RETURN conv_id;
END;
$$;

-- Add comment settings to groups table
ALTER TABLE public.groups
ADD COLUMN allow_comments BOOLEAN DEFAULT TRUE,
ADD COLUMN comments_public BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN groups.allow_comments IS 'Whether comments are enabled for this event';
COMMENT ON COLUMN groups.comments_public IS 'If true, all members can see comments; if false, only organizer sees them';

-- Create event_comments table
CREATE TABLE public.event_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_comments_group ON event_comments(group_id, created_at DESC);
CREATE INDEX idx_event_comments_user ON event_comments(user_id);

-- Enable RLS
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Event Comments
CREATE POLICY "Event members can post comments if enabled"
ON public.event_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = event_comments.group_id
    AND groups.allow_comments = true
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can view event comments based on settings"
ON public.event_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = event_comments.group_id
    AND (
      groups.creator_id = auth.uid()
      OR (
        groups.comments_public = true
        AND EXISTS (
          SELECT 1 FROM group_members
          WHERE group_members.group_id = groups.id
          AND group_members.user_id = auth.uid()
        )
      )
      OR event_comments.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own comments"
ON public.event_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.event_comments FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = event_comments.group_id
    AND groups.creator_id = auth.uid()
  )
);

-- Enable realtime for messages and comments
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE event_comments;