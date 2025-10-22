import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Download, Plus, Mail, Phone, Edit, Trash2, ChevronDown, Upload, Calendar, Eye, Columns, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useLayoutContext } from "@/components/layout/Layout";
import { exportToExcel, exportToCSV } from "@/lib/exportUtils";
import { format } from "date-fns";
import { useRealtime } from "@/hooks/use-realtime";

type Client = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];

export default function Clients() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isClientDialogOpen, setIsClientDialogOpen } = useLayoutContext();
  const { isAdmin, isAgent } = useUserRole();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'particulier' | 'entreprise'>('all');
  const [visibleColumns, setVisibleColumns] = useState({
    type: true,
    cinPermis: true,
    telephone: true,
    email: true,
    adresse: true,
    createdAt: true,
  });
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
    sexe: '',
    client_fiable: '',
    passeport: '',
    date_naissance: '',
    date_delivrance_permis: '',
    date_expiration_permis: '',
    centre_delivrance_permis: '',
  });

  const [cinFile, setCinFile] = useState<File | null>(null);
  const [permisFile, setPermisFile] = useState<File | null>(null);

  useEffect(() => {
    loadClients();
    
    // Vérifier si on doit ouvrir le dialogue de modification
    const editId = searchParams.get('edit');
    if (editId) {
      handleEditFromUrl(editId);
    }
  }, [searchParams]);

  // Synchronisation en temps réel avec debounce
  useRealtime<Client>({
    table: 'clients',
    debounceMs: 3000, // 3 secondes de debounce
    onInsert: (payload) => {
      setClients((prev) => [payload, ...prev]);
      toast({
        title: 'Nouveau client',
        description: `${payload.prenom} ${payload.nom} ajouté`,
      });
    },
    onUpdate: (payload) => {
      setClients((prev) =>
        prev.map((c) => (c.id === payload.id ? payload : c))
      );
    },
    onDelete: ({ old }) => {
      setClients((prev) => prev.filter((c) => c.id !== old.id));
      toast({
        title: 'Client supprimé',
        description: `${old.prenom} ${old.nom} a été supprimé`,
      });
    },
  });

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

  const handleEditFromUrl = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      if (data) {
        openEditDialog(data);
        // Supprimer le paramètre de l'URL
        setSearchParams({});
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Client introuvable',
        variant: 'destructive',
      });
      setSearchParams({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation des fichiers obligatoires pour les nouveaux clients
    if (!editingClient && (!cinFile || !permisFile)) {
      toast({
        title: 'Documents requis',
        description: 'Veuillez ajouter la photo de la CIN et du permis avant d\'enregistrer.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let clientData = { 
        ...formData,
      } as Partial<ClientInsert>;

      if (editingClient) {
        // Upload des nouveaux fichiers si fournis
        if (cinFile) {
          const cinPath = `clients/${editingClient.id}/cin_${Date.now()}.${cinFile.name.split('.').pop()}`;
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
          const permisPath = `clients/${editingClient.id}/permis_${Date.now()}.${permisFile.name.split('.').pop()}`;
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
          .eq('id', editingClient.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Client modifié avec succès',
        });
      } else {
        // Vérification anti-doublon CIN (seulement si CIN renseigné)
        if (clientData.cin && clientData.cin.trim() !== '') {
          const { data: existingClient } = await supabase
            .from('clients')
            .select('id, nom, prenom')
            .eq('cin', clientData.cin)
            .maybeSingle();

          if (existingClient) {
            const confirm = window.confirm(
              `Un client avec ce CIN existe déjà dans votre base (${existingClient.prenom} ${existingClient.nom}). Voulez-vous continuer ?`
            );
            if (!confirm) {
              setLoading(false);
              return;
            }
          }
        }

        // Création du client d'abord pour obtenir l'ID
        const { data: newClient, error: insertError } = await supabase
          .from('clients')
          .insert([clientData as ClientInsert])
          .select()
          .single();

        if (insertError) throw insertError;

        // Upload des fichiers avec l'ID du client
        const cinPath = `clients/${newClient.id}/cin_${Date.now()}.${cinFile!.name.split('.').pop()}`;
        const permisPath = `clients/${newClient.id}/permis_${Date.now()}.${permisFile!.name.split('.').pop()}`;

        const [cinUpload, permisUpload] = await Promise.all([
          supabase.storage.from('client-documents').upload(cinPath, cinFile!),
          supabase.storage.from('client-documents').upload(permisPath, permisFile!)
        ]);

        if (cinUpload.error) throw cinUpload.error;
        if (permisUpload.error) throw permisUpload.error;

        const { data: { publicUrl: cinUrl } } = supabase.storage
          .from('client-documents')
          .getPublicUrl(cinPath);
        
        const { data: { publicUrl: permisUrl } } = supabase.storage
          .from('client-documents')
          .getPublicUrl(permisPath);

        // Mise à jour avec les URLs
        const { error: updateError } = await supabase
          .from('clients')
          .update({ cin_url: cinUrl, permis_url: permisUrl })
          .eq('id', newClient.id);

        if (updateError) throw updateError;

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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} client(s) ?`)) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `${selectedIds.size} client(s) supprimé(s)`,
      });

      setSelectedIds(new Set());
      loadClients();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === clients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clients.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
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
    setCinFile(null);
    setPermisFile(null);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setIsClientDialogOpen(true);
  };

  const filteredClients = clients
    .filter((c) => (typeFilter === 'all' ? true : c.type === typeFilter))
    .filter((client) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        client.nom?.toLowerCase().includes(query) ||
        client.prenom?.toLowerCase().includes(query) ||
        client.telephone?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.cin?.toLowerCase().includes(query) ||
        client.permis_conduire?.toLowerCase().includes(query) ||
        client.adresse?.toLowerCase().includes(query)
      );
    });

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const prepareClientsExport = () => {
    return filteredClients.map(c => ({
      'Type': c.type === 'particulier' ? 'Particulier' : 'Entreprise',
      'Prénom': c.prenom || '-',
      'Nom': c.nom,
      'CIN': c.cin || '-',
      'Permis': c.permis_conduire || '-',
      'Téléphone': c.telephone,
      'Email': c.email || '-',
      'Adresse': c.adresse || '-',
      'Créé le': format(new Date(c.created_at), 'dd/MM/yyyy')
    }));
  };

  const handleExport = (exportFormat: 'excel' | 'csv') => {
    const data = prepareClientsExport();
    const filename = `clients_${format(new Date(), 'yyyy-MM-dd')}`;
    
    if (exportFormat === 'excel') {
      exportToExcel(data, filename);
    } else {
      exportToCSV(data, filename);
    }
    
    toast({
      title: 'Export réussi',
      description: `${filteredClients.length} client(s) exporté(s) en ${exportFormat.toUpperCase()}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liste des clients</h1>
          <p className="text-sm text-muted-foreground">Gérez votre base de clients</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="w-4 h-4 mr-2" />
                COLONNES
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Afficher les colonnes</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-type"
                      checked={visibleColumns.type}
                      onCheckedChange={() => toggleColumn('type')}
                    />
                    <label htmlFor="col-type" className="text-sm cursor-pointer">Type</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-cin"
                      checked={visibleColumns.cinPermis}
                      onCheckedChange={() => toggleColumn('cinPermis')}
                    />
                    <label htmlFor="col-cin" className="text-sm cursor-pointer">CIN / Permis</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-tel"
                      checked={visibleColumns.telephone}
                      onCheckedChange={() => toggleColumn('telephone')}
                    />
                    <label htmlFor="col-tel" className="text-sm cursor-pointer">Téléphone</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-email"
                      checked={visibleColumns.email}
                      onCheckedChange={() => toggleColumn('email')}
                    />
                    <label htmlFor="col-email" className="text-sm cursor-pointer">Email</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-adresse"
                      checked={visibleColumns.adresse}
                      onCheckedChange={() => toggleColumn('adresse')}
                    />
                    <label htmlFor="col-adresse" className="text-sm cursor-pointer">Adresse</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-created"
                      checked={visibleColumns.createdAt}
                      onCheckedChange={() => toggleColumn('createdAt')}
                    />
                    <label htmlFor="col-created" className="text-sm cursor-pointer">Créé le</label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            FILTRER
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                EXPORTER
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileText className="w-4 h-4 mr-2" />
                Exporter en Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="w-4 h-4 mr-2" />
                Exporter en CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {(isAdmin || isAgent) && (
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
                      name="client-type"
                      value={formData.type || 'particulier'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'particulier' | 'entreprise' }))}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="particulier" id="type-particulier" />
                        <Label htmlFor="type-particulier" className="font-normal cursor-pointer">Particulier</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="entreprise" id="type-entreprise" />
                        <Label htmlFor="type-entreprise" className="font-normal cursor-pointer">Entreprise</Label>
                      </div>
                    </RadioGroup>
                  </div>

                </div>

                {/* Raison sociale et ICE pour entreprise uniquement */}
                {formData.type === 'entreprise' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="raison-sociale">
                        Raison sociale <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="raison-sociale"
                        value={formData.raison_sociale || ''}
                        onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
                        placeholder="Raison sociale"
                        required
                        className="border-input focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ice">
                        ICE <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="ice"
                        value={formData.ice || ''}
                        onChange={(e) => setFormData({ ...formData, ice: e.target.value })}
                        placeholder="Identifiant Commun de l'Entreprise"
                        required
                        className="border-input focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Prénom et Nom - pour tous les types */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">
                      Prénom <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="prenom"
                      value={formData.prenom || ''}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      placeholder="Prénom"
                      required
                      className="border-input focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom">
                      Nom <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      placeholder="Nom"
                      required
                      className="border-input focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Sexe - pour tous les types */}
                <div className="space-y-2">
                  <Label>
                    Sexe <span className="text-primary">*</span>
                  </Label>
                  <RadioGroup
                    value={formData.sexe || 'homme'}
                    onValueChange={(value) => setFormData({ ...formData, sexe: value })}
                    className="flex gap-6"
                    required
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

                {/* CIN pour tous */}
                <div className="space-y-2">
                  <Label htmlFor="cin">
                    N° CIN <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="cin"
                    value={formData.cin || ''}
                    onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                    placeholder="N° CIN"
                    required
                    className="border-input focus:border-primary transition-colors"
                  />
                  <p className="text-xs text-muted-foreground">Exemple: AB123456</p>
                </div>

                {/* Photo CIN pour tous */}
                <div className="space-y-2">
                  <Label htmlFor="cin-photo">
                    Photo CIN {!editingClient && <span className="text-primary">*</span>}
                  </Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-primary/50 transition-colors">
                    <label htmlFor="cin-photo" className="cursor-pointer block">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Upload className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {cinFile ? cinFile.name : "Ajouter la photo de la CIN"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Format: JPG, PNG, PDF (max 5MB)
                          </p>
                        </div>
                      </div>
                      <input
                        id="cin-photo"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setCinFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Permis pour tous */}
                <div className="space-y-2">
                  <Label htmlFor="permis">
                    N° permis <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="permis"
                    value={formData.permis_conduire || ''}
                    onChange={(e) => setFormData({ ...formData, permis_conduire: e.target.value })}
                    placeholder="N° permis"
                    required
                    className="border-input focus:border-primary transition-colors"
                  />
                  <p className="text-xs text-muted-foreground">10/8 chiffres de format xx/xxxxxxxx, exemple: 01/123456</p>
                </div>

                {/* Photo Permis pour tous */}
                <div className="space-y-2">
                  <Label htmlFor="permis-photo">
                    Photo permis de conduire {!editingClient && <span className="text-primary">*</span>}
                  </Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-primary/50 transition-colors">
                    <label htmlFor="permis-photo" className="cursor-pointer block">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Upload className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {permisFile ? permisFile.name : "Ajouter la photo du permis"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Format: JPG, PNG, PDF (max 5MB)
                          </p>
                        </div>
                      </div>
                      <input
                        id="permis-photo"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setPermisFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Téléphone et Client fiable */}
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">Client fiable</Label>
                    <RadioGroup
                      value={formData.client_fiable || 'nouveau'}
                      onValueChange={(value) => setFormData({ ...formData, client_fiable: value })}
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

                {/* Dates permis pour tous */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date-delivrance">Date délivrance permis</Label>
                    <div className="relative">
                      <Input
                        id="date-delivrance"
                        type="date"
                        value={formData.date_delivrance_permis || ''}
                        onChange={(e) => setFormData({ ...formData, date_delivrance_permis: e.target.value })}
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
                        value={formData.date_expiration_permis || ''}
                        onChange={(e) => setFormData({ ...formData, date_expiration_permis: e.target.value })}
                        className="border-input focus:border-primary transition-colors"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="centre-delivrance">Centre de délivrance permis</Label>
                    <Input
                      id="centre-delivrance"
                      value={formData.centre_delivrance_permis || ''}
                      onChange={(e) => setFormData({ ...formData, centre_delivrance_permis: e.target.value })}
                      placeholder="Centre de délivrance"
                      className="border-input focus:border-primary transition-colors"
                    />
                  </div>
                </div>

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
                          value={formData.passeport || ''}
                          onChange={(e) => setFormData({ ...formData, passeport: e.target.value })}
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
                            value={formData.date_naissance || ''}
                            onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
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
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un client (nom, téléphone, email...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm font-medium">
              <button
                className={`${typeFilter === 'all' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'} pb-2`}
                onClick={() => setTypeFilter('all')}
              >
                TOUS ({clients.length})
              </button>
              <button
                className={`${typeFilter === 'particulier' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'} pb-2`}
                onClick={() => setTypeFilter('particulier')}
              >
                PARTICULIERS ({clients.filter(c => c.type === 'particulier').length})
              </button>
              <button
                className={`${typeFilter === 'entreprise' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'} pb-2`}
                onClick={() => setTypeFilter('entreprise')}
              >
                ENTREPRISES ({clients.filter(c => c.type === 'entreprise').length})
              </button>
            </div>
            {selectedIds.size > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer ({selectedIds.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : filteredClients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? 'Aucun client trouvé pour cette recherche.' : 'Aucun client. Cliquez sur "Nouveau client" pour commencer.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 pl-4 font-medium w-12">
                      <Checkbox 
                        checked={selectedIds.size > 0 && selectedIds.size === clients.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="pb-3 font-medium">Actions</th>
                    <th className="pb-3 font-medium">Nom / Entreprise</th>
                    {visibleColumns.type && <th className="pb-3 font-medium">Type</th>}
                    {visibleColumns.cinPermis && <th className="pb-3 font-medium">CIN / Permis</th>}
                    {visibleColumns.telephone && <th className="pb-3 font-medium">Téléphone</th>}
                    {visibleColumns.email && <th className="pb-3 font-medium">Email</th>}
                    {visibleColumns.adresse && <th className="pb-3 font-medium">Adresse</th>}
                    {visibleColumns.createdAt && <th className="pb-3 font-medium">Créé le</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-4 pl-4">
                        <Checkbox 
                          checked={selectedIds.has(client.id)}
                          onCheckedChange={() => toggleSelect(client.id)}
                        />
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/clients/${client.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(client)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(client.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
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
                      {visibleColumns.type && (
                        <td className="py-4">
                          <Badge variant="outline" className={client.type === 'particulier' ? 'bg-primary/10 text-primary border-0' : 'bg-yellow-400 text-black border-0'}>
                            {client.type === 'particulier' ? 'Particulier' : 'Entreprise'}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.cinPermis && (
                        <td className="py-4 text-foreground text-sm">
                          {client.cin && <div>CIN: {client.cin}</div>}
                          {client.permis_conduire && <div>Permis: {client.permis_conduire}</div>}
                        </td>
                      )}
                      {visibleColumns.telephone && (
                        <td className="py-4">
                          <div className="flex items-center gap-2 text-foreground">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{client.telephone}</span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.email && (
                        <td className="py-4">
                          {client.email && (
                            <div className="flex items-center gap-2 text-foreground">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span>{client.email}</span>
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.adresse && (
                        <td className="py-4 text-foreground">{client.adresse || '-'}</td>
                      )}
                      {visibleColumns.createdAt && (
                        <td className="py-4 text-foreground text-sm">
                          {new Date(client.created_at).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      )}
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
