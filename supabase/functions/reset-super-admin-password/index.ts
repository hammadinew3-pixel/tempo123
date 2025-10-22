import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { action, email, token, newPassword } = await req.json();

    console.log('Reset password request:', { action, email });

    // Action 1: Demander un code OTP
    if (action === 'request_otp') {
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vérifier que l'utilisateur existe et est super admin
      const { data: authUser } = await supabaseAdmin.auth.admin.listUsers();
      const user = authUser?.users.find(u => u.email === email);

      if (!user) {
        // Ne pas révéler si l'utilisateur existe ou non (sécurité)
        return new Response(
          JSON.stringify({ message: 'Si cet email existe, un code de vérification a été envoyé.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vérifier le rôle super_admin
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('role, tenant_id')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .is('tenant_id', null)
        .maybeSingle();

      if (!roles) {
        return new Response(
          JSON.stringify({ message: 'Si cet email existe, un code de vérification a été envoyé.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vérifier le nombre de tentatives récentes (protection anti-spam)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentTokens } = await supabaseAdmin
        .from('super_admin_reset_tokens')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', oneHourAgo);

      if (recentTokens && recentTokens.length >= 3) {
        return new Response(
          JSON.stringify({ error: 'Trop de tentatives. Veuillez réessayer dans une heure.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Générer un code OTP à 6 chiffres
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
      
      // 🔐 [DEV ONLY] Log temporaire pour afficher l'OTP dans les logs
      console.log('🔐 [DEV ONLY] Generated OTP for', email, ':', otp);
      console.log('⏰ [DEV ONLY] OTP expires at:', expiresAt);

      // Sauvegarder le token
      const { error: tokenError } = await supabaseAdmin
        .from('super_admin_reset_tokens')
        .insert({
          user_id: user.id,
          token: otp,
          expires_at: expiresAt,
          used: false,
          attempts: 0
        });

      if (tokenError) {
        console.error('Error creating token:', tokenError);
        throw new Error('Erreur lors de la création du token');
      }

      // Envoyer l'email avec le code OTP
      try {
        await resend.emails.send({
          from: "CRSApp <noreply@resend.dev>",
          to: [email],
          subject: "Code de réinitialisation de mot de passe - CRSApp",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #C8102E;">Réinitialisation de mot de passe</h1>
              <p>Bonjour,</p>
              <p>Vous avez demandé la réinitialisation de votre mot de passe super admin CRSApp.</p>
              <p>Votre code de vérification est :</p>
              <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                <h2 style="color: #C8102E; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h2>
              </div>
              <p style="color: #666;">Ce code expire dans 15 minutes.</p>
              <p style="color: #666;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">CRSApp - Gestion de location de véhicules</p>
            </div>
          `,
        });

        console.log('OTP sent successfully to:', email);
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        throw new Error('Erreur lors de l\'envoi de l\'email');
      }

      return new Response(
        JSON.stringify({ message: 'Code de vérification envoyé par email.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action 2: Valider l'OTP et réinitialiser le mot de passe
    if (action === 'verify_and_reset') {
      if (!email || !token || !newPassword) {
        return new Response(
          JSON.stringify({ error: 'Email, code et nouveau mot de passe requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vérifier la longueur du mot de passe
      if (newPassword.length < 8) {
        return new Response(
          JSON.stringify({ error: 'Le mot de passe doit contenir au moins 8 caractères' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Récupérer l'utilisateur
      const { data: authUser } = await supabaseAdmin.auth.admin.listUsers();
      const user = authUser?.users.find(u => u.email === email);

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Code de vérification invalide' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Récupérer le token le plus récent non utilisé
      const { data: tokenData, error: tokenFetchError } = await supabaseAdmin
        .from('super_admin_reset_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tokenFetchError || !tokenData) {
        console.error('Token fetch error:', tokenFetchError);
        return new Response(
          JSON.stringify({ error: 'Code de vérification invalide ou expiré' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vérifier le nombre de tentatives
      if (tokenData.attempts >= 3) {
        return new Response(
          JSON.stringify({ error: 'Trop de tentatives incorrectes. Demandez un nouveau code.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vérifier le code OTP
      if (tokenData.token !== token) {
        // Incrémenter le compteur de tentatives
        await supabaseAdmin
          .from('super_admin_reset_tokens')
          .update({ attempts: tokenData.attempts + 1 })
          .eq('id', tokenData.id);

        return new Response(
          JSON.stringify({ 
            error: 'Code de vérification incorrect',
            remainingAttempts: 2 - tokenData.attempts
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Code valide - Réinitialiser le mot de passe
      const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (resetError) {
        console.error('Password reset error:', resetError);
        throw new Error('Erreur lors de la réinitialisation du mot de passe');
      }

      // Marquer le token comme utilisé
      await supabaseAdmin
        .from('super_admin_reset_tokens')
        .update({ used: true })
        .eq('id', tokenData.id);

      // Log de l'événement
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          table_name: 'auth.users',
          record_id: user.id,
          action: 'PASSWORD_RESET',
          user_id: user.id,
          user_email: user.email,
          tenant_id: null
        });

      console.log('Password reset successfully for:', email);

      return new Response(
        JSON.stringify({ message: 'Mot de passe réinitialisé avec succès' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Action non reconnue' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in reset-super-admin-password function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});