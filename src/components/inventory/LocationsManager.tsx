import { useState } from "react";
import { MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Location, LocationFormData } from "@/types/company";

interface LocationsManagerProps {
  locations: Location[];
  onAdd: (data: LocationFormData) => Promise<void>;
  onUpdate: (id: string, data: LocationFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function LocationsManager({ locations, onAdd, onUpdate, onDelete }: LocationsManagerProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<LocationFormData>({
    name: "",
    description: "",
    address: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      address: "",
    });
    setEditingLocation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de l'emplacement est requis.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingLocation) {
        await onUpdate(editingLocation.id, formData);
        toast({
          title: "Emplacement modifié",
          description: `${formData.name} a été mis à jour.`,
        });
      } else {
        await onAdd(formData);
        toast({
          title: "Emplacement ajouté",
          description: `${formData.name} a été créé.`,
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'emplacement.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      description: location.description || "",
      address: location.address || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (location: Location) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${location.name}" ?`)) {
      try {
        await onDelete(location.id);
        toast({
          title: "Emplacement supprimé",
          description: `${location.name} a été supprimé.`,
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'emplacement.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Emplacements
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingLocation ? "Modifier l'emplacement" : "Nouvel emplacement"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Atelier Principal, Entrepôt..."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description de l'emplacement..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Adresse physique..."
                    rows={2}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingLocation ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {locations.map((location) => (
            <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">{location.name}</h4>
                {location.description && (
                  <p className="text-sm text-muted-foreground mt-1">{location.description}</p>
                )}
                {location.address && (
                  <p className="text-xs text-muted-foreground mt-1">{location.address}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(location)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(location)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {locations.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Aucun emplacement configuré
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}