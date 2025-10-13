import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const OfflineSyncButton = () => {
  const { isOnline, pendingOperations, isSyncing, syncOperations } = useOfflineSync();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-8 w-8 md:h-10 md:w-10"
              onClick={syncOperations}
              disabled={!isOnline || isSyncing || pendingOperations === 0}
            >
              {isOnline ? (
                isSyncing ? (
                  <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4 md:w-5 md:h-5" />
                )
              ) : (
                <CloudOff className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </Button>
            {pendingOperations > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1 text-xs"
              >
                {pendingOperations}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isOnline 
              ? pendingOperations > 0
                ? `${pendingOperations} opération(s) en attente - Cliquer pour synchroniser`
                : 'En ligne - Données synchronisées'
              : 'Hors ligne - Les modifications seront synchronisées plus tard'
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
