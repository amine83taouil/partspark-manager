import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Company, Location, StockAlert, StockMovement, LocationFormData } from '@/types/company';

export const useCompany = (userId?: string) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch company data
  const fetchCompany = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .single();

      if (error) throw error;

      setCompany({
        id: data.id,
        name: data.name,
        slug: data.slug,
        subscriptionPlan: data.subscription_plan,
        maxUsers: data.max_users,
        maxLocations: data.max_locations,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      });
    } catch (error) {
      console.error('Error fetching company:', error);
    }
  };

  // Fetch locations
  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const transformedLocations: Location[] = data.map((location: any) => ({
        id: location.id,
        companyId: location.company_id,
        name: location.name,
        description: location.description,
        address: location.address,
        isActive: location.is_active,
        createdAt: new Date(location.created_at),
        updatedAt: new Date(location.updated_at),
      }));

      setLocations(transformedLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Fetch stock alerts
  const fetchStockAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select(`
          *,
          parts(name, sku, location_id),
          locations(name)
        `)
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedAlerts: StockAlert[] = data.map((alert: any) => ({
        id: alert.id,
        companyId: alert.company_id,
        partId: alert.part_id,
        alertType: alert.alert_type,
        thresholdValue: alert.threshold_value,
        currentValue: alert.current_value,
        isAcknowledged: alert.is_acknowledged,
        acknowledgedBy: alert.acknowledged_by,
        acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at) : undefined,
        createdAt: new Date(alert.created_at),
        resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : undefined,
        partName: alert.parts?.name,
        partSku: alert.parts?.sku,
        locationName: alert.locations?.name,
      }));

      setStockAlerts(transformedAlerts);
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
    }
  };

  // Fetch stock movements
  const fetchStockMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          parts(name),
          locations(name),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const transformedMovements: StockMovement[] = data.map((movement: any) => ({
        id: movement.id,
        companyId: movement.company_id,
        partId: movement.part_id,
        locationId: movement.location_id,
        movementType: movement.movement_type,
        quantity: movement.quantity,
        previousQuantity: movement.previous_quantity,
        newQuantity: movement.new_quantity,
        unitCost: Number(movement.unit_cost),
        referenceNumber: movement.reference_number,
        notes: movement.notes,
        userId: movement.user_id,
        createdAt: new Date(movement.created_at),
        partName: movement.parts?.name,
        locationName: movement.locations?.name,
        userName: movement.profiles?.full_name,
      }));

      setStockMovements(transformedMovements);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    }
  };

  // Add location
  const addLocation = async (locationData: LocationFormData) => {
    try {
      // Get company_id from current user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (!profile?.company_id) {
        throw new Error('Company not found');
      }

      const { error } = await supabase
        .from('locations')
        .insert({
          company_id: profile.company_id,
          name: locationData.name,
          description: locationData.description || null,
          address: locationData.address || null,
        });

      if (error) throw error;
      await fetchLocations();
    } catch (error) {
      console.error('Error adding location:', error);
      throw error;
    }
  };

  // Update location
  const updateLocation = async (locationId: string, locationData: LocationFormData) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update({
          name: locationData.name,
          description: locationData.description || null,
          address: locationData.address || null,
        })
        .eq('id', locationId);

      if (error) throw error;
      await fetchLocations();
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  };

  // Delete location
  const deleteLocation = async (locationId: string) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update({ is_active: false })
        .eq('id', locationId);

      if (error) throw error;
      await fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('stock_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_by: userId,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
      await fetchStockAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  };

  // Resolve alert
  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('stock_alerts')
        .update({
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
      await fetchStockAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  };

  // Load all company data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCompany(),
        fetchLocations(),
        fetchStockAlerts(),
        fetchStockMovements(),
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    company,
    locations,
    stockAlerts,
    stockMovements,
    loading,
    addLocation,
    updateLocation,
    deleteLocation,
    acknowledgeAlert,
    resolveAlert,
    fetchStockAlerts,
    fetchStockMovements,
  };
};