import { useState } from "react";
import { Clock, Package, Edit, Trash2, Plus, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityLog } from "@/types/inventory";

interface ActivityLogsProps {
  logs: ActivityLog[];
  className?: string;
}

export function ActivityLogs({ logs, className }: ActivityLogsProps) {
  const [showAll, setShowAll] = useState(false);
  const displayedLogs = showAll ? logs : logs.slice(0, 10);

  const getActionIcon = (action: ActivityLog['action']) => {
    const icons = {
      CREATE: <Package className="h-4 w-4" />,
      UPDATE: <Edit className="h-4 w-4" />,
      DELETE: <Trash2 className="h-4 w-4" />,
      STOCK_ADJUST: <Plus className="h-4 w-4" />,
    };
    return icons[action];
  };

  const getActionColor = (action: ActivityLog['action']) => {
    const colors = {
      CREATE: "bg-success/10 text-success border-success/20",
      UPDATE: "bg-primary/10 text-primary border-primary/20", 
      DELETE: "bg-destructive/10 text-destructive border-destructive/20",
      STOCK_ADJUST: "bg-warning/10 text-warning border-warning/20",
    };
    return colors[action];
  };

  const getActionLabel = (action: ActivityLog['action']) => {
    const labels = {
      CREATE: "Création",
      UPDATE: "Modification",
      DELETE: "Suppression",
      STOCK_ADJUST: "Ajustement stock",
    };
    return labels[action];
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (logs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Journal d'activité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Aucune activité enregistrée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Journal d'activité ({logs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {displayedLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className={`p-2 rounded-full border ${getActionColor(log.action)}`}>
                {getActionIcon(log.action)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {getActionLabel(log.action)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(log.timestamp)}
                  </span>
                </div>
                
                <p className="font-medium text-sm text-foreground">
                  {log.partName}
                </p>
                
                <p className="text-sm text-muted-foreground mt-1">
                  {log.details}
                </p>
                
                {log.userName && (
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    Par: {log.userName}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {logs.length > 10 && (
          <div className="text-center pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Afficher moins" : `Voir tout (${logs.length})`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
