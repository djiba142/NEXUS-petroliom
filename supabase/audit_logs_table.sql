-- Audit Logs Table for comprehensive user tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'LOGIN', 'VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'DOWNLOAD'
  resource_type TEXT, -- 'stations', 'alertes', 'entreprises', 'rapports', 'users', etc.
  resource_id UUID,
  resource_name TEXT, -- Name of affected resource
  details JSONB, -- Additional information about the action
  ip_address TEXT,
  user_agent TEXT,
  status TEXT, -- 'success', 'failed'
  error_message TEXT,
  entreprise_id UUID REFERENCES entreprises(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entreprise_id ON audit_logs(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);

-- Enable RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Super admins can see all audit logs
CREATE POLICY "super_admin_view_all_logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- RLS Policy: Entreprise managers can only see logs for their entreprise
CREATE POLICY "entreprise_manager_view_own_logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'responsable_entreprise'
      AND profiles.entreprise_id = audit_logs.entreprise_id
    )
  );

-- Create a function to log user login
CREATE OR REPLACE FUNCTION log_user_login()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action_type,
    status,
    created_at
  )
  VALUES (
    auth.uid(),
    auth.jwt()->>'email',
    'LOGIN',
    'success',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log all changes
INSERT INTO audit_logs (user_id, user_email, action_type, status, details)
SELECT 
  auth.uid(),
  auth.jwt()->>'email',
  'AUDIT_TABLE_CREATED',
  'success',
  jsonb_build_object('description', 'Audit table and policies created')
WHERE auth.uid() IS NOT NULL;
