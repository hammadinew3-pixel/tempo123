export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      acc_accounts: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          type: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          type: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      acc_entries: {
        Row: {
          created_at: string | null
          date_entry: string
          doc_id: string | null
          doc_type: string
          id: string
          is_locked: boolean | null
          journal_id: string
          memo: string | null
          ref_number: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_entry: string
          doc_id?: string | null
          doc_type: string
          id?: string
          is_locked?: boolean | null
          journal_id: string
          memo?: string | null
          ref_number: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_entry?: string
          doc_id?: string | null
          doc_type?: string
          id?: string
          is_locked?: boolean | null
          journal_id?: string
          memo?: string | null
          ref_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_entries_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "acc_journals"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_entry_lines: {
        Row: {
          account_id: string
          created_at: string | null
          credit: number | null
          debit: number | null
          entry_id: string
          id: string
          partner_name: string | null
          tax_code: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          entry_id: string
          id?: string
          partner_name?: string | null
          tax_code?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          entry_id?: string
          id?: string
          partner_name?: string | null
          tax_code?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_entry_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "acc_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_entry_lines_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_journals: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          sequence: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          sequence?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          sequence?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      acc_settings: {
        Row: {
          ap_account_id: string | null
          ar_account_id: string | null
          bank_account_id: string | null
          cash_account_id: string | null
          cheque_issued_account_id: string | null
          cheque_received_account_id: string | null
          created_at: string | null
          expense_default_account_id: string | null
          id: string
          next_ref_purchases: number | null
          next_ref_sales: number | null
          rounding_account_id: string | null
          sales_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          ap_account_id?: string | null
          ar_account_id?: string | null
          bank_account_id?: string | null
          cash_account_id?: string | null
          cheque_issued_account_id?: string | null
          cheque_received_account_id?: string | null
          created_at?: string | null
          expense_default_account_id?: string | null
          id?: string
          next_ref_purchases?: number | null
          next_ref_sales?: number | null
          rounding_account_id?: string | null
          sales_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ap_account_id?: string | null
          ar_account_id?: string | null
          bank_account_id?: string | null
          cash_account_id?: string | null
          cheque_issued_account_id?: string | null
          cheque_received_account_id?: string | null
          created_at?: string | null
          expense_default_account_id?: string | null
          id?: string
          next_ref_purchases?: number | null
          next_ref_sales?: number | null
          rounding_account_id?: string | null
          sales_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_settings_ap_account_id_fkey"
            columns: ["ap_account_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_settings_ar_account_id_fkey"
            columns: ["ar_account_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_settings_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_settings_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_settings_cheque_issued_account_id_fkey"
            columns: ["cheque_issued_account_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_settings_cheque_received_account_id_fkey"
            columns: ["cheque_received_account_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_settings_expense_default_account_id_fkey"
            columns: ["expense_default_account_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_settings_rounding_account_id_fkey"
            columns: ["rounding_account_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_settings_sales_account_id_fkey"
            columns: ["sales_account_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_tax_settings: {
        Row: {
          code: string
          created_at: string | null
          id: string
          label: string
          purchase_account_id: string | null
          rate: number
          sales_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          label: string
          purchase_account_id?: string | null
          rate: number
          sales_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          label?: string
          purchase_account_id?: string | null
          rate?: number
          sales_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_tax_settings_purchase_account_id_fkey"
            columns: ["purchase_account_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_tax_settings_sales_account_id_fkey"
            columns: ["sales_account_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      agence_settings: {
        Row: {
          adresse: string | null
          alerte_assurance_jours: number | null
          alerte_autorisation_jours: number | null
          alerte_cheque_jours: number | null
          alerte_visite_jours: number | null
          cgv_texte: string | null
          cgv_url: string | null
          cnss: string | null
          created_at: string | null
          email: string | null
          ice: string | null
          id: string
          if_number: string | null
          inclure_cgv: boolean | null
          logo_url: string | null
          masquer_entete: boolean | null
          masquer_logo: boolean | null
          masquer_pied_page: boolean | null
          nom: string | null
          patente: string | null
          raison_sociale: string | null
          rc: string | null
          signature_agence_url: string | null
          taux_tva: number | null
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          adresse?: string | null
          alerte_assurance_jours?: number | null
          alerte_autorisation_jours?: number | null
          alerte_cheque_jours?: number | null
          alerte_visite_jours?: number | null
          cgv_texte?: string | null
          cgv_url?: string | null
          cnss?: string | null
          created_at?: string | null
          email?: string | null
          ice?: string | null
          id?: string
          if_number?: string | null
          inclure_cgv?: boolean | null
          logo_url?: string | null
          masquer_entete?: boolean | null
          masquer_logo?: boolean | null
          masquer_pied_page?: boolean | null
          nom?: string | null
          patente?: string | null
          raison_sociale?: string | null
          rc?: string | null
          signature_agence_url?: string | null
          taux_tva?: number | null
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          adresse?: string | null
          alerte_assurance_jours?: number | null
          alerte_autorisation_jours?: number | null
          alerte_cheque_jours?: number | null
          alerte_visite_jours?: number | null
          cgv_texte?: string | null
          cgv_url?: string | null
          cnss?: string | null
          created_at?: string | null
          email?: string | null
          ice?: string | null
          id?: string
          if_number?: string | null
          inclure_cgv?: boolean | null
          logo_url?: string | null
          masquer_entete?: boolean | null
          masquer_logo?: boolean | null
          masquer_pied_page?: boolean | null
          nom?: string | null
          patente?: string | null
          raison_sociale?: string | null
          rc?: string | null
          signature_agence_url?: string | null
          taux_tva?: number | null
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      assistance: {
        Row: {
          assureur_id: string | null
          assureur_nom: string | null
          client_id: string
          created_at: string | null
          date_debut: string
          date_fin: string
          date_paiement_assurance: string | null
          date_retour_effective: string | null
          etat: string | null
          etat_paiement: Database["public"]["Enums"]["payment_status"] | null
          etat_vehicule_depart: string | null
          etat_vehicule_retour: string | null
          franchise_montant: number | null
          franchise_notes: string | null
          franchise_statut: string | null
          id: string
          kilometrage_depart: number | null
          kilometrage_retour: number | null
          montant_facture: number | null
          montant_paye: number | null
          montant_total: number | null
          niveau_carburant_depart: string | null
          niveau_carburant_retour: string | null
          num_dossier: string
          ordre_mission: string | null
          ordre_mission_url: string | null
          prolongations: Json | null
          remarques: string | null
          tarif_journalier: number | null
          type: string | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          assureur_id?: string | null
          assureur_nom?: string | null
          client_id: string
          created_at?: string | null
          date_debut: string
          date_fin: string
          date_paiement_assurance?: string | null
          date_retour_effective?: string | null
          etat?: string | null
          etat_paiement?: Database["public"]["Enums"]["payment_status"] | null
          etat_vehicule_depart?: string | null
          etat_vehicule_retour?: string | null
          franchise_montant?: number | null
          franchise_notes?: string | null
          franchise_statut?: string | null
          id?: string
          kilometrage_depart?: number | null
          kilometrage_retour?: number | null
          montant_facture?: number | null
          montant_paye?: number | null
          montant_total?: number | null
          niveau_carburant_depart?: string | null
          niveau_carburant_retour?: string | null
          num_dossier: string
          ordre_mission?: string | null
          ordre_mission_url?: string | null
          prolongations?: Json | null
          remarques?: string | null
          tarif_journalier?: number | null
          type?: string | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          assureur_id?: string | null
          assureur_nom?: string | null
          client_id?: string
          created_at?: string | null
          date_debut?: string
          date_fin?: string
          date_paiement_assurance?: string | null
          date_retour_effective?: string | null
          etat?: string | null
          etat_paiement?: Database["public"]["Enums"]["payment_status"] | null
          etat_vehicule_depart?: string | null
          etat_vehicule_retour?: string | null
          franchise_montant?: number | null
          franchise_notes?: string | null
          franchise_statut?: string | null
          id?: string
          kilometrage_depart?: number | null
          kilometrage_retour?: number | null
          montant_facture?: number | null
          montant_paye?: number | null
          montant_total?: number | null
          niveau_carburant_depart?: string | null
          niveau_carburant_retour?: string | null
          num_dossier?: string
          ordre_mission?: string | null
          ordre_mission_url?: string | null
          prolongations?: Json | null
          remarques?: string | null
          tarif_journalier?: number | null
          type?: string | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistance_assureur_id_fkey"
            columns: ["assureur_id"]
            isOneToOne: false
            referencedRelation: "assurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistance_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      assurance_bareme: {
        Row: {
          assurance_id: string | null
          categorie: string | null
          created_at: string | null
          description: string | null
          id: string
          montant: number | null
          tarif_journalier: number | null
        }
        Insert: {
          assurance_id?: string | null
          categorie?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          montant?: number | null
          tarif_journalier?: number | null
        }
        Update: {
          assurance_id?: string | null
          categorie?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          montant?: number | null
          tarif_journalier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assurance_bareme_assurance_id_fkey"
            columns: ["assurance_id"]
            isOneToOne: false
            referencedRelation: "assurances"
            referencedColumns: ["id"]
          },
        ]
      }
      assurances: {
        Row: {
          actif: boolean | null
          adresse: string | null
          conditions_paiement: string | null
          contact_email: string | null
          contact_nom: string | null
          contact_telephone: string | null
          created_at: string | null
          delai_paiement_jours: number | null
          id: string
          nom: string
        }
        Insert: {
          actif?: boolean | null
          adresse?: string | null
          conditions_paiement?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string | null
          delai_paiement_jours?: number | null
          id?: string
          nom: string
        }
        Update: {
          actif?: boolean | null
          adresse?: string | null
          conditions_paiement?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string | null
          delai_paiement_jours?: number | null
          id?: string
          nom?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cheques: {
        Row: {
          banque: string | null
          client_id: string | null
          contract_id: string | null
          created_at: string | null
          date_echeance: string
          date_emission: string
          date_encaissement: string | null
          date_paiement: string | null
          depense_id: string | null
          fournisseur: string | null
          id: string
          montant: number
          note: string | null
          numero_cheque: string
          revenu_id: string | null
          statut: string | null
          type_cheque: string
          updated_at: string | null
        }
        Insert: {
          banque?: string | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          date_echeance: string
          date_emission: string
          date_encaissement?: string | null
          date_paiement?: string | null
          depense_id?: string | null
          fournisseur?: string | null
          id?: string
          montant: number
          note?: string | null
          numero_cheque: string
          revenu_id?: string | null
          statut?: string | null
          type_cheque: string
          updated_at?: string | null
        }
        Update: {
          banque?: string | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          date_echeance?: string
          date_emission?: string
          date_encaissement?: string | null
          date_paiement?: string | null
          depense_id?: string | null
          fournisseur?: string | null
          id?: string
          montant?: number
          note?: string | null
          numero_cheque?: string
          revenu_id?: string | null
          statut?: string | null
          type_cheque?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cheques_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cheques_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cheques_depense_id_fkey"
            columns: ["depense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cheques_revenu_id_fkey"
            columns: ["revenu_id"]
            isOneToOne: false
            referencedRelation: "revenus"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          adresse: string | null
          cin: string | null
          cin_url: string | null
          client_fiable: string | null
          created_at: string | null
          email: string | null
          id: string
          nom: string
          permis_conduire: string | null
          permis_url: string | null
          prenom: string | null
          sexe: string | null
          telephone: string
          type: string
          updated_at: string | null
        }
        Insert: {
          adresse?: string | null
          cin?: string | null
          cin_url?: string | null
          client_fiable?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nom: string
          permis_conduire?: string | null
          permis_url?: string | null
          prenom?: string | null
          sexe?: string | null
          telephone: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          adresse?: string | null
          cin?: string | null
          cin_url?: string | null
          client_fiable?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nom?: string
          permis_conduire?: string | null
          permis_url?: string | null
          prenom?: string | null
          sexe?: string | null
          telephone?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contract_payments: {
        Row: {
          contract_id: string
          created_at: string | null
          date_paiement: string
          id: string
          methode: Database["public"]["Enums"]["payment_method"] | null
          montant: number
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          date_paiement: string
          id?: string
          methode?: Database["public"]["Enums"]["payment_method"] | null
          montant: number
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          date_paiement?: string
          id?: string
          methode?: Database["public"]["Enums"]["payment_method"] | null
          montant?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          advance_payment: number | null
          caution_montant: number | null
          caution_notes: string | null
          caution_statut: string | null
          client_id: string
          created_at: string | null
          daily_rate: number | null
          date_debut: string
          date_fin: string
          delivery_date: string | null
          delivery_fuel_level: string | null
          delivery_km: number | null
          delivery_notes: string | null
          delivery_type: string | null
          duration: number | null
          end_location: string | null
          end_time: string | null
          id: string
          notes: string | null
          numero_contrat: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          pdf_url: string | null
          prolongations: Json | null
          remaining_amount: number | null
          return_date: string | null
          return_fuel_level: string | null
          return_km: number | null
          return_notes: string | null
          return_type: string | null
          signed_at: string | null
          start_location: string | null
          start_time: string | null
          statut: Database["public"]["Enums"]["contract_status"] | null
          total_amount: number | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          advance_payment?: number | null
          caution_montant?: number | null
          caution_notes?: string | null
          caution_statut?: string | null
          client_id: string
          created_at?: string | null
          daily_rate?: number | null
          date_debut: string
          date_fin: string
          delivery_date?: string | null
          delivery_fuel_level?: string | null
          delivery_km?: number | null
          delivery_notes?: string | null
          delivery_type?: string | null
          duration?: number | null
          end_location?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          numero_contrat: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          pdf_url?: string | null
          prolongations?: Json | null
          remaining_amount?: number | null
          return_date?: string | null
          return_fuel_level?: string | null
          return_km?: number | null
          return_notes?: string | null
          return_type?: string | null
          signed_at?: string | null
          start_location?: string | null
          start_time?: string | null
          statut?: Database["public"]["Enums"]["contract_status"] | null
          total_amount?: number | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          advance_payment?: number | null
          caution_montant?: number | null
          caution_notes?: string | null
          caution_statut?: string | null
          client_id?: string
          created_at?: string | null
          daily_rate?: number | null
          date_debut?: string
          date_fin?: string
          delivery_date?: string | null
          delivery_fuel_level?: string | null
          delivery_km?: number | null
          delivery_notes?: string | null
          delivery_type?: string | null
          duration?: number | null
          end_location?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          numero_contrat?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          pdf_url?: string | null
          prolongations?: Json | null
          remaining_amount?: number | null
          return_date?: string | null
          return_fuel_level?: string | null
          return_km?: number | null
          return_notes?: string | null
          return_type?: string | null
          signed_at?: string | null
          start_location?: string | null
          start_time?: string | null
          statut?: Database["public"]["Enums"]["contract_status"] | null
          total_amount?: number | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          categorie: string | null
          contract_id: string | null
          created_at: string | null
          date_depense: string
          description: string
          fournisseur: string | null
          id: string
          mode_paiement: string | null
          montant: number
          statut: string | null
          type_depense: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          categorie?: string | null
          contract_id?: string | null
          created_at?: string | null
          date_depense: string
          description: string
          fournisseur?: string | null
          id?: string
          mode_paiement?: string | null
          montant: number
          statut?: string | null
          type_depense?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          categorie?: string | null
          contract_id?: string | null
          created_at?: string | null
          date_depense?: string
          description?: string
          fournisseur?: string | null
          id?: string
          mode_paiement?: string | null
          montant?: number
          statut?: string | null
          type_depense?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      infraction_files: {
        Row: {
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          infraction_id: string
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          infraction_id: string
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          infraction_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_infraction_files_infraction_id"
            columns: ["infraction_id"]
            isOneToOne: false
            referencedRelation: "infractions"
            referencedColumns: ["id"]
          },
        ]
      }
      infractions: {
        Row: {
          client_id: string | null
          contract_id: string | null
          created_at: string | null
          date_infraction: string
          description: string | null
          id: string
          lieu: string | null
          montant: number | null
          reference: string | null
          statut: string | null
          statut_traitement: string | null
          type_infraction: string | null
          vehicle_id: string | null
        }
        Insert: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          date_infraction: string
          description?: string | null
          id?: string
          lieu?: string | null
          montant?: number | null
          reference?: string | null
          statut?: string | null
          statut_traitement?: string | null
          type_infraction?: string | null
          vehicle_id?: string | null
        }
        Update: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          date_infraction?: string
          description?: string | null
          id?: string
          lieu?: string | null
          montant?: number | null
          reference?: string | null
          statut?: string | null
          statut_traitement?: string | null
          type_infraction?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_infractions_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_infractions_contract_id"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_infractions_vehicle_id"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          contact_garage: string | null
          created_at: string | null
          date_intervention: string
          depense_id: string | null
          details_intervention: string[] | null
          facturee: boolean | null
          garage_externe: boolean | null
          id: string
          kilometrage_actuel: number
          montant_ht: number | null
          montant_ttc: number
          montant_tva: number | null
          nom_garage: string | null
          notes: string | null
          prochain_kilometrage_vidange: number | null
          reference_facture: string | null
          telephone_garage: string | null
          type_intervention: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          contact_garage?: string | null
          created_at?: string | null
          date_intervention: string
          depense_id?: string | null
          details_intervention?: string[] | null
          facturee?: boolean | null
          garage_externe?: boolean | null
          id?: string
          kilometrage_actuel: number
          montant_ht?: number | null
          montant_ttc: number
          montant_tva?: number | null
          nom_garage?: string | null
          notes?: string | null
          prochain_kilometrage_vidange?: number | null
          reference_facture?: string | null
          telephone_garage?: string | null
          type_intervention: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          contact_garage?: string | null
          created_at?: string | null
          date_intervention?: string
          depense_id?: string | null
          details_intervention?: string[] | null
          facturee?: boolean | null
          garage_externe?: boolean | null
          id?: string
          kilometrage_actuel?: number
          montant_ht?: number | null
          montant_ttc?: number
          montant_tva?: number | null
          nom_garage?: string | null
          notes?: string | null
          prochain_kilometrage_vidange?: number | null
          reference_facture?: string | null
          telephone_garage?: string | null
          type_intervention?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_depense_id_fkey"
            columns: ["depense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          actif: boolean | null
          created_at: string | null
          email: string | null
          id: string
          nom: string | null
          prenom: string | null
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          created_at?: string | null
          email?: string | null
          id: string
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      revenus: {
        Row: {
          client_id: string | null
          contract_id: string | null
          created_at: string | null
          date_encaissement: string
          id: string
          mode_paiement: string | null
          montant: number
          note: string | null
          source_revenu: string
          statut: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          date_encaissement: string
          id?: string
          mode_paiement?: string | null
          montant: number
          note?: string | null
          source_revenu?: string
          statut?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          date_encaissement?: string
          id?: string
          mode_paiement?: string | null
          montant?: number
          note?: string | null
          source_revenu?: string
          statut?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenus_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenus_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      secondary_drivers: {
        Row: {
          cin: string | null
          contract_id: string
          created_at: string | null
          email: string | null
          id: string
          nom: string
          permis_conduire: string | null
          prenom: string
          telephone: string | null
        }
        Insert: {
          cin?: string | null
          contract_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          nom: string
          permis_conduire?: string | null
          prenom: string
          telephone?: string | null
        }
        Update: {
          cin?: string | null
          contract_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          nom?: string
          permis_conduire?: string | null
          prenom?: string
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secondary_drivers_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      sinistre_files: {
        Row: {
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          sinistre_id: string
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          sinistre_id: string
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          sinistre_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sinistre_files_sinistre_id"
            columns: ["sinistre_id"]
            isOneToOne: false
            referencedRelation: "sinistres"
            referencedColumns: ["id"]
          },
        ]
      }
      sinistres: {
        Row: {
          client_id: string | null
          contract_id: string | null
          cout_estime: number | null
          created_at: string | null
          date_sinistre: string
          description: string | null
          documents_urls: string[] | null
          gravite: string | null
          id: string
          lieu: string | null
          montant: number | null
          notes: string | null
          prise_en_charge: string | null
          reference: string | null
          responsabilite: string | null
          statut: string | null
          temoins: string | null
          type_sinistre: string | null
          vehicle_id: string | null
        }
        Insert: {
          client_id?: string | null
          contract_id?: string | null
          cout_estime?: number | null
          created_at?: string | null
          date_sinistre: string
          description?: string | null
          documents_urls?: string[] | null
          gravite?: string | null
          id?: string
          lieu?: string | null
          montant?: number | null
          notes?: string | null
          prise_en_charge?: string | null
          reference?: string | null
          responsabilite?: string | null
          statut?: string | null
          temoins?: string | null
          type_sinistre?: string | null
          vehicle_id?: string | null
        }
        Update: {
          client_id?: string | null
          contract_id?: string | null
          cout_estime?: number | null
          created_at?: string | null
          date_sinistre?: string
          description?: string | null
          documents_urls?: string[] | null
          gravite?: string | null
          id?: string
          lieu?: string | null
          montant?: number | null
          notes?: string | null
          prise_en_charge?: string | null
          reference?: string | null
          responsabilite?: string | null
          statut?: string | null
          temoins?: string | null
          type_sinistre?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sinistres_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sinistres_contract_id"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sinistres_vehicle_id"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_affectations: {
        Row: {
          contract_id: string
          created_at: string | null
          date_debut: string
          date_fin: string | null
          id: string
          vehicle_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          date_debut: string
          date_fin?: string | null
          id?: string
          vehicle_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          date_debut?: string
          date_fin?: string | null
          id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vehicle"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_assistance_categories: {
        Row: {
          actif: boolean | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          label: string | null
          nom: string
          ordre: number | null
        }
        Insert: {
          actif?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          label?: string | null
          nom: string
          ordre?: number | null
        }
        Update: {
          actif?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          label?: string | null
          nom?: string
          ordre?: number | null
        }
        Relationships: []
      }
      vehicle_changes: {
        Row: {
          change_date: string
          contract_id: string
          created_at: string | null
          id: string
          new_vehicle_id: string | null
          notes: string | null
          old_vehicle_id: string | null
          reason: string | null
        }
        Insert: {
          change_date: string
          contract_id: string
          created_at?: string | null
          id?: string
          new_vehicle_id?: string | null
          notes?: string | null
          old_vehicle_id?: string | null
          reason?: string | null
        }
        Update: {
          change_date?: string
          contract_id?: string
          created_at?: string | null
          id?: string
          new_vehicle_id?: string | null
          notes?: string | null
          old_vehicle_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_changes_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_changes_new_vehicle_id_fkey"
            columns: ["new_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_changes_old_vehicle_id_fkey"
            columns: ["old_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_insurance: {
        Row: {
          assureur: string
          banque: string | null
          coordonnees_assureur: string | null
          created_at: string | null
          date_debut: string
          date_expiration: string
          date_paiement: string | null
          id: string
          mode_paiement: string | null
          montant: number | null
          numero_cheque: string | null
          numero_ordre: string | null
          numero_police: string | null
          photo_url: string | null
          remarques: string | null
          vehicle_id: string
        }
        Insert: {
          assureur: string
          banque?: string | null
          coordonnees_assureur?: string | null
          created_at?: string | null
          date_debut: string
          date_expiration: string
          date_paiement?: string | null
          id?: string
          mode_paiement?: string | null
          montant?: number | null
          numero_cheque?: string | null
          numero_ordre?: string | null
          numero_police?: string | null
          photo_url?: string | null
          remarques?: string | null
          vehicle_id: string
        }
        Update: {
          assureur?: string
          banque?: string | null
          coordonnees_assureur?: string | null
          created_at?: string | null
          date_debut?: string
          date_expiration?: string
          date_paiement?: string | null
          id?: string
          mode_paiement?: string | null
          montant?: number | null
          numero_cheque?: string | null
          numero_ordre?: string | null
          numero_police?: string | null
          photo_url?: string | null
          remarques?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_insurance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_technical_inspection: {
        Row: {
          banque: string | null
          centre_controle: string | null
          created_at: string | null
          date_expiration: string
          date_paiement: string | null
          date_visite: string
          id: string
          mode_paiement: string | null
          montant: number | null
          numero_cheque: string | null
          numero_ordre: string | null
          photo_url: string | null
          remarques: string | null
          resultat: string | null
          vehicle_id: string
        }
        Insert: {
          banque?: string | null
          centre_controle?: string | null
          created_at?: string | null
          date_expiration: string
          date_paiement?: string | null
          date_visite: string
          id?: string
          mode_paiement?: string | null
          montant?: number | null
          numero_cheque?: string | null
          numero_ordre?: string | null
          photo_url?: string | null
          remarques?: string | null
          resultat?: string | null
          vehicle_id: string
        }
        Update: {
          banque?: string | null
          centre_controle?: string | null
          created_at?: string | null
          date_expiration?: string
          date_paiement?: string | null
          date_visite?: string
          id?: string
          mode_paiement?: string | null
          montant?: number | null
          numero_cheque?: string | null
          numero_ordre?: string | null
          photo_url?: string | null
          remarques?: string | null
          resultat?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_technical_inspection_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_vignette: {
        Row: {
          annee: number | null
          banque: string | null
          created_at: string | null
          date_debut: string
          date_expiration: string
          date_paiement: string | null
          id: string
          mode_paiement: string | null
          montant: number | null
          numero_cheque: string | null
          numero_ordre: string | null
          remarques: string | null
          vehicle_id: string
        }
        Insert: {
          annee?: number | null
          banque?: string | null
          created_at?: string | null
          date_debut: string
          date_expiration: string
          date_paiement?: string | null
          id?: string
          mode_paiement?: string | null
          montant?: number | null
          numero_cheque?: string | null
          numero_ordre?: string | null
          remarques?: string | null
          vehicle_id: string
        }
        Update: {
          annee?: number | null
          banque?: string | null
          created_at?: string | null
          date_debut?: string
          date_expiration?: string
          date_paiement?: string | null
          id?: string
          mode_paiement?: string | null
          montant?: number | null
          numero_cheque?: string | null
          numero_ordre?: string | null
          remarques?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_vignette_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          annee: number | null
          assurance_expire_le: string | null
          categorie: string | null
          categories: string[] | null
          created_at: string | null
          date_derniere_vidange: string | null
          dernier_kilometrage_vidange: number | null
          en_service: boolean | null
          id: string
          immatriculation: string
          kilometrage: number | null
          marque: string
          modele: string
          photo_url: string | null
          prochain_kilometrage_vidange: number | null
          sous_location: boolean | null
          statut: Database["public"]["Enums"]["vehicle_status"] | null
          tarif_journalier: number | null
          updated_at: string | null
          valeur_achat: number | null
          vignette_expire_le: string | null
          visite_technique_expire_le: string | null
          ww: string | null
        }
        Insert: {
          annee?: number | null
          assurance_expire_le?: string | null
          categorie?: string | null
          categories?: string[] | null
          created_at?: string | null
          date_derniere_vidange?: string | null
          dernier_kilometrage_vidange?: number | null
          en_service?: boolean | null
          id?: string
          immatriculation: string
          kilometrage?: number | null
          marque: string
          modele: string
          photo_url?: string | null
          prochain_kilometrage_vidange?: number | null
          sous_location?: boolean | null
          statut?: Database["public"]["Enums"]["vehicle_status"] | null
          tarif_journalier?: number | null
          updated_at?: string | null
          valeur_achat?: number | null
          vignette_expire_le?: string | null
          visite_technique_expire_le?: string | null
          ww?: string | null
        }
        Update: {
          annee?: number | null
          assurance_expire_le?: string | null
          categorie?: string | null
          categories?: string[] | null
          created_at?: string | null
          date_derniere_vidange?: string | null
          dernier_kilometrage_vidange?: number | null
          en_service?: boolean | null
          id?: string
          immatriculation?: string
          kilometrage?: number | null
          marque?: string
          modele?: string
          photo_url?: string | null
          prochain_kilometrage_vidange?: number | null
          sous_location?: boolean | null
          statut?: Database["public"]["Enums"]["vehicle_status"] | null
          tarif_journalier?: number | null
          updated_at?: string | null
          valeur_achat?: number | null
          vignette_expire_le?: string | null
          visite_technique_expire_le?: string | null
          ww?: string | null
        }
        Relationships: []
      }
      vehicules_traite: {
        Row: {
          avance_paye: number | null
          concessionaire: string | null
          created_at: string | null
          date_achat: string | null
          date_debut: string | null
          date_traitement: string
          description: string | null
          duree_deja_paye: number | null
          id: string
          montant: number | null
          montant_mensuel: number | null
          montant_total: number | null
          nombre_traites: number | null
          notes: string | null
          organisme: string | null
          type_traitement: string
          vehicle_id: string
        }
        Insert: {
          avance_paye?: number | null
          concessionaire?: string | null
          created_at?: string | null
          date_achat?: string | null
          date_debut?: string | null
          date_traitement: string
          description?: string | null
          duree_deja_paye?: number | null
          id?: string
          montant?: number | null
          montant_mensuel?: number | null
          montant_total?: number | null
          nombre_traites?: number | null
          notes?: string | null
          organisme?: string | null
          type_traitement: string
          vehicle_id: string
        }
        Update: {
          avance_paye?: number | null
          concessionaire?: string | null
          created_at?: string | null
          date_achat?: string | null
          date_debut?: string | null
          date_traitement?: string
          description?: string | null
          duree_deja_paye?: number | null
          id?: string
          montant?: number | null
          montant_mensuel?: number | null
          montant_total?: number | null
          nombre_traites?: number | null
          notes?: string | null
          organisme?: string | null
          type_traitement?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      vehicules_traites_echeances: {
        Row: {
          created_at: string | null
          date_echeance: string | null
          date_paiement: string | null
          date_traitee: string
          id: string
          montant: number | null
          notes: string | null
          statut: string | null
          traite_id: string | null
          type_echeance: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          date_echeance?: string | null
          date_paiement?: string | null
          date_traitee: string
          id?: string
          montant?: number | null
          notes?: string | null
          statut?: string | null
          traite_id?: string | null
          type_echeance: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          date_echeance?: string | null
          date_paiement?: string | null
          date_traitee?: string
          id?: string
          montant?: number | null
          notes?: string | null
          statut?: string | null
          traite_id?: string | null
          type_echeance?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicules_traites_echeances_traite_id_fkey"
            columns: ["traite_id"]
            isOneToOne: false
            referencedRelation: "vehicules_traite"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicules_traites_echeances_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vidanges: {
        Row: {
          created_at: string | null
          date_vidange: string
          id: string
          kilometrage: number
          montant: number | null
          notes: string | null
          remarques: string | null
          type_vidange: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          date_vidange: string
          id?: string
          kilometrage: number
          montant?: number | null
          notes?: string | null
          remarques?: string | null
          type_vidange?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          date_vidange?: string
          id?: string
          kilometrage?: number
          montant?: number | null
          notes?: string | null
          remarques?: string | null
          type_vidange?: string | null
          vehicle_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_infraction_reference: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_sinistre_reference: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      contract_status:
        | "brouillon"
        | "ouvert"
        | "contrat_valide"
        | "livre"
        | "retour_effectue"
        | "termine"
        | "cloture"
        | "annule"
      payment_method: "especes" | "carte_bancaire" | "virement" | "cheque"
      payment_status: "en_attente" | "paye" | "partiellement_paye"
      vehicle_status:
        | "disponible"
        | "loue"
        | "reserve"
        | "en_panne"
        | "immobilise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      contract_status: [
        "brouillon",
        "ouvert",
        "contrat_valide",
        "livre",
        "retour_effectue",
        "termine",
        "cloture",
        "annule",
      ],
      payment_method: ["especes", "carte_bancaire", "virement", "cheque"],
      payment_status: ["en_attente", "paye", "partiellement_paye"],
      vehicle_status: [
        "disponible",
        "loue",
        "reserve",
        "en_panne",
        "immobilise",
      ],
    },
  },
} as const
