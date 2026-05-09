import type { Unit } from '../types';

export const cmToM = (cm: number): number => Math.round(cm) / 100;
export const mToCm = (m: number): number => Math.round(m * 100);

export const formatValue = (cm: number, unit: Unit): string => {
  if (unit === 'cm') return String(Math.round(cm));
  return String(Math.round(cm) / 100);
};

export const parseValueToCm = (value: string, unit: Unit): number => {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return unit === 'cm' ? Math.round(num) : Math.round(num * 100);
};

export const displayValue = (cm: number, unit: Unit): string => {
  if (unit === 'cm') return `${Math.round(cm)}cm`;
  return `${(Math.round(cm) / 100).toFixed(2)}m`;
};

export const snapToGrid = (cm: number, gridCm = 10): number =>
  Math.round(cm / gridCm) * gridCm;

export const calcPxPerCm = (
  containerWidth: number,
  containerHeight: number,
  roomWidth: number,
  roomHeight: number,
  padding = 20,
): number => {
  const availW = containerWidth - padding * 2;
  const availH = containerHeight - padding * 2;
  return Math.min(availW / roomWidth, availH / roomHeight);
};
