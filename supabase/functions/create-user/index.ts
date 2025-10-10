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

    const { email, password, nom, role } = await req.json();

    console.log('Creating user with email:', email, 'role:', role);

    // Validate input
    if (!email || !password || !nom || !role) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create user with admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nom
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    if (!authData.user) {
      console.error('User creation failed - no user returned');
      throw new Error('User creation failed');
    }

    console.log('User created successfully:', authData.user.id);

    // Wait a bit for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Delete the auto-assigned role from the trigger (first user gets admin, others get agent)
    const { error: deleteRoleError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', authData.user.id);

    if (deleteRoleError) {
      console.error('Error deleting auto-assigned role:', deleteRoleError);
    }

    // Assign the requested role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ 
        user_id: authData.user.id, 
        role 
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      // Cleanup: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw roleError;
    }

    console.log('Role assigned successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        user: authData.user 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in create-user function:', error);
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
