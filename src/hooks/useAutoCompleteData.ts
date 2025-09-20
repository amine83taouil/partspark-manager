import { useMemo } from 'react';
import { Part } from '@/types/inventory';

export const useAutoCompleteData = (parts: Part[]) => {
  const { brands, locations, suppliers, names } = useMemo(() => {
    const brandsSet = new Set<string>();
    const locationsSet = new Set<string>();
    const suppliersSet = new Set<string>();
    const namesSet = new Set<string>();

    parts.forEach(part => {
      // Extraire la marque du SKU (format: CAT-BRAND-NUM)
      const brandFromSku = part.sku.split('-')[1];
      if (brandFromSku && brandFromSku.trim()) {
        brandsSet.add(brandFromSku);
      }

      if (part.location && part.location.trim()) {
        locationsSet.add(part.location);
      }

      if (part.supplier && part.supplier.trim()) {
        suppliersSet.add(part.supplier);
      }

      if (part.name && part.name.trim()) {
        namesSet.add(part.name);
      }
    });

    return {
      brands: Array.from(brandsSet).sort(),
      locations: Array.from(locationsSet).sort(),
      suppliers: Array.from(suppliersSet).sort(),
      names: Array.from(namesSet).sort(),
    };
  }, [parts]);

  return { brands, locations, suppliers, names };
};
