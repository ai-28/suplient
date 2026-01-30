-- Migration script to add missing columns to PushSubscription table
-- Run this directly in your PostgreSQL database

-- Add platform column if it doesn't exist
ALTER TABLE "PushSubscription" 
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'web';

-- Add userAgent column if it doesn't exist
ALTER TABLE "PushSubscription" 
ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

-- Add updatedAt column if it doesn't exist
ALTER TABLE "PushSubscription" 
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have default platform value
UPDATE "PushSubscription" 
SET platform = 'web' 
WHERE platform IS NULL;
