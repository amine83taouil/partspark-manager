import { useState } from "react";
import { Plus, Minus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Part } from "@/types/inventory";

interface PartsTableProps {
  parts: Part[];
  onEdit: (part: Part) => void;
  onDelete: (id: string) => void;
  onStockAdjust: (id: string, adjustment: number) => void;
}

export function PartsTable({ parts, onEdit, onDelete, onStockAdjust }: PartsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      "Batterie": "bg-blue-100 text-blue-800",
      "Écran complet": "bg-purple-100 text-purple-800",
      "Caméra": "bg-green-100 text-green-800",
      "Châssis": "bg-orange-100 text-orange-800",
      "Connecteur de charge": "bg-yellow-100 text-yellow-800",
      "Nappe": "bg-pink-100 text-pink-800",
      "Vitre arrière": "bg-indigo-100 text-indigo-800",
      "Adhésif": "bg-gray-100 text-gray-800",
      "Antenne": "bg-red-100 text-red-800",
      "Écouteur interne": "bg-teal-100 text-teal-800",
      "Haut-parleur": "bg-cyan-100 text-cyan-800",
      "Lentille caméra": "bg-emerald-100 text-emerald-800",
      "Tiroir SIM": "bg-violet-100 text-violet-800",
      "Vibreur": "bg-amber-100 text-amber-800",
      "Visserie": "bg-slate-100 text-slate-800",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (parts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium">Aucune pièce trouvée</p>
            <p className="text-sm">Commencez par ajouter des pièces à votre inventaire</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventaire des pièces ({parts.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead className="text-right">Prix unitaire</TableHead>
                <TableHead className="text-right">Valeur totale</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((part) => {
                const isLowStock = part.quantity <= part.reorderThreshold;
                const totalValue = part.quantity * part.unitCost;

                return (
                  <TableRow key={part.id} className={cn(
                    "group hover:bg-accent/50 transition-colors",
                    isLowStock && "bg-destructive/5 border-l-2 border-l-destructive"
                  )}>
                    <TableCell className="font-mono text-sm">
                      {part.sku}
                    </TableCell>
                    
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {part.name}
                        {isLowStock && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      {part.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                          {part.notes}
                        </p>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="secondary" className={getCategoryColor(part.category)}>
                        {part.category}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => onStockAdjust(part.id, -1)}
                          disabled={part.quantity === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className={cn(
                          "min-w-[3rem] text-center font-semibold",
                          isLowStock && "text-destructive"
                        )}>
                          {part.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => onStockAdjust(part.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      {isLowStock && (
                        <div className="text-xs text-destructive mt-1">
                          Seuil: {part.reorderThreshold}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-sm">
                      {part.location}
                    </TableCell>
                    
                    <TableCell className="text-sm">
                      {part.supplier}
                    </TableCell>
                    
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(part.unitCost)}
                    </TableCell>
                    
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(totalValue)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                          onClick={() => onEdit(part)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer la pièce</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer "{part.name}" (SKU: {part.sku}) ?
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(part.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
