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
  currency: string;
  max_vehicles: number;
  max_users: number;
  max_clients: number;
  max_contracts: number;
  module_assistance: boolean;
  module_sinistres: boolean;
  module_infractions: boolean;
  module_alertes: boolean;
  module_rapports: boolean;
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
    currency: "MAD",
    max_vehicles: 0,
    max_users: 0,
    max_clients: 0,
    max_contracts: 0,
    module_assistance: false,
    module_sinistres: false,
    module_infractions: false,
    module_alertes: false,
    module_rapports: false,
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
      currency: "MAD",
      max_vehicles: 0,
      max_users: 0,
      max_clients: 0,
      max_contracts: 0,
      module_assistance: false,
      module_sinistres: false,
      module_infractions: false,
      module_alertes: false,
      module_rapports: false,
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
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Layers className="h-7 w-7 text-emerald-500" />
          Gestion des Plans
        </h1>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({
              name: "",
              description: "",
              price: 0,
              currency: "MAD",
              max_vehicles: 0,
              max_users: 0,
              max_clients: 0,
              max_contracts: 0,
              module_assistance: false,
              module_sinistres: false,
              module_infractions: false,
              module_alertes: false,
              module_rapports: false,
              is_active: true,
            });
            setOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Nouveau Plan
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-3 text-left">Nom</th>
                <th className="px-6 py-3 text-left">Prix</th>
                <th className="px-6 py-3 text-left">Quotas</th>
                <th className="px-6 py-3 text-left">Modules</th>
                <th className="px-6 py-3 text-left">Statut</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/60">
                  <td className="px-6 py-4 font-semibold">{p.name}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {p.price} {p.currency}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {p.max_vehicles} véhicules<br />
                    {p.max_users} utilisateurs<br />
                    {p.max_contracts} contrats<br />
                    {p.max_clients} clients
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {p.module_assistance && "🆘 Assistance "}{" "}
                    {p.module_sinistres && "🚗 Sinistres "}{" "}
                    {p.module_infractions && "⚠️ Infractions "}{" "}
                    {p.module_alertes && "🔔 Alertes "}{" "}
                    {p.module_rapports && "📊 Rapports"}
                  </td>
                  <td className="px-6 py-4">
                    {p.is_active ? (
                      <span className="px-2 py-1 rounded text-xs bg-emerald-500/10 text-emerald-400 inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Actif
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 inline-flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-300 border-slate-700 hover:bg-slate-800"
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
                      className="text-gray-300 border-slate-700 hover:bg-slate-800"
                      onClick={() => toggleActive(p)}
                    >
                      {p.is_active ? "Désactiver" : "Activer"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(p.id!)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Dialog Création / Édition */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editing ? "Modifier le plan" : "Créer un nouveau plan"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configurez les paramètres et limites du plan d'abonnement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide">
                Informations générales
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Nom du plan *</Label>
                  <Input
                    placeholder="Ex: Premium, Pro, Basic..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Prix (MAD) *</Label>
                  <Input
                    placeholder="0"
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-300">Description</Label>
                  <Input
                    placeholder="Description du plan..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Limites & Quotas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide">
                Limites & Quotas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Nombre maximum de véhicules</Label>
                  <Input
                    placeholder="0 = illimité"
                    type="number"
                    value={form.max_vehicles}
                    onChange={(e) =>
                      setForm({ ...form, max_vehicles: parseInt(e.target.value) || 0 })
                    }
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Nombre maximum d'utilisateurs</Label>
                  <Input
                    placeholder="0 = illimité"
                    type="number"
                    value={form.max_users}
                    onChange={(e) =>
                      setForm({ ...form, max_users: parseInt(e.target.value) || 0 })
                    }
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Nombre maximum de clients</Label>
                  <Input
                    placeholder="0 = illimité"
                    type="number"
                    value={form.max_clients}
                    onChange={(e) =>
                      setForm({ ...form, max_clients: parseInt(e.target.value) || 0 })
                    }
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Nombre maximum de contrats</Label>
                  <Input
                    placeholder="0 = illimité"
                    type="number"
                    value={form.max_contracts}
                    onChange={(e) =>
                      setForm({ ...form, max_contracts: parseInt(e.target.value) || 0 })
                    }
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Modules activés */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide">
                Modules activés
              </h3>
              <div className="grid grid-cols-2 gap-3 bg-slate-800/50 p-4 rounded-lg">
                {[
                  ["module_assistance", "🆘 Module Assistance"],
                  ["module_sinistres", "🚗 Module Sinistres"],
                  ["module_infractions", "⚠️ Module Infractions"],
                  ["module_alertes", "🔔 Module Alertes"],
                  ["module_rapports", "📊 Module Rapports"],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                    <Label className="text-gray-300 cursor-pointer">{label}</Label>
                    <Switch
                      checked={(form as any)[key]}
                      onCheckedChange={(v) =>
                        setForm({ ...form, [key]: v } as any)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-700 hover:bg-slate-800 text-gray-300"
            >
              Annuler
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
