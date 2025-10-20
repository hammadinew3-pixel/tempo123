import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, DollarSign, Calendar, ChevronDown, ChevronUp, Info, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(true);
  const [statsOpen, setStatsOpen] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  const loadClientData = async () => {
    try {
      const [clientRes, contractsRes, revenusRes] = await Promise.all([
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
          .eq('client_id', id)
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

      setClient(clientRes.data);
      setContracts(contractsRes.data || []);
      
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


  const getContractStats = () => {
    const stats = {
      shortTerm: {
        pending: 0,
        delivered: 0,
        returned: 0,
        cancelled: 0,
        total: 0
      },
      longTerm: {
        pending: 0,
        delivered: 0,
        returned: 0,
        cancelled: 0,
        total: 0
      }
    };

    contracts.forEach((contract) => {
      const duration = contract.duration || 0;
      const isShortTerm = duration <= 7;
      const category = isShortTerm ? 'shortTerm' : 'longTerm';

      if (contract.statut === 'brouillon') {
        stats[category].pending++;
      } else if (contract.statut === 'livre' || contract.statut === 'contrat_valide') {
        stats[category].delivered++;
      } else if (contract.statut === 'retour_effectue' || contract.statut === 'termine') {
        stats[category].returned++;
      } else if (contract.statut === 'annule') {
        stats[category].cancelled++;
      }
      stats[category].total++;
    });

    return stats;
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

  const stats = getContractStats();
  const isNewClient = contracts.length <= 2;

  return (
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
              {infoOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
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
                      {isNewClient ? 'Nouveau client' : 'Client fidèle'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">N° CIN</p>
                    <p className="font-medium">{client.cin || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Sexe</p>
                    <p className="font-medium text-blue-600">👤 {client.prenom ? 'Homme' : '—'}</p>
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
                          onClick={() => window.open(client.cin_url, '_blank')}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Voir CIN
                        </Button>
                      )}
                      {client.permis_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(client.permis_url, '_blank')}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Voir Permis
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
                    <p className="text-sm text-muted-foreground mb-1">CIN</p>
                    <p className="font-medium">{client.cin || '—'}</p>
                  </div>
                  {client.permis_url && (
                    <div className="col-span-2">
                      <Button 
                        variant="outline" 
                        onClick={() => window.open(client.permis_url, '_blank')}
                      >
                        Voir le document du permis
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

      {/* Statistiques des réservations */}
      <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <div className="p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h2 className="text-lg font-semibold">Statistiques des réservations</h2>
              </div>
              {statsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type location</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">En attente</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Livrée</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Récupérée</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Annulée</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4 text-sm">Courte durée</td>
                      <td className="text-center py-3 px-4">{stats.shortTerm.pending.toString().padStart(2, '0')}</td>
                      <td className="text-center py-3 px-4">{stats.shortTerm.delivered.toString().padStart(2, '0')}</td>
                      <td className="text-center py-3 px-4">{stats.shortTerm.returned.toString().padStart(2, '0')}</td>
                      <td className="text-center py-3 px-4">{stats.shortTerm.cancelled.toString().padStart(2, '0')}</td>
                      <td className="text-center py-3 px-4">{stats.shortTerm.total.toString().padStart(2, '0')}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 text-sm">Longue durée</td>
                      <td className="text-center py-3 px-4">{stats.longTerm.pending.toString().padStart(2, '0')}</td>
                      <td className="text-center py-3 px-4">{stats.longTerm.delivered.toString().padStart(2, '0')}</td>
                      <td className="text-center py-3 px-4">{stats.longTerm.returned.toString().padStart(2, '0')}</td>
                      <td className="text-center py-3 px-4">{stats.longTerm.cancelled.toString().padStart(2, '0')}</td>
                      <td className="text-center py-3 px-4">{stats.longTerm.total.toString().padStart(2, '0')}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-semibold">Total</td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20">
                          {(stats.shortTerm.pending + stats.longTerm.pending).toString().padStart(2, '0')}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20">
                          {(stats.shortTerm.delivered + stats.longTerm.delivered).toString().padStart(2, '0')}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">
                          {(stats.shortTerm.returned + stats.longTerm.returned).toString().padStart(2, '0')}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20">
                          {(stats.shortTerm.cancelled + stats.longTerm.cancelled).toString().padStart(2, '0')}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-700">
                          {(stats.shortTerm.total + stats.longTerm.total).toString().padStart(2, '0')}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-md flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p className="text-blue-600 font-medium cursor-pointer hover:underline">
                    Cliquez ici pour consulter toutes les locations courtes durées de ce client.
                  </p>
                  <p className="text-blue-600 font-medium cursor-pointer hover:underline">
                    Cliquez ici pour consulter toutes les locations longues durées de ce client.
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
  );
}