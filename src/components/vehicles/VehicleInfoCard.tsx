import { useState } from "react";
import { Edit, Save, X, Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

interface VehicleInfoCardProps {
  vehicle: Vehicle;
  onUpdate: (data: Partial<Vehicle>) => void;
}

export function VehicleInfoCard({ vehicle, onUpdate }: VehicleInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(vehicle);
  const [activeTab, setActiveTab] = useState("resume");

  const handleSave = () => {
    onUpdate(editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData(vehicle);
    setIsEditing(false);
  };

  const statusBadge = vehicle.statut === 'disponible' ? 'Libre' :
                     vehicle.statut === 'loue' ? 'Loué' : 
                     vehicle.statut === 'reserve' ? 'Réservé' : 'En panne';
  
  const statusColor = vehicle.statut === 'disponible' ? 'bg-green-100 text-green-800' : 
                     vehicle.statut === 'loue' ? 'bg-blue-100 text-blue-800' : 
                     vehicle.statut === 'reserve' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

  return (
    <Card className="animate-scale-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-primary" />
          <CardTitle>Informations du véhicule</CardTitle>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resume">Résumé</TabsTrigger>
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="details">Détails</TabsTrigger>
          </TabsList>
          
          <TabsContent value="resume" className="mt-6 space-y-6">
            <div className="flex flex-col items-center">
              {vehicle.photo_url ? (
                <img 
                  src={vehicle.photo_url} 
                  alt={vehicle.marque}
                  className="w-40 h-40 object-cover rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-40 h-40 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
                  <Car className="w-20 h-20 text-primary/40" />
                </div>
              )}
              <h3 className="text-2xl font-bold mt-4">{vehicle.marque} {vehicle.modele}</h3>
              <Badge className={`${statusColor} mt-2`}>{statusBadge}</Badge>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full mt-8">
                <div className="text-center p-4 bg-muted/50 rounded-lg hover-scale">
                  <div className="text-primary text-3xl font-bold mb-1">#</div>
                  <p className="text-xs text-muted-foreground mb-2">Matricule</p>
                  <p className="font-semibold">{vehicle.immatriculation}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg hover-scale">
                  <div className="text-primary text-3xl font-bold mb-1">⊙</div>
                  <p className="text-xs text-muted-foreground mb-2">Kilométrage</p>
                  <p className="font-semibold">{vehicle.kilometrage.toLocaleString()} Km</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg hover-scale">
                  <div className="text-primary text-3xl font-bold mb-1">DH</div>
                  <p className="text-xs text-muted-foreground mb-2">Prix/jour</p>
                  <p className="font-semibold">{vehicle.tarif_journalier.toLocaleString()} Dh</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg hover-scale">
                  <div className="text-primary text-3xl font-bold mb-1">📅</div>
                  <p className="text-xs text-muted-foreground mb-2">Année</p>
                  <p className="font-semibold">{vehicle.annee}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info" className="mt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marque</Label>
                  {isEditing ? (
                    <Input
                      value={editedData.marque}
                      onChange={(e) => setEditedData({...editedData, marque: e.target.value})}
                    />
                  ) : (
                    <p className="font-semibold p-2 bg-muted/50 rounded">{vehicle.marque}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Modèle</Label>
                  {isEditing ? (
                    <Input
                      value={editedData.modele}
                      onChange={(e) => setEditedData({...editedData, modele: e.target.value})}
                    />
                  ) : (
                    <p className="font-semibold p-2 bg-muted/50 rounded">{vehicle.modele}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Année</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedData.annee}
                      onChange={(e) => setEditedData({...editedData, annee: parseInt(e.target.value)})}
                    />
                  ) : (
                    <p className="font-semibold p-2 bg-muted/50 rounded">{vehicle.annee}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Valeur d'achat</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedData.valeur_achat || ''}
                      onChange={(e) => setEditedData({...editedData, valeur_achat: parseFloat(e.target.value)})}
                    />
                  ) : (
                    <p className="font-semibold p-2 bg-muted/50 rounded">
                      {vehicle.valeur_achat?.toLocaleString() || 'N/A'} Dh
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Tarif journalier</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedData.tarif_journalier}
                      onChange={(e) => setEditedData({...editedData, tarif_journalier: parseFloat(e.target.value)})}
                    />
                  ) : (
                    <p className="font-semibold p-2 bg-muted/50 rounded">
                      {vehicle.tarif_journalier.toLocaleString()} Dh
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Kilométrage</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedData.kilometrage}
                      onChange={(e) => setEditedData({...editedData, kilometrage: parseInt(e.target.value)})}
                    />
                  ) : (
                    <p className="font-semibold p-2 bg-muted/50 rounded">
                      {vehicle.kilometrage.toLocaleString()} km
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Assurance expire le</Label>
                  <p className="font-semibold p-2 bg-muted/50 rounded">
                    {vehicle.assurance_expire_le ? 
                      format(new Date(vehicle.assurance_expire_le), 'dd/MM/yyyy', { locale: fr }) : 
                      'Non défini'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Visite technique expire le</Label>
                  <p className="font-semibold p-2 bg-muted/50 rounded">
                    {vehicle.visite_technique_expire_le ? 
                      format(new Date(vehicle.visite_technique_expire_le), 'dd/MM/yyyy', { locale: fr }) : 
                      'Non défini'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Vignette expire le</Label>
                  <p className="font-semibold p-2 bg-muted/50 rounded">
                    {vehicle.vignette_expire_le ? 
                      format(new Date(vehicle.vignette_expire_le), 'dd/MM/yyyy', { locale: fr }) : 
                      'Non défini'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
