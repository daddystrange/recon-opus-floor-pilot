import { ProductionDepartmentName } from '../types';

export type FacilityEndpoint = ProductionDepartmentName | 'revision' | 'sublets' | 'exit';
export type FacilityMovement = { id: number; from: FacilityEndpoint; to: FacilityEndpoint };
export type NormalizedPoint = { x: number; y: number };

const LEFT_COLUMN_X = 0.21;
const RIGHT_COLUMN_X = 0.79;
const FIRST_DEPARTMENT_ROW_Y = 0.17;
const DEPARTMENT_ROW_GAP = 0.22;
const departmentRowY = (row: number) => FIRST_DEPARTMENT_ROW_Y + row * DEPARTMENT_ROW_GAP;

export const facilityPositions: Record<FacilityEndpoint, NormalizedPoint> = {
  Entrance: { x: 0.15, y: 0.04 },
  'Parts Hold': { x: LEFT_COLUMN_X, y: departmentRowY(0) },
  Mechanical: { x: LEFT_COLUMN_X, y: departmentRowY(1) },
  Body: { x: LEFT_COLUMN_X, y: departmentRowY(2) },
  Paint: { x: LEFT_COLUMN_X, y: departmentRowY(3) },
  Reassembly: { x: RIGHT_COLUMN_X, y: departmentRowY(3) },
  Detail: { x: RIGHT_COLUMN_X, y: departmentRowY(2) },
  'Quality Control': { x: RIGHT_COLUMN_X, y: departmentRowY(1) },
  Delivery: { x: RIGHT_COLUMN_X, y: departmentRowY(0) },
  revision: { x: 0.5, y: -0.08 },
  sublets: { x: 0.78, y: -0.08 },
  exit: { x: 1.04, y: 0.03 },
};
