import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIES, Part, PartFormData } from "@/types/inventory";

interface PartFormProps {
  part?: Part;
  onSubmit: (data: PartFormData) => void;
  onCancel: () => void;
}

export function PartForm({ part, onSubmit, onCancel }: PartFormProps) {
  const [formData, setFormData] = useState<PartFormData>({
    sku: "",
    name: "",
    category: "Batterie",
    quantity: 0,
    location: "",
    supplier: "",
    unitCost: 0,
    reorderThreshold: 5,
    notes: "",
  });

  const [errors, setErrors] = useState<Partial<PartFormData>>({});

  useEffect(() => {
    if (part) {
      setFormData({
        sku: part.sku,
        name: part.name,
        category: part.category,
        quantity: part.quantity,
        location: part.location,
        supplier: part.supplier,
        unitCost: part.unitCost,
        reorderThreshold: part.reorderThreshold,
        notes: part.notes,
      });
    }
  }, [part]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PartFormData> = {};

    if (!formData.sku.trim()) newErrors.sku = "SKU requis";
    if (!formData.name.trim()) newErrors.name = "Nom requis";
    if (!formData.location.trim()) newErrors.location = "Localisation requise";
    if (!formData.supplier.trim()) newErrors.supplier = "Fournisseur requis";
    if (formData.quantity < 0) newErrors.quantity = "Quantité invalide" as any;
    if (formData.unitCost < 0) newErrors.unitCost = "Coût invalide" as any;
    if (formData.reorderThreshold < 0) newErrors.reorderThreshold = "Seuil invalide" as any;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateField = (field: keyof PartFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {part ? "Modifier la pièce" : "Nouvelle pièce"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => updateField("sku", e.target.value)}
                className={errors.sku ? "border-destructive" : ""}
              />
              {errors.sku && <p className="text-sm text-destructive mt-1">{errors.sku}</p>}
            </div>

            <div>
              <Label htmlFor="name">Nom de la pièce *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => updateField("category", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => updateField("quantity", parseInt(e.target.value) || 0)}
                className={errors.quantity ? "border-destructive" : ""}
              />
              {errors.quantity && <p className="text-sm text-destructive mt-1">{errors.quantity}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Localisation *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="ex: A1-B3, Étagère 2"
                className={errors.location ? "border-destructive" : ""}
              />
              {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
            </div>

            <div>
              <Label htmlFor="supplier">Fournisseur *</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => updateField("supplier", e.target.value)}
                className={errors.supplier ? "border-destructive" : ""}
              />
              {errors.supplier && <p className="text-sm text-destructive mt-1">{errors.supplier}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unitCost">Coût unitaire (€)</Label>
              <Input
                id="unitCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => updateField("unitCost", parseFloat(e.target.value) || 0)}
                className={errors.unitCost ? "border-destructive" : ""}
              />
              {errors.unitCost && <p className="text-sm text-destructive mt-1">{errors.unitCost}</p>}
            </div>

            <div>
              <Label htmlFor="reorderThreshold">Seuil de réapprovisionnement</Label>
              <Input
                id="reorderThreshold"
                type="number"
                min="0"
                value={formData.reorderThreshold}
                onChange={(e) => updateField("reorderThreshold", parseInt(e.target.value) || 0)}
                className={errors.reorderThreshold ? "border-destructive" : ""}
              />
              {errors.reorderThreshold && <p className="text-sm text-destructive mt-1">{errors.reorderThreshold}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes / Commentaires</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Informations complémentaires..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit">
              {part ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}