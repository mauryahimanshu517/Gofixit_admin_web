/** A single state in a service type's status workflow. */
export interface WorkflowState {
  key: string;
  label: string;
  type: 'initial' | 'normal' | 'terminal' | string;
}

export interface WorkflowTransition {
  from: string;
  to: string;
}

export interface ServiceWorkflow {
  initial: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}

export interface ServiceCapabilities {
  needsScheduling?: boolean;
  instantBooking?: boolean;
  needsWorker?: boolean;
  needsInventory?: boolean;
  needsPickupDelivery?: boolean;
  needsServiceArea?: boolean;
}

export interface BookingFormField {
  key: string;
  label: string;
  type: string;
}

export interface ServicePricing {
  strategy: string;
  currency?: string;
  commissionPercent?: number;
  taxPercent?: number;
}

/**
 * A dynamic service type from the registry (the entities managed on the Service
 * Management page). Shape derived from how the admin app reads/writes it.
 */
export interface ServiceType {
  key: string;
  label: string;
  icon?: string;
  imageUrl?: string;
  description?: string;
  kind: string;
  capabilities?: ServiceCapabilities;
  workflow?: ServiceWorkflow;
  bookingForm?: { fields: BookingFormField[] };
  pricing?: ServicePricing;
  isActive?: boolean;
}
