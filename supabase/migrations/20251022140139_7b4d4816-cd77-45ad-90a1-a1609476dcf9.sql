-- Add cricket, football, and basketball to activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'cricket';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'football';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'basketball';