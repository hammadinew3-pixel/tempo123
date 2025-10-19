import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header to identify the calling user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create a client with the user's token to get their info
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get the tenant_id of the calling user (admin)
    const { data: userTenantData, error: tenantError } = await supabaseAdmin
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (tenantError || !userTenantData) {
      return new Response(
        JSON.stringify({ error: 'Could not find tenant for admin user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const adminTenantId = userTenantData.tenant_id;

    // Verify that the calling user is an admin
    const { data: roleData, error: roleCheckError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', adminTenantId)
      .single();

    if (roleCheckError || roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can create users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { email, password, nom, role } = await req.json();

    // Validate input
    if (!email || !password || !nom) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, nom' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Force role to be 'agent' - only admins can create agents
    const newUserRole = 'agent';

    // Create user with admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nom,
        skip_tenant_creation: 'true'  // Prevent handle_new_user trigger from creating a tenant
      }
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        nom,
        actif: true
      });

    if (profileError) {
      // Cleanup: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    // Link user to the same tenant as the admin
    const { error: userTenantError } = await supabaseAdmin
      .from('user_tenants')
      .insert({
        user_id: authData.user.id,
        tenant_id: adminTenantId,
        is_active: true
      });

    if (userTenantError) {
      // Cleanup: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw userTenantError;
    }

    // Assign agent role in the admin's tenant
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ 
        user_id: authData.user.id, 
        tenant_id: adminTenantId,
        role: newUserRole
      });

    if (roleError) {
      // Cleanup: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw roleError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: newUserRole,
          tenant_id: adminTenantId
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    );
  }
});
