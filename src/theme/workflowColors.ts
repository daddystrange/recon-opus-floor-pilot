import { ProductionDepartmentName } from '../types';

export const workflowColors: Record<ProductionDepartmentName, string> = {
  'Arrival & Inspection': '#B84A4A',
  'Parts Hold': '#C87336',
  Body: '#D58D36',
  Paint: '#D5B64C',
  Reassembly: '#4F9D67',
  Detail: '#329789',
  'Quality Control': '#357F9D',
  Delivery: '#2D69A5',
};

export const workflowTracerColors = [
  workflowColors['Arrival & Inspection'],
  workflowColors['Parts Hold'],
  workflowColors.Body,
  workflowColors.Paint,
  workflowColors.Reassembly,
  workflowColors.Detail,
  workflowColors['Quality Control'],
  workflowColors.Delivery,
];

export const workflowTracerStops = workflowTracerColors.map((_, index) => index / (workflowTracerColors.length - 1));
