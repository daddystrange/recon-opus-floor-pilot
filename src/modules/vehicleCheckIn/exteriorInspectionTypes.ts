export const exteriorPanels = [
  { id: 'front-bumper', label: 'Front Bumper' },
  { id: 'hood', label: 'Hood' },
  { id: 'left-front-fender', label: 'Left Front Fender' },
  { id: 'right-front-fender', label: 'Right Front Fender' },
  { id: 'left-front-door', label: 'Left Front Door' },
  { id: 'right-front-door', label: 'Right Front Door' },
  { id: 'roof', label: 'Roof' },
  { id: 'left-rear-door', label: 'Left Rear Door' },
  { id: 'right-rear-door', label: 'Right Rear Door' },
  { id: 'left-quarter-panel', label: 'Left Quarter Panel' },
  { id: 'right-quarter-panel', label: 'Right Quarter Panel' },
  { id: 'trunk-liftgate', label: 'Trunk / Liftgate' },
  { id: 'rear-bumper', label: 'Rear Bumper' },
] as const;

export type ExteriorPanelId = typeof exteriorPanels[number]['id'];
export type ExteriorPanel = typeof exteriorPanels[number];
export type DamageType = 'Dent' | 'Scratch' | 'Chip' | 'Gouge' | 'Crack' | 'Rust' | 'Previous Repair' | 'Other';
export type DamageSeverity = 'Light' | 'Moderate' | 'Severe';
export type RepairAction = 'Repair' | 'Replace' | 'Paint' | 'Blend' | 'PDR' | 'Review Needed';

export type ExteriorDamageFinding = {
  id: string;
  vehicleId: string;
  panelId: ExteriorPanelId;
  panelLabel: string;
  damageType: DamageType;
  severity: DamageSeverity;
  suggestedAction: RepairAction;
  notes: string;
  photoReference: string | null;
  createdAt: number;
  updatedAt: number;
};

export type DamageDraft = Pick<ExteriorDamageFinding, 'damageType' | 'severity' | 'suggestedAction' | 'notes' | 'photoReference'>;

export const damageTypes: DamageType[] = ['Dent', 'Scratch', 'Chip', 'Gouge', 'Crack', 'Rust', 'Previous Repair', 'Other'];
export const damageSeverities: DamageSeverity[] = ['Light', 'Moderate', 'Severe'];
export const repairActions: RepairAction[] = ['Repair', 'Replace', 'Paint', 'Blend', 'PDR', 'Review Needed'];

export const emptyDamageDraft: DamageDraft = {
  damageType: 'Dent',
  severity: 'Light',
  suggestedAction: 'Repair',
  notes: '',
  photoReference: null,
};
