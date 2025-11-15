-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Team Invitations Table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')) DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, email, status)
);

-- Conversation Assignments Table
CREATE TABLE IF NOT EXISTS conversation_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, bot_id)
);

-- Add organization_id to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE users ADD COLUMN organization_id UUID DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_org ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_org ON team_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_conversation_assignments_session ON conversation_assignments(session_id, bot_id);
CREATE INDEX IF NOT EXISTS idx_conversation_assignments_assigned_to ON conversation_assignments(assigned_to);

-- Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_assignments ENABLE ROW LEVEL SECURITY;

-- Team Members Policies
CREATE POLICY "Users can view team members in their organization"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_members.organization_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage team members"
  ON team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_members.organization_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Team Invitations Policies
CREATE POLICY "Team members can view invitations in their organization"
  ON team_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_invitations.organization_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage invitations"
  ON team_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = team_invitations.organization_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Conversation Assignments Policies
CREATE POLICY "Team members can view assignments in their organization"
  ON conversation_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bots b
      JOIN team_members tm ON b.user_id = tm.user_id
      WHERE b.id = conversation_assignments.bot_id
      AND tm.organization_id IN (
        SELECT organization_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Team members and admins can manage assignments"
  ON conversation_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bots b
      JOIN team_members tm ON b.user_id = tm.user_id
      WHERE b.id = conversation_assignments.bot_id
      AND tm.organization_id IN (
        SELECT organization_id FROM team_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'member')
      )
    )
  );

-- Function to auto-create organization and owner for new users
CREATE OR REPLACE FUNCTION create_user_organization()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Generate organization ID if not set
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := gen_random_uuid();
  END IF;

  org_id := NEW.organization_id;

  -- Create team member entry for the user as owner
  INSERT INTO team_members (organization_id, user_id, role, joined_at)
  VALUES (org_id, NEW.id, 'owner', NOW())
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create organization for new users
DROP TRIGGER IF EXISTS on_user_created_organization ON users;
CREATE TRIGGER on_user_created_organization
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_organization();
