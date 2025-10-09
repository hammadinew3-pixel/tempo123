import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WorkflowStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
  action?: () => void;
  actionLabel?: string;
}

interface ContractWorkflowProps {
  currentStatus: string;
  onStepAction: (step: string) => void;
  canProceed: boolean;
}

export function ContractWorkflow({ currentStatus, onStepAction, canProceed }: ContractWorkflowProps) {
  const getWorkflowSteps = (): WorkflowStep[] => {
    const statusOrder = ['brouillon', 'contrat_valide', 'livre', 'retour_effectue', 'termine'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return [
      {
        id: 'brouillon',
        label: 'Réservation',
        status: currentIndex >= 0 ? 'completed' : 'current',
      },
      {
        id: 'contrat_valide',
        label: 'Contrat',
        status: currentIndex > 0 ? 'completed' : currentIndex === 0 ? 'current' : 'upcoming',
        action: currentIndex === 0 ? () => onStepAction('contrat_valide') : undefined,
        actionLabel: 'Valider le contrat',
      },
      {
        id: 'livre',
        label: 'Livraison',
        status: currentIndex > 1 ? 'completed' : currentIndex === 1 ? 'current' : 'upcoming',
        action: currentIndex === 1 ? () => onStepAction('livre') : undefined,
        actionLabel: 'Enregistrer livraison',
      },
      {
        id: 'actif',
        label: 'En cours',
        status: currentIndex > 2 ? 'completed' : currentIndex === 2 ? 'current' : 'upcoming',
      },
      {
        id: 'retour_effectue',
        label: 'Retour',
        status: currentIndex > 3 ? 'completed' : currentIndex === 2 ? 'current' : 'upcoming',
        action: currentIndex === 2 ? () => onStepAction('retour_effectue') : undefined,
        actionLabel: 'Enregistrer retour',
      },
      {
        id: 'termine',
        label: 'Clôture',
        status: currentIndex >= 4 ? 'completed' : currentIndex === 3 ? 'current' : 'upcoming',
        action: currentIndex === 3 ? () => onStepAction('termine') : undefined,
        actionLabel: 'Clôturer',
      },
    ];
  };

  const steps = getWorkflowSteps();
  const currentStep = steps.find(s => s.status === 'current');

  return (
    <Card className="border-primary/20">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Visual Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center relative">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                      ${step.status === 'completed' 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : step.status === 'current'
                        ? 'bg-primary/10 border-primary text-primary animate-pulse'
                        : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                      }
                    `}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`
                      text-xs mt-2 font-medium text-center whitespace-nowrap
                      ${step.status === 'current' ? 'text-primary' : 'text-muted-foreground'}
                    `}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2">
                    <div
                      className={`
                        h-0.5 w-full transition-all
                        ${step.status === 'completed' 
                          ? 'bg-primary' 
                          : 'bg-muted-foreground/20'
                        }
                      `}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Current Step Action */}
          {currentStep?.action && canProceed && (
            <div className="bg-muted/30 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Étape suivante</p>
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour passer à : {currentStep.actionLabel}
                  </p>
                </div>
                <Button onClick={currentStep.action} size="sm">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {currentStep.actionLabel}
                </Button>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Statut actuel : <span className="font-semibold text-foreground">{currentStep?.label}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}