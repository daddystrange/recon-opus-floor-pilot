import { DepartmentName, ProductionDepartmentName, RevisionReason, Vehicle, VehicleHistoryEvent, VehicleTimeCategory, VehicleTimerState } from '../types';

export const COMPLETED_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

const event = (type: VehicleHistoryEvent['type'], data: Omit<VehicleHistoryEvent, 'id' | 'type' | 'occurredAt'> = {}, now = Date.now()): VehicleHistoryEvent => ({
  id: `${type}-${now}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  occurredAt: now,
  ...data,
});

function transitionTimer(timer: VehicleTimerState, category: VehicleTimeCategory, now: number): VehicleTimerState {
  const elapsed = timer.categoryStartedAt ? Math.max(0, now - timer.categoryStartedAt) : 0;
  return {
    category,
    categoryStartedAt: category === 'stopped' ? null : now,
    activeProductionMs: timer.activeProductionMs + (timer.category === 'active_production' ? elapsed : 0),
    partsHoldMs: timer.partsHoldMs + (timer.category === 'parts_hold' ? elapsed : 0),
    revisionHoldMs: timer.revisionHoldMs + (timer.category === 'revision_hold' ? elapsed : 0),
  };
}

export function recordPhaseMove(vehicle: Vehicle, destination: ProductionDepartmentName, status: string, statusColor: string, now = Date.now()): Vehicle {
  return { ...vehicle, department: destination, lifecycleState: 'active_production', status, statusColor, timeInStage: '0 min', stageStartedAt: now, timerState: transitionTimer(vehicle.timerState, destination === 'Parts Hold' ? 'parts_hold' : 'active_production', now), history: [...vehicle.history, event('phase_completed', { fromDepartment: vehicle.department, toDepartment: destination, status }, now)] };
}

export function sendToRevision(vehicle: Vehicle, originalDepartment: ProductionDepartmentName, reason: RevisionReason, notes: string, now = Date.now()): Vehicle {
  return { ...vehicle, department: 'Revision Needed', lifecycleState: 'revision_needed', stageStartedAt: null, timerState: transitionTimer(vehicle.timerState, 'revision_hold', now), activeRevision: { originalDepartment, originalStatus: vehicle.status, reason, notes, requestedAt: now }, history: [...vehicle.history, event('revision_requested', { fromDepartment: originalDepartment, toDepartment: 'Revision Needed', status: vehicle.status, note: notes || reason }, now)] };
}

export function resolveRevisionLifecycle(vehicle: Vehicle, destination: ProductionDepartmentName, status: string, statusColor: string, resolutionNote: string, now = Date.now()): Vehicle {
  return { ...vehicle, department: destination, lifecycleState: 'active_production', status, statusColor, timeInStage: '0 min', stageStartedAt: now, timerState: transitionTimer(vehicle.timerState, destination === 'Parts Hold' ? 'parts_hold' : 'active_production', now), history: [...vehicle.history, event('revision_resolved', { fromDepartment: 'Revision Needed', toDepartment: destination, status, note: resolutionNote }, now)] };
}

export function startProductionException(vehicle: Vehicle, destination: ProductionDepartmentName, correctiveTask: string, statusColor: string, notes: string, now = Date.now()): Vehicle {
  const revision = vehicle.activeRevision;
  if (!revision || vehicle.activeException?.active) return vehicle;
  const productionException = {
    id: `exception-${now}-${Math.random().toString(36).slice(2, 8)}`,
    originDepartment: revision.originalDepartment,
    originStatus: revision.originalStatus,
    originStatusColor: vehicle.statusColor,
    receivingDepartment: destination,
    reason: revision.reason,
    notes: notes || revision.notes,
    correctiveTask,
    createdAt: now,
    active: true,
  };
  return {
    ...vehicle,
    department: destination,
    lifecycleState: 'active_production',
    status: correctiveTask,
    statusColor,
    timeInStage: '0 min',
    stageStartedAt: now,
    timerState: transitionTimer(vehicle.timerState, 'revision_hold', now),
    activeRevision: undefined,
    activeException: productionException,
    exceptionHistory: [...(vehicle.exceptionHistory ?? []), productionException],
    history: [...vehicle.history, event('exception_started', { fromDepartment: revision.originalDepartment, toDepartment: destination, status: correctiveTask, note: revision.reason }, now)],
  };
}

export function completeProductionException(vehicle: Vehicle, completedBy: string, now = Date.now()): Vehicle {
  const productionException = vehicle.activeException;
  if (!productionException?.active) return vehicle;
  const resolvedException = { ...productionException, active: false, resolvedAt: now, completedBy };
  const destination = productionException.originDepartment;
  return {
    ...vehicle,
    department: destination,
    status: productionException.originStatus,
    statusColor: productionException.originStatusColor,
    timeInStage: '0 min',
    stageStartedAt: now,
    timerState: transitionTimer(vehicle.timerState, destination === 'Parts Hold' ? 'parts_hold' : 'active_production', now),
    activeException: undefined,
    exceptionHistory: (vehicle.exceptionHistory ?? []).map((item) => item.id === productionException.id ? resolvedException : item),
    history: [...vehicle.history, event('exception_completed', { fromDepartment: productionException.receivingDepartment, toDepartment: destination, status: productionException.originStatus, note: `${productionException.correctiveTask} · ${completedBy}` }, now)],
  };
}

export function closeProduction(vehicle: Vehicle, now = Date.now()): Vehicle {
  return { ...vehicle, lifecycleState: 'completed', completedAt: now, stageStartedAt: null, timerState: transitionTimer(vehicle.timerState, 'stopped', now), history: [...vehicle.history, event('production_closed', { fromDepartment: vehicle.department, status: vehicle.status }, now)] };
}

export function archiveVehicle(vehicle: Vehicle, now = Date.now()): Vehicle {
  return { ...vehicle, lifecycleState: 'archived', archivedAt: now, stageStartedAt: null, timerState: transitionTimer(vehicle.timerState, 'stopped', now), history: [...vehicle.history, event('archived', {}, now)] };
}

export function partitionCompleted(completed: Vehicle[], now = Date.now()) {
  const retained: Vehicle[] = [];
  const expired: Vehicle[] = [];
  completed.forEach((vehicle) => ((vehicle.completedAt ?? now) + COMPLETED_RETENTION_MS <= now ? expired : retained).push(vehicle));
  return { retained, expired: expired.map((vehicle) => archiveVehicle(vehicle, now)) };
}

export function isProductionDepartment(name: DepartmentName): name is ProductionDepartmentName {
  return name !== 'Revision Needed';
}
