import type { PlacedFurniture, Point } from '../types';

export interface Segment {
  p1: Point;
  p2: Point;
}

export function getFurnitureCorners(f: PlacedFurniture): Point[] {
  const angleRad = (f.rotation * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const hw = f.width / 2;
  const hh = f.height / 2;
  const local = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];
  return local.map((lc) => ({
    x: f.x + (lc.x * cos - lc.y * sin),
    y: f.y + (lc.x * sin + lc.y * cos),
  }));
}

export function getFurnitureSegments(f: PlacedFurniture): Segment[] {
  const c = getFurnitureCorners(f);
  return [
    { p1: c[0], p2: c[1] },
    { p1: c[1], p2: c[2] },
    { p1: c[2], p2: c[3] },
    { p1: c[3], p2: c[0] },
  ];
}

function projectPolygon(points: Point[], axis: Point): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    const dot = p.x * axis.x + p.y * axis.y;
    if (dot < min) min = dot;
    if (dot > max) max = dot;
  }
  return [min, max];
}

function normalize(v: Point): Point {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function areFurnitureColliding(f1: PlacedFurniture, f2: PlacedFurniture): boolean {
  const c1 = getFurnitureCorners(f1);
  const c2 = getFurnitureCorners(f2);
  const axes: Point[] = [];
  for (let i = 0; i < 4; i++) {
    const p1 = c1[i];
    const p2 = c1[(i + 1) % 4];
    axes.push(normalize({ x: -(p2.y - p1.y), y: p2.x - p1.x }));
  }
  for (let i = 0; i < 4; i++) {
    const p1 = c2[i];
    const p2 = c2[(i + 1) % 4];
    axes.push(normalize({ x: -(p2.y - p1.y), y: p2.x - p1.x }));
  }
  for (const axis of axes) {
    const [min1, max1] = projectPolygon(c1, axis);
    const [min2, max2] = projectPolygon(c2, axis);
    if (max1 < min2 || max2 < min1) return false;
  }
  return true;
}

export function isPointInPolygon(p: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = (yi > p.y) !== (yj > p.y) &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function findSegmentIntersection(s1: Segment, s2: Segment): Point | null {
  const { p1: a, p2: b } = s1;
  const { p1: c, p2: d } = s2;
  const denom = (d.y - c.y) * (b.x - a.x) - (d.x - c.x) * (b.y - a.y);
  if (denom === 0) return null;
  const ua = ((d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x)) / denom;
  const ub = ((b.x - a.x) * (a.y - c.y) - (b.y - a.y) * (a.x - c.x)) / denom;
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return { x: a.x + ua * (b.x - a.x), y: a.y + ua * (b.y - a.y) };
  }
  return null;
}

export function isFurnitureWithinBounds(
  f: PlacedFurniture,
  roomWidth: number,
  roomHeight: number,
  polygon: Point[],
  polygonEnabled: boolean,
): boolean {
  const corners = getFurnitureCorners(f);
  if (polygonEnabled && polygon.length >= 3) {
    for (const p of corners) {
      if (!isPointInPolygon(p, polygon)) return false;
    }
    const fSegs = getFurnitureSegments(f);
    const polySegs: Segment[] = polygon.map((p, i) => ({
      p1: p,
      p2: polygon[(i + 1) % polygon.length],
    }));
    for (const fs of fSegs) {
      for (const ps of polySegs) {
        if (findSegmentIntersection(fs, ps) !== null) return false;
      }
    }
    return true;
  }
  for (const p of corners) {
    if (p.x < 0 || p.x > roomWidth || p.y < 0 || p.y > roomHeight) return false;
  }
  return true;
}

export interface DimensionIndicator {
  direction: 'left' | 'right' | 'up' | 'down';
  start: Point;
  end: Point;
  distance: number; // cm
}

export function calculateDistanceIndicators(
  selected: PlacedFurniture,
  allFurniture: PlacedFurniture[],
  roomWidth: number,
  roomHeight: number,
  polygon: Point[],
  polygonEnabled: boolean,
): DimensionIndicator[] {
  const result: DimensionIndicator[] = [];
  const cx = selected.x;
  const cy = selected.y;
  const fSegments = getFurnitureSegments(selected);

  const findExitPoint = (dx: number, dy: number): Point => {
    const ray: Segment = {
      p1: { x: cx, y: cy },
      p2: { x: cx + dx * 10000, y: cy + dy * 10000 },
    };
    let bestPt: Point = { x: cx + dx * (selected.width / 2), y: cy + dy * (selected.height / 2) };
    let bestDist = 0;
    for (const seg of fSegments) {
      const ipt = findSegmentIntersection(ray, seg);
      if (ipt) {
        const d = Math.sqrt((ipt.x - cx) ** 2 + (ipt.y - cy) ** 2);
        if (d > bestDist) { bestDist = d; bestPt = ipt; }
      }
    }
    return bestPt;
  };

  const directions: { dir: 'left' | 'right' | 'up' | 'down'; dx: number; dy: number }[] = [
    { dir: 'left', dx: -1, dy: 0 },
    { dir: 'right', dx: 1, dy: 0 },
    { dir: 'up', dx: 0, dy: -1 },
    { dir: 'down', dx: 0, dy: 1 },
  ];

  for (const { dir, dx, dy } of directions) {
    const startPoint = findExitPoint(dx, dy);
    const ray: Segment = {
      p1: startPoint,
      p2: { x: startPoint.x + dx * 10000, y: startPoint.y + dy * 10000 },
    };

    let closestPoint: Point | null = null;
    let closestDist = Infinity;

    for (const f of allFurniture) {
      if (f.id === selected.id) continue;
      for (const seg of getFurnitureSegments(f)) {
        const ipt = findSegmentIntersection(ray, seg);
        if (ipt) {
          const d = Math.sqrt((ipt.x - startPoint.x) ** 2 + (ipt.y - startPoint.y) ** 2);
          if (d < closestDist) { closestDist = d; closestPoint = ipt; }
        }
      }
    }

    if (polygonEnabled && polygon.length >= 3) {
      for (let i = 0; i < polygon.length; i++) {
        const ipt = findSegmentIntersection(ray, { p1: polygon[i], p2: polygon[(i + 1) % polygon.length] });
        if (ipt) {
          const d = Math.sqrt((ipt.x - startPoint.x) ** 2 + (ipt.y - startPoint.y) ** 2);
          if (d < closestDist) { closestDist = d; closestPoint = ipt; }
        }
      }
    } else {
      let wall: Point | null = null;
      if (dir === 'left') wall = { x: 0, y: startPoint.y };
      if (dir === 'right') wall = { x: roomWidth, y: startPoint.y };
      if (dir === 'up') wall = { x: startPoint.x, y: 0 };
      if (dir === 'down') wall = { x: startPoint.x, y: roomHeight };
      if (wall) {
        const d = Math.sqrt((wall.x - startPoint.x) ** 2 + (wall.y - startPoint.y) ** 2);
        if (d < closestDist) { closestDist = d; closestPoint = wall; }
      }
    }

    if (closestPoint && closestDist > 0.05) {
      result.push({
        direction: dir,
        start: startPoint,
        end: closestPoint,
        distance: Math.round(closestDist * 10) / 10,
      });
    }
  }

  return result;
}
