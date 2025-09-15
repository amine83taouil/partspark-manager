import { useState, useEffect, useCallback } from 'react';
import { Part, PartFormData, InventoryStats, ActivityLog, Category } from '@/types/inventory';
import { generateUniqueSku } from '@/utils/skuGenerator';
import { supabase } from '@/integrations/supabase/client';

export function useInventory() {
  const [parts, setParts] = useState<Part[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase on mount
  useEffect(() => {
    loadParts();
    loadLogs();
  }, []);

  const loadParts = async () => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading parts:', error);
        return;
      }

      const transformedParts: Part[] = data.map((part: any) => ({
        id: String(part.id),
        sku: part.sku,
        name: part.name,
        category: part.category,
        quantity: part.quantity,
        location: part.location,
        supplier: part.supplier,
        unitCost: Number(part.unit_cost),
        reorderThreshold: part.reorder_threshold,
        notes: part.notes || '',
        createdAt: new Date(part.created_at),
        updatedAt: new Date(part.updated_at),
      }));

      setParts(transformedParts);
    } catch (error) {
      console.error('Error loading parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading logs:', error);
        return;
      }

      const transformedLogs: ActivityLog[] = data.map((log: any) => ({
        id: String(log.id),
        timestamp: new Date(log.timestamp),
        action: log.action,
        partId: String(log.part_id || ''),
        partName: log.part_name,
        details: log.details,
      }));

      setLogs(transformedLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const addLog = useCallback(async (action: ActivityLog['action'], partId: string, partName: string, details: string) => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert([
          {
            action,
            part_id: partId,
            part_name: partName,
            details,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding log:', error);
        return;
      }

      const newLog: ActivityLog = {
        id: String(data.id),
        timestamp: new Date(data.timestamp),
        action: data.action,
        partId: String(data.part_id || ''),
        partName: data.part_name,
        details: data.details,
      };

      setLogs(prev => [newLog, ...prev].slice(0, 100));
    } catch (error) {
      console.error('Error adding log:', error);
    }
  }, []);

  // Fonction utilitaire pour extraire la marque du SKU
  const extractBrandFromSku = (sku: string): string => {
    const skuParts = sku.split('-');
    return skuParts.length >= 2 ? skuParts[1] : '';
  };

  const createPart = useCallback(async (formData: PartFormData) => {
    try {
      // Générer un SKU unique
      const sku = generateUniqueSku(formData.category, formData.brand, parts);
      
      const { data, error } = await supabase
        .from('parts')
        .insert([
          {
            sku,
            name: formData.name,
            category: formData.category,
            quantity: formData.quantity,
            location: formData.location,
            supplier: formData.supplier,
            unit_cost: formData.unitCost,
            reorder_threshold: formData.reorderThreshold,
            notes: formData.notes,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating part:', error);
        throw error;
      }

      const newPart: Part = {
        id: String(data.id),
        sku: data.sku,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        location: data.location,
        supplier: data.supplier,
        unitCost: Number(data.unit_cost),
        reorderThreshold: data.reorder_threshold,
        notes: data.notes || '',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setParts(prev => [...prev, newPart]);
      await addLog('CREATE', String(newPart.id), newPart.name, `Pièce créée avec SKU: ${sku}`);
      return newPart;
    } catch (error) {
      console.error('Error creating part:', error);
      throw error;
    }
  }, [parts, addLog]);

  const updatePart = useCallback(async (id: string, formData: PartFormData) => {
    try {
      // Régénérer le SKU si la catégorie ou la marque a changé
      const currentPart = parts.find(p => p.id === id);
      let sku = currentPart?.sku || '';
      
      if (currentPart && (
        formData.category !== currentPart.category || 
        formData.brand !== extractBrandFromSku(currentPart.sku)
      )) {
        sku = generateUniqueSku(formData.category, formData.brand, parts.filter(p => p.id !== id));
      }

      const { data, error } = await supabase
        .from('parts')
        .update({
          sku,
          name: formData.name,
          category: formData.category,
          quantity: formData.quantity,
          location: formData.location,
          supplier: formData.supplier,
          unit_cost: formData.unitCost,
          reorder_threshold: formData.reorderThreshold,
          notes: formData.notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating part:', error);
        throw error;
      }

      const updatedPart: Part = {
        id: String(data.id),
        sku: data.sku,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        location: data.location,
        supplier: data.supplier,
        unitCost: Number(data.unit_cost),
        reorderThreshold: data.reorder_threshold,
        notes: data.notes || '',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setParts(prev => prev.map(part => part.id === id ? updatedPart : part));
      await addLog('UPDATE', String(id), updatedPart.name, `Pièce modifiée${sku !== currentPart?.sku ? ` - Nouveau SKU: ${sku}` : ''}`);
    } catch (error) {
      console.error('Error updating part:', error);
      throw error;
    }
  }, [parts, addLog]);

  const deletePart = useCallback(async (id: string) => {
    try {
      const part = parts.find(p => p.id === id);
      if (!part) return;

      const { error } = await supabase
        .from('parts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting part:', error);
        throw error;
      }

      setParts(prev => prev.filter(p => p.id !== id));
      await addLog('DELETE', String(id), part.name, `Pièce supprimée`);
    } catch (error) {
      console.error('Error deleting part:', error);
      throw error;
    }
  }, [parts, addLog]);

  const adjustStock = useCallback(async (id: string, adjustment: number) => {
    try {
      const part = parts.find(p => p.id === id);
      if (!part) return;

      const newQuantity = Math.max(0, part.quantity + adjustment);

      const { data, error } = await supabase
        .from('parts')
        .update({ quantity: newQuantity })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error adjusting stock:', error);
        throw error;
      }

      const updatedPart: Part = {
        ...part,
        quantity: data.quantity,
        updatedAt: new Date(data.updated_at),
      };

      setParts(prev => prev.map(p => p.id === id ? updatedPart : p));
      await addLog(
        'STOCK_ADJUST',
        String(id),
        part.name,
        `Stock ajusté: ${adjustment > 0 ? '+' : ''}${adjustment} (${part.quantity} → ${newQuantity})`
      );
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  }, [parts, addLog]);

  const getStats = useCallback((): InventoryStats => {
    const totalParts = parts.length;
    const lowStockItems = parts.filter(part => part.quantity <= part.reorderThreshold).length;
    const totalValue = parts.reduce((sum, part) => sum + (part.quantity * part.unitCost), 0);
    
    const categoryBreakdown = parts.reduce((acc, part) => {
      acc[part.category] = (acc[part.category] || 0) + part.quantity;
      return acc;
    }, {} as Record<Category, number>);

    return {
      totalParts,
      lowStockItems,
      totalValue,
      categoryBreakdown,
    };
  }, [parts]);

  const searchParts = useCallback((query: string, categoryFilter?: Category, locationFilter?: string) => {
    return parts.filter(part => {
      const matchesQuery = !query || 
        part.name.toLowerCase().includes(query.toLowerCase()) ||
        part.sku.toLowerCase().includes(query.toLowerCase()) ||
        part.supplier.toLowerCase().includes(query.toLowerCase()) ||
        part.notes.toLowerCase().includes(query.toLowerCase()) ||
        extractBrandFromSku(part.sku).toLowerCase().includes(query.toLowerCase());

      const matchesCategory = !categoryFilter || part.category === categoryFilter;
      const matchesLocation = !locationFilter || part.location.toLowerCase().includes(locationFilter.toLowerCase());

      return matchesQuery && matchesCategory && matchesLocation;
    });
  }, [parts]);

  const getLowStockParts = useCallback(() => {
    return parts.filter(part => part.quantity <= part.reorderThreshold);
  }, [parts]);

  return {
    parts,
    logs,
    loading,
    createPart,
    updatePart,
    deletePart,
    adjustStock,
    getStats,
    searchParts,
    getLowStockParts,
  };
}