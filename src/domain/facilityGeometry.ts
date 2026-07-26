import { ProductionDepartmentName } from '../types';

export type FacilityEndpoint = ProductionDepartmentName | 'revision' | 'sublets' | 'exit';
export type FacilityMovement = { id: number; from: FacilityEndpoint; to: FacilityEndpoint };
export type NormalizedPoint = { x: number; y: number };

export const facilityPositions: Record<FacilityEndpoint, NormalizedPoint> = {
  Mechanical: { x: 0.21, y: 0.17 },
  'Parts Hold': { x: 0.21, y: 0.39 },
  Body: { x: 0.21, y: 0.61 },
  Paint: { x: 0.21, y: 0.83 },
  Reassembly: { x: 0.79, y: 0.83 },
  Detail: { x: 0.79, y: 0.61 },
  'Quality Control': { x: 0.79, y: 0.39 },
  Delivery: { x: 0.79, y: 0.17 },
  revision: { x: 0.5, y: -0.08 },
  sublets: { x: 0.78, y: -0.08 },
  exit: { x: 1.04, y: 0.03 },
};
