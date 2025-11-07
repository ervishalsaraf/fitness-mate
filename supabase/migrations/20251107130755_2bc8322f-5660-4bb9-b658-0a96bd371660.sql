-- Add new activity types to the activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'badminton';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'volleyball';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'snooker';