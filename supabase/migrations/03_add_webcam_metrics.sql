-- Add webcam metrics storage for mock interview sessions
ALTER TABLE mock_interviews
ADD COLUMN IF NOT EXISTS webcam_metrics_json JSONB DEFAULT '{}';
