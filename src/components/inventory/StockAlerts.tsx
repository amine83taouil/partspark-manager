import { AlertTriangle, Check, X, MapPin, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { StockAlert } from "@/types/company";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface StockAlertsProps {
  alerts: StockAlert[];
  onAcknowledge: (alertId: string) => Promise<void>;
  onResolve: (alertId: string) => Promise<void>;
}

export function StockAlerts({ alerts, onAcknowledge, onResolve }: StockAlertsProps) {
  const { toast } = useToast();

  const handleAcknowledge = async (alertId: string) => {
    try {
      await onAcknowledge(alertId);
      toast({
        title: "Alerte acquittée",
        description: "L'alerte a été marquée comme vue.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'acquitter l'alerte.",
        variant: "destructive",
      });
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await onResolve(alertId);
      toast({
        title: "Alerte résolue",
        description: "L'alerte a été marquée comme résolue.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de résoudre l'alerte.",
        variant: "destructive",
      });
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-green-500" />
            Alertes Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Aucune alerte de stock actuellement 🎉
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertes Stock
          </div>
          <Badge variant="destructive" className="text-xs">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${
              alert.isAcknowledged 
                ? 'border-muted bg-muted/50' 
                : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{alert.partName}</span>
                  <Badge variant="outline" className="text-xs">
                    {alert.partSku}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{alert.locationName}</span>
                  </div>
                  <div>
                    Stock: <span className="font-medium text-destructive">{alert.currentValue}</span>
                  </div>
                  <div>
                    Seuil: <span className="font-medium">{alert.thresholdValue}</span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(alert.createdAt, { addSuffix: true, locale: fr })}
                  {alert.isAcknowledged && (
                    <span className="ml-2 text-green-600">• Acquittée</span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {!alert.isAcknowledged && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAcknowledge(alert.id)}
                    className="h-8 px-2"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResolve(alert.id)}
                  className="h-8 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
