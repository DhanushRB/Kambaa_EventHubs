-- Add total_accessed field to FormAnalytics table for better completion rate tracking
-- This field will track how many times a form has been accessed/viewed

ALTER TABLE FormAnalytics 
ADD COLUMN total_accessed INTEGER DEFAULT 0;

-- Update existing records to have a reasonable estimate
-- Estimate accessed count as 25% higher than current responses
UPDATE FormAnalytics 
SET total_accessed = GREATEST(
    total_responses, 
    CAST(total_responses * 1.25 AS INTEGER)
) 
WHERE total_accessed IS NULL OR total_accessed = 0;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_form_analytics_accessed ON FormAnalytics(total_accessed);