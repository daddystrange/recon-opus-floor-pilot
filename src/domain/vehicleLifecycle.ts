import { DepartmentName, ProductionDepartmentName, RevisionReason, SubletCategory, SubletQueueItem, SubletStatus, Vehicle, VehicleHistoryEvent, VehicleTimeCategory, VehicleTimerState } from '../types';
import { productionSequence } from '../data/departments';

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
    subletHoldMs: (timer.subletHoldMs ?? 0) + (timer.category === 'sublet_hold' ? elapsed : 0),
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

export function recommendedExceptionDestination(
  vehicle: Vehicle,
  currentDepartment: ProductionDepartmentName,
  availableDepartments: ProductionDepartmentName[],
): ProductionDepartmentName {
  const productionException = vehicle.activeException;
  const available = new Set(availableDepartments);
  if (productionException?.suggestedDestination && available.has(productionException.suggestedDestination)) return productionException.suggestedDestination;
  if (productionException) {
    const originIndex = productionSequence.indexOf(productionException.originDepartment);
    const nextDepartment = productionSequence[originIndex + 1];
    if (nextDepartment && available.has(nextDepartment)) return nextDepartment;
    if (available.has(productionException.originDepartment)) return productionException.originDepartment;
  }
  return currentDepartment;
}

export function completeProductionException(
  vehicle: Vehicle,
  completedBy: string,
  completedDestination: ProductionDepartmentName,
  destinationStatus = vehicle.status,
  destinationStatusColor = vehicle.statusColor,
  now = Date.now(),
): Vehicle {
  const productionException = vehicle.activeException;
  if (!productionException?.active) return vehicle;
  const resolvedException = { ...productionException, active: false, resolvedAt: now, completedBy, completedDestination };
  const exceptionHistory = vehicle.exceptionHistory ?? [];
  return {
    ...vehicle,
    department: completedDestination,
    status: destinationStatus,
    statusColor: destinationStatusColor,
    timeInStage: '0 min',
    stageStartedAt: now,
    timerState: transitionTimer(vehicle.timerState, completedDestination === 'Parts Hold' ? 'parts_hold' : 'active_production', now),
    activeException: undefined,
    exceptionHistory: exceptionHistory.some((item) => item.id === productionException.id)
      ? exceptionHistory.map((item) => item.id === productionException.id ? resolvedException : item)
      : [...exceptionHistory, resolvedException],
    history: [...vehicle.history, event('exception_completed', { fromDepartment: productionException.receivingDepartment, toDepartment: completedDestination, status: destinationStatus, note: `${productionException.correctiveTask} · ${completedBy}` }, now)],
  };
}

export function sendVehicleToSublet(
  vehicle: Vehicle,
  category: SubletCategory,
  serviceDescription: string,
  vendorName: string,
  expectedReturnLabel: string,
  now = Date.now(),
): SubletQueueItem {
  if (vehicle.department === 'Revision Needed' || vehicle.department === 'Sublets') throw new Error('Vehicle is not eligible for Sublet');
  const previousDepartment = vehicle.department;
  const sublet = {
    id: `sublet-${now}-${Math.random().toString(36).slice(2, 8)}`,
    vehicleId: vehicle.id,
    category,
    serviceDescription,
    vendorName: vendorName || undefined,
    status: 'Awaiting Dispatch' as const,
    createdAt: now,
    expectedReturnLabel: expectedReturnLabel || undefined,
    productionLocationBeforeSublet: previousDepartment,
  };
  return {
    sublet,
    vehicle: {
      ...vehicle,
      department: 'Sublets',
      lifecycleState: 'sublet',
      timeInStage: '0 min',
      stageStartedAt: now,
      timerState: transitionTimer(vehicle.timerState, 'sublet_hold', now),
      history: [...vehicle.history, event('sublet_started', { fromDepartment: previousDepartment, toDepartment: 'Sublets', status: category, note: `${serviceDescription}${vendorName ? ` · ${vendorName}` : ''}` }, now)],
    },
  };
}

export function requestSubletApproval(
  vehicle: Vehicle,
  category: SubletCategory,
  serviceDescription: string,
  suggestedVendor: string,
  expectedTiming: string,
  notes: string,
  requestedBy: string,
  now = Date.now(),
): Vehicle {
  if (vehicle.department === 'Revision Needed' || vehicle.department === 'Sublets' || vehicle.activeSubletRequest) return vehicle;
  const request = {
    id: `sublet-request-${now}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'Sublet Approval Required' as const,
    status: 'awaiting_manager_approval' as const,
    requestedCategory: category,
    requestedServiceDescription: serviceDescription,
    suggestedVendor: suggestedVendor || undefined,
    requestedBy,
    requestedAt: now,
    expectedTiming: expectedTiming || undefined,
    notes: notes || undefined,
    previousProductionLocation: vehicle.department,
  };
  return {
    ...vehicle,
    department: 'Revision Needed',
    lifecycleState: 'revision_needed',
    stageStartedAt: null,
    timerState: transitionTimer(vehicle.timerState, 'revision_hold', now),
    activeSubletRequest: request,
    subletRequestHistory: [...(vehicle.subletRequestHistory ?? []), request],
    history: [...vehicle.history,
      event('sublet_requested', { fromDepartment: vehicle.department, toDepartment: vehicle.department, status: request.type, note: `${category} · ${serviceDescription} · ${requestedBy}` }, now),
      event('moved_to_production_exceptions', { fromDepartment: vehicle.department, toDepartment: 'Revision Needed', status: request.type }, now),
    ],
  };
}

export function approveSubletRequest(vehicle: Vehicle, category: SubletCategory, serviceDescription: string, vendorName: string, expectedReturnLabel: string, notes: string, managerName: string, now = Date.now()): SubletQueueItem {
  const request = vehicle.activeSubletRequest;
  if (!request || request.status !== 'awaiting_manager_approval' || vehicle.department !== 'Revision Needed') throw new Error('No approvable Sublet request');
  const approvedRequest = { ...request, status: 'approved' as const, managerName, managerActionAt: now };
  const sublet = {
    id: `sublet-${now}-${Math.random().toString(36).slice(2, 8)}`,
    vehicleId: vehicle.id,
    category,
    serviceDescription,
    vendorName: vendorName || undefined,
    status: 'At Vendor' as const,
    createdAt: now,
    dispatchedAt: now,
    expectedReturnLabel: expectedReturnLabel || undefined,
    productionLocationBeforeSublet: request.previousProductionLocation,
    notes: notes || undefined,
  };
  return {
    sublet,
    vehicle: {
      ...vehicle,
      department: 'Sublets',
      lifecycleState: 'sublet',
      status: 'At Vendor',
      statusColor: '#C68A43',
      timeInStage: '0 min',
      stageStartedAt: now,
      timerState: transitionTimer(vehicle.timerState, 'sublet_hold', now),
      activeSubletRequest: undefined,
      subletRequestHistory: (vehicle.subletRequestHistory ?? []).map((item) => item.id === request.id ? approvedRequest : item),
      history: [...vehicle.history,
        event('sublet_manager_approved', { fromDepartment: 'Revision Needed', toDepartment: 'Revision Needed', status: category, note: `${managerName} · ${vendorName || 'Vendor pending'}` }, now),
        event('sublet_started', { fromDepartment: 'Revision Needed', toDepartment: 'Sublets', status: category, note: serviceDescription }, now),
      ],
    },
  };
}

export function denySubletRequest(vehicle: Vehicle, denialReason: string, managerName: string, now = Date.now()): Vehicle {
  const request = vehicle.activeSubletRequest;
  if (!request || request.status !== 'awaiting_manager_approval') return vehicle;
  const deniedRequest = { ...request, status: 'denied_pending_routing' as const, managerName, managerActionAt: now, denialReason: denialReason || undefined };
  return { ...vehicle, activeSubletRequest: deniedRequest, subletRequestHistory: (vehicle.subletRequestHistory ?? []).map((item) => item.id === request.id ? deniedRequest : item), history: [...vehicle.history, event('sublet_manager_denied', { fromDepartment: 'Revision Needed', toDepartment: 'Revision Needed', status: request.type, note: `${managerName}${denialReason ? ` · ${denialReason}` : ''}` }, now)] };
}

export function routeDeniedSubletRequest(vehicle: Vehicle, destination: ProductionDepartmentName, status: string, statusColor: string, now = Date.now()): Vehicle {
  const request = vehicle.activeSubletRequest;
  if (!request || request.status !== 'denied_pending_routing') return vehicle;
  const deniedRequest = { ...request, status: 'denied' as const };
  return { ...vehicle, department: destination, lifecycleState: 'active_production', status, statusColor, timeInStage: '0 min', stageStartedAt: now, timerState: transitionTimer(vehicle.timerState, destination === 'Parts Hold' ? 'parts_hold' : 'active_production', now), activeSubletRequest: undefined, subletRequestHistory: (vehicle.subletRequestHistory ?? []).map((item) => item.id === request.id ? deniedRequest : item), history: [...vehicle.history, event('phase_completed', { fromDepartment: 'Revision Needed', toDepartment: destination, status, note: 'Sublet request denied · manager-routed' }, now)] };
}

export function updateSubletStatus(item: SubletQueueItem, status: Exclude<SubletStatus, 'Returned'>, now = Date.now()): SubletQueueItem {
  const eventType = status === 'At Vendor' ? 'sublet_dispatched' : status === 'Work Complete' ? 'sublet_work_completed' : null;
  return {
    ...item,
    sublet: {
      ...item.sublet,
      status,
      dispatchedAt: status === 'At Vendor' ? now : item.sublet.dispatchedAt,
      completedAt: status === 'Work Complete' ? now : item.sublet.completedAt,
    },
    vehicle: eventType ? { ...item.vehicle, history: [...item.vehicle.history, event(eventType, { fromDepartment: 'Sublets', toDepartment: 'Sublets', status, note: item.sublet.vendorName }, now)] } : item.vehicle,
  };
}

export function returnSubletToProduction(item: SubletQueueItem, destination: ProductionDepartmentName, status: string, statusColor: string, now = Date.now()): { vehicle: Vehicle; completedSublet: SubletQueueItem['sublet'] } {
  const returnedEvent = event('sublet_returned', { fromDepartment: 'Sublets', toDepartment: 'Sublets', status: 'Returned', note: item.sublet.vendorName }, now);
  const reentryEvent = event('sublet_reentered_production', { fromDepartment: 'Sublets', toDepartment: destination, status, note: item.sublet.serviceDescription }, now);
  return {
    completedSublet: { ...item.sublet, status: 'Returned', returnedAt: now, confirmedReturnDestination: destination, totalCycleTimeMs: Math.max(0, now - item.sublet.createdAt) },
    vehicle: {
      ...item.vehicle,
      department: destination,
      lifecycleState: 'active_production',
      status,
      statusColor,
      timeInStage: '0 min',
      stageStartedAt: now,
      timerState: transitionTimer(item.vehicle.timerState, destination === 'Parts Hold' ? 'parts_hold' : 'active_production', now),
      history: [...item.vehicle.history, returnedEvent, reentryEvent],
    },
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
