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
      .maybeSingle();

    if (tenantError) {
      console.error('create-user: tenant lookup error', tenantError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la vérification du tenant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!userTenantData?.tenant_id) {
      return new Response(
        JSON.stringify({ error: "Aucun tenant actif n'est associé à cet administrateur" }),
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
      .maybeSingle();

    if (roleCheckError) {
      console.error('create-user: role lookup error', roleCheckError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la vérification du rôle' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Seuls les administrateurs peuvent créer des utilisateurs' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { email, password, nom, role, tenant_id } = await req.json();

    // Validate input
    if (!email || !password || !nom) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, nom' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Use provided tenant_id or fallback to admin's tenant
    const targetTenantId = tenant_id || adminTenantId;

    // Verify admin has access to target tenant
    if (tenant_id && tenant_id !== adminTenantId) {
      return new Response(
        JSON.stringify({ error: 'Vous ne pouvez créer des utilisateurs que dans votre propre agence' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Check quota before creating user
    const { data: tenantData, error: quotaError } = await supabaseAdmin
      .from('tenants')
      .select('max_users')
      .eq('id', targetTenantId)
      .single();

    if (quotaError) {
      console.error('create-user: quota check error', quotaError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la vérification du quota' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { count: currentUsers } = await supabaseAdmin
      .from('user_tenants')
      .select('user_id', { count: 'exact', head: true })
      .eq('tenant_id', targetTenantId)
      .eq('is_active', true);

    if (currentUsers !== null && tenantData.max_users && currentUsers >= tenantData.max_users) {
      return new Response(
        JSON.stringify({ 
          error: `Quota utilisateurs atteint (${currentUsers}/${tenantData.max_users})`,
          code: 'QUOTA_EXCEEDED'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
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

    // Profile is automatically created by handle_new_user trigger
    // No need to insert it here

    // Link user to the target tenant
    const { error: userTenantError } = await supabaseAdmin
      .from('user_tenants')
      .insert({
        user_id: authData.user.id,
        tenant_id: targetTenantId,
        is_active: true
      });

    if (userTenantError) {
      // Cleanup: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw userTenantError;
    }

    // Assign agent role in the target tenant
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ 
        user_id: authData.user.id, 
        tenant_id: targetTenantId,
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
          tenant_id: targetTenantId
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = (error as any)?.details;
    const errorCode = (error as any)?.code;
    const errorHint = (error as any)?.hint;
    
    console.error('create-user: error', { 
      message: errorMessage, 
      details: errorDetails, 
      hint: errorHint, 
      code: errorCode,
      raw: error 
    });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        code: errorCode
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    );
  }
});
