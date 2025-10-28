-- Add missing activity types to the enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'running';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'hiking';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'exercise';