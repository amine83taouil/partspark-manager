import { ArrowUpDown, TrendingUp, TrendingDown, RotateCcw, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StockMovement } from "@/types/company";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface StockMovementsProps {
  movements: StockMovement[];
}

const getMovementIcon = (type: StockMovement['movementType']) => {
  switch (type) {
    case 'IN':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'OUT':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    case 'TRANSFER':
      return <ArrowUpDown className="h-4 w-4 text-blue-500" />;
    case 'ADJUSTMENT':
      return <RotateCcw className="h-4 w-4 text-amber-500" />;
    default:
      return <Package className="h-4 w-4 text-muted-foreground" />;
  }
};

const getMovementBadge = (type: StockMovement['movementType']) => {
  switch (type) {
    case 'IN':
      return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Entrée</Badge>;
    case 'OUT':
      return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Sortie</Badge>;
    case 'TRANSFER':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Transfert</Badge>;
    case 'ADJUSTMENT':
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Ajustement</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export function StockMovements({ movements }: StockMovementsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" />
          Mouvements de Stock
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {movements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun mouvement de stock
              </p>
            ) : (
              movements.map((movement) => (
                <div key={movement.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-1">
                    {getMovementIcon(movement.movementType)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{movement.partName}</span>
                      {getMovementBadge(movement.movementType)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-4">
                        <span>Quantité: <span className="font-medium">{movement.quantity > 0 ? '+' : ''}{movement.quantity}</span></span>
                        <span>Stock: {movement.previousQuantity} → {movement.newQuantity}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span>Emplacement: {movement.locationName}</span>
                        {movement.unitCost > 0 && (
                          <span>Coût: {movement.unitCost.toFixed(2)}€</span>
                        )}
                      </div>
                      
                      {movement.referenceNumber && (
                        <div>Référence: {movement.referenceNumber}</div>
                      )}
                      
                      {movement.notes && (
                        <div className="italic">"{movement.notes}"</div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span>{formatDistanceToNow(movement.createdAt, { addSuffix: true, locale: fr })}</span>
                        {movement.userName && (
                          <span className="text-xs">par {movement.userName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
