import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, CreditCard, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  const loadClientData = async () => {
    try {
      const [clientRes, contractsRes] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('contracts')
          .select(`
            *,
            vehicles (marque, modele, immatriculation)
          `)
          .eq('client_id', id)
          .order('created_at', { ascending: false })
      ]);

      if (clientRes.error) throw clientRes.error;
      if (contractsRes.error) throw contractsRes.error;

      setClient(clientRes.data);
      setContracts(contractsRes.data || []);
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

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {client.nom} {client.prenom}
            </h1>
            <p className="text-sm text-muted-foreground">
              <Badge variant="outline" className="capitalize">
                {client.type === 'particulier' ? 'Particulier' : 'Professionnel'}
              </Badge>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Informations de contact */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.telephone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{client.telephone}</p>
                </div>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
            )}
            {client.adresse && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p className="font-medium">{client.adresse}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.cin && (
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">CIN</p>
                  <p className="font-medium">{client.cin}</p>
                  {client.cin_url && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => window.open(client.cin_url, '_blank')}
                    >
                      Voir le document
                    </Button>
                  )}
                </div>
              </div>
            )}
            {client.permis_conduire && (
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Permis de conduire</p>
                  <p className="font-medium">{client.permis_conduire}</p>
                  {client.permis_url && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => window.open(client.permis_url, '_blank')}
                    >
                      Voir le document
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistiques */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total locations</p>
                <p className="text-2xl font-bold">{contracts.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Locations actives</p>
                <p className="text-2xl font-bold">
                  {contracts.filter(c => c.statut === 'actif').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historique des locations */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des locations</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune location</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 font-medium">N° Contrat</th>
                    <th className="pb-3 font-medium">Véhicule</th>
                    <th className="pb-3 font-medium">Période</th>
                    <th className="pb-3 font-medium">Montant</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 font-medium">{contract.numero_contrat}</td>
                      <td className="py-3">
                        {contract.vehicles?.marque} {contract.vehicles?.modele}
                      </td>
                      <td className="py-3 text-sm">
                        {new Date(contract.date_debut).toLocaleDateString('fr-FR')} -{' '}
                        {new Date(contract.date_fin).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3">{contract.total_amount?.toFixed(2)} MAD</td>
                      <td className="py-3">
                        <Badge
                          variant="outline"
                          className={
                            contract.statut === 'actif'
                              ? 'bg-green-100 text-green-800'
                              : contract.statut === 'termine'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {contract.statut}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/locations/${contract.id}`)}
                        >
                          Voir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
