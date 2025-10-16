import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, Download, Trash2, Calendar, MapPin, User, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AuditTimeline } from '@/components/audit/AuditTimeline';
import { useUserRole } from '@/hooks/use-user-role';

export default function SinistreDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [sinistre, setSinistre] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSinistre();
      loadFiles();
    }
  }, [id]);

  const loadSinistre = async () => {
    try {
      const { data, error } = await supabase
        .from('sinistres')
        .select(`
          *,
          vehicles (id, immatriculation, marque, modele),
          clients (id, nom, prenom, telephone),
          contracts (id, numero_contrat)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setSinistre(data);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/sinistres');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('sinistre_files')
        .select('*')
        .eq('sinistre_id', id);

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error('Error loading files:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('sinistres')
        .update({ statut: newStatus as any })
        .eq('id', id);

      if (error) throw error;

      // FORCER le statut du véhicule selon le statut du sinistre (même s'il est loué)
      if (sinistre?.vehicle_id) {
        let vehicleStatus: 'disponible' | 'loue' | 'reserve' | 'en_panne' | 'immobilise';
        
        if (newStatus === 'clos' || newStatus === 'ferme') {
          vehicleStatus = 'disponible';
        } else {
          vehicleStatus = 'immobilise';
        }

        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({ statut: vehicleStatus })
          .eq('id', sinistre.vehicle_id);

        if (vehicleError) {
          console.error('Erreur lors de la mise à jour du statut du véhicule:', vehicleError);
        }
      }

      toast({
        title: 'Succès',
        description: 'Statut mis à jour',
      });

      loadSinistre();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce sinistre ?')) return;

    try {
      const { error } = await supabase
        .from('sinistres')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Sinistre supprimé',
      });

      navigate('/sinistres');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      ouvert: 'bg-red-500/10 text-red-600 border-red-500/20',
      en_cours: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      clos: 'bg-green-500/10 text-green-600 border-green-500/20',
    };
    const labels: Record<string, string> = {
      ouvert: 'Ouvert',
      en_cours: 'En cours',
      clos: 'Clos',
    };
    return (
      <Badge variant="outline" className={styles[statut]}>
        {labels[statut]}
      </Badge>
    );
  };

  if (loading || !sinistre) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/sinistres')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sinistre {sinistre.reference}</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(sinistre.date_sinistre), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sinistre.statut} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ouvert">Ouvert</SelectItem>
              <SelectItem value="en_cours">En cours</SelectItem>
              <SelectItem value="clos">Clos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => navigate(`/sinistres/${id}/modifier`)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          {isAdmin && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Type</p>
            <p className="text-lg font-semibold">
              {sinistre.type_sinistre === 'accident' ? 'Accident' :
               sinistre.type_sinistre === 'vol' ? 'Vol' :
               sinistre.type_sinistre === 'panne_grave' ? 'Panne grave' : 'Autre'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Gravité</p>
            <p className="text-lg font-semibold">
              {sinistre.gravite === 'legere' ? 'Légère' :
               sinistre.gravite === 'moyenne' ? 'Moyenne' : 'Grave'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Responsabilité</p>
            <p className="text-lg font-semibold">
              {sinistre.responsabilite === 'locataire' ? 'Locataire' :
               sinistre.responsabilite === 'tiers' ? 'Tiers' : 'Indéterminée'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Coût estimé</p>
            <p className="text-lg font-semibold">
              {sinistre.cout_estime ? `${sinistre.cout_estime.toFixed(2)} DH` : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="documents">Documents ({files.length})</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date du sinistre
                  </p>
                  <p className="font-medium">
                    {format(new Date(sinistre.date_sinistre), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Lieu
                  </p>
                  <p className="font-medium">{sinistre.lieu}</p>
                </div>
              </div>

              {sinistre.vehicles && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Véhicule
                  </p>
                  <p className="font-medium">
                    {sinistre.vehicles.marque} {sinistre.vehicles.modele} ({sinistre.vehicles.immatriculation})
                  </p>
                </div>
              )}

              {sinistre.clients && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Client
                  </p>
                  <p className="font-medium">
                    {sinistre.clients.prenom} {sinistre.clients.nom}
                  </p>
                  {sinistre.clients.telephone && (
                    <p className="text-sm text-muted-foreground">{sinistre.clients.telephone}</p>
                  )}
                </div>
              )}

              {sinistre.contracts && (
                <div>
                  <p className="text-sm text-muted-foreground">Contrat</p>
                  <p className="font-medium">{sinistre.contracts.numero_contrat}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {sinistre.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{sinistre.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents attachés</CardTitle>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun document</p>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {files.map((file) => (
                    <Card key={file.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.file_url, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm font-medium truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(file.uploaded_at), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historique">
          <Card>
            <CardHeader>
              <CardTitle>Historique des modifications</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditTimeline tableName="sinistres" recordId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
