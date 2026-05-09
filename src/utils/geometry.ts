import type { Point, PlacedFurniture, FurnitureDefinition } from '../types';

// Ray casting algorithm
export const pointInPolygon = (point: Point, polygon: Point[]): boolean => {
  if (polygon.length < 3) return true; // No polygon = no constraint
  let inside = false;
  const { x, y } = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

export const getFurnitureBounds = (
  placed: PlacedFurniture,
  def: FurnitureDefinition,
): { x: number; y: number; w: number; h: number } => {
  const w = placed.rotated ? def.height : def.width;
  const h = placed.rotated ? def.width : def.height;
  return { x: placed.x, y: placed.y, w, h };
};

export const furnitureCorners = (
  placed: PlacedFurniture,
  def: FurnitureDefinition,
): Point[] => {
  const { x, y, w, h } = getFurnitureBounds(placed, def);
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
};

export const isFurnitureInsideRoom = (
  placed: PlacedFurniture,
  def: FurnitureDefinition,
  roomWidth: number,
  roomHeight: number,
  polygon?: Point[],
): boolean => {
  const { x, y, w, h } = getFurnitureBounds(placed, def);
  // Must be within bounding box
  if (x < 0 || y < 0 || x + w > roomWidth || y + h > roomHeight) return false;
  // If polygon defined, all corners must be inside
  if (polygon && polygon.length >= 3) {
    const corners = furnitureCorners(placed, def);
    return corners.every((c) => pointInPolygon(c, polygon));
  }
  return true;
};

export const furnituresOverlap = (
  a: PlacedFurniture,
  aDef: FurnitureDefinition,
  b: PlacedFurniture,
  bDef: FurnitureDefinition,
): boolean => {
  if (a.id === b.id) return false;
  const ab = getFurnitureBounds(a, aDef);
  const bb = getFurnitureBounds(b, bDef);
  return (
    ab.x < bb.x + bb.w &&
    ab.x + ab.w > bb.x &&
    ab.y < bb.y + bb.h &&
    ab.y + ab.h > bb.y
  );
};

export const isValidPlacement = (
  candidate: PlacedFurniture,
  def: FurnitureDefinition,
  roomWidth: number,
  roomHeight: number,
  polygon: Point[] | undefined,
  existing: PlacedFurniture[],
  allDefs: FurnitureDefinition[],
): boolean => {
  if (!isFurnitureInsideRoom(candidate, def, roomWidth, roomHeight, polygon)) {
    return false;
  }
  for (const other of existing) {
    if (other.id === candidate.id) continue;
    const otherDef = allDefs.find((d) => d.id === other.definitionId);
    if (!otherDef) continue;
    if (furnituresOverlap(candidate, def, other, otherDef)) return false;
  }
  return true;
};
