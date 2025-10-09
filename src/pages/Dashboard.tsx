import { Car, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="w-full">
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">VÉHICULES</p>
                  <p className="text-3xl font-bold text-foreground">01</p>
                </div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Car className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">RÉSERVATIONS</p>
                  <p className="text-3xl font-bold text-foreground">01</p>
                </div>
                <div className="w-16 h-16 bg-[hsl(var(--chart-2))] bg-opacity-10 rounded-full flex items-center justify-center">
                  <Calendar className="w-8 h-8" style={{ color: "hsl(var(--chart-2))" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">CLIENTS</p>
                  <p className="text-3xl font-bold text-foreground">01</p>
                </div>
                <div className="w-16 h-16 bg-[hsl(var(--chart-3))] bg-opacity-10 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8" style={{ color: "hsl(var(--chart-3))" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[hsl(var(--warning)/0.1)] border-[hsl(var(--warning)/0.3)]">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-[hsl(var(--warning)/0.2)] rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: "hsl(var(--warning))" }}>03</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold" style={{ color: "hsl(var(--warning))" }}>Alerts</h3>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--success))" }}></span>
                        <span className="text-sm text-foreground">00 Alertes chèques</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--success))" }}></span>
                        <span className="text-sm text-foreground">00 Alertes réservations</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--warning))" }}></span>
                        <span className="text-sm text-foreground">03 Alertes véhicules</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Departures - Returns Section */}
            <Card>
              <CardHeader>
                <CardTitle>Départs - Récupérations</CardTitle>
                <CardDescription>Vos départs et retours prévus pour aujourd'hui</CardDescription>
                <div className="flex space-x-8 mt-4">
                  <button className="text-primary border-b-2 border-primary pb-2">
                    <span className="text-sm font-medium">00 Départs</span>
                  </button>
                  <button className="text-muted-foreground pb-2 hover:text-foreground">
                    <span className="text-sm font-medium">00 Récupérations</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-muted-foreground border-b">
                        <th className="pb-3 font-medium">Rés. N°</th>
                        <th className="pb-3 font-medium">Véhicule</th>
                        <th className="pb-3 font-medium">Locataire</th>
                        <th className="pb-3 font-medium">Heure de départ</th>
                        <th className="pb-3 font-medium">Date retour</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-4">
                              <Calendar className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">Aucun résultat</p>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fleet Status */}
          <Card>
            <CardHeader>
              <CardTitle>État du parc</CardTitle>
              <CardDescription>État d'aujourd'hui</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="hsl(var(--border))" strokeWidth="8" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="hsl(var(--info))"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray="251.2"
                      strokeDashoffset="0"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-foreground">1</p>
                      <p className="text-sm text-muted-foreground">Véhicule</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--info))" }}></span>
                    <span className="text-sm text-foreground">Disponibles</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-muted"></span>
                    <span className="text-sm text-foreground">En location</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--warning))" }}></span>
                    <span className="text-sm text-foreground">En maintenance</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
