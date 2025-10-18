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

    const { doc_type, doc_id } = await req.json();

    console.log('Generating accounting entry for:', { doc_type, doc_id });

    // Récupérer les paramètres comptables
    const { data: settings } = await supabase
      .from('acc_settings')
      .select('*')
      .single();

    if (!settings) {
      throw new Error('Paramètres comptables non configurés');
    }

    // Récupérer les comptes nécessaires
    const { data: accounts } = await supabase
      .from('acc_accounts')
      .select('*');

    const accountsMap = accounts?.reduce((acc, account) => {
      acc[account.id] = account;
      return acc;
    }, {} as Record<string, any>) || {};

    // Récupérer le taux TVA par défaut (TVA20)
    const { data: taxSettings } = await supabase
      .from('acc_tax_settings')
      .select('*')
      .eq('code', 'TVA20')
      .single();

    let entryData: any = null;
    let journalCode = '';

    // Traitement selon le type de document
    switch (doc_type) {
      case 'CONTRACT': {
        // Facture de location
        const { data: contract } = await supabase
          .from('contracts')
          .select('*, clients(nom, prenom), vehicles(id)')
          .eq('id', doc_id)
          .single();

        if (!contract) throw new Error('Contrat non trouvé');

        const totalAmount = contract.total_amount || 0;
        const htAmount = totalAmount / 1.2; // HT
        const tvaAmount = totalAmount - htAmount; // TVA

        journalCode = 'VEN';
        entryData = {
          date_entry: contract.date_debut,
          memo: `Facture location - ${contract.clients?.nom || ''} ${contract.clients?.prenom || ''}`,
          lines: [
            {
              account_id: settings.ar_account_id, // 3411 Clients
              partner_name: `${contract.clients?.nom || ''} ${contract.clients?.prenom || ''}`,
              debit: totalAmount,
              credit: 0,
              vehicle_id: contract.vehicle_id,
            },
            {
              account_id: settings.sales_account_id, // 7011 Ventes
              partner_name: `${contract.clients?.nom || ''} ${contract.clients?.prenom || ''}`,
              debit: 0,
              credit: htAmount,
              vehicle_id: contract.vehicle_id,
            },
            {
              account_id: taxSettings?.sales_account_id, // 4457 TVA collectée
              partner_name: `${contract.clients?.nom || ''} ${contract.clients?.prenom || ''}`,
              debit: 0,
              credit: tvaAmount,
              tax_code: 'TVA20',
              vehicle_id: contract.vehicle_id,
            },
          ],
        };
        break;
      }

      case 'PAYMENT': {
        // Encaissement (revenus)
        const { data: revenu } = await supabase
          .from('revenus')
          .select('*, clients(nom, prenom), contracts(vehicle_id)')
          .eq('id', doc_id)
          .single();

        if (!revenu) throw new Error('Revenu non trouvé');

        const isCash = revenu.mode_paiement === 'espece';
        journalCode = isCash ? 'CAI' : 'BNK';

        entryData = {
          date_entry: revenu.date_encaissement,
          memo: `Encaissement ${isCash ? 'espèces' : 'virement'} - ${revenu.clients?.nom || ''} ${revenu.clients?.prenom || ''}`,
          lines: [
            {
              account_id: isCash ? settings.cash_account_id : settings.bank_account_id,
              partner_name: `${revenu.clients?.nom || ''} ${revenu.clients?.prenom || ''}`,
              debit: revenu.montant,
              credit: 0,
              vehicle_id: revenu.contracts?.vehicle_id,
            },
            {
              account_id: settings.ar_account_id, // 3411 Clients
              partner_name: `${revenu.clients?.nom || ''} ${revenu.clients?.prenom || ''}`,
              debit: 0,
              credit: revenu.montant,
              vehicle_id: revenu.contracts?.vehicle_id,
            },
          ],
        };
        break;
      }

      case 'EXPENSE': {
        // Dépense
        const { data: expense } = await supabase
          .from('expenses')
          .select('*, vehicles(id)')
          .eq('id', doc_id)
          .single();

        if (!expense) throw new Error('Dépense non trouvée');

        const totalAmount = expense.montant || 0;
        const htAmount = totalAmount / 1.2; // HT
        const tvaAmount = totalAmount - htAmount; // TVA déductible

        journalCode = 'ACH';

        entryData = {
          date_entry: expense.date_depense,
          memo: `${expense.description} - ${expense.fournisseur || 'Fournisseur'}`,
          lines: [
            {
              account_id: settings.expense_default_account_id, // 6111 Charges
              partner_name: expense.fournisseur,
              debit: htAmount,
              credit: 0,
              vehicle_id: expense.vehicle_id,
            },
            {
              account_id: taxSettings?.purchase_account_id, // 3451 TVA déductible
              partner_name: expense.fournisseur,
              debit: tvaAmount,
              credit: 0,
              tax_code: 'TVA20',
              vehicle_id: expense.vehicle_id,
            },
            {
              account_id: settings.ap_account_id, // 4411 Fournisseurs
              partner_name: expense.fournisseur,
              debit: 0,
              credit: totalAmount,
              vehicle_id: expense.vehicle_id,
            },
          ],
        };
        break;
      }

      case 'CHEQUE_IN': {
        // Chèque reçu
        const { data: cheque } = await supabase
          .from('cheques')
          .select('*, clients(nom, prenom)')
          .eq('id', doc_id)
          .single();

        if (!cheque) throw new Error('Chèque non trouvé');

        journalCode = 'BNK';

        entryData = {
          date_entry: cheque.date_emission,
          memo: `Chèque reçu n°${cheque.numero_cheque} - ${cheque.clients?.nom || ''} ${cheque.clients?.prenom || ''}`,
          lines: [
            {
              account_id: settings.cheque_received_account_id, // 5113 Chèques à encaisser
              partner_name: `${cheque.clients?.nom || ''} ${cheque.clients?.prenom || ''}`,
              debit: cheque.montant,
              credit: 0,
            },
            {
              account_id: settings.ar_account_id, // 3411 Clients
              partner_name: `${cheque.clients?.nom || ''} ${cheque.clients?.prenom || ''}`,
              debit: 0,
              credit: cheque.montant,
            },
          ],
        };
        break;
      }

      case 'CHEQUE_OUT': {
        // Chèque émis
        const { data: cheque } = await supabase
          .from('cheques')
          .select('*')
          .eq('id', doc_id)
          .single();

        if (!cheque) throw new Error('Chèque non trouvé');

        journalCode = 'BNK';

        entryData = {
          date_entry: cheque.date_emission,
          memo: `Chèque émis n°${cheque.numero_cheque} - ${cheque.fournisseur || 'Fournisseur'}`,
          lines: [
            {
              account_id: settings.ap_account_id, // 4411 Fournisseurs
              partner_name: cheque.fournisseur,
              debit: cheque.montant,
              credit: 0,
            },
            {
              account_id: settings.cheque_issued_account_id, // 5114 Chèques à payer
              partner_name: cheque.fournisseur,
              debit: 0,
              credit: cheque.montant,
            },
          ],
        };
        break;
      }

      default:
        throw new Error(`Type de document non supporté: ${doc_type}`);
    }

    // Récupérer le journal
    const { data: journal } = await supabase
      .from('acc_journals')
      .select('*')
      .eq('code', journalCode)
      .single();

    if (!journal) throw new Error(`Journal ${journalCode} non trouvé`);

    // Générer le numéro de référence
    const year = new Date().getFullYear();
    const refNumber = `${journalCode}-${year}-${String(journal.sequence).padStart(6, '0')}`;

    // Créer l'écriture
    const { data: entry, error: entryError } = await supabase
      .from('acc_entries')
      .insert({
        journal_id: journal.id,
        doc_type,
        doc_id,
        date_entry: entryData.date_entry,
        ref_number: refNumber,
        memo: entryData.memo,
      })
      .select()
      .single();

    if (entryError) throw entryError;

    // Créer les lignes d'écriture
    const lines = entryData.lines.map((line: any) => ({
      ...line,
      entry_id: entry.id,
    }));

    const { error: linesError } = await supabase
      .from('acc_entry_lines')
      .insert(lines);

    if (linesError) throw linesError;

    // Incrémenter la séquence du journal
    await supabase
      .from('acc_journals')
      .update({ sequence: journal.sequence + 1 })
      .eq('id', journal.id);

    console.log('Écriture comptable créée:', { ref_number: refNumber, entry_id: entry.id });

    return new Response(
      JSON.stringify({ success: true, entry_id: entry.id, ref_number: refNumber }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erreur génération écriture:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
