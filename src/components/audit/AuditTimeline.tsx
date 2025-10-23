import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { AuditLog, ACTION_LABELS, ACTION_COLORS } from '@/types/audit';
import { FileEdit, Plus, Trash2 } from 'lucide-react';

interface AuditTimelineProps {
  tableName?: string;
  recordId?: string;
  limit?: number;
}

export function AuditTimeline({ tableName, recordId, limit = 20 }: AuditTimelineProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [tableName, recordId]);

  const loadLogs = async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (tableName) {
        query = query.eq('table_name', tableName);
      }
      if (recordId) {
        query = query.eq('record_id', recordId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setLogs((data as AuditLog[]) || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Plus className="w-4 h-4" />;
      case 'UPDATE':
        return <FileEdit className="w-4 h-4" />;
      case 'DELETE':
        return <Trash2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const renderFieldChange = (field: string, oldValue: any, newValue: any) => {
    // Format field name for display
    const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
      <div key={field} className="flex gap-4 py-2 text-sm">
        <span className="font-medium text-muted-foreground min-w-[120px]">{fieldLabel}:</span>
        <div className="flex-1 flex items-center gap-2">
          <span className="text-destructive line-through">{oldValue?.toString() || 'N/A'}</span>
          <span>→</span>
          <span className="text-primary font-medium">{newValue?.toString() || 'N/A'}</span>
        </div>
      </div>
    );
  };

  const renderRecordDetails = (data: any, tableName: string) => {
    if (!data) return null;

    // Champs importants par table
    const importantFields: Record<string, string[]> = {
      contracts: ['numero_contrat', 'date_debut', 'date_fin', 'total_amount', 'statut'],
      clients: ['nom', 'prenom', 'telephone', 'email', 'cin'],
      vehicles: ['immatriculation', 'marque', 'modele', 'annee'],
      assistance: ['num_dossier', 'date_debut', 'date_fin', 'montant_total', 'etat'],
      infractions: ['reference', 'date_infraction', 'montant', 'type_infraction'],
      sinistres: ['reference', 'date_sinistre', 'montant', 'type_sinistre'],
      contract_payments: ['montant', 'date_paiement', 'methode'],
      expenses: ['montant', 'date_depense', 'description', 'type_depense'],
      revenus: ['montant', 'date_encaissement', 'source_revenu'],
    };

    const fields = importantFields[tableName] || Object.keys(data).slice(0, 5);
    
    return (
      <div className="mt-3 space-y-1 border-t pt-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">Détails de l&apos;enregistrement:</p>
        {fields.map((field) => {
          if (data[field] !== undefined && data[field] !== null) {
            const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            let value = data[field];
            
            // Format dates
            if (field.includes('date') && value) {
              try {
                value = format(new Date(value), 'dd/MM/yyyy', { locale: fr });
              } catch {}
            }
            
            // Format montants
            if (field.includes('montant') && !isNaN(value)) {
              value = `${Number(value).toFixed(2)} DH`;
            }

            return (
              <div key={field} className="flex gap-4 py-1 text-sm">
                <span className="font-medium text-muted-foreground min-w-[120px]">{fieldLabel}:</span>
                <span className="flex-1">{value.toString()}</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center text-muted-foreground py-8">Chargement de l'historique...</div>;
  }

  if (logs.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Aucune modification enregistrée</div>;
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-4">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full bg-muted ${ACTION_COLORS[log.action]}`}>
                  {getActionIcon(log.action)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={ACTION_COLORS[log.action]}>
                      {ACTION_LABELS[log.action]}
                    </Badge>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {format(new Date(log.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </Badge>
                  </div>

                  {log.user_email && (
                    <p className="text-sm text-muted-foreground">
                      Par: <span className="font-medium text-foreground">{log.user_email}</span>
                    </p>
                  )}

                  {log.action === 'UPDATE' && log.changed_fields && log.changed_fields.length > 0 && (
                    <div className="mt-3 space-y-1 border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Champs modifiés:</p>
                      {log.changed_fields.map((field) => 
                        renderFieldChange(
                          field,
                          log.old_data?.[field],
                          log.new_data?.[field]
                        )
                      )}
                    </div>
                  )}

                  {log.action === 'INSERT' && log.new_data && (
                    <div>
                      <p className="text-sm text-green-600 mt-2 font-medium">
                        Nouvel enregistrement créé
                      </p>
                      {renderRecordDetails(log.new_data, log.table_name)}
                    </div>
                  )}

                  {log.action === 'DELETE' && log.old_data && (
                    <div>
                      <p className="text-sm text-destructive mt-2 font-medium">
                        Enregistrement supprimé
                      </p>
                      {renderRecordDetails(log.old_data, log.table_name)}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
