import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Alert {
  message: string;
  action: string;
}

interface AlertsCardProps {
  alerts: Alert[];
}

export function AlertsCard({ alerts }: AlertsCardProps) {
  if (alerts.length === 0) return null;

  return (
    <Collapsible defaultOpen>
      <Card className="border-orange-200 bg-orange-50/50 animate-fade-in">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex flex-row items-center justify-between hover:bg-orange-100/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="bg-orange-200 p-2 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-700" />
              </div>
              <CardTitle className="text-base text-orange-900">
                {alerts.length} alerte{alerts.length > 1 ? 's' : ''} détectée{alerts.length > 1 ? 's' : ''}
              </CardTitle>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-2 pt-0">
            {alerts.map((alert, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg hover:shadow-md transition-all animate-fade-in hover-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span className="text-sm text-orange-900">{alert.message}</span>
                </div>
                <Button 
                  variant="link" 
                  className="text-orange-700 text-xs h-auto p-0 hover:text-orange-900"
                >
                  {alert.action} →
                </Button>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
