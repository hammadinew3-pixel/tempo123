import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Plus, Mail, Phone, Edit, Trash2, ChevronDown, Upload, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useLayoutContext } from "@/components/layout/Layout";

type Client = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];

export default function Clients() {
  const navigate = useNavigate();
  const { isClientDialogOpen, setIsClientDialogOpen } = useLayoutContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const [showAllFields, setShowAllFields] = useState(false);
  const [sexe, setSexe] = useState<'homme' | 'femme'>('homme');
  const [clientFiable, setClientFiable] = useState<'nouveau' | 'oui' | 'non'>('nouveau');
  
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

      setIsClientDialogOpen(false);
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
    setSexe('homme');
    setClientFiable('nouveau');
    setShowAllFields(false);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setIsClientDialogOpen(true);
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
          <Dialog open={isClientDialogOpen} onOpenChange={(open) => { setIsClientDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold">
                  {editingClient ? 'Modifier client' : 'Créer client'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type client et Sexe */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">Type client</Label>
                    <RadioGroup
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="particulier" id="particulier" />
                        <Label htmlFor="particulier" className="font-normal cursor-pointer">Particulier</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="entreprise" id="entreprise" />
                        <Label htmlFor="entreprise" className="font-normal cursor-pointer">Entreprise</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.type === 'particulier' && (
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">Sexe</Label>
                      <RadioGroup
                        value={sexe}
                        onValueChange={(value: any) => setSexe(value)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="homme" id="homme" />
                          <Label htmlFor="homme" className="font-normal cursor-pointer">Homme</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="femme" id="femme" />
                          <Label htmlFor="femme" className="font-normal cursor-pointer">Femme</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>

                {/* Prénom et Nom */}
                <div className="grid grid-cols-2 gap-4">
                  {formData.type === 'particulier' && (
                    <div className="space-y-2">
                      <Label htmlFor="prenom">
                        Prénom <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="prenom"
                        value={formData.prenom || ''}
                        onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                        placeholder="Prénom"
                        className="border-input focus:border-primary transition-colors"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="nom">
                      {formData.type === 'entreprise' ? 'Raison sociale' : 'Nom'} <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      placeholder={formData.type === 'entreprise' ? 'Nom de l\'entreprise' : 'Nom'}
                      required
                      className="border-input focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Permis et Téléphone */}
                <div className="grid grid-cols-2 gap-4">
                  {formData.type === 'particulier' && (
                    <div className="space-y-2">
                      <Label htmlFor="permis">N° permis</Label>
                      <Input
                        id="permis"
                        value={formData.permis_conduire || ''}
                        onChange={(e) => setFormData({ ...formData, permis_conduire: e.target.value })}
                        placeholder="N° permis"
                        className="border-input focus:border-primary transition-colors"
                      />
                      <p className="text-xs text-muted-foreground">10/8 chiffres de format xx/xxxxxxxx, exemple: 01/123456</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="telephone">
                      N° Tél <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="telephone"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      placeholder="N° Tél"
                      required
                      className="border-input focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* CIN et Client fiable */}
                <div className="grid grid-cols-2 gap-4">
                  {formData.type === 'particulier' && (
                    <div className="space-y-2">
                      <Label htmlFor="cin">N° CIN</Label>
                      <Input
                        id="cin"
                        value={formData.cin || ''}
                        onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                        placeholder="N° CIN"
                        className="border-input focus:border-primary transition-colors"
                      />
                      <p className="text-xs text-muted-foreground">Exemple: AB123456</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">Client fiable</Label>
                    <RadioGroup
                      value={clientFiable}
                      onValueChange={(value: any) => setClientFiable(value)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nouveau" id="nouveau" />
                        <Label htmlFor="nouveau" className="font-normal cursor-pointer">Nouveau</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="oui" id="oui" />
                        <Label htmlFor="oui" className="font-normal cursor-pointer">Oui</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="non" id="non" />
                        <Label htmlFor="non" className="font-normal cursor-pointer">Non</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Dates permis */}
                {formData.type === 'particulier' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date-delivrance">Date délivrance permis</Label>
                      <div className="relative">
                        <Input
                          id="date-delivrance"
                          type="date"
                          className="border-input focus:border-primary transition-colors"
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date-expiration">Date expiration permis</Label>
                      <div className="relative">
                        <Input
                          id="date-expiration"
                          type="date"
                          className="border-input focus:border-primary transition-colors"
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Collapsible pour champs additionnels */}
                <Collapsible open={showAllFields} onOpenChange={setShowAllFields}>
                  <CollapsibleTrigger className="flex items-center justify-center w-full py-2 text-primary hover:text-primary/80 transition-colors">
                    <span className="text-sm font-medium uppercase tracking-wide">
                      {showAllFields ? 'Afficher moins de champs' : 'Afficher tous les champs'}
                    </span>
                    <ChevronDown className={`ml-2 w-4 h-4 transition-transform ${showAllFields ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-4">
                    <p className="text-xs text-muted-foreground text-center -mt-2">
                      Pièces jointes, N° passport, Email, Identifiant Fiscal, ...
                    </p>

                    {/* Passport et Date de naissance */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="passport">N° Passport</Label>
                        <Input
                          id="passport"
                          placeholder="N° Passport"
                          className="border-input focus:border-primary transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date-naissance">Date de naissance</Label>
                        <div className="relative">
                          <Input
                            id="date-naissance"
                            type="date"
                            className="border-input focus:border-primary transition-colors"
                          />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Email et Adresse */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="E-mail"
                          className="border-input focus:border-primary transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adresse">Adresse</Label>
                        <Input
                          id="adresse"
                          value={formData.adresse || ''}
                          onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                          placeholder="Adresse"
                          className="border-input focus:border-primary transition-colors"
                        />
                      </div>
                    </div>

                    {/* Remarques */}
                    <div className="space-y-2">
                      <Label htmlFor="remarques">Diverses remarques personnelles</Label>
                      <Textarea
                        id="remarques"
                        placeholder="Diverses remarques personnelles"
                        className="border-input focus:border-primary transition-colors min-h-[80px]"
                      />
                    </div>

                    {/* File upload area */}
                    <div className="space-y-2">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Glisser-déposer, ou <span className="text-primary">explorer</span> votre fichiers.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => { setIsClientDialogOpen(false); resetForm(); }}
                    className="uppercase text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="uppercase"
                  >
                    {loading ? 'Enregistrement...' : 'Ajouter'}
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
                            onClick={() => navigate(`/clients/${client.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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
                        <Badge variant="outline" className={client.type === 'particulier' ? 'bg-primary/10 text-primary border-0' : 'bg-secondary/10 text-secondary border-0'}>
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
