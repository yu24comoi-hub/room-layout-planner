export type Unit = 'cm' | 'm';

export interface Point {
  x: number; // cm
  y: number; // cm
}

export interface Room {
  width: number;  // cm
  height: number; // cm
  polygon?: Point[];        // polygon vertices in cm (relative to room top-left)
  floorPlanImage?: string;  // base64 data URL
  imageScale?: number;      // px/cm in original image (from calibration)
  // polygon bounding box offset from original image (in cm)
  polygonOffsetX?: number;
  polygonOffsetY?: number;
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
  x: number;        // cm from room top-left
  y: number;        // cm from room top-left
  rotated: boolean; // true = 90° rotation (swap width/height)
}
