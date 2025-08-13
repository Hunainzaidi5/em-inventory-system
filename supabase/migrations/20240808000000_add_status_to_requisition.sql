-- Add status field to requisition table
ALTER TABLE requisition ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add comment for the new field
COMMENT ON COLUMN requisition.status IS 'Status of the requisition: pending, completed, overdue'; 