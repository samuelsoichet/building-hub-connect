import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'tenant' | 'maintenance';

export interface UserWithDetails {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  suite_number: string | null;
  created_at: string;
  role: UserRole | null;
  unit_id: string | null;
  unit_number: string | null;
}

export interface UnitOption {
  id: string;
  unit_number: string;
  tenant_id: string | null;
}

// Fetch all users with their profiles and roles (admin only)
export const fetchAllUsers = async (): Promise<UserWithDetails[]> => {
  // First, get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw profilesError;
  }

  // Get all user roles
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role');

  if (rolesError) {
    console.error('Error fetching roles:', rolesError);
    throw rolesError;
  }

  // Get all units to find tenant assignments
  const { data: units, error: unitsError } = await supabase
    .from('units')
    .select('id, unit_number, tenant_id');

  if (unitsError) {
    console.error('Error fetching units:', unitsError);
    throw unitsError;
  }

  // Create a map of user_id to role
  const roleMap = new Map<string, UserRole>();
  roles?.forEach((r: any) => {
    roleMap.set(r.user_id, r.role as UserRole);
  });

  // Create a map of tenant_id to unit info
  const unitMap = new Map<string, { id: string; unit_number: string }>();
  units?.forEach((u: any) => {
    if (u.tenant_id) {
      unitMap.set(u.tenant_id, { id: u.id, unit_number: u.unit_number });
    }
  });

  // Combine the data
  return (profiles || []).map((profile: any) => {
    const unitInfo = unitMap.get(profile.user_id);
    return {
      id: profile.id,
      user_id: profile.user_id,
      email: profile.email || '',
      full_name: profile.full_name,
      suite_number: profile.suite_number,
      created_at: profile.created_at,
      role: roleMap.get(profile.user_id) || null,
      unit_id: unitInfo?.id || null,
      unit_number: unitInfo?.unit_number || null,
    };
  });
};

// Fetch all available units (admin only)
export const fetchAllUnits = async (): Promise<UnitOption[]> => {
  const { data, error } = await supabase
    .from('units')
    .select('id, unit_number, tenant_id')
    .order('unit_number');

  if (error) {
    console.error('Error fetching units:', error);
    throw error;
  }

  return (data || []).map((u: any) => ({
    id: u.id,
    unit_number: u.unit_number,
    tenant_id: u.tenant_id,
  }));
};

// Update a user's role (admin only)
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
  // Check if user already has a role
  const { data: existingRole, error: checkError } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking existing role:', checkError);
    throw checkError;
  }

  if (existingRole) {
    // Update existing role
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  } else {
    // Insert new role
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: newRole });

    if (error) {
      console.error('Error inserting role:', error);
      throw error;
    }
  }
};

// Assign a tenant to a unit (admin only)
export const assignTenantToUnit = async (userId: string, unitId: string | null): Promise<void> => {
  // First, remove tenant from any existing unit
  const { error: clearError } = await supabase
    .from('units')
    .update({ tenant_id: null, updated_at: new Date().toISOString() })
    .eq('tenant_id', userId);

  if (clearError) {
    console.error('Error clearing existing unit assignment:', clearError);
    throw clearError;
  }

  // If unitId is provided, assign tenant to new unit
  if (unitId) {
    const { error } = await supabase
      .from('units')
      .update({ tenant_id: userId, updated_at: new Date().toISOString() })
      .eq('id', unitId);

    if (error) {
      console.error('Error assigning tenant to unit:', error);
      throw error;
    }
  }
};

// Update user's password
export const updateUserPassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};
