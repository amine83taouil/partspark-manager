export interface Company {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  maxUsers: number;
  maxLocations: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  companyId: string;
  partId: string;
  locationId: string;
  movementType: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  unitCost: number;
  referenceNumber?: string;
  notes?: string;
  userId?: string;
  createdAt: Date;
  // Joined data
  partName?: string;
  locationName?: string;
  userName?: string;
}

export interface StockAlert {
  id: string;
  companyId: string;
  partId: string;
  alertType: 'LOW_STOCK';
  thresholdValue: number;
  currentValue: number;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
  resolvedAt?: Date;
  // Joined data
  partName?: string;
  partSku?: string;
  locationName?: string;
}

export interface LocationFormData {
  name: string;
  description: string;
  address: string;
}
