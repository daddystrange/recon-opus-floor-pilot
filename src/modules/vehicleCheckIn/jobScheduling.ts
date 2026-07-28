export const PARTS_BUFFER_DAYS = 3;
export const LABOR_HOURS_PER_PRODUCTION_DAY = 2;

function isWeekday(date: Date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

export function addProductionWeekdays(startDate: Date, days: number): Date {
  const result = new Date(startDate.getTime());
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (isWeekday(result)) remaining -= 1;
  }
  return result;
}

export function calculateTargetCompletion(arrivalDate: Date, totalJobHours: number): Date | null {
  if (Number.isNaN(arrivalDate.getTime()) || !Number.isFinite(totalJobHours) || totalJobHours < 0) return null;
  const productionDays = Math.ceil(totalJobHours / LABOR_HOURS_PER_PRODUCTION_DAY);
  return addProductionWeekdays(arrivalDate, PARTS_BUFFER_DAYS + productionDays);
}

export function normalizeToLocalDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(17, 0, 0, 0);
  return date.getTime();
}
