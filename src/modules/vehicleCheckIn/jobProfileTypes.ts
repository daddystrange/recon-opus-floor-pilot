export const jobTypeOptions = [
  { value: 'collision_repair', label: 'Collision Repair' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'detail', label: 'Detail' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'sublet_only', label: 'Sublet Only' },
] as const;

export type JobType = typeof jobTypeOptions[number]['value'];
export type JobPriority = 'normal' | 'rush' | 'critical';

export type JobProfile = {
  customer: string;
  companyOrDealer: string;
  jobTypes: JobType[];
  arrivalTimestamp: number;
  totalJobHours: string;
  calculatedTargetCompletion: number | null;
  targetCompletion: number | null;
  targetCompletionWasOverridden: boolean;
  priority: JobPriority;
};

export type JobProfileErrors = Partial<Record<'customer' | 'jobTypes' | 'totalJobHours' | 'targetCompletion', string>>;

export function createJobProfile(arrivalTimestamp = Date.now()): JobProfile {
  return {
    customer: '',
    companyOrDealer: '',
    jobTypes: [],
    arrivalTimestamp,
    totalJobHours: '',
    calculatedTargetCompletion: null,
    targetCompletion: null,
    targetCompletionWasOverridden: false,
    priority: 'normal',
  };
}
