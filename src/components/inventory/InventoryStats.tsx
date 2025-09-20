import { Package, AlertTriangle, DollarSign, Archive } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { InventoryStats } from "@/types/inventory";

interface InventoryStatsProps {
  stats: InventoryStats;
}

export function InventoryStatsComponent({ stats }: InventoryStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Total des pièces"
        value={stats.totalParts}
        subtitle="références en stock"
        icon={<Package className="h-6 w-6" />}
      />
      
      <StatsCard
        title="Stock faible"
        value={stats.lowStockItems}
        subtitle="pièces à réapprovisionner"
        variant={stats.lowStockItems > 0 ? "danger" : "success"}
        icon={<AlertTriangle className="h-6 w-6" />}
      />
      
      <StatsCard
        title="Valeur totale"
        value={formatCurrency(stats.totalValue)}
        subtitle="inventaire valorisé"
        icon={<DollarSign className="h-6 w-6" />}
        variant="success"
      />
      
      <StatsCard
        title="Catégories"
        value={Object.keys(stats.categoryBreakdown).length}
        subtitle="types de pièces"
        icon={<Archive className="h-6 w-6" />}
      />
    </div>
  );
}
