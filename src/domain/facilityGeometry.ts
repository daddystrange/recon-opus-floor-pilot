import { ProductionDepartmentName } from '../types';

export type FacilityEndpoint = ProductionDepartmentName | 'revision' | 'exit';
export type FacilityMovement = { id: number; from: FacilityEndpoint; to: FacilityEndpoint };
export type NormalizedPoint = { x: number; y: number };

export const facilityPositions: Record<FacilityEndpoint, NormalizedPoint> = {
  'Arrival & Inspection': { x: 0.18, y: 0.12 },
  'Parts Hold': { x: 0.18, y: 0.32 },
  Body: { x: 0.18, y: 0.52 },
  Paint: { x: 0.18, y: 0.72 },
  Reassembly: { x: 0.82, y: 0.72 },
  Detail: { x: 0.82, y: 0.52 },
  'Quality Control': { x: 0.82, y: 0.32 },
  Delivery: { x: 0.82, y: 0.12 },
  revision: { x: 0.5, y: -0.08 },
  exit: { x: 1.04, y: 0.03 },
};
