import { useState } from "react";
import { Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInventory } from "@/hooks/useInventory";
import { useToast } from "@/hooks/use-toast";
import { InventoryStatsComponent } from "@/components/inventory/InventoryStats";
import { SearchFilters } from "@/components/inventory/SearchFilters";
import { PartsTable } from "@/components/inventory/PartsTable";
import { PartForm } from "@/components/inventory/PartForm";
import { ActivityLogs } from "@/components/inventory/ActivityLogs";
import { Part, PartFormData, Category } from "@/types/inventory";

const Index = () => {
  const {
    parts,
    logs,
    createPart,
    updatePart,
    deletePart,
    adjustStock,
    getStats,
    searchParts,
  } = useInventory();

  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [searchActive, setSearchActive] = useState(false);

  const stats = getStats();

  const handleSearch = (query: string, category?: Category, location?: string) => {
    const results = searchParts(query, category, location);
    setFilteredParts(results);
    setSearchActive(Boolean(query || category || location));
  };

  const handleCreatePart = (formData: PartFormData) => {
    try {
      createPart(formData);
      setShowForm(false);
      toast({
        title: "Pièce créée",
        description: `${formData.name} a été ajoutée à l'inventaire.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la pièce.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePart = (formData: PartFormData) => {
    if (!editingPart) return;
    
    try {
      updatePart(editingPart.id, formData);
      setEditingPart(null);
      setShowForm(false);
      toast({
        title: "Pièce modifiée",
        description: `${formData.name} a été mise à jour.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la pièce.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePart = (id: string) => {
    try {
      deletePart(id);
      toast({
        title: "Pièce supprimée",
        description: "La pièce a été supprimée de l'inventaire.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la pièce.",
        variant: "destructive",
      });
    }
  };

  const handleStockAdjust = (id: string, adjustment: number) => {
    try {
      adjustStock(id, adjustment);
      toast({
        title: "Stock ajusté",
        description: `Stock ${adjustment > 0 ? "augmenté" : "diminué"} de ${Math.abs(adjustment)}.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajuster le stock.",
        variant: "destructive",
      });
    }
  };

  const handleEditPart = (part: Part) => {
    setEditingPart(part);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPart(null);
  };

  const displayedParts = searchActive ? filteredParts : parts;

  if (showForm) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <PartForm
            part={editingPart || undefined}
            onSubmit={editingPart ? handleUpdatePart : handleCreatePart}
            onCancel={handleCancelForm}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-primary rounded-xl text-primary-foreground">
                <Smartphone className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Inventaire Pièces Mobile
              </h1>
            </div>
            <p className="text-muted-foreground">
              Gestion des pièces détachées de téléphones portables
            </p>
          </div>
          
          <Button onClick={() => setShowForm(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Nouvelle pièce
          </Button>
        </div>

        {/* Stats */}
        <InventoryStatsComponent stats={stats} />

        {/* Search & Filters */}
        <SearchFilters onSearch={handleSearch} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Parts Table */}
          <div className="xl:col-span-3">
            <PartsTable
              parts={displayedParts}
              onEdit={handleEditPart}
              onDelete={handleDeletePart}
              onStockAdjust={handleStockAdjust}
            />
          </div>

          {/* Activity Logs */}
          <div className="xl:col-span-1">
            <ActivityLogs logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
