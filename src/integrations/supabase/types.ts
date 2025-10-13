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
      agence_settings: {
        Row: {
          adresse: string | null
          alerte_assurance_jours: number | null
          alerte_autorisation_jours: number | null
          alerte_cheque_jours: number | null
          alerte_vidange_kms: number | null
          alerte_visite_jours: number | null
          cgv_texte: string | null
          cgv_url: string | null
          cnss: string | null
          created_at: string | null
          email: string | null
          grace_long: number | null
          grace_medium: number | null
          grace_short: number | null
          ice: string | null
          id: string
          if_number: string | null
          inclure_cgv: boolean | null
          logo_url: string | null
          masquer_entete: boolean | null
          masquer_logo: boolean | null
          masquer_pied_page: boolean | null
          patente: string | null
          raison_sociale: string | null
          rc: string | null
          taux_tva: number | null
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          adresse?: string | null
          alerte_assurance_jours?: number | null
          alerte_autorisation_jours?: number | null
          alerte_cheque_jours?: number | null
          alerte_vidange_kms?: number | null
          alerte_visite_jours?: number | null
          cgv_texte?: string | null
          cgv_url?: string | null
          cnss?: string | null
          created_at?: string | null
          email?: string | null
          grace_long?: number | null
          grace_medium?: number | null
          grace_short?: number | null
          ice?: string | null
          id?: string
          if_number?: string | null
          inclure_cgv?: boolean | null
          logo_url?: string | null
          masquer_entete?: boolean | null
          masquer_logo?: boolean | null
          masquer_pied_page?: boolean | null
          patente?: string | null
          raison_sociale?: string | null
          rc?: string | null
          taux_tva?: number | null
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          adresse?: string | null
          alerte_assurance_jours?: number | null
          alerte_autorisation_jours?: number | null
          alerte_cheque_jours?: number | null
          alerte_vidange_kms?: number | null
          alerte_visite_jours?: number | null
          cgv_texte?: string | null
          cgv_url?: string | null
          cnss?: string | null
          created_at?: string | null
          email?: string | null
          grace_long?: number | null
          grace_medium?: number | null
          grace_short?: number | null
          ice?: string | null
          id?: string
          if_number?: string | null
          inclure_cgv?: boolean | null
          logo_url?: string | null
          masquer_entete?: boolean | null
          masquer_logo?: boolean | null
          masquer_pied_page?: boolean | null
          patente?: string | null
          raison_sociale?: string | null
          rc?: string | null
          taux_tva?: number | null
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      assistance: {
        Row: {
          assureur_id: string | null
          assureur_nom: string
          client_id: string | null
          created_at: string
          date_debut: string
          date_fin: string | null
          date_paiement_assurance: string | null
          date_retour_effective: string | null
          etat: Database["public"]["Enums"]["assistance_status"]
          etat_paiement: string | null
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
          type: Database["public"]["Enums"]["assistance_type"]
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          assureur_id?: string | null
          assureur_nom: string
          client_id?: string | null
          created_at?: string
          date_debut: string
          date_fin?: string | null
          date_paiement_assurance?: string | null
          date_retour_effective?: string | null
          etat?: Database["public"]["Enums"]["assistance_status"]
          etat_paiement?: string | null
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
          type: Database["public"]["Enums"]["assistance_type"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          assureur_id?: string | null
          assureur_nom?: string
          client_id?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          date_paiement_assurance?: string | null
          date_retour_effective?: string | null
          etat?: Database["public"]["Enums"]["assistance_status"]
          etat_paiement?: string | null
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
          type?: Database["public"]["Enums"]["assistance_type"]
          updated_at?: string
          vehicle_id?: string | null
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
          assurance_id: string
          categorie: Database["public"]["Enums"]["vehicle_category"]
          created_at: string
          id: string
          tarif_journalier: number
          updated_at: string
        }
        Insert: {
          assurance_id: string
          categorie: Database["public"]["Enums"]["vehicle_category"]
          created_at?: string
          id?: string
          tarif_journalier: number
          updated_at?: string
        }
        Update: {
          assurance_id?: string
          categorie?: Database["public"]["Enums"]["vehicle_category"]
          created_at?: string
          id?: string
          tarif_journalier?: number
          updated_at?: string
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
          actif: boolean
          adresse: string | null
          conditions_paiement: string | null
          contact_email: string | null
          contact_nom: string | null
          contact_telephone: string | null
          created_at: string
          delai_paiement_jours: number | null
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          conditions_paiement?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string
          delai_paiement_jours?: number | null
          id?: string
          nom: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          conditions_paiement?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string
          delai_paiement_jours?: number | null
          id?: string
          nom?: string
          updated_at?: string
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
          record_id: string
          table_name: string
          timestamp: string | null
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
          record_id: string
          table_name: string
          timestamp?: string | null
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
          record_id?: string
          table_name?: string
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          adresse: string | null
          cin: string | null
          cin_url: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          permis_conduire: string | null
          permis_url: string | null
          prenom: string | null
          telephone: string
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          cin?: string | null
          cin_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          permis_conduire?: string | null
          permis_url?: string | null
          prenom?: string | null
          telephone: string
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          cin?: string | null
          cin_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          permis_conduire?: string | null
          permis_url?: string | null
          prenom?: string | null
          telephone?: string
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Relationships: []
      }
      contract_payments: {
        Row: {
          banque: string | null
          contract_id: string
          created_at: string
          date_paiement: string
          id: string
          methode: Database["public"]["Enums"]["payment_method"]
          montant: number
          numero_cheque: string | null
          remarques: string | null
          updated_at: string
        }
        Insert: {
          banque?: string | null
          contract_id: string
          created_at?: string
          date_paiement?: string
          id?: string
          methode: Database["public"]["Enums"]["payment_method"]
          montant: number
          numero_cheque?: string | null
          remarques?: string | null
          updated_at?: string
        }
        Update: {
          banque?: string | null
          contract_id?: string
          created_at?: string
          date_paiement?: string
          id?: string
          methode?: Database["public"]["Enums"]["payment_method"]
          montant?: number
          numero_cheque?: string | null
          remarques?: string | null
          updated_at?: string
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
          branch_id: number | null
          caution_montant: number
          caution_statut: Database["public"]["Enums"]["caution_status"]
          client_id: string
          client_signature: string | null
          created_at: string
          created_by: string | null
          daily_rate: number | null
          date_debut: string
          date_fin: string
          delivery_date: string | null
          delivery_fuel_level: string | null
          delivery_km: number | null
          delivery_notes: string | null
          delivery_type: string | null
          dropoff_branch_id: number | null
          duration: number | null
          end_location: string | null
          end_time: string | null
          franchise_montant: number | null
          id: string
          notes: string | null
          numero_contrat: string
          ordre_mission_url: string | null
          payment_method: string | null
          pdf_url: string | null
          pickup_branch_id: number | null
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
          statut: Database["public"]["Enums"]["contract_status"]
          total_amount: number | null
          updated_at: string
          vehicle_id: string
          witness_signature: string | null
        }
        Insert: {
          advance_payment?: number | null
          branch_id?: number | null
          caution_montant?: number
          caution_statut?: Database["public"]["Enums"]["caution_status"]
          client_id: string
          client_signature?: string | null
          created_at?: string
          created_by?: string | null
          daily_rate?: number | null
          date_debut: string
          date_fin: string
          delivery_date?: string | null
          delivery_fuel_level?: string | null
          delivery_km?: number | null
          delivery_notes?: string | null
          delivery_type?: string | null
          dropoff_branch_id?: number | null
          duration?: number | null
          end_location?: string | null
          end_time?: string | null
          franchise_montant?: number | null
          id?: string
          notes?: string | null
          numero_contrat: string
          ordre_mission_url?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          pickup_branch_id?: number | null
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
          statut?: Database["public"]["Enums"]["contract_status"]
          total_amount?: number | null
          updated_at?: string
          vehicle_id: string
          witness_signature?: string | null
        }
        Update: {
          advance_payment?: number | null
          branch_id?: number | null
          caution_montant?: number
          caution_statut?: Database["public"]["Enums"]["caution_status"]
          client_id?: string
          client_signature?: string | null
          created_at?: string
          created_by?: string | null
          daily_rate?: number | null
          date_debut?: string
          date_fin?: string
          delivery_date?: string | null
          delivery_fuel_level?: string | null
          delivery_km?: number | null
          delivery_notes?: string | null
          delivery_type?: string | null
          dropoff_branch_id?: number | null
          duration?: number | null
          end_location?: string | null
          end_time?: string | null
          franchise_montant?: number | null
          id?: string
          notes?: string | null
          numero_contrat?: string
          ordre_mission_url?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          pickup_branch_id?: number | null
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
          statut?: Database["public"]["Enums"]["contract_status"]
          total_amount?: number | null
          updated_at?: string
          vehicle_id?: string
          witness_signature?: string | null
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
          categorie: Database["public"]["Enums"]["expense_category"]
          created_at: string
          date_depense: string
          description: string | null
          id: string
          justificatif_url: string | null
          montant: number
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          categorie: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date_depense?: string
          description?: string | null
          id?: string
          justificatif_url?: string | null
          montant: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          categorie?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date_depense?: string
          description?: string | null
          id?: string
          justificatif_url?: string | null
          montant?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
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
          file_type: Database["public"]["Enums"]["infraction_file_type"]
          file_url: string
          id: string
          infraction_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_type?: Database["public"]["Enums"]["infraction_file_type"]
          file_url: string
          id?: string
          infraction_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_type?: Database["public"]["Enums"]["infraction_file_type"]
          file_url?: string
          id?: string
          infraction_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "infraction_files_infraction_id_fkey"
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
          commentaire: string | null
          contract_id: string | null
          created_at: string
          created_by: string | null
          date_infraction: string
          date_transmission: string | null
          description: string | null
          id: string
          lieu: string
          montant: number
          reference: string
          statut_traitement: Database["public"]["Enums"]["infraction_statut"]
          type_infraction: Database["public"]["Enums"]["infraction_type"]
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          client_id?: string | null
          commentaire?: string | null
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          date_infraction: string
          date_transmission?: string | null
          description?: string | null
          id?: string
          lieu: string
          montant?: number
          reference: string
          statut_traitement?: Database["public"]["Enums"]["infraction_statut"]
          type_infraction: Database["public"]["Enums"]["infraction_type"]
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          client_id?: string | null
          commentaire?: string | null
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          date_infraction?: string
          date_transmission?: string | null
          description?: string | null
          id?: string
          lieu?: string
          montant?: number
          reference?: string
          statut_traitement?: Database["public"]["Enums"]["infraction_statut"]
          type_infraction?: Database["public"]["Enums"]["infraction_type"]
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "infractions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "infractions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "infractions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          contract_id: string | null
          created_at: string
          date_emission: string
          id: string
          montant_ht: number
          montant_ttc: number
          numero_facture: string
          payee: boolean
          taux_tva: number
          updated_at: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          date_emission?: string
          id?: string
          montant_ht: number
          montant_ttc: number
          numero_facture: string
          payee?: boolean
          taux_tva?: number
          updated_at?: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          date_emission?: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          numero_facture?: string
          payee?: boolean
          taux_tva?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          cree_le: string
          id: string
          lu: boolean
          message: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          cree_le?: string
          id?: string
          lu?: boolean
          message: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          cree_le?: string
          id?: string
          lu?: boolean
          message?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          created_at: string
          date_paiement: string
          id: string
          invoice_id: string
          methode: Database["public"]["Enums"]["payment_method"]
          montant: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_paiement?: string
          id?: string
          invoice_id: string
          methode: Database["public"]["Enums"]["payment_method"]
          montant: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_paiement?: string
          id?: string
          invoice_id?: string
          methode?: Database["public"]["Enums"]["payment_method"]
          montant?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          actif: boolean
          created_at: string
          email: string
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          email: string
          id: string
          nom: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          email?: string
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      secondary_drivers: {
        Row: {
          cin: string | null
          contract_id: string
          created_at: string
          email: string | null
          id: string
          nom: string
          permis_conduire: string | null
          prenom: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          cin?: string | null
          contract_id: string
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          permis_conduire?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          cin?: string | null
          contract_id?: string
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          permis_conduire?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string
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
          file_type: Database["public"]["Enums"]["sinistre_file_type"]
          file_url: string
          id: string
          sinistre_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_type: Database["public"]["Enums"]["sinistre_file_type"]
          file_url: string
          id?: string
          sinistre_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_type?: Database["public"]["Enums"]["sinistre_file_type"]
          file_url?: string
          id?: string
          sinistre_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sinistre_files_sinistre_id_fkey"
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
          created_at: string
          created_by: string | null
          date_sinistre: string
          description: string | null
          gravite: Database["public"]["Enums"]["sinistre_gravite"]
          id: string
          lieu: string
          reference: string
          responsabilite: Database["public"]["Enums"]["sinistre_responsabilite"]
          statut: Database["public"]["Enums"]["sinistre_statut"]
          type_sinistre: Database["public"]["Enums"]["sinistre_type"]
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          client_id?: string | null
          contract_id?: string | null
          cout_estime?: number | null
          created_at?: string
          created_by?: string | null
          date_sinistre: string
          description?: string | null
          gravite: Database["public"]["Enums"]["sinistre_gravite"]
          id?: string
          lieu: string
          reference: string
          responsabilite: Database["public"]["Enums"]["sinistre_responsabilite"]
          statut?: Database["public"]["Enums"]["sinistre_statut"]
          type_sinistre: Database["public"]["Enums"]["sinistre_type"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          client_id?: string | null
          contract_id?: string | null
          cout_estime?: number | null
          created_at?: string
          created_by?: string | null
          date_sinistre?: string
          description?: string | null
          gravite?: Database["public"]["Enums"]["sinistre_gravite"]
          id?: string
          lieu?: string
          reference?: string
          responsabilite?: Database["public"]["Enums"]["sinistre_responsabilite"]
          statut?: Database["public"]["Enums"]["sinistre_statut"]
          type_sinistre?: Database["public"]["Enums"]["sinistre_type"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sinistres_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinistres_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinistres_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_changes: {
        Row: {
          change_date: string
          changed_by: string | null
          contract_id: string
          created_at: string
          id: string
          new_vehicle_id: string
          notes: string | null
          old_vehicle_id: string
          reason: string | null
        }
        Insert: {
          change_date?: string
          changed_by?: string | null
          contract_id: string
          created_at?: string
          id?: string
          new_vehicle_id: string
          notes?: string | null
          old_vehicle_id: string
          reason?: string | null
        }
        Update: {
          change_date?: string
          changed_by?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          new_vehicle_id?: string
          notes?: string | null
          old_vehicle_id?: string
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
          created_at: string
          date_debut: string
          date_expiration: string
          date_paiement: string
          id: string
          mode_paiement: Database["public"]["Enums"]["payment_method"]
          montant: number
          numero_cheque: string | null
          numero_ordre: string
          numero_police: string | null
          photo_url: string | null
          remarques: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          assureur: string
          banque?: string | null
          coordonnees_assureur?: string | null
          created_at?: string
          date_debut: string
          date_expiration: string
          date_paiement: string
          id?: string
          mode_paiement: Database["public"]["Enums"]["payment_method"]
          montant: number
          numero_cheque?: string | null
          numero_ordre: string
          numero_police?: string | null
          photo_url?: string | null
          remarques?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          assureur?: string
          banque?: string | null
          coordonnees_assureur?: string | null
          created_at?: string
          date_debut?: string
          date_expiration?: string
          date_paiement?: string
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_method"]
          montant?: number
          numero_cheque?: string | null
          numero_ordre?: string
          numero_police?: string | null
          photo_url?: string | null
          remarques?: string | null
          updated_at?: string
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
          created_at: string
          date_expiration: string
          date_paiement: string | null
          date_visite: string
          id: string
          mode_paiement: Database["public"]["Enums"]["payment_method"] | null
          montant: number | null
          numero_cheque: string | null
          numero_ordre: string
          photo_url: string | null
          remarques: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          banque?: string | null
          centre_controle?: string | null
          created_at?: string
          date_expiration: string
          date_paiement?: string | null
          date_visite: string
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_method"] | null
          montant?: number | null
          numero_cheque?: string | null
          numero_ordre: string
          photo_url?: string | null
          remarques?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          banque?: string | null
          centre_controle?: string | null
          created_at?: string
          date_expiration?: string
          date_paiement?: string | null
          date_visite?: string
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_method"] | null
          montant?: number | null
          numero_cheque?: string | null
          numero_ordre?: string
          photo_url?: string | null
          remarques?: string | null
          updated_at?: string
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
          annee: number
          banque: string | null
          created_at: string
          date_expiration: string
          date_paiement: string | null
          id: string
          mode_paiement: Database["public"]["Enums"]["payment_method"] | null
          montant: number | null
          numero_cheque: string | null
          numero_ordre: string
          photo_url: string | null
          remarques: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          annee: number
          banque?: string | null
          created_at?: string
          date_expiration: string
          date_paiement?: string | null
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_method"] | null
          montant?: number | null
          numero_cheque?: string | null
          numero_ordre: string
          photo_url?: string | null
          remarques?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          annee?: number
          banque?: string | null
          created_at?: string
          date_expiration?: string
          date_paiement?: string | null
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_method"] | null
          montant?: number | null
          numero_cheque?: string | null
          numero_ordre?: string
          photo_url?: string | null
          remarques?: string | null
          updated_at?: string
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
          annee: number
          assurance_expire_le: string | null
          categorie: Database["public"]["Enums"]["vehicle_category"] | null
          categories: string[] | null
          created_at: string
          date_derniere_vidange: string | null
          dernier_kilometrage_vidange: number | null
          en_service: boolean | null
          id: string
          immatriculation: string
          kilometrage: number
          marque: string
          modele: string
          photo_url: string | null
          prochain_kilometrage_vidange: number | null
          sous_location: boolean | null
          statut: Database["public"]["Enums"]["vehicle_status"]
          tarif_journalier: number
          updated_at: string
          valeur_achat: number | null
          vignette_expire_le: string | null
          visite_technique_expire_le: string | null
        }
        Insert: {
          annee: number
          assurance_expire_le?: string | null
          categorie?: Database["public"]["Enums"]["vehicle_category"] | null
          categories?: string[] | null
          created_at?: string
          date_derniere_vidange?: string | null
          dernier_kilometrage_vidange?: number | null
          en_service?: boolean | null
          id?: string
          immatriculation: string
          kilometrage?: number
          marque: string
          modele: string
          photo_url?: string | null
          prochain_kilometrage_vidange?: number | null
          sous_location?: boolean | null
          statut?: Database["public"]["Enums"]["vehicle_status"]
          tarif_journalier: number
          updated_at?: string
          valeur_achat?: number | null
          vignette_expire_le?: string | null
          visite_technique_expire_le?: string | null
        }
        Update: {
          annee?: number
          assurance_expire_le?: string | null
          categorie?: Database["public"]["Enums"]["vehicle_category"] | null
          categories?: string[] | null
          created_at?: string
          date_derniere_vidange?: string | null
          dernier_kilometrage_vidange?: number | null
          en_service?: boolean | null
          id?: string
          immatriculation?: string
          kilometrage?: number
          marque?: string
          modele?: string
          photo_url?: string | null
          prochain_kilometrage_vidange?: number | null
          sous_location?: boolean | null
          statut?: Database["public"]["Enums"]["vehicle_status"]
          tarif_journalier?: number
          updated_at?: string
          valeur_achat?: number | null
          vignette_expire_le?: string | null
          visite_technique_expire_le?: string | null
        }
        Relationships: []
      }
      vehicules_traite: {
        Row: {
          avance_paye: number | null
          concessionaire: string | null
          created_at: string
          date_achat: string | null
          date_debut: string
          duree_deja_paye: number | null
          id: string
          mode_paiement: string | null
          montant_mensuel: number
          montant_total: number
          nombre_traites: number
          notes: string | null
          organisme: string
          statut: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          avance_paye?: number | null
          concessionaire?: string | null
          created_at?: string
          date_achat?: string | null
          date_debut: string
          duree_deja_paye?: number | null
          id?: string
          mode_paiement?: string | null
          montant_mensuel: number
          montant_total: number
          nombre_traites: number
          notes?: string | null
          organisme: string
          statut?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          avance_paye?: number | null
          concessionaire?: string | null
          created_at?: string
          date_achat?: string | null
          date_debut?: string
          duree_deja_paye?: number | null
          id?: string
          mode_paiement?: string | null
          montant_mensuel?: number
          montant_total?: number
          nombre_traites?: number
          notes?: string | null
          organisme?: string
          statut?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicules_traite_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicules_traites_echeances: {
        Row: {
          created_at: string
          date_echeance: string
          date_paiement: string | null
          document_url: string | null
          id: string
          mode_paiement: string | null
          montant: number
          notes: string | null
          ref_paiement: string | null
          statut: string
          traite_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          date_echeance: string
          date_paiement?: string | null
          document_url?: string | null
          id?: string
          mode_paiement?: string | null
          montant: number
          notes?: string | null
          ref_paiement?: string | null
          statut?: string
          traite_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          date_echeance?: string
          date_paiement?: string | null
          document_url?: string | null
          id?: string
          mode_paiement?: string | null
          montant?: number
          notes?: string | null
          ref_paiement?: string | null
          statut?: string
          traite_id?: string
          updated_at?: string
          vehicle_id?: string
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
          created_at: string
          date_vidange: string
          id: string
          kilometrage: number
          montant: number | null
          remarques: string | null
          type: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          date_vidange?: string
          id?: string
          kilometrage: number
          montant?: number | null
          remarques?: string | null
          type?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          date_vidange?: string
          id?: string
          kilometrage?: number
          montant?: number | null
          remarques?: string | null
          type?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vidanges_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "agent" | "comptable"
      assistance_status:
        | "ouvert"
        | "cloture"
        | "contrat_valide"
        | "livre"
        | "retour_effectue"
      assistance_type: "remplacement" | "prolongation"
      caution_status: "bloquee" | "utilisee" | "remboursee"
      client_type: "particulier" | "entreprise"
      contract_status:
        | "brouillon"
        | "actif"
        | "termine"
        | "annule"
        | "contrat_valide"
        | "livre"
        | "retour_effectue"
      expense_category:
        | "entretien"
        | "assurance"
        | "loyer"
        | "marketing"
        | "salaires"
        | "autres"
      infraction_file_type:
        | "pv"
        | "photo"
        | "recu"
        | "autre"
        | "cin"
        | "permis"
        | "contrat"
      infraction_statut: "nouveau" | "transmis" | "clos"
      infraction_type:
        | "exces_vitesse"
        | "stationnement"
        | "feu_rouge"
        | "telephone"
        | "autre"
      notification_type: "expiration" | "contrat" | "paiement" | "autre"
      payment_method: "especes" | "virement" | "carte" | "cheque"
      sinistre_file_type: "photo" | "constat" | "facture" | "autre"
      sinistre_gravite: "legere" | "moyenne" | "grave"
      sinistre_responsabilite: "locataire" | "tiers" | "indeterminee"
      sinistre_statut: "ouvert" | "en_cours" | "clos"
      sinistre_type: "accident" | "vol" | "panne_grave" | "autre"
      vehicle_category: "A" | "B" | "C" | "D" | "E"
      vehicle_status:
        | "disponible"
        | "reserve"
        | "loue"
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
      app_role: ["admin", "agent", "comptable"],
      assistance_status: [
        "ouvert",
        "cloture",
        "contrat_valide",
        "livre",
        "retour_effectue",
      ],
      assistance_type: ["remplacement", "prolongation"],
      caution_status: ["bloquee", "utilisee", "remboursee"],
      client_type: ["particulier", "entreprise"],
      contract_status: [
        "brouillon",
        "actif",
        "termine",
        "annule",
        "contrat_valide",
        "livre",
        "retour_effectue",
      ],
      expense_category: [
        "entretien",
        "assurance",
        "loyer",
        "marketing",
        "salaires",
        "autres",
      ],
      infraction_file_type: [
        "pv",
        "photo",
        "recu",
        "autre",
        "cin",
        "permis",
        "contrat",
      ],
      infraction_statut: ["nouveau", "transmis", "clos"],
      infraction_type: [
        "exces_vitesse",
        "stationnement",
        "feu_rouge",
        "telephone",
        "autre",
      ],
      notification_type: ["expiration", "contrat", "paiement", "autre"],
      payment_method: ["especes", "virement", "carte", "cheque"],
      sinistre_file_type: ["photo", "constat", "facture", "autre"],
      sinistre_gravite: ["legere", "moyenne", "grave"],
      sinistre_responsabilite: ["locataire", "tiers", "indeterminee"],
      sinistre_statut: ["ouvert", "en_cours", "clos"],
      sinistre_type: ["accident", "vol", "panne_grave", "autre"],
      vehicle_category: ["A", "B", "C", "D", "E"],
      vehicle_status: [
        "disponible",
        "reserve",
        "loue",
        "en_panne",
        "immobilise",
      ],
    },
  },
} as const
