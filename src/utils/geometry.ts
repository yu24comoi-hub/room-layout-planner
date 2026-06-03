import type { Point, PlacedFurniture, FurnitureDefinition } from '../types';

// Ray casting algorithm
export const pointInPolygon = (point: Point, polygon: Point[]): boolean => {
  if (polygon.length < 3) return true;
  let inside = false;
  const { x, y } = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

// Actual corners of a furniture piece after rotation
export const getRotatedCorners = (placed: PlacedFurniture, def: FurnitureDefinition): Point[] => {
  const w = def.width;
  const h = def.height;
  const cx = placed.x + w / 2;
  const cy = placed.y + h / 2;
  const angle = ((placed.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const hw = w / 2;
  const hh = h / 2;
  // 4 corners relative to center, then rotated
  return [
    [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh],
  ].map(([dx, dy]) => ({
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  }));
};

// Axis-aligned bounding box of a rotated furniture piece (for room-boundary check without polygon)
const getRotatedAABB = (placed: PlacedFurniture, def: FurnitureDefinition) => {
  const corners = getRotatedCorners(placed, def);
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  return {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys),
  };
};

export const isFurnitureInsideRoom = (
  placed: PlacedFurniture,
  def: FurnitureDefinition,
  roomWidth: number,
  roomHeight: number,
  polygon?: Point[],
): boolean => {
  const aabb = getRotatedAABB(placed, def);
  if (aabb.minX < 0 || aabb.minY < 0 || aabb.maxX > roomWidth || aabb.maxY > roomHeight) return false;
  if (polygon && polygon.length >= 3) {
    const corners = getRotatedCorners(placed, def);
    return corners.every((c) => pointInPolygon(c, polygon));
  }
  return true;
};

// SAT (Separating Axis Theorem) for OBB collision
function satAxes(corners: Point[]): Point[] {
  const axes: Point[] = [];
  for (let i = 0; i < corners.length; i++) {
    const j = (i + 1) % corners.length;
    const ex = corners[j].x - corners[i].x;
    const ey = corners[j].y - corners[i].y;
    const len = Math.sqrt(ex * ex + ey * ey);
    if (len > 0) axes.push({ x: -ey / len, y: ex / len });
  }
  return axes;
}

function project(corners: Point[], axis: Point): { min: number; max: number } {
  const dots = corners.map((c) => c.x * axis.x + c.y * axis.y);
  return { min: Math.min(...dots), max: Math.max(...dots) };
}

export const furnituresOverlap = (
  a: PlacedFurniture, aDef: FurnitureDefinition,
  b: PlacedFurniture, bDef: FurnitureDefinition,
): boolean => {
  if (a.id === b.id) return false;
  const cornersA = getRotatedCorners(a, aDef);
  const cornersB = getRotatedCorners(b, bDef);
  const axes = [...satAxes(cornersA), ...satAxes(cornersB)];
  for (const axis of axes) {
    const pA = project(cornersA, axis);
    const pB = project(cornersB, axis);
    if (pA.max <= pB.min || pB.max <= pA.min) return false;
  }
  return true;
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
  if (!isFurnitureInsideRoom(candidate, def, roomWidth, roomHeight, polygon)) return false;
  for (const other of existing) {
    if (other.id === candidate.id) continue;
    const otherDef = allDefs.find((d) => d.id === other.definitionId);
    if (!otherDef) continue;
    if (furnituresOverlap(candidate, def, other, otherDef)) return false;
  }
  return true;
};
