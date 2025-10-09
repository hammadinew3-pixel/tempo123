import { useEffect, useState } from 'react';
import { Search, Filter, Download, Plus, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Client = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<ClientInsert>>({
    type: 'particulier',
    nom: '',
    prenom: '',
    cin: '',
    permis_conduire: '',
    email: '',
    telephone: '',
    adresse: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', editingClient.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Client modifié avec succès',
        });
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([formData as ClientInsert]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Client ajouté avec succès',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadClients();
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

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Client supprimé',
      });

      loadClients();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'particulier',
      nom: '',
      prenom: '',
      cin: '',
      permis_conduire: '',
      email: '',
      telephone: '',
      adresse: '',
    });
    setEditingClient(null);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liste des clients</h1>
          <p className="text-sm text-muted-foreground">Gérez votre base de clients</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            FILTRER
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            IMPORTER
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Modifier' : 'Ajouter'} un client</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du client
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particulier">Particulier</SelectItem>
                      <SelectItem value="entreprise">Entreprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom {formData.type === 'entreprise' ? '(Raison sociale)' : ''} *</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      placeholder={formData.type === 'entreprise' ? 'Nom de l\'entreprise' : 'Nom'}
                      required
                    />
                  </div>
                  
                  {formData.type === 'particulier' && (
                    <div className="space-y-2">
                      <Label htmlFor="prenom">Prénom</Label>
                      <Input
                        id="prenom"
                        value={formData.prenom || ''}
                        onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                        placeholder="Prénom"
                      />
                    </div>
                  )}

                  {formData.type === 'particulier' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="cin">CIN</Label>
                        <Input
                          id="cin"
                          value={formData.cin || ''}
                          onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                          placeholder="BE123456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="permis">Permis de conduire</Label>
                        <Input
                          id="permis"
                          value={formData.permis_conduire || ''}
                          onChange={(e) => setFormData({ ...formData, permis_conduire: e.target.value })}
                          placeholder="P123456"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemple.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone *</Label>
                    <Input
                      id="telephone"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      placeholder="+212 6 12 34 56 78"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input
                    id="adresse"
                    value={formData.adresse || ''}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    placeholder="Adresse complète"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-4 text-sm font-medium">
            <button className="text-primary border-b-2 border-primary pb-2">
              TOUS ({clients.length})
            </button>
            <button className="text-muted-foreground hover:text-foreground pb-2">
              PARTICULIERS ({clients.filter(c => c.type === 'particulier').length})
            </button>
            <button className="text-muted-foreground hover:text-foreground pb-2">
              ENTREPRISES ({clients.filter(c => c.type === 'entreprise').length})
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : clients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun client. Cliquez sur "Nouveau client" pour commencer.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 pl-4 font-medium">Actions</th>
                    <th className="pb-3 font-medium">Nom / Entreprise</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">CIN / Permis</th>
                    <th className="pb-3 font-medium">Téléphone</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Adresse</th>
                    <th className="pb-3 font-medium">Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-4 pl-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(client)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs font-medium">{client.nom.charAt(0)}</span>
                          </div>
                          <div className="font-medium text-foreground">
                            {client.nom} {client.prenom}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant="outline" className={client.type === 'particulier' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-0' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 border-0'}>
                          {client.type === 'particulier' ? 'Particulier' : 'Entreprise'}
                        </Badge>
                      </td>
                      <td className="py-4 text-foreground text-sm">
                        {client.cin && <div>CIN: {client.cin}</div>}
                        {client.permis_conduire && <div>Permis: {client.permis_conduire}</div>}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 text-foreground">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{client.telephone}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        {client.email && (
                          <div className="flex items-center gap-2 text-foreground">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span>{client.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-foreground">{client.adresse || '-'}</td>
                      <td className="py-4 text-foreground text-sm">
                        {new Date(client.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
