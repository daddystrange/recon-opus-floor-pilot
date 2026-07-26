import { Department, ProductionDepartmentName, RevisionReason, Vehicle } from '../types';

const statusColors: Record<string, string> = {
  Prep: '#3B82F6', Prime: '#8B5CF6', Block: '#F59E0B', 'Next in Booth': '#EF4444',
  'Ready to Buff': '#10B981', 'Denib and Polish': '#06B6D4', Checked: '#64748B',
  Received: '#64748B', Photos: '#3B82F6', Estimate: '#8B5CF6', Repair: '#F97316',
  Measure: '#EAB308', 'Ready for Paint': '#22C55E', Assemble: '#A855F7', 'Parts Check': '#3B82F6',
  'Final Fit': '#22C55E', Clean: '#14B8A6', Wash: '#3B82F6', Interior: '#8B5CF6',
  'Final Detail': '#22C55E', Inspect: '#EAB308', 'Needs Correction': '#EF4444', Passed: '#22C55E',
  'Checked In': '#64748B', Teardown: '#F97316', 'Ready for Reassembly': '#A855F7',
  'Awaiting QC': '#EAB308', 'Ready for Delivery': '#22C55E', Ready: '#22C55E',
  Staged: '#3B82F6', Delivered: '#64748B',
  'VIN Scanned': '#3B82F6', 'Pre-Work Inspection': '#8B5CF6', Blueprinting: '#F59E0B',
  'Inspection Complete': '#22C55E', 'Ready for Parts Hold': '#14B8A6', 'Parts Being Identified': '#64748B',
  'Parts Ordered': '#3B82F6', 'Partial Parts Received': '#8B5CF6', 'Waiting on Critical Parts': '#EF4444',
  'Parts Complete': '#22C55E', 'Released to Body': '#14B8A6',
  'Panel Alignment': '#F59E0B', Diagnostics: '#64748B', 'Mechanical Repair': '#F97316',
  Calibration: '#3B82F6',
};

export const getStatusColor = (status: string) => statusColors[status] ?? '#64748B';

const vehicle = (id: string, year: number, make: string, model: string, color: string, stockNumber: string, status: string, location: string, timeInStage: string, priority = false): Omit<Vehicle, 'department'> => ({
  id, year, make, model, color, stockNumber, status, location, timeInStage, priority,
  statusColor: getStatusColor(status),
  lifecycleState: 'active_production',
  productionStartedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  stageStartedAt: Date.now(),
  timerState: { category: 'active_production', categoryStartedAt: Date.now(), activeProductionMs: 0, partsHoldMs: 0, revisionHoldMs: 0 },
  history: [],
});

const exceptionVehicle = (id: string, year: number, make: string, model: string, color: string, stockNumber: string, receivingDepartment: ProductionDepartmentName, originDepartment: ProductionDepartmentName, originStatus: string, reason: RevisionReason, correctiveTask: string, location: string, elapsedMinutes: number, notes: string): Omit<Vehicle, 'department'> => {
  const createdAt = Date.now() - elapsedMinutes * 60 * 1000;
  const base = vehicle(id, year, make, model, color, stockNumber, correctiveTask, location, `${elapsedMinutes} min`);
  const productionException = { id: `sample-${id}`, originDepartment, originStatus, originStatusColor: getStatusColor(originStatus), receivingDepartment, reason, notes, correctiveTask, createdAt, active: true };
  return { ...base, stageStartedAt: createdAt, timerState: { ...base.timerState, category: 'revision_hold', categoryStartedAt: createdAt }, activeException: productionException, exceptionHistory: [productionException], history: [{ id: `exception-started-${id}`, type: 'exception_started', occurredAt: createdAt, fromDepartment: originDepartment, toDepartment: receivingDepartment, status: correctiveTask, note: reason }] };
};

const departmentData = [
  { name: 'Mechanical', shortName: 'Mechanical', statusOptions: ['Diagnostics', 'Mechanical Repair', 'Calibration', 'Ready for Parts Hold'], vehicles: [
    vehicle('m1', 2024, 'Ford', 'F-150 Lariat', 'Agate Black', 'M-1042', 'Diagnostics', 'Mechanical bay 2', '18 min'),
    vehicle('m2', 2023, 'Honda', 'Pilot Touring', 'Sonic Gray', 'M-1039', 'Mechanical Repair', 'Mechanical bay 4', '42 min'),
  ]},
  { name: 'Parts Hold', shortName: 'Parts Hold', statusOptions: ['Parts Being Identified', 'Parts Ordered', 'Partial Parts Received', 'Waiting on Critical Parts', 'Parts Complete', 'Released to Body'], vehicles: [
    vehicle('h1', 2024, 'Nissan', 'Pathfinder Platinum', 'Obsidian Green', 'H-0721', 'Parts Ordered', 'Parts rack C', '1 hr 36 min', true),
    vehicle('h2', 2022, 'Hyundai', 'Palisade Limited', 'Steel Graphite', 'H-0717', 'Partial Parts Received', 'Parts hold lane 2', '3 hr 12 min'),
  ]},
  { name: 'Body', shortName: 'Body', statusOptions: ['Teardown', 'Measure', 'Repair', 'Ready for Paint'], vehicles: [
    vehicle('b1', 2022, 'Chevrolet', 'Tahoe LT', 'Summit White', 'B-0831', 'Repair', 'Body stall 4', '2 hr 16 min', true),
    vehicle('b2', 2024, 'Toyota', 'Camry XSE', 'Midnight Black', 'B-0844', 'Repair', 'Body stall 7', '54 min'),
    vehicle('b3', 2021, 'Jeep', 'Grand Cherokee', 'Velvet Red', 'B-0822', 'Repair', 'Frame bay', '4 hr 08 min'),
    exceptionVehicle('ex3', 2023, 'Ford', 'Explorer ST', 'Carbonized Gray', 'EX-3103', 'Body', 'Reassembly', 'Final Fit', 'Additional Body Work Needed', 'Panel Alignment', 'Body stall 2', 37, 'Align left front fender and hood gaps.'),
  ]},
  { name: 'Paint', shortName: 'Paint', statusOptions: ['Prep', 'Prime', 'Block', 'Next in Booth', 'Ready to Buff', 'Denib and Polish'], vehicles: [
    vehicle('p1', 2024, 'BMW', 'X5 xDrive40i', 'Alpine White', 'P-2418', 'Next in Booth', 'Booth queue', '12 min', true),
    vehicle('p2', 2023, 'Ford', 'Bronco Outer Banks', 'Cactus Gray', 'P-2397', 'Prep', 'Prep deck 3', '38 min'),
    vehicle('p3', 2022, 'Lexus', 'RX 350 F Sport', 'Caviar', 'P-2381', 'Prime', 'Prep deck 1', '1 hr 14 min'),
    vehicle('p4', 2024, 'GMC', 'Sierra 1500 Denali', 'Onyx Black', 'P-2421', 'Block', 'Prep deck 5', '2 hr 06 min'),
    vehicle('p5', 2021, 'Mercedes-Benz', 'GLE 350', 'Polar White', 'P-2368', 'Ready to Buff', 'Finish bay 2', '27 min'),
    vehicle('p6', 2023, 'Audi', 'Q7 Premium Plus', 'Navarra Blue', 'P-2404', 'Denib and Polish', 'Finish bay 4', '49 min'),
    exceptionVehicle('ex1', 2022, 'Mazda', 'CX-5 Signature', 'Soul Red', 'EX-3101', 'Paint', 'Quality Control', 'Inspect', 'Paint Defect', 'Denib and Polish', 'Finish bay 1', 24, 'Dirt nib found on left quarter during QC.'),
  ]},
  { name: 'Reassembly', shortName: 'Reassembly', statusOptions: ['Ready for Reassembly', 'Parts Check', 'Assemble', 'Final Fit'], vehicles: [
    vehicle('r1', 2023, 'Ram', '1500 Limited', 'Granite Crystal', 'R-1820', 'Assemble', 'Assembly 2', '1 hr 22 min'),
    vehicle('r2', 2022, 'Tesla', 'Model Y Long Range', 'Pearl White', 'R-1814', 'Assemble', 'Assembly 6', '48 min'),
  ]},
  { name: 'Detail', shortName: 'Detail', statusOptions: ['Wash', 'Interior', 'Clean', 'Final Detail'], vehicles: [
    vehicle('d1', 2024, 'Acura', 'MDX Type S', 'Apex Blue', 'D-0912', 'Clean', 'Detail bay 1', '32 min'),
    vehicle('d2', 2023, 'Cadillac', 'Escalade', 'Black Raven', 'D-0908', 'Clean', 'Detail bay 4', '1 hr 05 min'),
    vehicle('d3', 2022, 'Subaru', 'Outback Limited', 'Autumn Green', 'D-0899', 'Clean', 'Wash lane', '19 min'),
  ]},
  { name: 'Quality Control', shortName: 'QC', statusOptions: ['Awaiting QC', 'Inspect', 'Needs Correction', 'Passed'], vehicles: [
    vehicle('q1', 2024, 'Volvo', 'XC90 Recharge', 'Crystal White', 'Q-0518', 'Inspect', 'QC lane 1', '24 min', true),
    vehicle('q2', 2023, 'Kia', 'Telluride SX', 'Wolf Gray', 'Q-0514', 'Inspect', 'QC lane 2', '41 min'),
    exceptionVehicle('ex2', 2024, 'Genesis', 'GV80', 'Vik Black', 'EX-3102', 'Quality Control', 'Paint', 'Ready to Buff', 'Other', 'Inspect', 'QC lane 3', 18, 'Verify finish quality before Paint releases the vehicle.'),
  ]},
  { name: 'Delivery', shortName: 'Delivery', statusOptions: ['Ready for Delivery', 'Staged', 'Ready', 'Delivered'], vehicles: [
    vehicle('v1', 2023, 'Porsche', 'Cayenne', 'Moonlight Blue', 'DL-311', 'Ready', 'Delivery row A', '16 min'),
    vehicle('v2', 2024, 'Lincoln', 'Navigator Reserve', 'Infinite Black', 'DL-316', 'Ready', 'Delivery row B', '29 min'),
  ]},
];

export const departments: Department[] = [...departmentData.map((department) => ({
  ...department,
  name: department.name as ProductionDepartmentName,
  vehicles: department.vehicles.map((item) => ({
    ...item,
    department: department.name as ProductionDepartmentName,
    timerState: { ...item.timerState, category: department.name === 'Parts Hold' ? 'parts_hold' as const : 'active_production' as const },
  })),
})), { name: 'Revision Needed', shortName: 'Revision Needed', statusOptions: [], vehicles: [] }];

export const defaultStartingStatuses: Record<ProductionDepartmentName, string> = {
  Mechanical: 'Diagnostics',
  'Parts Hold': 'Parts Being Identified',
  Body: 'Teardown',
  Paint: 'Prep',
  Reassembly: 'Ready for Reassembly',
  Detail: 'Wash',
  'Quality Control': 'Awaiting QC',
  Delivery: 'Ready for Delivery',
};

export const productionSequence: ProductionDepartmentName[] = [
  'Mechanical', 'Parts Hold', 'Body', 'Paint', 'Reassembly', 'Detail', 'Quality Control', 'Delivery',
];

export const PAINT_INDEX = departments.findIndex(({ name }) => name === 'Paint');
