import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuditTimeline } from '@/components/audit/AuditTimeline';
import { TABLE_LABELS, ACTION_LABELS } from '@/types/audit';
import { History, Filter, X } from 'lucide-react';

export default function Historique() {
  const [filters, setFilters] = useState({
    tableName: '',
    action: '',
    startDate: '',
    endDate: '',
  });

  const resetFilters = () => {
    setFilters({
      tableName: '',
      action: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters = filters.tableName || filters.action || filters.startDate || filters.endDate;

  return (
    <div className="space-y-6 p-3 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <History className="w-5 h-5 md:w-6 md:h-6" />
            Historique des modifications
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Suivez toutes les modifications apportées à vos données
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="table">Table</Label>
              <Select value={filters.tableName} onValueChange={(value) => setFilters({ ...filters, tableName: value })}>
                <SelectTrigger id="table">
                  <SelectValue placeholder="Toutes les tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Toutes les tables</SelectItem>
                  {Object.entries(TABLE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Type d'action</Label>
              <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
                <SelectTrigger id="action">
                  <SelectValue placeholder="Toutes les actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Toutes les actions</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Date début</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Date fin</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chronologie des modifications</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditTimeline 
            tableName={filters.tableName || undefined}
            action={filters.action || undefined}
            startDate={filters.startDate || undefined}
            endDate={filters.endDate || undefined}
            limit={50}
          />
        </CardContent>
      </Card>
    </div>
  );
}
