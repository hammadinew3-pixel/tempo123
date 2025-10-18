import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Démarrage synchronisation données existantes...');

    // Vérifier si des écritures existent déjà
    const { count: existingCount } = await supabase
      .from('acc_entries')
      .select('*', { count: 'exact', head: true });

    if (existingCount && existingCount > 0) {
      return new Response(
        JSON.stringify({ message: 'Des écritures existent déjà. Synchronisation annulée.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      contracts: 0,
      revenus: 0,
      expenses: 0,
      cheques_in: 0,
      cheques_out: 0,
      errors: [] as string[],
    };

    // Synchroniser les contrats (factures)
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id')
      .eq('statut', 'actif')
      .order('created_at', { ascending: true });

    if (contracts) {
      for (const contract of contracts) {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-accounting-entry`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              doc_type: 'CONTRACT',
              doc_id: contract.id,
            }),
          });
          results.contracts++;
        } catch (error: any) {
          results.errors.push(`Contrat ${contract.id}: ${error.message}`);
        }
      }
    }

    // Synchroniser les revenus (encaissements)
    const { data: revenus } = await supabase
      .from('revenus')
      .select('id')
      .eq('statut', 'paye')
      .order('created_at', { ascending: true });

    if (revenus) {
      for (const revenu of revenus) {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-accounting-entry`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              doc_type: 'PAYMENT',
              doc_id: revenu.id,
            }),
          });
          results.revenus++;
        } catch (error: any) {
          results.errors.push(`Revenu ${revenu.id}: ${error.message}`);
        }
      }
    }

    // Synchroniser les dépenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id')
      .eq('statut', 'paye')
      .order('created_at', { ascending: true });

    if (expenses) {
      for (const expense of expenses) {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-accounting-entry`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              doc_type: 'EXPENSE',
              doc_id: expense.id,
            }),
          });
          results.expenses++;
        } catch (error: any) {
          results.errors.push(`Dépense ${expense.id}: ${error.message}`);
        }
      }
    }

    // Synchroniser les chèques reçus
    const { data: chequesIn } = await supabase
      .from('cheques')
      .select('id')
      .eq('type_cheque', 'recu')
      .order('created_at', { ascending: true });

    if (chequesIn) {
      for (const cheque of chequesIn) {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-accounting-entry`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              doc_type: 'CHEQUE_IN',
              doc_id: cheque.id,
            }),
          });
          results.cheques_in++;
        } catch (error: any) {
          results.errors.push(`Chèque reçu ${cheque.id}: ${error.message}`);
        }
      }
    }

    // Synchroniser les chèques émis
    const { data: chequesOut } = await supabase
      .from('cheques')
      .select('id')
      .eq('type_cheque', 'emis')
      .order('created_at', { ascending: true });

    if (chequesOut) {
      for (const cheque of chequesOut) {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-accounting-entry`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              doc_type: 'CHEQUE_OUT',
              doc_id: cheque.id,
            }),
          });
          results.cheques_out++;
        } catch (error: any) {
          results.errors.push(`Chèque émis ${cheque.id}: ${error.message}`);
        }
      }
    }

    console.log('Synchronisation terminée:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Synchronisation terminée',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erreur synchronisation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
