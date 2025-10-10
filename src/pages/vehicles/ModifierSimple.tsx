import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type VehicleStatus = Database['public']['Enums']['vehicle_status'];

export default function ModifierVehiculeSimple() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    kilometrage: 0,
    statut: 'disponible' as VehicleStatus,
  });

  useEffect(() => {
    if (id) {
      loadVehicle();
    }
  }, [id]);

  const loadVehicle = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('kilometrage, statut')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        kilometrage: data.kilometrage || 0,
        statut: data.statut || 'disponible',
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du véhicule",
        variant: "destructive",
      });
      navigate('/vehicules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          kilometrage: formData.kilometrage,
          statut: formData.statut,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Véhicule modifié avec succès",
      });
      navigate(`/vehicules/${id}`);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le véhicule",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Modifier kilométrage et statut</h1>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          <div>
            <Label htmlFor="kilometrage">Kilométrage *</Label>
            <div className="relative">
              <Input
                id="kilometrage"
                type="number"
                value={formData.kilometrage}
                onChange={(e) => setFormData({ ...formData, kilometrage: parseInt(e.target.value) || 0 })}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">KM</span>
            </div>
          </div>

          <div>
            <Label htmlFor="statut">Statut</Label>
            <Select
              value={formData.statut}
              onValueChange={(value) => setFormData({ ...formData, statut: value as VehicleStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="loue">Loué</SelectItem>
                <SelectItem value="reserve">Réservé</SelectItem>
                <SelectItem value="en_panne">En panne</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/vehicules/${id}`)}
              disabled={saving}
            >
              Annuler
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
