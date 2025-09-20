import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateUniqueSku } from '@/utils/skuGenerator';
import type { Part, PartFormData, ActivityLog } from '@/types/inventory';

export const useInventory = (currentUserId?: string) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch parts from Supabase
  const fetchParts = async () => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select(`
          *,
          locations(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedParts: Part[] = data.map((part: any) => ({
        id: part.id,
        sku: part.sku,
        name: part.name,
        category: part.category,
        quantity: part.quantity,
        unitCost: Number(part.unit_cost),
        location: part.locations?.name || part.location || '',
        supplier: part.supplier,
        reorderThreshold: part.reorder_threshold,
        notes: part.notes || '',
        createdAt: new Date(part.created_at),
        updatedAt: new Date(part.updated_at),
        locationId: part.location_id,
      }));

      setParts(transformedParts);
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
  };

  // Fetch activity logs from Supabase
  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, profiles:user_id(full_name)')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      const transformedLogs: ActivityLog[] = data.map((log: any) => ({
        id: log.id,
        timestamp: new Date(log.timestamp),
        action: log.action,
        partId: log.part_id,
        partName: log.part_name,
        details: log.details,
        userName: log.profiles?.full_name || 'Utilisateur inconnu',
      }));

      setActivityLogs(transformedLogs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  // Log activity to Supabase
  const logActivity = async (action: ActivityLog['action'], partId: string, partName: string, details: string) => {
    // Get company_id from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', currentUserId)
      .single();

    const { error } = await supabase
      .from('activity_logs')
      .insert({
        action,
        part_id: partId,
        part_name: partName,
        details,
        user_id: currentUserId,
        company_id: profile?.company_id,
      });

    if (error) {
      console.error('Error logging activity:', error);
      return;
    }

    // Refresh activity logs
    await fetchActivityLogs();
  };

  // Add a new part
  const addPart = async (partData: PartFormData, locationId?: string) => {
    try {
      // Get company_id from user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', currentUserId)
        .single();

      if (!profile?.company_id) {
        throw new Error('Company not found');
      }

      const sku = generateUniqueSku(partData.category, partData.brand, parts);
      
      const { data: newPart, error } = await supabase
        .from('parts')
        .insert({
          name: partData.name,
          sku: sku,
          category: partData.category as any,
          quantity: partData.quantity,
          unit_cost: partData.unitCost,
          location: partData.location,
          location_id: locationId,
          supplier: partData.supplier || '',
          reorder_threshold: partData.reorderThreshold,
          notes: partData.notes || '',
          company_id: profile.company_id,
          created_by: currentUserId,
          updated_by: currentUserId,
        })
        .select()
        .single();

      if (error) throw error;

      // Log stock movement
      if (locationId && partData.quantity > 0) {
        await supabase.rpc('log_stock_movement', {
          part_id_param: newPart.id,
          location_id_param: locationId,
          movement_type_param: 'IN',
          quantity_param: partData.quantity,
          previous_quantity_param: 0,
          new_quantity_param: partData.quantity,
          unit_cost_param: partData.unitCost,
          notes_param: `Stock initial lors de la création de la pièce`,
        });
      }

      await fetchParts();
      await logActivity('CREATE', newPart.id, newPart.name, `Pièce créée avec SKU: ${sku}`);
    } catch (error) {
      console.error('Error adding part:', error);
      throw error;
    }
  };

  // Update an existing part
  const updatePart = async (partId: string, partData: PartFormData) => {
    try {
      const currentPart = parts.find(p => p.id === partId);
      const extractBrandFromSku = (sku: string) => sku.split('-')[1] || '';
      
      let sku = currentPart?.sku || '';
      if (currentPart && (
        partData.category !== currentPart.category || 
        partData.brand !== extractBrandFromSku(currentPart.sku)
      )) {
        sku = generateUniqueSku(partData.category, partData.brand, parts.filter(p => p.id !== partId));
      }

      const { data: updatedPart, error } = await supabase
        .from('parts')
        .update({
          name: partData.name,
          sku: sku,
          category: partData.category as any,
          quantity: partData.quantity,
          unit_cost: partData.unitCost,
          location: partData.location,
          supplier: partData.supplier || '',
          reorder_threshold: partData.reorderThreshold,
          notes: partData.notes || '',
          updated_by: currentUserId,
        })
        .eq('id', partId)
        .select()
        .single();

      if (error) throw error;

      await fetchParts();
      await logActivity('UPDATE', partId, updatedPart.name, `Pièce modifiée${sku !== currentPart?.sku ? ` - Nouveau SKU: ${sku}` : ''}`);
    } catch (error) {
      console.error('Error updating part:', error);
      throw error;
    }
  };

  // Delete a part
  const deletePart = async (partId: string) => {
    try {
      const part = parts.find(p => p.id === partId);
      if (!part) throw new Error('Part not found');

      const { error } = await supabase
        .from('parts')
        .delete()
        .eq('id', partId);

      if (error) throw error;

      await fetchParts();
      await logActivity('DELETE', partId, part.name, 'Pièce supprimée');
    } catch (error) {
      console.error('Error deleting part:', error);
      throw error;
    }
  };

  // Adjust stock quantity
  const adjustStock = async (partId: string, adjustment: number) => {
    try {
      const part = parts.find(p => p.id === partId);
      if (!part) throw new Error('Part not found');

      const newQuantity = Math.max(0, part.quantity + adjustment);

      const { error } = await supabase
        .from('parts')
        .update({ 
          quantity: newQuantity,
          updated_by: currentUserId,
        })
        .eq('id', partId);

      if (error) throw error;

      await fetchParts();
      await logActivity(
        'STOCK_ADJUST',
        partId,
        part.name,
        `Stock ajusté: ${adjustment > 0 ? '+' : ''}${adjustment} (${part.quantity} → ${newQuantity})`
      );
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchParts(), fetchActivityLogs()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    parts,
    activityLogs,
    loading,
    addPart,
    updatePart,
    deletePart,
    adjustStock,
  };
};
