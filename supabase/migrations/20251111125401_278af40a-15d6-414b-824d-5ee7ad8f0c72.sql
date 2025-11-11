-- Create event_status enum
CREATE TYPE event_status AS ENUM ('active', 'cancelled', 'suspended', 'completed');

-- Add new columns to groups table
ALTER TABLE groups 
  ADD COLUMN status event_status DEFAULT 'active',
  ADD COLUMN entry_deadline timestamptz,
  ADD COLUMN last_modified_at timestamptz,
  ADD COLUMN last_modified_by uuid;

-- Create event_coordinators table
CREATE TABLE event_coordinators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  contact_info text NOT NULL,
  display_order integer NOT NULL CHECK (display_order >= 1 AND display_order <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, display_order)
);

-- Enable RLS on event_coordinators
ALTER TABLE event_coordinators ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_coordinators
CREATE POLICY "Event coordinators viewable by event members and creator"
ON event_coordinators FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = event_coordinators.group_id
    AND (
      groups.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Event creators can manage coordinators"
ON event_coordinators FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = event_coordinators.group_id
    AND groups.creator_id = auth.uid()
  )
);

-- Create trigger to update last_modified_at
CREATE OR REPLACE FUNCTION update_group_modified_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_modified_at = NOW();
  NEW.last_modified_by = auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER groups_update_modified
BEFORE UPDATE ON groups
FOR EACH ROW
EXECUTE FUNCTION update_group_modified_timestamp();