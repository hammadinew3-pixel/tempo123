import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Eye, Edit, Trash2, AlertTriangle, CheckCircle2, Clock, Download, Columns, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { exportToExcel, exportToCSV } from "@/lib/exportUtils";
import { useRealtime } from "@/hooks/use-realtime";
import { useUserRole } from "@/hooks/use-user-role";

export default function Infractions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [infractions, setInfractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("tous");
  const [filterStatut, setFilterStatut] = useState<string>("tous");
  const [visibleColumns, setVisibleColumns] = useState({
    reference: true,
    date: true,
    vehicule: true,
    client: true,
    type: true,
    montant: true,
    statut: true,
  });

  useEffect(() => {
    loadInfractions();
  }, []);

  const loadInfractions = async () => {
    try {
      const { data, error } = await supabase
        .from("infractions")
        .select(`
          *,
          vehicles (immatriculation, marque, modele),
          clients (nom, prenom, telephone),
          contracts (numero_contrat)
        `)
        .order("date_infraction", { ascending: false });

      if (error) throw error;
      setInfractions(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useRealtime({
    table: 'infractions',
    event: '*',
    onInsert: () => loadInfractions(),
    onUpdate: () => loadInfractions(),
    onDelete: () => loadInfractions(),
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette infraction ?")) return;

    try {
      const { error } = await supabase.from("infractions").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Infraction supprimée",
      });

      loadInfractions();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      exces_vitesse: "Excès de vitesse",
      stationnement: "Stationnement",
      feu_rouge: "Feu rouge",
      telephone: "Téléphone",
      autre: "Autre",
    };
    return labels[type] || type;
  };

  const getStatutBadge = (statut: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      nouveau: { label: "Nouveau", className: "bg-red-500 text-white" },
      transmis: { label: "Transmis au client", className: "bg-orange-500 text-white" },
      clos: { label: "Clos", className: "bg-green-500 text-white" },
    };
    const badge = badges[statut] || badges.nouveau;
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const filteredInfractions = infractions.filter((infraction) => {
    const matchSearch =
      searchTerm === "" ||
      infraction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      infraction.lieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      infraction.vehicles?.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${infraction.clients?.nom || ""} ${infraction.clients?.prenom || ""}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = filterType === "tous" || infraction.type_infraction === filterType;
    const matchStatut = filterStatut === "tous" || infraction.statut_traitement === filterStatut;

    return matchSearch && matchType && matchStatut;
  });

  const stats = {
    total: infractions.length,
    nouveau: infractions.filter((i) => i.statut_traitement === "nouveau").length,
    transmis: infractions.filter((i) => i.statut_traitement === "transmis").length,
    clos: infractions.filter((i) => i.statut_traitement === "clos").length,
  };

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const prepareInfractionsExport = () => {
    return filteredInfractions.map(i => ({
      'Référence': i.reference,
      'Date': format(new Date(i.date_infraction), 'dd/MM/yyyy', { locale: fr }),
      'Véhicule': i.vehicles ? `${i.vehicles.marque} ${i.vehicles.modele} (${i.vehicles.immatriculation})` : '-',
      'Client': i.clients ? `${i.clients.nom} ${i.clients.prenom}`.trim() : '-',
      'Type': getTypeLabel(i.type_infraction),
      'Lieu': i.lieu,
      'Montant (DH)': i.montant,
      'Statut': i.statut_traitement === 'nouveau' ? 'Nouveau' : i.statut_traitement === 'transmis' ? 'Transmis' : 'Clos',
      'Créé le': format(new Date(i.created_at), 'dd/MM/yyyy', { locale: fr })
    }));
  };

  const handleExport = (exportFormat: 'excel' | 'csv') => {
    const data = prepareInfractionsExport();
    const filename = `infractions_${format(new Date(), 'yyyy-MM-dd')}`;
    
    if (exportFormat === 'excel') {
      exportToExcel(data, filename);
    } else {
      exportToCSV(data, filename);
    }
    
    toast({
      title: 'Export réussi',
      description: `${filteredInfractions.length} infraction(s) exportée(s) en ${exportFormat.toUpperCase()}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Infractions</h1>
          <p className="text-muted-foreground">Gestion des contraventions</p>
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
                  {Object.entries(visibleColumns).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`col-${key}`}
                        checked={value}
                        onCheckedChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                      />
                      <label htmlFor={`col-${key}`} className="text-sm cursor-pointer capitalize">
                        {key === 'reference' ? 'Référence' : key === 'date' ? 'Date' : key === 'vehicule' ? 'Véhicule' : key === 'client' ? 'Client' : key === 'type' ? 'Type' : key === 'montant' ? 'Montant' : 'Statut'}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
          <Button onClick={() => navigate("/infractions/nouveau")} className="gap-2">
            <Plus className="w-4 h-4" />
            NOUVELLE INFRACTION
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <AlertTriangle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-500/10">
                <Clock className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nouveaux</p>
                <p className="text-2xl font-bold text-red-500">{stats.nouveau}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transmis</p>
                <p className="text-2xl font-bold text-orange-500">{stats.transmis}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clos</p>
                <p className="text-2xl font-bold text-green-500">{stats.clos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Type d'infraction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="exces_vitesse">Excès de vitesse</SelectItem>
                <SelectItem value="stationnement">Stationnement</SelectItem>
                <SelectItem value="feu_rouge">Feu rouge</SelectItem>
                <SelectItem value="telephone">Téléphone</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="nouveau">Nouveau</SelectItem>
                <SelectItem value="transmis">Transmis au client</SelectItem>
                <SelectItem value="clos">Clos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des infractions ({filteredInfractions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInfractions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune infraction trouvée
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInfractions.map((infraction) => (
                    <TableRow key={infraction.id}>
                      <TableCell className="font-medium">{infraction.reference}</TableCell>
                      <TableCell>
                        {format(new Date(infraction.date_infraction), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {infraction.vehicles?.marque} {infraction.vehicles?.modele}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {infraction.vehicles?.immatriculation}
                        </span>
                      </TableCell>
                      <TableCell>
                        {infraction.clients?.nom} {infraction.clients?.prenom}
                      </TableCell>
                      <TableCell>{getTypeLabel(infraction.type_infraction)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {infraction.montant.toFixed(2)} DH
                      </TableCell>
                      <TableCell>{getStatutBadge(infraction.statut_traitement)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/infractions/${infraction.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/infractions/${infraction.id}/modifier`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(infraction.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
