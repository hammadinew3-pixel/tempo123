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
    console.log('STEP A: Checking authorization header');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header', step: 'A' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('STEP B: Creating Supabase clients');
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

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    console.log('STEP C: Fetching current user');
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('create-user: user fetch failed', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', step: 'C' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    console.log('STEP C: User fetched OK, user_id:', user.id);

    console.log('STEP D: Fetching admin tenant');
    const { data: userTenantData, error: tenantError } = await supabaseAdmin
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (tenantError) {
      console.error('create-user: tenant lookup error', tenantError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la vérification du tenant', step: 'D' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!userTenantData?.tenant_id) {
      return new Response(
        JSON.stringify({ error: "Aucun tenant actif n'est associé à cet administrateur", step: 'D' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const adminTenantId = userTenantData.tenant_id;
    console.log('STEP D: Admin tenant resolved, adminTenantId:', adminTenantId);

    console.log('STEP E: Verifying admin role');
    const { data: roleData, error: roleCheckError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', adminTenantId)
      .maybeSingle();

    if (roleCheckError) {
      console.error('create-user: role lookup error', roleCheckError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la vérification du rôle', step: 'E' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Seuls les administrateurs peuvent créer des utilisateurs', step: 'E' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    console.log('STEP E: Admin role verified');

    console.log('STEP F: Parsing payload');
    const { email, password, nom, role, tenant_id } = await req.json();

    if (!email || !password || !nom) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, nom', step: 'F' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    console.log('STEP F: Payload parsed OK, email:', email, 'nom:', nom);

    const targetTenantId = tenant_id || adminTenantId;

    if (tenant_id && tenant_id !== adminTenantId) {
      return new Response(
        JSON.stringify({ error: 'Vous ne pouvez créer des utilisateurs que dans votre propre agence', step: 'F' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log('STEP G: Checking user quota');
    const { data: tenantData, error: quotaError } = await supabaseAdmin
      .from('tenants')
      .select('max_users')
      .eq('id', targetTenantId)
      .single();

    if (quotaError) {
      console.error('create-user: quota check error', quotaError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la vérification du quota', step: 'G' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { count: currentUsers } = await supabaseAdmin
      .from('user_tenants')
      .select('user_id', { count: 'exact', head: true })
      .eq('tenant_id', targetTenantId)
      .eq('is_active', true);

    if (currentUsers !== null && tenantData.max_users && currentUsers >= tenantData.max_users) {
      console.log('STEP G: Quota exceeded', currentUsers, '/', tenantData.max_users);
      return new Response(
        JSON.stringify({ 
          error: `Quota utilisateurs atteint (${currentUsers}/${tenantData.max_users})`,
          code: 'QUOTA_EXCEEDED',
          step: 'G'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    console.log('STEP G: Quota OK, current:', currentUsers, '/', tenantData.max_users);

    const newUserRole = 'agent';

    console.log('STEP H: Creating user via auth.admin.createUser');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nom,
        skip_tenant_creation: 'true'
      }
    });

    if (authError) {
      console.error('create-user: auth.admin.createUser failed', authError);
      throw authError;
    }

    if (!authData.user) {
      console.error('create-user: authData.user is null');
      throw new Error('User creation failed');
    }
    console.log('STEP H: User created OK, id:', authData.user.id);

    console.log('STEP I: Linking user to tenant');
    const { error: userTenantError } = await supabaseAdmin
      .from('user_tenants')
      .insert({
        user_id: authData.user.id,
        tenant_id: targetTenantId,
        is_active: true
      });

    if (userTenantError) {
      console.error('create-user: user_tenants insert failed', userTenantError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw userTenantError;
    }
    console.log('STEP I: user_tenants insert OK');

    console.log('STEP J: Assigning agent role');
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ 
        user_id: authData.user.id, 
        tenant_id: targetTenantId,
        role: newUserRole
      });

    if (roleError) {
      console.error('create-user: user_roles insert failed', roleError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw roleError;
    }
    console.log('STEP J: user_roles insert OK');

    console.log('STEP K: Success, returning user data');
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
    const err = error as any;
    const errorMessage = err?.message || err?.error_description || err?.error || err?.msg || JSON.stringify(err);
    const errorDetails = err?.details;
    const errorCode = err?.code;
    const errorHint = err?.hint;
    const status = typeof err?.status === 'number' ? err.status : 400;
    
    console.error('create-user: EXCEPTION CAUGHT', { 
      message: errorMessage, 
      details: errorDetails, 
      hint: errorHint, 
      code: errorCode,
      status,
      raw: error 
    });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        code: errorCode,
        hint: errorHint
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status 
      }
    );
  }
});
