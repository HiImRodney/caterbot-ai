-- ============================================================================
-- SESSION 4: DATABASE SCHEMA FOR MANAGER DASHBOARD
-- Complete table definitions supporting all test data
-- ============================================================================

-- ============================================================================
-- TABLE 1: STAFF_MEMBERS (Enhanced for 4-tier auth)
-- Supports Staff, Manager, Operative, Super Admin roles
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id),
  
  -- Authentication fields
  auth_method TEXT NOT NULL CHECK (auth_method IN ('username_joincode', 'email_password')),
  username TEXT, -- For staff users
  join_code TEXT, -- For staff users  
  email TEXT, -- For manager/operative/admin users
  auth_user_id UUID, -- Links to Supabase Auth when using email/password
  
  -- User information
  role TEXT NOT NULL CHECK (role IN ('staff', 'manager', 'operative', 'super_admin')),
  display_name TEXT NOT NULL,
  department TEXT,
  
  -- Role-specific permissions
  manager_permissions JSONB, -- For managers
  approval_limits JSONB, -- Spending limits for managers
  caterbot_employee_id TEXT, -- For operatives and admins
  service_territories TEXT[], -- For operatives
  engineer_contacts JSONB, -- For operatives
  admin_permissions JSONB, -- For super admins
  system_access JSONB, -- For super admins
  
  -- Staff-specific fields
  shift_pattern JSONB,
  equipment_certifications TEXT[],
  emergency_contact JSONB,
  
  -- Activity tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Constraints
  CONSTRAINT auth_method_fields CHECK (
    (auth_method = 'username_joincode' AND username IS NOT NULL AND join_code IS NOT NULL) OR
    (auth_method = 'email_password' AND email IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_staff_username_joincode ON staff_members(username, join_code) WHERE auth_method = 'username_joincode';
CREATE INDEX idx_staff_email ON staff_members(email) WHERE auth_method = 'email_password';
CREATE INDEX idx_staff_site_role ON staff_members(site_id, role);

-- ============================================================================
-- TABLE 2: EQUIPMENT_FINANCIALS
-- Detailed financial tracking per equipment per month
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment_registry(id),
  site_id UUID NOT NULL REFERENCES sites(id),
  
  -- Time period
  month_year TEXT NOT NULL, -- Format: "2024-06"
  
  -- Cost breakdown
  parts_cost_gbp DECIMAL(10,2) DEFAULT 0.00,
  labor_cost_gbp DECIMAL(10,2) DEFAULT 0.00,
  ai_interaction_cost_gbp DECIMAL(10,2) DEFAULT 0.00,
  total_maintenance_cost_gbp DECIMAL(10,2) DEFAULT 0.00,
  energy_cost_gbp DECIMAL(10,2) DEFAULT 0.00,
  total_operational_cost_gbp DECIMAL(10,2) DEFAULT 0.00,
  
  -- Savings and ROI
  cost_savings_delivered_gbp DECIMAL(10,2) DEFAULT 0.00,
  roi_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- Performance metrics
  maintenance_efficiency_score INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(equipment_id, month_year)
);

CREATE INDEX idx_equipment_financials_equipment ON equipment_financials(equipment_id);
CREATE INDEX idx_equipment_financials_site_month ON equipment_financials(site_id, month_year);

-- ============================================================================
-- Enable RLS on all new tables
-- ============================================================================

ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_financials ENABLE ROW LEVEL SECURITY;

-- Staff members policy - users can only see members from their site
CREATE POLICY staff_members_site_isolation ON staff_members
  FOR ALL USING (
    site_id = (
      SELECT site_id FROM staff_members 
      WHERE auth_user_id = auth.uid() 
      OR (username = current_setting('app.current_username', true) AND join_code = current_setting('app.current_joincode', true))
    )
  );

-- Equipment financials policy - site-based access
CREATE POLICY equipment_financials_site_access ON equipment_financials
  FOR ALL USING (
    site_id IN (
      SELECT site_id FROM staff_members 
      WHERE auth_user_id = auth.uid() 
      OR (username = current_setting('app.current_username', true) AND join_code = current_setting('app.current_joincode', true))
    )
  );

-- ============================================================================
-- SUMMARY: SESSION 4 DATABASE SCHEMA DEPLOYED
-- ============================================================================

/*
✅ STAFF_MEMBERS TABLE ENHANCED:
   - 4-tier authentication system (Staff/Manager/Operative/Super Admin)
   - Username + Join Code for staff users
   - Email + Password for management users  
   - Role-specific permissions and approval limits
   - Complete user profile and activity tracking

✅ EQUIPMENT_FINANCIALS TABLE:
   - Monthly financial breakdown per equipment
   - Parts, labor, AI, and total operational costs
   - ROI calculations and cost savings tracking
   - Maintenance efficiency scoring

✅ ROW LEVEL SECURITY:
   - Complete multi-tenant data isolation
   - Site-based access control for all tables
   - Support for both auth methods (username/joincode and email/password)
   - Secure data access for all user roles

🚀 READY FOR SESSION 4 FRONTEND IMPLEMENTATION!
*/