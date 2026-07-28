import { Technician, UnassignedJob } from '../types';

export const initialUnassignedJobs: UnassignedJob[] = [
  { id: 'job-4102', vehicleId: 'intake-4102', year: 2024, make: 'Toyota', model: 'Camry XSE', color: 'Midnight Black', roNumber: 'RO-4102', customerName: 'M. Reynolds', daysOnLot: 1, estimatedCompletionDate: 'Aug 2', repairType: 'Collision', priority: 'Priority' },
  { id: 'job-4098', vehicleId: 'intake-4098', year: 2023, make: 'BMW', model: 'X3 xDrive30i', color: 'Alpine White', roNumber: 'RO-4098', customerName: 'J. Brooks', daysOnLot: 2, estimatedCompletionDate: 'Aug 5', repairType: 'Cosmetic', priority: 'Standard' },
  { id: 'job-4087', vehicleId: 'intake-4087', year: 2022, make: 'Ford', model: 'F-150 Lariat', color: 'Agate Black', roNumber: 'RO-4087', customerName: 'D. Patel', daysOnLot: 4, estimatedCompletionDate: 'Jul 31', repairType: 'Mechanical', priority: 'Critical' },
  { id: 'job-4110', vehicleId: 'intake-4110', year: 2024, make: 'Lexus', model: 'RX 350', color: 'Caviar', roNumber: 'RO-4110', daysOnLot: 1, estimatedCompletionDate: 'Aug 1', repairType: 'PDR', priority: 'Standard' },
];

export const initialTechnicians: Technician[] = [
  { id: 'tech-parts-1', name: 'Maya Chen', department: 'Parts Hold', role: 'Parts Coordinator', activeJobs: 4, initials: 'MC' },
  { id: 'tech-mech-1', name: 'Andre Lewis', department: 'Mechanical', role: 'Mechanical Technician', activeJobs: 3, initials: 'AL' },
  { id: 'tech-body-1', name: 'Joe Smith', department: 'Body', role: 'Body Technician', activeJobs: 6, initials: 'JS' },
  { id: 'tech-paint-1', name: 'Elena Ruiz', department: 'Paint', role: 'Refinish Technician', activeJobs: 5, initials: 'ER' },
  { id: 'tech-reassembly-1', name: 'Caleb Grant', department: 'Reassembly', role: 'Reassembly Technician', activeJobs: 3, initials: 'CG' },
  { id: 'tech-detail-1', name: 'Nia Davis', department: 'Detail', role: 'Detail Technician', activeJobs: 4, initials: 'ND' },
  { id: 'tech-qc-1', name: 'Marcus Hill', department: 'Quality Control', role: 'Quality Specialist', activeJobs: 2, initials: 'MH' },
  { id: 'tech-delivery-1', name: 'Sofia King', department: 'Delivery', role: 'Delivery Coordinator', activeJobs: 2, initials: 'SK' },
];
