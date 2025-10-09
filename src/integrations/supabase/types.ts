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
      assistance: {
        Row: {
          assureur_id: string | null
          assureur_nom: string
          client_id: string | null
          created_at: string
          date_debut: string
          date_fin: string | null
          date_retour_effective: string | null
          etat: Database["public"]["Enums"]["assistance_status"]
          etat_vehicule_depart: string | null
          etat_vehicule_retour: string | null
          id: string
          kilometrage_depart: number | null
          kilometrage_retour: number | null
          montant_facture: number | null
          montant_total: number | null
          niveau_carburant_depart: string | null
          niveau_carburant_retour: string | null
          num_dossier: string
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
          date_retour_effective?: string | null
          etat?: Database["public"]["Enums"]["assistance_status"]
          etat_vehicule_depart?: string | null
          etat_vehicule_retour?: string | null
          id?: string
          kilometrage_depart?: number | null
          kilometrage_retour?: number | null
          montant_facture?: number | null
          montant_total?: number | null
          niveau_carburant_depart?: string | null
          niveau_carburant_retour?: string | null
          num_dossier: string
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
          date_retour_effective?: string | null
          etat?: Database["public"]["Enums"]["assistance_status"]
          etat_vehicule_depart?: string | null
          etat_vehicule_retour?: string | null
          id?: string
          kilometrage_depart?: number | null
          kilometrage_retour?: number | null
          montant_facture?: number | null
          montant_total?: number | null
          niveau_carburant_depart?: string | null
          niveau_carburant_retour?: string | null
          num_dossier?: string
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
          id: string
          notes: string | null
          numero_contrat: string
          payment_method: string | null
          pdf_url: string | null
          pickup_branch_id: number | null
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
          id?: string
          notes?: string | null
          numero_contrat: string
          payment_method?: string | null
          pdf_url?: string | null
          pickup_branch_id?: number | null
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
          id?: string
          notes?: string | null
          numero_contrat?: string
          payment_method?: string | null
          pdf_url?: string | null
          pickup_branch_id?: number | null
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
          created_at: string
          id: string
          immatriculation: string
          kilometrage: number
          marque: string
          modele: string
          photo_url: string | null
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
          created_at?: string
          id?: string
          immatriculation: string
          kilometrage?: number
          marque: string
          modele: string
          photo_url?: string | null
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
          created_at?: string
          id?: string
          immatriculation?: string
          kilometrage?: number
          marque?: string
          modele?: string
          photo_url?: string | null
          statut?: Database["public"]["Enums"]["vehicle_status"]
          tarif_journalier?: number
          updated_at?: string
          valeur_achat?: number | null
          vignette_expire_le?: string | null
          visite_technique_expire_le?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      assistance_status: "ouvert" | "cloture"
      assistance_type: "remplacement" | "prolongation"
      caution_status: "bloquee" | "utilisee" | "remboursee"
      client_type: "particulier" | "entreprise"
      contract_status: "brouillon" | "actif" | "termine" | "annule"
      expense_category:
        | "entretien"
        | "assurance"
        | "loyer"
        | "marketing"
        | "salaires"
        | "autres"
      notification_type: "expiration" | "contrat" | "paiement" | "autre"
      payment_method: "especes" | "virement" | "carte" | "cheque"
      vehicle_category: "A" | "B" | "C" | "D" | "E"
      vehicle_status: "disponible" | "reserve" | "loue" | "en_panne"
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
      assistance_status: ["ouvert", "cloture"],
      assistance_type: ["remplacement", "prolongation"],
      caution_status: ["bloquee", "utilisee", "remboursee"],
      client_type: ["particulier", "entreprise"],
      contract_status: ["brouillon", "actif", "termine", "annule"],
      expense_category: [
        "entretien",
        "assurance",
        "loyer",
        "marketing",
        "salaires",
        "autres",
      ],
      notification_type: ["expiration", "contrat", "paiement", "autre"],
      payment_method: ["especes", "virement", "carte", "cheque"],
      vehicle_category: ["A", "B", "C", "D", "E"],
      vehicle_status: ["disponible", "reserve", "loue", "en_panne"],
    },
  },
} as const
