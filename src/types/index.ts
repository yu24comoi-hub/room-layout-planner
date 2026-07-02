export type Unit = 'cm' | 'm';

export interface Point {
  x: number;
  y: number;
}

export interface FurnitureDefinition {
  id: string;
  name: string;
  defaultWidth: number;  // cm
  defaultHeight: number; // cm
  iconType:
    | 'single_bed'
    | 'double_bed'
    | 'sofa'
    | 'dining_table'
    | 'chair'
    | 'desk'
    | 'wardrobe'
    | 'tv_stand'
    | 'refrigerator'
    | 'washing_machine'
    | 'custom';
  isCustom?: boolean;
}

export interface PlacedFurniture {
  id: string;
  defId: string;
  name: string;
  width: number;    // cm (per-instance)
  height: number;   // cm (per-instance)
  x: number;        // CENTER x in cm
  y: number;        // CENTER y in cm
  rotation: number; // degrees 0-359
  color: string;
}

export interface FloorplanSettings {
  image: string | null;
  scalePoints: { x: number; y: number }[];
  scaleCm: number | null;
  pxPerCm: number | null;
  polygon: Point[];
  polygonEnabled: boolean;
}

export interface RoomConfig {
  width: number;  // cm
  height: number; // cm
}

export interface AppState {
  unit: Unit;
  room: RoomConfig;
  furnitureDefinitions: FurnitureDefinition[];
  placedFurniture: PlacedFurniture[];
  floorplan: FloorplanSettings;
}

export interface HistoryState {
  unit: Unit;
  room: RoomConfig;
  placedFurniture: PlacedFurniture[];
  floorplan: FloorplanSettings;
}
