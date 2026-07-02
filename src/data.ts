import type { FurnitureDefinition } from './types';

export const PRESET_FURNITURE_DEFINITIONS: FurnitureDefinition[] = [
  { id: 'single_bed', name: 'シングルベッド', defaultWidth: 100, defaultHeight: 200, iconType: 'single_bed' },
  { id: 'double_bed', name: 'ダブルベッド', defaultWidth: 140, defaultHeight: 200, iconType: 'double_bed' },
  { id: 'sofa', name: 'ソファ', defaultWidth: 180, defaultHeight: 90, iconType: 'sofa' },
  { id: 'dining_table', name: 'ダイニングテーブル', defaultWidth: 150, defaultHeight: 85, iconType: 'dining_table' },
  { id: 'chair', name: '椅子', defaultWidth: 45, defaultHeight: 45, iconType: 'chair' },
  { id: 'desk', name: 'デスク', defaultWidth: 120, defaultHeight: 60, iconType: 'desk' },
  { id: 'wardrobe', name: 'ワードローブ', defaultWidth: 90, defaultHeight: 60, iconType: 'wardrobe' },
  { id: 'tv_stand', name: 'テレビ台', defaultWidth: 150, defaultHeight: 45, iconType: 'tv_stand' },
  { id: 'refrigerator', name: '冷蔵庫', defaultWidth: 65, defaultHeight: 65, iconType: 'refrigerator' },
  { id: 'washing_machine', name: '洗濯機', defaultWidth: 60, defaultHeight: 60, iconType: 'washing_machine' },
];

export const NEUTRAL_FURNITURE_COLORS = [
  '#C8B89A', // Warm Sand
  '#BCA98A', // Soft Tan
  '#8E9DB5', // Steel Blue
  '#7A8FA8', // Cadet Blue
  '#A8896C', // Terracotta Sand
  '#C2A87A', // Gold Sand
  '#9A8878', // Warm Stone
  '#9A8570', // Soft Brown
  '#5A5A5E', // Dark Slate
  '#B8BEC4', // Silver Sage
];

export const SWATCH_COLORS = [
  '#C8B89A', '#BCA98A', '#8E9DB5', '#7A8FA8',
  '#A8896C', '#C2A87A', '#9A8878', '#9A8570',
  '#5A5A5E', '#B8BEC4', '#DFD5C6', '#626F60',
];
