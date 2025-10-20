import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Plan = {
  id?: string;
  name: string;
  description?: string;
  price: number;
  price_6_months?: number;
  price_12_months?: number;
  discount_6_months?: number;
  discount_12_months?: number;
  currency: string;
  max_vehicles: number;
  max_users: number;
  max_clients: number;
  max_contracts: number;
  module_assistance: boolean;
  is_active: boolean;
};

export default function Plans() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);

  const [form, setForm] = useState<Plan>({
    name: "",
    description: "",
    price: 0,
    price_6_months: 0,
    price_12_months: 0,
    discount_6_months: 0,
    discount_12_months: 0,
    currency: "MAD",
    max_vehicles: 0,
    max_users: 0,
    max_clients: 0,
    max_contracts: 0,
    module_assistance: false,
    is_active: true,
  });

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("created_at", { ascending: true });
    
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les plans",
        variant: "destructive",
      });
      return;
    }
    
    setPlans(data || []);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    
    if (editing) {
      const { error } = await supabase.from("plans").update(form).eq("id", editing.id);
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de modifier le plan",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      toast({
        title: "Plan modifié",
        description: "Le plan a été mis à jour avec succès",
      });
    } else {
      const { error } = await supabase.from("plans").insert([form]);
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer le plan",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      toast({
        title: "Plan créé",
        description: "Le nouveau plan a été créé avec succès",
      });
    }
    
    setLoading(false);
    setOpen(false);
    setEditing(null);
    setForm({
      name: "",
      description: "",
      price: 0,
      price_6_months: 0,
      price_12_months: 0,
      discount_6_months: 0,
      discount_12_months: 0,
      currency: "MAD",
      max_vehicles: 0,
      max_users: 0,
      max_clients: 0,
      max_contracts: 0,
      module_assistance: false,
      is_active: true,
    });
    loadPlans();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce plan ?")) return;
    
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le plan",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Plan supprimé",
      description: "Le plan a été supprimé avec succès",
    });
    loadPlans();
  };

  const toggleActive = async (plan: Plan) => {
    const { error } = await supabase
      .from("plans")
      .update({ is_active: !plan.is_active })
      .eq("id", plan.id);
    
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: plan.is_active ? "Plan désactivé" : "Plan activé",
      description: `Le plan ${plan.name} a été ${plan.is_active ? 'désactivé' : 'activé'}`,
    });
    loadPlans();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-black flex items-center gap-3">
          <Layers className="h-8 w-8 text-[#c01533]" />
          Plans d'abonnement
        </h1>
        <p className="text-gray-500 mt-1">
          Tarifs et remises configurables pour chaque formule
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <Button
          onClick={() => {
            setEditing(null);
            setForm({
              name: "",
              description: "",
              price: 0,
              price_6_months: 0,
              price_12_months: 0,
              discount_6_months: 0,
              discount_12_months: 0,
              currency: "MAD",
              max_vehicles: 0,
              max_users: 0,
              max_clients: 0,
              max_contracts: 0,
              module_assistance: false,
              is_active: true,
            });
            setOpen(true);
          }}
          className="bg-[#c01533] hover:bg-[#9a0f26] text-white"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Nouveau Plan
        </Button>
      </div>

      <Card className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Prix 6 mois</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Prix 12 mois</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Remise 6M</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Remise 12M</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quotas</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Assistance</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-black">{p.name}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {p.price_6_months || 0} DH
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {p.price_12_months || 0} DH
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {p.discount_6_months || 0}%
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {p.discount_12_months || 0}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {p.max_vehicles === 0 ? 'Illimité' : p.max_vehicles} véhicules<br />
                    {p.max_users === 0 ? 'Illimité' : p.max_users} utilisateurs<br />
                    {p.max_contracts === 0 ? 'Illimité' : p.max_contracts} contrats<br />
                    {p.max_clients === 0 ? 'Illimité' : p.max_clients} clients
                  </td>
                  <td className="px-6 py-4">
                    {p.module_assistance ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-600 border border-green-200 font-medium">
                        Oui
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500 border border-gray-200">
                        Non
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {p.is_active ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-600 border border-green-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Actif
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-red-50 text-red-600 border border-red-200 inline-flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-700 border-gray-300 hover:bg-gray-100"
                        onClick={() => {
                          setEditing(p);
                          setForm(p);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" /> Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-700 border-gray-300 hover:bg-gray-100"
                        onClick={() => toggleActive(p)}
                      >
                        {p.is_active ? "Désactiver" : "Activer"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(p.id!)}
                        className="bg-[#c01533] hover:bg-[#9a0f26] text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Dialog Création / Édition */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border-gray-200 text-black max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              {editing ? "Modifier le plan" : "Créer un nouveau plan"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Configurez les paramètres et limites du plan d'abonnement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#c01533] uppercase tracking-wide">
                Informations générales
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-700 font-medium">Nom du plan *</Label>
                  <Input
                    placeholder="Ex: Premium, Pro, Basic..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Prix 6 mois (DH HT) *</Label>
                  <Input
                    placeholder="0"
                    type="number"
                    value={form.price_6_months}
                    onChange={(e) =>
                      setForm({ ...form, price_6_months: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Remise 6 mois (%)</Label>
                  <Input
                    placeholder="0"
                    type="number"
                    value={form.discount_6_months}
                    onChange={(e) =>
                      setForm({ ...form, discount_6_months: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
              </div>

              {/* Affichage du prix remisé pour 6 mois */}
              {form.discount_6_months && form.discount_6_months > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    💰 Prix remisé pour 6 mois :{" "}
                    <strong className="text-green-800">
                      {Math.round((form.price_6_months || 0) * (1 - (form.discount_6_months || 0) / 100))} DH HT
                    </strong>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Prix 12 mois (DH HT) *</Label>
                  <Input
                    placeholder="0"
                    type="number"
                    value={form.price_12_months}
                    onChange={(e) =>
                      setForm({ ...form, price_12_months: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Remise 12 mois (%)</Label>
                  <Input
                    placeholder="0"
                    type="number"
                    value={form.discount_12_months}
                    onChange={(e) =>
                      setForm({ ...form, discount_12_months: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
              </div>

              {/* Affichage du prix remisé pour 12 mois */}
              {form.discount_12_months && form.discount_12_months > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    💰 Prix remisé pour 12 mois :{" "}
                    <strong className="text-green-800">
                      {Math.round((form.price_12_months || 0) * (1 - (form.discount_12_months || 0) / 100))} DH HT
                    </strong>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-700 font-medium">Description</Label>
                  <Input
                    placeholder="Description du plan..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
              </div>
            </div>

            {/* Limites & Quotas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#c01533] uppercase tracking-wide">
                Limites & Quotas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Nombre maximum de véhicules</Label>
                  <Input
                    placeholder="0 = illimité"
                    type="number"
                    value={form.max_vehicles}
                    onChange={(e) =>
                      setForm({ ...form, max_vehicles: parseInt(e.target.value) || 0 })
                    }
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Nombre maximum d'utilisateurs</Label>
                  <Input
                    placeholder="0 = illimité"
                    type="number"
                    value={form.max_users}
                    onChange={(e) =>
                      setForm({ ...form, max_users: parseInt(e.target.value) || 0 })
                    }
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Nombre maximum de clients</Label>
                  <Input
                    placeholder="0 = illimité"
                    type="number"
                    value={form.max_clients}
                    onChange={(e) =>
                      setForm({ ...form, max_clients: parseInt(e.target.value) || 0 })
                    }
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Nombre maximum de contrats</Label>
                  <Input
                    placeholder="0 = illimité"
                    type="number"
                    value={form.max_contracts}
                    onChange={(e) =>
                      setForm({ ...form, max_contracts: parseInt(e.target.value) || 0 })
                    }
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
              </div>
            </div>

            {/* Modules activés */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#c01533] uppercase tracking-wide">
                Modules activés
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                {/* Message explicatif */}
                <p className="text-xs text-gray-600">
                  ✓ Modules de base inclus dans tous les plans : Sinistres, Infractions, Alertes, Rapports
                </p>
                
                {/* Seul module premium */}
                <div className="flex items-center justify-between p-3 rounded bg-white border border-gray-200">
                  <div className="space-y-1">
                    <Label className="text-gray-800 font-medium cursor-pointer">
                      🆘 Module Assistance/Assurance
                    </Label>
                    <p className="text-xs text-gray-500">
                      Inclut : Dossiers assistance, Liste des assurances, Factures assurances
                    </p>
                  </div>
                  <Switch
                    checked={form.module_assistance}
                    onCheckedChange={(v) => setForm({ ...form, module_assistance: v })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-gray-300 hover:bg-gray-100 text-gray-700"
            >
              Annuler
            </Button>
            <Button
              className="bg-[#c01533] hover:bg-[#9a0f26] text-white"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "💾 Enregistrement..." : "💾 Enregistrer les modifications"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
