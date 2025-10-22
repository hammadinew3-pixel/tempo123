import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { targetUserId, newPassword } = await req.json();

    if (!targetUserId) {
      throw new Error('targetUserId is required');
    }

    // Vérifier que l'utilisateur courant est admin
    const { data: currentUserRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role, tenant_id')
      .eq('user_id', user.id)
      .single();

    if (roleError || !currentUserRole || currentUserRole.role !== 'admin') {
      throw new Error('Admin role required');
    }

    // Si l'utilisateur réinitialise son propre mot de passe
    if (targetUserId === user.id) {
      // Vérifier que le nouveau mot de passe est fourni
      if (!newPassword || newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        { password: newPassword }
      );

      if (updateError) {
        console.error('Error updating password:', updateError);
        throw new Error('Failed to update password');
      }

      console.log(`User ${user.id} updated their own password`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Password updated successfully' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Si l'utilisateur réinitialise le mot de passe d'un autre utilisateur
    // Vérifier que l'utilisateur cible appartient au même tenant
    const { data: targetUserTenant, error: targetTenantError } = await supabaseClient
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .single();

    if (targetTenantError || !targetUserTenant) {
      throw new Error('Target user not found or not in a tenant');
    }

    // Vérifier que l'utilisateur cible est dans le même tenant que l'admin
    if (targetUserTenant.tenant_id !== currentUserRole.tenant_id) {
      throw new Error('Cannot reset password for user in different tenant');
    }

    // Vérifier que l'utilisateur cible n'est pas un admin ou super_admin
    const { data: targetUserRole, error: targetRoleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId)
      .single();

    if (targetRoleError) {
      throw new Error('Failed to fetch target user role');
    }

    if (targetUserRole.role === 'admin' || targetUserRole.role === 'super_admin') {
      throw new Error('Cannot reset password for admin or super_admin users');
    }

    // Générer un mot de passe temporaire sécurisé
    const generatedPassword = newPassword || generateSecurePassword();

    // Mettre à jour le mot de passe de l'utilisateur cible
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: generatedPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw new Error('Failed to update password');
    }

    // Log de l'événement d'audit
    const { data: targetUserProfile } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', targetUserId)
      .single();

    console.log(`Admin ${user.id} reset password for user ${targetUserId} (${targetUserProfile?.email})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        temporaryPassword: generatedPassword,
        message: 'Password reset successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in reset-user-password:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

function generateSecurePassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}
