export type ProductionDepartmentName =
  | 'Arrival & Inspection'
  | 'Parts Hold'
  | 'Body'
  | 'Paint'
  | 'Reassembly'
  | 'Detail'
  | 'Quality Control'
  | 'Delivery';

export type DepartmentName = ProductionDepartmentName | 'Revision Needed';
export type OperationalLocation = DepartmentName | 'Sublets';

export type VehicleLifecycleState = 'active_production' | 'revision_needed' | 'sublet' | 'completed' | 'archived';
export type VehicleTimeCategory = 'active_production' | 'parts_hold' | 'revision_hold' | 'sublet_hold' | 'stopped';
export type VehicleTimerState = { category: VehicleTimeCategory; categoryStartedAt: number | null; activeProductionMs: number; partsHoldMs: number; revisionHoldMs: number; subletHoldMs?: number };

export type VehicleHistoryEvent = {
  id: string;
  type: 'phase_completed' | 'revision_requested' | 'revision_resolved' | 'exception_started' | 'exception_completed' | 'sublet_requested' | 'moved_to_production_exceptions' | 'sublet_manager_approved' | 'sublet_manager_denied' | 'sublet_started' | 'sublet_dispatched' | 'sublet_work_completed' | 'sublet_returned' | 'sublet_reentered_production' | 'production_closed' | 'archived';
  occurredAt: number;
  fromDepartment?: OperationalLocation;
  toDepartment?: OperationalLocation;
  status?: string;
  note?: string;
};

export type Vehicle = {
  id: string;
  department: OperationalLocation;
  year: number;
  make: string;
  model: string;
  color: string;
  stockNumber: string;
  status: string;
  statusColor: string;
  location: string;
  timeInStage: string;
  lifecycleState: VehicleLifecycleState;
  productionStartedAt: number;
  stageStartedAt: number | null;
  timerState: VehicleTimerState;
  completedAt?: number;
  archivedAt?: number;
  history: VehicleHistoryEvent[];
  priority?: boolean;
  activeRevision?: {
    originalDepartment: ProductionDepartmentName;
    originalStatus: string;
    reason: RevisionReason;
    notes: string;
    requestedAt: number;
  };
  activeSubletRequest?: SubletApprovalRequest;
  subletRequestHistory?: SubletApprovalRequest[];
  revisionHistory?: RevisionHistoryEntry[];
  activeException?: ProductionExceptionRecord;
  exceptionHistory?: ProductionExceptionRecord[];
};

export type RevisionReason =
  | 'Additional Body Work Needed'
  | 'Paint Defect'
  | 'Parts Issue'
  | 'Estimate Revision'
  | 'Structural Concern'
  | 'Other';

export type RevisionHistoryEntry = {
  originalDepartment: ProductionDepartmentName;
  reason: RevisionReason;
  notes: string;
  requestedAt: number;
  destination: ProductionDepartmentName;
  destinationStatus: string;
  resolutionNote: string;
  resolvedAt: number;
};

export type ProductionExceptionRecord = {
  id: string;
  originDepartment: ProductionDepartmentName;
  originStatus: string;
  originStatusColor: string;
  receivingDepartment: ProductionDepartmentName;
  reason: RevisionReason;
  notes: string;
  correctiveTask: string;
  suggestedDestination?: ProductionDepartmentName;
  createdAt: number;
  active: boolean;
  resolvedAt?: number;
  completedBy?: string;
  completedDestination?: ProductionDepartmentName;
};

export type Department = {
  name: DepartmentName;
  shortName: string;
  statusOptions: string[];
  vehicles: Vehicle[];
};

export type SubletStatus = 'Awaiting Dispatch' | 'At Vendor' | 'Work Complete' | 'Returned';
export type SubletCategory = 'Glass' | 'Alignment' | 'Mechanical' | 'Calibration' | 'Upholstery' | 'Tires' | 'Dealer Service' | 'Other';

export type VehicleSublet = {
  id: string;
  vehicleId: string;
  category: SubletCategory;
  serviceDescription: string;
  vendorName?: string;
  status: SubletStatus;
  createdAt: number;
  dispatchedAt?: number;
  expectedReturnAt?: number;
  expectedReturnLabel?: string;
  completedAt?: number;
  returnedAt?: number;
  productionLocationBeforeSublet?: ProductionDepartmentName;
  confirmedReturnDestination?: ProductionDepartmentName;
  totalCycleTimeMs?: number;
  notes?: string;
};

export type SubletQueueItem = { vehicle: Vehicle; sublet: VehicleSublet };

export type SubletApprovalRequestStatus = 'awaiting_manager_approval' | 'approved' | 'denied_pending_routing' | 'denied';
export type SubletApprovalRequest = {
  id: string;
  type: 'Sublet Approval Required';
  status: SubletApprovalRequestStatus;
  requestedCategory: SubletCategory;
  requestedServiceDescription: string;
  suggestedVendor?: string;
  requestedBy: string;
  requestedAt: number;
  expectedTiming?: string;
  notes?: string;
  previousProductionLocation: ProductionDepartmentName;
  managerName?: string;
  managerActionAt?: number;
  denialReason?: string;
};
