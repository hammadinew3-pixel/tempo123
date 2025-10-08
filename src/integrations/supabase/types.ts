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
          assureur_nom: string
          client_id: string | null
          created_at: string
          date_debut: string
          date_fin: string | null
          etat: Database["public"]["Enums"]["assistance_status"]
          id: string
          montant_facture: number | null
          num_dossier: string
          tenant_id: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          assureur_nom: string
          client_id?: string | null
          created_at?: string
          date_debut: string
          date_fin?: string | null
          etat?: Database["public"]["Enums"]["assistance_status"]
          id?: string
          montant_facture?: number | null
          num_dossier: string
          tenant_id: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          assureur_nom?: string
          client_id?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          etat?: Database["public"]["Enums"]["assistance_status"]
          id?: string
          montant_facture?: number | null
          num_dossier?: string
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistance_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          caution_montant: number
          caution_statut: Database["public"]["Enums"]["caution_status"]
          client_id: string
          created_at: string
          date_debut: string
          date_fin: string
          id: string
          numero_contrat: string
          pdf_url: string | null
          statut: Database["public"]["Enums"]["contract_status"]
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          caution_montant?: number
          caution_statut?: Database["public"]["Enums"]["caution_status"]
          client_id: string
          created_at?: string
          date_debut: string
          date_fin: string
          id?: string
          numero_contrat: string
          pdf_url?: string | null
          statut?: Database["public"]["Enums"]["contract_status"]
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          caution_montant?: number
          caution_statut?: Database["public"]["Enums"]["caution_status"]
          client_id?: string
          created_at?: string
          date_debut?: string
          date_fin?: string
          id?: string
          numero_contrat?: string
          pdf_url?: string | null
          statut?: Database["public"]["Enums"]["contract_status"]
          tenant_id?: string
          updated_at?: string
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
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          cree_le?: string
          id?: string
          lu?: boolean
          message: string
          tenant_id: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          cree_le?: string
          id?: string
          lu?: boolean
          message?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          date_paiement: string
          id: string
          invoice_id: string
          methode: Database["public"]["Enums"]["payment_method"]
          montant: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_paiement?: string
          id?: string
          invoice_id: string
          methode: Database["public"]["Enums"]["payment_method"]
          montant: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_paiement?: string
          id?: string
          invoice_id?: string
          methode?: Database["public"]["Enums"]["payment_method"]
          montant?: number
          tenant_id?: string
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
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          email: string
          id: string
          nom: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          email?: string
          id?: string
          nom?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          actif: boolean
          adresse: string | null
          created_at: string
          date_inscription: string
          email_contact: string
          id: string
          justificatif_virement_url: string | null
          logo_url: string | null
          nom_agence: string
          paiement_valide: boolean
          plan: Database["public"]["Enums"]["plan_type"]
          slug: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          created_at?: string
          date_inscription?: string
          email_contact: string
          id?: string
          justificatif_virement_url?: string | null
          logo_url?: string | null
          nom_agence: string
          paiement_valide?: boolean
          plan?: Database["public"]["Enums"]["plan_type"]
          slug: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          created_at?: string
          date_inscription?: string
          email_contact?: string
          id?: string
          justificatif_virement_url?: string | null
          logo_url?: string | null
          nom_agence?: string
          paiement_valide?: boolean
          plan?: Database["public"]["Enums"]["plan_type"]
          slug?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
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
      vehicles: {
        Row: {
          annee: number
          assurance_expire_le: string | null
          created_at: string
          id: string
          immatriculation: string
          kilometrage: number
          marque: string
          modele: string
          statut: Database["public"]["Enums"]["vehicle_status"]
          tarif_journalier: number
          tenant_id: string
          updated_at: string
          valeur_achat: number | null
          vignette_expire_le: string | null
          visite_technique_expire_le: string | null
        }
        Insert: {
          annee: number
          assurance_expire_le?: string | null
          created_at?: string
          id?: string
          immatriculation: string
          kilometrage?: number
          marque: string
          modele: string
          statut?: Database["public"]["Enums"]["vehicle_status"]
          tarif_journalier: number
          tenant_id: string
          updated_at?: string
          valeur_achat?: number | null
          vignette_expire_le?: string | null
          visite_technique_expire_le?: string | null
        }
        Update: {
          annee?: number
          assurance_expire_le?: string | null
          created_at?: string
          id?: string
          immatriculation?: string
          kilometrage?: number
          marque?: string
          modele?: string
          statut?: Database["public"]["Enums"]["vehicle_status"]
          tarif_journalier?: number
          tenant_id?: string
          updated_at?: string
          valeur_achat?: number | null
          vignette_expire_le?: string | null
          visite_technique_expire_le?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tenant_id: {
        Args: { _user_id: string }
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
      app_role: "superadmin" | "admin" | "agent" | "comptable"
      assistance_status: "ouvert" | "cloture"
      caution_status: "bloquee" | "utilisee" | "remboursee"
      client_type: "particulier" | "entreprise"
      contract_status: "brouillon" | "actif" | "termine" | "annule"
      expense_category: "entretien" | "assurance" | "salaires" | "autres"
      notification_type: "expiration" | "contrat" | "paiement" | "autre"
      payment_method: "especes" | "virement" | "carte" | "cheque"
      plan_type: "essentiel" | "standard" | "premium"
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
      app_role: ["superadmin", "admin", "agent", "comptable"],
      assistance_status: ["ouvert", "cloture"],
      caution_status: ["bloquee", "utilisee", "remboursee"],
      client_type: ["particulier", "entreprise"],
      contract_status: ["brouillon", "actif", "termine", "annule"],
      expense_category: ["entretien", "assurance", "salaires", "autres"],
      notification_type: ["expiration", "contrat", "paiement", "autre"],
      payment_method: ["especes", "virement", "carte", "cheque"],
      plan_type: ["essentiel", "standard", "premium"],
      vehicle_status: ["disponible", "reserve", "loue", "en_panne"],
    },
  },
} as const
