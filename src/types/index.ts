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

export type VehicleLifecycleState = 'active_production' | 'revision_needed' | 'completed' | 'archived';
export type VehicleTimeCategory = 'active_production' | 'parts_hold' | 'revision_hold' | 'stopped';
export type VehicleTimerState = { category: VehicleTimeCategory; categoryStartedAt: number | null; activeProductionMs: number; partsHoldMs: number; revisionHoldMs: number };

export type VehicleHistoryEvent = {
  id: string;
  type: 'phase_completed' | 'revision_requested' | 'revision_resolved' | 'exception_started' | 'exception_completed' | 'production_closed' | 'archived';
  occurredAt: number;
  fromDepartment?: DepartmentName;
  toDepartment?: DepartmentName;
  status?: string;
  note?: string;
};

export type Vehicle = {
  id: string;
  department: DepartmentName;
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
  createdAt: number;
  active: boolean;
  resolvedAt?: number;
  completedBy?: string;
};

export type Department = {
  name: DepartmentName;
  shortName: string;
  statusOptions: string[];
  vehicles: Vehicle[];
};
