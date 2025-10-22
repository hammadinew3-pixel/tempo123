import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, DollarSign, Calendar, ChevronDown, ChevronUp, Info, AlertCircle, Download, Edit, AlertTriangle, Car, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUserRole } from '@/hooks/use-user-role';

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [client, setClient] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [infractions, setInfractions] = useState<any[]>([]);
  const [sinistres, setSinistres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(true);
  const [infractionsOpen, setInfractionsOpen] = useState(true);
  const [sinistresOpen, setSinistresOpen] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [sexe, setSexe] = useState<'homme' | 'femme'>('homme');
  const [clientFiable, setClientFiable] = useState<'nouveau' | 'oui' | 'non'>('nouveau');
  const [cinFile, setCinFile] = useState<File | null>(null);
  const [permisFile, setPermisFile] = useState<File | null>(null);

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  // Écouter les changements en temps réel sur ce client
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel('client-details-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clients',
          filter: `id=eq.${id}`
        },
        () => {
          loadClientData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const loadClientData = async () => {
    try {
      const [clientRes, contractsRes, revenusRes, infractionsRes, sinistresRes] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('contracts')
          .select(`
            *,
            vehicles (marque, modele, immatriculation)
          `)
          .eq('client_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('revenus')
          .select('montant')
          .eq('client_id', id),
        supabase
          .from('infractions')
          .select(`
            *,
            vehicles (marque, modele, immatriculation)
          `)
          .eq('client_id', id)
          .order('date_infraction', { ascending: false }),
        supabase
          .from('sinistres')
          .select(`
            *,
            vehicles (marque, modele, immatriculation)
          `)
          .eq('client_id', id)
          .order('date_sinistre', { ascending: false }),
      ]);

      if (clientRes.error) throw clientRes.error;
      if (!clientRes.data) {
        toast({
          title: 'Erreur',
          description: 'Client introuvable',
          variant: 'destructive',
        });
        navigate('/clients');
        return;
      }
      if (contractsRes.error) throw contractsRes.error;
      if (revenusRes.error) throw revenusRes.error;
      if (infractionsRes.error) throw infractionsRes.error;
      if (sinistresRes.error) throw sinistresRes.error;

      setClient(clientRes.data);
      setContracts(contractsRes.data || []);
      setInfractions(infractionsRes.data || []);
      setSinistres(sinistresRes.data || []);
      
      // Calculer le revenu total depuis la table revenus
      const total = (revenusRes.data || []).reduce((sum, revenu) => sum + (revenu.montant || 0), 0);
      setTotalRevenue(total);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (url: string, filename: string) => {
    try {
      const { downloadFromSupabase } = await import('@/lib/downloadUtils');
      await downloadFromSupabase(url, filename);
      
      toast({
        title: 'Succès',
        description: 'Document téléchargé',
      });
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de télécharger le document',
        variant: 'destructive',
      });
    }
  };



  const openEditDialog = () => {
    setFormData({
      ...client,
      sexe: client.sexe || 'homme',
      client_fiable: client.client_fiable || 'nouveau',
    });
    setSexe(client.sexe || 'homme');
    setClientFiable(client.client_fiable || 'nouveau');
    setIsEditDialogOpen(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom || !formData.telephone) {
      toast({
        title: 'Champs requis',
        description: 'Le nom et le téléphone sont obligatoires',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let clientData = { 
        ...formData,
        sexe,
        client_fiable: clientFiable,
      };

      // Upload des nouveaux fichiers si fournis
      if (cinFile) {
        const cinPath = `clients/${id}/cin_${Date.now()}.${cinFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(cinPath, cinFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('client-documents')
          .getPublicUrl(cinPath);
        
        clientData.cin_url = publicUrl;
      }

      if (permisFile) {
        const permisPath = `clients/${id}/permis_${Date.now()}.${permisFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(permisPath, permisFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('client-documents')
          .getPublicUrl(permisPath);
        
        clientData.permis_url = publicUrl;
      }

      const { error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Client modifié avec succès',
      });

      setIsEditDialogOpen(false);
      setCinFile(null);
      setPermisFile(null);
      loadClientData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (contracts.length > 0) {
      toast({
        title: 'Impossible de supprimer',
        description: 'Ce client a des réservations actives',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Client supprimé avec succès',
      });
      navigate('/clients');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!client) return null;

  return (
    <>
    <div className="space-y-6 p-6 bg-muted/30 min-h-screen">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Tableau de bord</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/clients" className="hover:text-foreground">Clients</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">
          {client.type === 'entreprise' ? client.nom : `${client.nom} ${client.prenom || ''}`}
        </span>
      </nav>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenu Total */}
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/2 h-full opacity-10">
            <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-full transform translate-x-1/4 -translate-y-1/4 scale-150" />
          </div>
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-2">REVENU TOTAL</p>
                <p className="text-3xl font-bold text-foreground">
                  {totalRevenue.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl">DH</span>
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Réservations */}
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/2 h-full opacity-10">
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-full transform translate-x-1/4 -translate-y-1/4 scale-150" />
          </div>
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-2">RÉSERVATIONS</p>
                <p className="text-3xl font-bold text-foreground">{contracts.length.toString().padStart(2, '0')}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations */}
      <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <div className="p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Informations</h2>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog();
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                )}
                {infoOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Tabs defaultValue="resume" className="w-full">
              <div className="px-6 border-b">
                <TabsList className="bg-transparent h-auto p-0">
                  <TabsTrigger 
                    value="resume" 
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3"
                  >
                    RÉSUMÉ
                  </TabsTrigger>
                  <TabsTrigger 
                    value="personal" 
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3"
                  >
                    INFO PERSONNELLES
                  </TabsTrigger>
                  <TabsTrigger 
                    value="license" 
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3"
                  >
                    PERMIS DE CONDUIRE
                  </TabsTrigger>
                  {client.type === 'entreprise' && (
                    <TabsTrigger 
                      value="company" 
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3"
                    >
                      ENTREPRISE
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent value="resume" className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Type</p>
                    <p className="font-medium capitalize">{client.type === 'particulier' ? 'Particulier' : 'Entreprise'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nom complet</p>
                    <p className="font-medium">
                      {client.type === 'entreprise' ? client.nom : `${client.nom} ${client.prenom || ''}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fiabilité</p>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20">
                      {client.client_fiable === 'nouveau' ? 'Nouveau client' : 
                       client.client_fiable === 'oui' ? 'Client fiable' : 
                       client.client_fiable === 'non' ? 'Non fiable' : 
                       contracts.length <= 2 ? 'Nouveau client' : 'Client fidèle'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">N° CIN</p>
                    <p className="font-medium">{client.cin || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Sexe</p>
                    <p className="font-medium capitalize">{client.sexe || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date de naissance</p>
                    <p className="font-medium">
                      {client.date_naissance ? format(new Date(client.date_naissance), 'dd/MM/yyyy', { locale: fr }) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">N° permis</p>
                    <p className="font-medium">{client.permis_conduire || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Téléphone</p>
                    <p className="font-medium">{client.telephone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date création</p>
                    <p className="font-medium">
                      {client.created_at ? format(new Date(client.created_at), 'dd/MM/yyyy', { locale: fr }) : '—'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-3">Pièces jointes</p>
                    <div className="flex gap-3">
                      {client.cin_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadDocument(client.cin_url, `CIN_${client.nom}_${client.prenom}`)}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger CIN
                        </Button>
                      )}
                      {client.permis_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                        onClick={() => handleDownloadDocument(client.permis_url, `Permis_${client.nom}_${client.prenom}`)}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger Permis
                        </Button>
                      )}
                      {!client.cin_url && !client.permis_url && (
                        <p className="text-sm text-muted-foreground">Aucun document</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="personal" className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nom</p>
                    <p className="font-medium">{client.nom || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Prénom</p>
                    <p className="font-medium">{client.prenom || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">{client.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Téléphone</p>
                    <p className="font-medium">{client.telephone || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Adresse</p>
                    <p className="font-medium">{client.adresse || '—'}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="license" className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">N° permis de conduire</p>
                    <p className="font-medium">{client.permis_conduire || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date délivrance</p>
                    <p className="font-medium">
                      {client.date_delivrance_permis ? format(new Date(client.date_delivrance_permis), 'dd/MM/yyyy', { locale: fr }) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date expiration</p>
                    <p className="font-medium">
                      {client.date_expiration_permis ? format(new Date(client.date_expiration_permis), 'dd/MM/yyyy', { locale: fr }) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Centre de délivrance</p>
                    <p className="font-medium">{client.centre_delivrance_permis || '—'}</p>
                  </div>
                  {client.permis_url && (
                    <div className="col-span-2">
                      <Button 
                        variant="outline"
                        onClick={() => handleDownloadDocument(client.permis_url, `Permis_${client.nom}_${client.prenom}`)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger le document du permis
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {client.type === 'entreprise' && (
                <TabsContent value="company" className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Nom de l&apos;entreprise</p>
                      <p className="font-medium">{client.nom || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="font-medium">{client.email || '—'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Adresse</p>
                      <p className="font-medium">{client.adresse || '—'}</p>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Historique Infractions */}
      <Collapsible open={infractionsOpen} onOpenChange={setInfractionsOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <div className="p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold">Historique Infractions</h2>
                <Badge variant="secondary">{infractions.length}</Badge>
              </div>
              {infractionsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-6">
              {infractions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Aucune infraction pour ce client</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {infractions.map((infraction) => (
                    <Link 
                      key={infraction.id}
                      to={`/infractions/${infraction.id}`}
                      className="block p-4 rounded-lg border border-border hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium">Infraction {infraction.reference || '—'}</p>
                            <Badge variant={infraction.statut === 'payee' ? 'default' : 'destructive'}>
                              {infraction.statut === 'payee' ? 'Payée' : 'Non payée'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>📅 {infraction.date_infraction ? format(new Date(infraction.date_infraction), 'dd/MM/yyyy', { locale: fr }) : '—'}</p>
                            {infraction.vehicles && (
                              <p>🚗 {infraction.vehicles.marque} {infraction.vehicles.modele} - {infraction.vehicles.immatriculation}</p>
                            )}
                            {infraction.type_infraction && <p>Type: {infraction.type_infraction}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">
                            {infraction.montant ? `${infraction.montant.toFixed(2)} DH` : '—'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Historique Sinistres */}
      <Collapsible open={sinistresOpen} onOpenChange={setSinistresOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <div className="p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold">Historique Sinistres</h2>
                <Badge variant="secondary">{sinistres.length}</Badge>
              </div>
              {sinistresOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-6">
              {sinistres.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Car className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Aucun sinistre pour ce client</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sinistres.map((sinistre) => (
                    <Link 
                      key={sinistre.id}
                      to={`/sinistres/${sinistre.id}`}
                      className="block p-4 rounded-lg border border-border hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium">Sinistre {sinistre.reference || '—'}</p>
                            <Badge 
                              variant={
                                sinistre.statut === 'cloture' ? 'default' : 
                                sinistre.statut === 'en_cours' ? 'secondary' : 
                                'destructive'
                              }
                            >
                              {sinistre.statut === 'cloture' ? 'Clôturé' : 
                               sinistre.statut === 'en_cours' ? 'En cours' : 
                               'En attente'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>📅 {sinistre.date_sinistre ? format(new Date(sinistre.date_sinistre), 'dd/MM/yyyy', { locale: fr }) : '—'}</p>
                            {sinistre.vehicles && (
                              <p>🚗 {sinistre.vehicles.marque} {sinistre.vehicles.modele} - {sinistre.vehicles.immatriculation}</p>
                            )}
                            {sinistre.type_sinistre && <p>Type: {sinistre.type_sinistre}</p>}
                            {sinistre.description && <p className="text-xs">{sinistre.description}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">
                            {sinistre.montant ? `${sinistre.montant.toFixed(2)} DH` : '—'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Historique des locations */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Historique des locations</h2>
            </div>
            <Badge variant="secondary">{contracts.length} réservations</Badge>
          </div>
          
          {contracts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Aucune réservation pour ce client</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/locations/${contract.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={
                        contract.statut === 'livre' || contract.statut === 'contrat_valide' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : contract.statut === 'termine' || contract.statut === 'retour_effectue'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : contract.statut === 'annule'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }>
                        {contract.statut === 'brouillon' ? 'Réservation' :
                         contract.statut === 'contrat_valide' ? 'Validé' :
                         contract.statut === 'livre' ? 'En cours' :
                         contract.statut === 'retour_effectue' ? 'Retourné' :
                         contract.statut === 'termine' ? 'Clôturé' :
                         contract.statut === 'annule' ? 'Annulé' : contract.statut}
                      </Badge>
                      <span className="text-sm font-mono text-muted-foreground">{contract.numero_contrat}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">{contract.total_amount?.toFixed(2) || '0.00'} DH</div>
                      <div className="text-xs text-muted-foreground">{contract.duration || 0} jours</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Véhicule: </span>
                      <span className="font-medium">
                        {contract.vehicles?.marque} {contract.vehicles?.modele}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Immat: </span>
                      <span className="font-medium">{contract.vehicles?.immatriculation}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Début: </span>
                      <span className="font-medium">
                        {contract.date_debut ? format(new Date(contract.date_debut), 'dd/MM/yyyy', { locale: fr }) : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fin: </span>
                      <span className="font-medium">
                        {contract.date_fin ? format(new Date(contract.date_fin), 'dd/MM/yyyy', { locale: fr }) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Delete Button */}
      <div className="flex justify-start">
        {isAdmin && (
          <Button
            variant="destructive"
            onClick={handleDeleteClient}
            disabled={contracts.length > 0}
            className="bg-gray-300 text-gray-500 hover:bg-gray-400 disabled:opacity-50"
          >
            SUPPRIMER CE CLIENT
          </Button>
        )}
        {contracts.length > 0 && (
          <p className="ml-4 text-sm text-muted-foreground flex items-center gap-2 mt-2">
            <AlertCircle className="w-4 h-4" />
            Vous ne pouvez pas supprimer un client s&apos;il a eu des réservations.
          </p>
        )}
      </div>
    </div>

    {/* Dialog de modification */}
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdateClient} className="space-y-6">
          {/* Type de client */}
          <div className="space-y-2">
            <Label>Type de client</Label>
            <RadioGroup
              value={formData.type || 'particulier'}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="particulier" id="edit-particulier" />
                  <Label htmlFor="edit-particulier" className="cursor-pointer">Particulier</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="entreprise" id="edit-entreprise" />
                  <Label htmlFor="edit-entreprise" className="cursor-pointer">Entreprise</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Informations entreprise (si entreprise) */}
          {formData.type === 'entreprise' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-raison-sociale">Raison sociale</Label>
                <Input
                  id="edit-raison-sociale"
                  value={formData.raison_sociale || ''}
                  onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ice">ICE</Label>
                <Input
                  id="edit-ice"
                  value={formData.ice || ''}
                  onChange={(e) => setFormData({ ...formData, ice: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Informations générales - TOUJOURS VISIBLES */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nom">Nom *</Label>
              <Input
                id="edit-nom"
                value={formData.nom || ''}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-prenom">Prénom</Label>
              <Input
                id="edit-prenom"
                value={formData.prenom || ''}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-telephone">Téléphone *</Label>
              <Input
                id="edit-telephone"
                value={formData.telephone || ''}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Informations personnelles - TOUJOURS VISIBLES */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cin">N° CIN</Label>
              <Input
                id="edit-cin"
                value={formData.cin || ''}
                onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date-naissance">Date de naissance</Label>
              <Input
                id="edit-date-naissance"
                type="date"
                value={formData.date_naissance || ''}
                onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Sexe</Label>
              <RadioGroup value={sexe || 'homme'} onValueChange={(value: 'homme' | 'femme') => setSexe(value)}>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="homme" id="edit-homme" />
                    <Label htmlFor="edit-homme" className="cursor-pointer">Homme</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="femme" id="edit-femme" />
                    <Label htmlFor="edit-femme" className="cursor-pointer">Femme</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Client fiable</Label>
              <RadioGroup value={clientFiable || 'nouveau'} onValueChange={(value: 'nouveau' | 'oui' | 'non') => setClientFiable(value)}>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nouveau" id="edit-nouveau" />
                    <Label htmlFor="edit-nouveau" className="cursor-pointer">Nouveau</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oui" id="edit-oui" />
                    <Label htmlFor="edit-oui" className="cursor-pointer">Oui</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non" id="edit-non" />
                    <Label htmlFor="edit-non" className="cursor-pointer">Non</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Permis de conduire - TOUJOURS VISIBLE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-permis">N° Permis de conduire</Label>
              <Input
                id="edit-permis"
                value={formData.permis_conduire || ''}
                onChange={(e) => setFormData({ ...formData, permis_conduire: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date-delivrance">Date de délivrance</Label>
              <Input
                id="edit-date-delivrance"
                type="date"
                value={formData.date_delivrance_permis || ''}
                onChange={(e) => setFormData({ ...formData, date_delivrance_permis: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date-expiration">Date d'expiration</Label>
              <Input
                id="edit-date-expiration"
                type="date"
                value={formData.date_expiration_permis || ''}
                onChange={(e) => setFormData({ ...formData, date_expiration_permis: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-centre-delivrance">Centre de délivrance</Label>
              <Input
                id="edit-centre-delivrance"
                value={formData.centre_delivrance_permis || ''}
                onChange={(e) => setFormData({ ...formData, centre_delivrance_permis: e.target.value })}
              />
            </div>
          </div>

          {/* Adresse - TOUJOURS VISIBLE */}
          <div className="space-y-2">
            <Label htmlFor="edit-adresse">Adresse</Label>
            <Textarea
              id="edit-adresse"
              value={formData.adresse || ''}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              rows={3}
            />
          </div>

          {/* Documents - TOUJOURS VISIBLE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cin-file">Photo CIN (optionnel)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-cin-file"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setCinFile(e.target.files?.[0] || null)}
                />
                {client?.cin_url && !cinFile && (
                  <Badge variant="outline">Déjà uploadé</Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-permis-file">Photo Permis (optionnel)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-permis-file"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setPermisFile(e.target.files?.[0] || null)}
                />
                {client?.permis_url && !permisFile && (
                  <Badge variant="outline">Déjà uploadé</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setCinFile(null);
                setPermisFile(null);
              }}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}