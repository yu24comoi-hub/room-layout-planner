export type Unit = 'cm' | 'm';

export interface Point {
  x: number; // cm
  y: number; // cm
}

export interface Room {
  width: number;  // cm
  height: number; // cm
  polygon?: Point[];
  floorPlanImage?: string;
  imageCropX?: number;
  imageCropY?: number;
  imageCropW?: number;
  imageCropH?: number;
}

export interface FurnitureDefinition {
  id: string;
  name: string;
  width: number;  // cm
  height: number; // cm
  color: string;
  isPreset: boolean;
}

export interface PlacedFurniture {
  id: string;
  definitionId: string;
  x: number;        // cm — top-left of unrotated bounding box
  y: number;
  rotation: number; // degrees, 0–360 (clockwise)
  widthOverride?: number;  // cm, overrides definition width for this instance
  heightOverride?: number; // cm, overrides definition height for this instance
}
