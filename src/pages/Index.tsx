import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PartsTable } from "@/components/inventory/PartsTable";
import { InventoryStatsComponent } from "@/components/inventory/InventoryStats";
import { SearchFilters } from "@/components/inventory/SearchFilters";
import { ActivityLogs } from "@/components/inventory/ActivityLogs";
import { PartForm } from "@/components/inventory/PartForm";
import { useInventory } from "@/hooks/useInventory";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Part, PartFormData, Category } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, LogOut, Shield, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { user, logout, isAuthenticated, loading, isAdmin } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [locationFilter, setLocationFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const {
    parts,
    activityLogs,
    loading: inventoryLoading,
    addPart,
    updatePart,
    deletePart,
    adjustStock,
  } = useInventory(user?.id);

  const handleSearch = (query: string, category?: Category, location?: string) => {
    setSearchQuery(query);
    setSelectedCategory(category);
    setLocationFilter(location || "");
  };

  const filteredParts = parts.filter((part) => {
    const matchesSearch = !searchQuery || 
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || part.category === selectedCategory;
    const matchesLocation = !locationFilter || part.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const stats = {
    totalParts: parts.length,
    lowStockItems: parts.filter(part => part.quantity <= part.reorderThreshold).length,
    totalValue: parts.reduce((sum, part) => sum + (part.quantity * part.unitCost), 0),
    categoryBreakdown: parts.reduce((acc, part) => {
      acc[part.category] = (acc[part.category] || 0) + part.quantity;
      return acc;
    }, {} as Record<Category, number>),
  };

  const handleFormSubmit = async (data: PartFormData) => {
    try {
      if (editingPart) {
        await updatePart(editingPart.id, data);
        toast({
          title: "Pièce modifiée",
          description: `${data.name} a été mise à jour avec succès.`,
        });
      } else {
        await addPart(data);
        toast({
          title: "Pièce ajoutée",
          description: `${data.name} a été ajoutée à l'inventaire.`,
        });
      }
      setIsDialogOpen(false);
      setEditingPart(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePart(id);
      toast({
        title: "Pièce supprimée",
        description: "La pièce a été supprimée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la pièce.",
        variant: "destructive",
      });
    }
  };

  const handleStockAdjust = async (id: string, adjustment: number) => {
    try {
      await adjustStock(id, adjustment);
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

  if (loading || inventoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gestion d'Inventaire</h1>
              <p className="text-muted-foreground">Gérez vos pièces et composants efficacement</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                    {user?.role === 'admin' ? (
                      <>
                        <Shield className="mr-1 h-3 w-3" />
                        Admin
                      </>
                    ) : (
                      <>
                        <User className="mr-1 h-3 w-3" />
                        Opérateur
                      </>
                    )}
                  </Badge>
                  <span className="text-sm font-medium">{user?.full_name}</span>
                </div>
              </Card>
              
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/admin')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Administration
                  </Button>
                )}
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nouvelle Pièce
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingPart ? "Modifier la pièce" : "Nouvelle pièce"}
                      </DialogTitle>
                    </DialogHeader>
                    <PartForm
                      part={editingPart}
                      onSubmit={handleFormSubmit}
                      onCancel={() => {
                        setIsDialogOpen(false);
                        setEditingPart(null);
                      }}
                    />
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="outline"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>

          <InventoryStatsComponent stats={stats} />
          
          <SearchFilters onSearch={handleSearch} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PartsTable 
              parts={filteredParts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStockAdjust={handleStockAdjust}
            />
          </div>
          
          <div>
            <ActivityLogs logs={activityLogs} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;