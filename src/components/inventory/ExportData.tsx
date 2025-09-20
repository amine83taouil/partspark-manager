import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Part } from "@/types/inventory";
import type { StockMovement } from "@/types/company";

interface ExportDataProps {
  parts: Part[];
  movements: StockMovement[];
}

export function ExportData({ parts, movements }: ExportDataProps) {
  const { toast } = useToast();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR');
  };

  const exportPartsToCSV = () => {
    try {
      const headers = [
        'SKU',
        'Nom',
        'Catégorie',
        'Quantité',
        'Coût Unitaire (€)',
        'Emplacement',
        'Fournisseur',
        'Seuil de Réapprovisionnement',
        'Valeur Totale (€)',
        'Notes',
        'Date de Création',
        'Dernière Modification'
      ];

      const csvContent = [
        headers.join(','),
        ...parts.map(part => [
          `"${part.sku}"`,
          `"${part.name}"`,
          `"${part.category}"`,
          part.quantity,
          part.unitCost.toFixed(2),
          `"${part.location}"`,
          `"${part.supplier}"`,
          part.reorderThreshold,
          (part.quantity * part.unitCost).toFixed(2),
          `"${part.notes.replace(/"/g, '""')}"`,
          `"${formatDate(part.createdAt)}"`,
          `"${formatDate(part.updatedAt)}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inventaire_pieces_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export réussi",
        description: "Le fichier CSV des pièces a été téléchargé.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données.",
        variant: "destructive",
      });
    }
  };

  const exportMovementsToCSV = () => {
    try {
      const headers = [
        'Date',
        'Pièce',
        'Type de Mouvement',
        'Quantité',
        'Stock Précédent',
        'Nouveau Stock',
        'Emplacement',
        'Coût Unitaire (€)',
        'Référence',
        'Notes',
        'Utilisateur'
      ];

      const movementTypeLabels = {
        'IN': 'Entrée',
        'OUT': 'Sortie',
        'TRANSFER': 'Transfert',
        'ADJUSTMENT': 'Ajustement'
      };

      const csvContent = [
        headers.join(','),
        ...movements.map(movement => [
          `"${formatDate(movement.createdAt)}"`,
          `"${movement.partName || ''}"`,
          `"${movementTypeLabels[movement.movementType] || movement.movementType}"`,
          movement.quantity,
          movement.previousQuantity,
          movement.newQuantity,
          `"${movement.locationName || ''}"`,
          movement.unitCost.toFixed(2),
          `"${movement.referenceNumber || ''}"`,
          `"${(movement.notes || '').replace(/"/g, '""')}"`,
          `"${movement.userName || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `mouvements_stock_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export réussi",
        description: "Le fichier CSV des mouvements a été téléchargé.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les mouvements.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Export des Données
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Inventaire des Pièces</h4>
              <p className="text-sm text-muted-foreground">
                Exporte toutes les pièces avec leurs détails complets
              </p>
              <Button onClick={exportPartsToCSV} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exporter Pièces (CSV)
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Mouvements de Stock</h4>
              <p className="text-sm text-muted-foreground">
                Exporte l'historique complet des mouvements
              </p>
              <Button onClick={exportMovementsToCSV} className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter Mouvements (CSV)
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p className="font-medium mb-1">📄 Format des fichiers :</p>
            <ul className="space-y-1">
              <li>• Encodage UTF-8 avec BOM pour Excel</li>
              <li>• Compatible avec Excel, LibreOffice, Google Sheets</li>
              <li>• Données au format français (dates, décimales)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
