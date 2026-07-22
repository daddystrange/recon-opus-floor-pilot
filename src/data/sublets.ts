import { SubletCategory, SubletQueueItem, SubletStatus, Vehicle } from '../types';

const now = Date.now();

function sampleSublet(
  id: string,
  year: number,
  make: string,
  model: string,
  stockNumber: string,
  category: SubletCategory,
  vendorName: string,
  serviceDescription: string,
  status: SubletStatus,
  expectedReturnLabel: string,
  minutesAgo: number,
): SubletQueueItem {
  const createdAt = now - minutesAgo * 60 * 1000;
  const vehicle: Vehicle = {
    id,
    department: 'Sublets',
    year,
    make,
    model,
    color: 'Shop Vehicle',
    stockNumber,
    status,
    statusColor: '#C68A43',
    location: vendorName,
    timeInStage: `${minutesAgo} min`,
    lifecycleState: 'sublet',
    productionStartedAt: createdAt - 2 * 24 * 60 * 60 * 1000,
    stageStartedAt: createdAt,
    timerState: { category: 'sublet_hold', categoryStartedAt: createdAt, activeProductionMs: 0, partsHoldMs: 0, revisionHoldMs: 0, subletHoldMs: 0 },
    history: [{ id: `sample-sublet-${id}`, type: 'sublet_started', occurredAt: createdAt, fromDepartment: 'Paint', toDepartment: 'Sublets', status: category, note: `${serviceDescription} · ${vendorName}` }],
  };
  return {
    vehicle,
    sublet: {
      id: `sample-${id}`,
      vehicleId: id,
      category,
      vendorName,
      serviceDescription,
      status,
      createdAt,
      dispatchedAt: status === 'At Vendor' || status === 'Work Complete' ? createdAt + 30 * 60 * 1000 : undefined,
      completedAt: status === 'Work Complete' ? now - 20 * 60 * 1000 : undefined,
      expectedReturnLabel,
      productionLocationBeforeSublet: 'Paint',
    },
  };
}

export const initialSublets: SubletQueueItem[] = [
  sampleSublet('s1', 2022, 'Ford', 'F-150', 'S-2201', 'Glass', 'Safelite', 'Windshield replacement', 'At Vendor', 'Today at 3:00 PM', 185),
  sampleSublet('s2', 2021, 'Toyota', 'Camry', 'S-2108', 'Alignment', 'Local Alignment Center', 'Four-wheel alignment', 'Awaiting Dispatch', 'Tomorrow morning', 72),
  sampleSublet('s3', 2023, 'Chevrolet', 'Tahoe', 'S-2314', 'Calibration', 'ADAS Calibration Services', 'Forward camera calibration', 'Work Complete', 'Today', 260),
];
