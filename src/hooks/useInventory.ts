import { useState, useEffect, useCallback } from 'react';
import { Part, PartFormData, InventoryStats, ActivityLog, Category } from '@/types/inventory';

const STORAGE_KEY = 'inventory-parts';
const LOGS_KEY = 'inventory-logs';

export function useInventory() {
  const [parts, setParts] = useState<Part[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedParts = localStorage.getItem(STORAGE_KEY);
    const storedLogs = localStorage.getItem(LOGS_KEY);
    
    if (storedParts) {
      const parsedParts = JSON.parse(storedParts).map((part: any) => ({
        ...part,
        createdAt: new Date(part.createdAt),
        updatedAt: new Date(part.updatedAt),
      }));
      setParts(parsedParts);
    }

    if (storedLogs) {
      const parsedLogs = JSON.parse(storedLogs).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
      setLogs(parsedLogs);
    }
  }, []);

  // Save to localStorage whenever parts change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
  }, [parts]);

  // Save to localStorage whenever logs change
  useEffect(() => {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }, [logs]);

  const addLog = useCallback((action: ActivityLog['action'], partId: string, partName: string, details: string) => {
    const log: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      action,
      partId,
      partName,
      details,
    };
    setLogs(prev => [log, ...prev].slice(0, 100)); // Keep only last 100 logs
  }, []);

  const createPart = useCallback((formData: PartFormData) => {
    const newPart: Part = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setParts(prev => [...prev, newPart]);
    addLog('CREATE', newPart.id, newPart.name, `Pièce créée avec SKU: ${newPart.sku}`);
    return newPart;
  }, [addLog]);

  const updatePart = useCallback((id: string, formData: PartFormData) => {
    setParts(prev => prev.map(part => {
      if (part.id === id) {
        const updatedPart = {
          ...part,
          ...formData,
          updatedAt: new Date(),
        };
        addLog('UPDATE', id, updatedPart.name, `Pièce modifiée`);
        return updatedPart;
      }
      return part;
    }));
  }, [addLog]);

  const deletePart = useCallback((id: string) => {
    const part = parts.find(p => p.id === id);
    if (part) {
      setParts(prev => prev.filter(p => p.id !== id));
      addLog('DELETE', id, part.name, `Pièce supprimée`);
    }
  }, [parts, addLog]);

  const adjustStock = useCallback((id: string, adjustment: number) => {
    setParts(prev => prev.map(part => {
      if (part.id === id) {
        const newQuantity = Math.max(0, part.quantity + adjustment);
        const updatedPart = {
          ...part,
          quantity: newQuantity,
          updatedAt: new Date(),
        };
        addLog(
          'STOCK_ADJUST',
          id,
          part.name,
          `Stock ajusté: ${adjustment > 0 ? '+' : ''}${adjustment} (${part.quantity} → ${newQuantity})`
        );
        return updatedPart;
      }
      return part;
    }));
  }, [addLog]);

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
        part.notes.toLowerCase().includes(query.toLowerCase());

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
    createPart,
    updatePart,
    deletePart,
    adjustStock,
    getStats,
    searchParts,
    getLowStockParts,
  };
}