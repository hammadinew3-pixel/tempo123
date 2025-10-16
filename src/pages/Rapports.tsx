import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BarChart3, Car, DollarSign, Shield } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import RapportParVoiture from '@/components/rapports/RapportParVoiture';
import RapportEncaissement from '@/components/rapports/RapportEncaissement';
import RapportAssurance from '@/components/rapports/RapportAssurance';

export default function Rapports() {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Rapports Détaillés
          </h1>
          <p className="text-sm text-muted-foreground">
            Analysez vos données avec des rapports complets et exports
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Période du rapport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date début</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date fin</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="vehicles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vehicles">
            <Car className="w-4 h-4 mr-2" />
            Par Voiture
          </TabsTrigger>
          <TabsTrigger value="encaissement">
            <DollarSign className="w-4 h-4 mr-2" />
            Encaissement
          </TabsTrigger>
          <TabsTrigger value="assurance">
            <Shield className="w-4 h-4 mr-2" />
            Assurance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-4">
          <RapportParVoiture dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="encaissement" className="space-y-4">
          <RapportEncaissement dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="assurance" className="space-y-4">
          <RapportAssurance dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
