import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useStore } from '../store/useStore';
import { PlacedFurniture as PlacedFurnitureComp } from './PlacedFurniture';
import { calcPxPerCm, displayValue } from '../utils/scale';

const GRID_CM = 10;

export interface RoomCanvasHandle {
  getCanvasRect: () => DOMRect | null;
  getPxPerCm: () => number;
  exportPng: () => void;
}

// ── Dimension line SVG helper ──────────────────────────────────────────────
function DimLine({ x1, y1, x2, y2, label }: {
  x1: number; y1: number; x2: number; y2: number; label: string;
}) {
  const isHoriz = Math.abs(x2 - x1) >= Math.abs(y2 - y1);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dist = Math.hypot(x2 - x1, y2 - y1);
  if (dist < 2) return null;

  const tick = 5;
  const showLabel = dist > 26;
  // For vertical lines, offset label rightward to avoid overlapping the line
  const lx = isHoriz ? midX : midX + 17;
  const ly = midY;
  const lw = label.length * 6 + 12;

  return (
    <g>
      {/* Dashed measurement line */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="rgba(200,164,88,0.55)" strokeWidth={1} strokeDasharray="3 2" />
      {/* Tick marks at both ends */}
      {isHoriz ? (
        <>
          <line x1={x1} y1={y1 - tick} x2={x1} y2={y1 + tick} stroke="#C8A458" strokeWidth={1.5} />
          <line x1={x2} y1={y2 - tick} x2={x2} y2={y2 + tick} stroke="#C8A458" strokeWidth={1.5} />
        </>
      ) : (
        <>
          <line x1={x1 - tick} y1={y1} x2={x1 + tick} y2={y1} stroke="#C8A458" strokeWidth={1.5} />
          <line x1={x2 - tick} y1={y2} x2={x2 + tick} y2={y2} stroke="#C8A458" strokeWidth={1.5} />
        </>
      )}
      {/* Distance label */}
      {showLabel && (
        <>
          <rect x={lx - lw / 2} y={ly - 9} width={lw} height={17} rx={3}
            fill="#18171480" />
          <text x={lx} y={ly + 4.5} textAnchor="middle"
            fontSize={9.5} fontWeight="700" fill="#C8A458"
            fontFamily="system-ui, -apple-system, sans-serif">
            {label}
          </text>
        </>
      )}
    </g>
  );
}

export const RoomCanvas = forwardRef<RoomCanvasHandle, { isMobile?: boolean }>(({ isMobile }, ref) => {
  const { room, furnitureDefinitions, placedFurniture, unit } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLDivElement>(null);
  const [pxPerCm, setPxPerCm] = useState(2);
  const [selected, setSelected] = useState<string | null>(null);
  const pxPerCmRef = useRef(pxPerCm);

  const { setNodeRef, isOver } = useDroppable({ id: 'room-canvas' });

  const setCanvasRef = useCallback((el: HTMLDivElement | null) => {
    setNodeRef(el);
    (canvasElRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [setNodeRef]);

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const scale = calcPxPerCm(clientWidth, clientHeight, room.width, room.height);
    const clamped = Math.max(0.3, scale);
    setPxPerCm(clamped);
    pxPerCmRef.current = clamped;
  }, [room.width, room.height]);

  useEffect(() => {
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateScale]);

  const exportPng = useCallback(() => {
    const px = pxPerCmRef.current;
    const w = room.width * px;
    const h = room.height * px;
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= room.width; x += GRID_CM) {
      ctx.beginPath(); ctx.moveTo(x * px, 0); ctx.lineTo(x * px, h); ctx.stroke();
    }
    for (let y = 0; y <= room.height; y += GRID_CM) {
      ctx.beginPath(); ctx.moveTo(0, y * px); ctx.lineTo(w, y * px); ctx.stroke();
    }

    if (room.polygon && room.polygon.length >= 3) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      room.polygon.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x * px, p.y * px);
        else ctx.lineTo(p.x * px, p.y * px);
      });
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      room.polygon.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x * px, p.y * px);
        else ctx.lineTo(p.x * px, p.y * px);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    placedFurniture.forEach((placed) => {
      const def = furnitureDefinitions.find((d) => d.id === placed.definitionId);
      if (!def) return;
      const fw = (placed.widthOverride ?? def.width) * px;
      const fh = (placed.heightOverride ?? def.height) * px;
      const cx = placed.x * px + fw / 2;
      const cy = placed.y * px + fh / 2;
      const angle = ((placed.rotation ?? 0) * Math.PI) / 180;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillStyle = def.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-fw / 2, -fh / 2, fw, fh, 3);
      ctx.fill();
      ctx.stroke();

      const fontSize = Math.max(8, Math.min(13, fw / 6));
      ctx.fillStyle = '#374151';
      ctx.font = `500 ${fontSize}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.name, 0, 0, fw - 8);
      ctx.restore();
    });

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'room-layout.png';
    a.click();
  }, [room, furnitureDefinitions, placedFurniture]);

  useImperativeHandle(ref, () => ({
    getCanvasRect: () => canvasElRef.current?.getBoundingClientRect() ?? null,
    getPxPerCm: () => pxPerCmRef.current,
    exportPng,
  }));

  const canvasW = room.width * pxPerCm;
  const canvasH = room.height * pxPerCm;

  // ── Grid lines (slightly brightened for readability) ─────────────────────
  const gridLines: React.ReactNode[] = [];
  for (let x = 0; x <= room.width; x += GRID_CM) {
    gridLines.push(
      <line key={`v${x}`} x1={x * pxPerCm} y1={0} x2={x * pxPerCm} y2={canvasH}
        stroke="#3C3830" strokeWidth={0.8} />
    );
  }
  for (let y = 0; y <= room.height; y += GRID_CM) {
    gridLines.push(
      <line key={`h${y}`} x1={0} y1={y * pxPerCm} x2={canvasW} y2={y * pxPerCm}
        stroke="#3C3830" strokeWidth={0.8} />
    );
  }

  // ── Dimension overlay ────────────────────────────────────────────────────
  const dimLines: React.ReactNode[] = [];
  if (selected) {
    const selPlaced = placedFurniture.find((p) => p.id === selected);
    const selDef = selPlaced
      ? furnitureDefinitions.find((d) => d.id === selPlaced.definitionId)
      : null;

    if (selPlaced && selDef) {
      const selW = selPlaced.widthOverride ?? selDef.width;
      const selH = selPlaced.heightOverride ?? selDef.height;
      const selX = selPlaced.x;
      const selY = selPlaced.y;
      const selMidX = selX + selW / 2;
      const selMidY = selY + selH / 2;

      const leftPx   = selX * pxPerCm;
      const topPx    = selY * pxPerCm;
      const rightPx  = (selX + selW) * pxPerCm;
      const bottomPx = (selY + selH) * pxPerCm;
      const midXPx   = (leftPx + rightPx) / 2;
      const midYPx   = (topPx + bottomPx) / 2;

      type NearResult = { dist: number; edge: number } | null;

      // Find the nearest furniture piece in a given cardinal direction
      // that overlaps the selected piece's perpendicular midpoint
      const getNearest = (dir: 'left' | 'right' | 'top' | 'bottom'): NearResult => {
        let best: NearResult = null;
        placedFurniture.forEach((p) => {
          if (p.id === selected) return;
          const d = furnitureDefinitions.find((fd) => fd.id === p.definitionId);
          if (!d) return;
          const pw = p.widthOverride ?? d.width;
          const ph = p.heightOverride ?? d.height;
          const pL = p.x, pT = p.y, pR = p.x + pw, pB = p.y + ph;

          let candidate: { dist: number; edge: number } | null = null;
          switch (dir) {
            case 'right':
              if (pT <= selMidY && pB >= selMidY && pL >= selX + selW)
                candidate = { dist: pL - (selX + selW), edge: pL };
              break;
            case 'left':
              if (pT <= selMidY && pB >= selMidY && pR <= selX)
                candidate = { dist: selX - pR, edge: pR };
              break;
            case 'bottom':
              if (pL <= selMidX && pR >= selMidX && pT >= selY + selH)
                candidate = { dist: pT - (selY + selH), edge: pT };
              break;
            case 'top':
              if (pL <= selMidX && pR >= selMidX && pB <= selY)
                candidate = { dist: selY - pB, edge: pB };
              break;
          }
          if (candidate && (!best || candidate.dist < best.dist)) best = candidate;
        });
        return best;
      };

      const push = (key: string, x1: number, y1: number, x2: number, y2: number, cm: number) => {
        if (cm <= 0) return;
        dimLines.push(
          <DimLine key={key} x1={x1} y1={y1} x2={x2} y2={y2}
            label={`${Math.round(cm)}cm`} />
        );
      };

      const nr = getNearest('right');
      const nl = getNearest('left');
      const nb = getNearest('bottom');
      const nt = getNearest('top');

      // Right
      if (nr) push('r', rightPx, midYPx, nr.edge * pxPerCm, midYPx, nr.dist);
      else     push('r', rightPx, midYPx, canvasW, midYPx, room.width - (selX + selW));

      // Left
      if (nl) push('l', nl.edge * pxPerCm, midYPx, leftPx, midYPx, nl.dist);
      else    push('l', 0, midYPx, leftPx, midYPx, selX);

      // Bottom
      if (nb) push('b', midXPx, bottomPx, midXPx, nb.edge * pxPerCm, nb.dist);
      else    push('b', midXPx, bottomPx, midXPx, canvasH, room.height - (selY + selH));

      // Top
      if (nt) push('t', midXPx, nt.edge * pxPerCm, midXPx, topPx, nt.dist);
      else    push('t', midXPx, 0, midXPx, topPx, selY);
    }
  }

  const polygonPts = room.polygon
    ? room.polygon.map((p) => `${p.x * pxPerCm},${p.y * pxPerCm}`).join(' ')
    : '';

  const getImgStyle = (): React.CSSProperties => {
    if (!room.floorPlanImage || !room.imageCropW || !room.imageCropH) return { display: 'none' };
    const sx = (room.width * pxPerCm) / room.imageCropW;
    const sy = (room.height * pxPerCm) / room.imageCropH;
    const cropX = room.imageCropX ?? 0;
    const cropY = room.imageCropY ?? 0;
    return {
      position: 'absolute', top: 0, left: 0,
      transformOrigin: '0 0',
      transform: `scaleX(${sx}) scaleY(${sy}) translate(${-cropX}px, ${-cropY}px)`,
      opacity: 0.35,
      pointerEvents: 'none',
      userSelect: 'none',
    };
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'auto', background: '#1B1A17', padding: isMobile ? 12 : 32,
      }}
      onClick={() => setSelected(null)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          ref={setCanvasRef}
          style={{
            width: canvasW,
            height: canvasH,
            position: 'relative',
            // Canvas floor: noticeably lighter than the surrounding #1B1A17
            background: '#3C3830',
            boxShadow: isOver
              ? '0 0 0 2px #C8A458, 0 0 40px rgba(200,164,88,0.15)'
              : '0 0 0 1px #4A4540, 0 8px 48px rgba(0,0,0,0.55)',
            overflow: 'visible',
            flexShrink: 0,
          }}
        >
          {/* Floor plan background image */}
          {room.floorPlanImage && (
            <img src={room.floorPlanImage} alt="" style={getImgStyle()} draggable={false} />
          )}

          {/* SVG layer: outside shading + grid */}
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}
            width={canvasW} height={canvasH}
          >
            {room.polygon && (
              <defs>
                <clipPath id="room-poly-clip">
                  <polygon points={polygonPts} />
                </clipPath>
                <mask id="outside-mask">
                  <rect x={0} y={0} width={canvasW} height={canvasH} fill="white" />
                  <polygon points={polygonPts} fill="black" />
                </mask>
              </defs>
            )}
            {room.polygon && (
              <rect x={0} y={0} width={canvasW} height={canvasH}
                fill="rgba(0,0,0,0.45)" mask="url(#outside-mask)" />
            )}
            <g clipPath={room.polygon ? 'url(#room-poly-clip)' : undefined}>
              {gridLines}
            </g>
          </svg>

          {/* Placed furniture */}
          {placedFurniture.map((placed) => {
            const def = furnitureDefinitions.find((d) => d.id === placed.definitionId);
            if (!def) return null;
            return (
              <PlacedFurnitureComp
                key={placed.id}
                placed={placed}
                def={def}
                pxPerCm={pxPerCm}
                selected={selected === placed.id}
                onClick={() => setSelected(placed.id)}
                invalid={false}
              />
            );
          })}

          {/* Dimension overlay (above furniture, below polygon outline) */}
          {dimLines.length > 0 && (
            <svg
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15, overflow: 'visible' }}
              width={canvasW} height={canvasH}
            >
              {dimLines}
            </svg>
          )}

          {/* Top SVG: polygon outline */}
          {room.polygon && (
            <svg
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}
              width={canvasW} height={canvasH}
            >
              <polygon points={polygonPts} fill="none"
                stroke="#C8A458" strokeWidth={1.5} strokeDasharray="6 3" opacity={0.7} />
            </svg>
          )}
        </div>

        {/* Room size label */}
        <div style={{ marginTop: 10, fontSize: 11, color: '#4A4840', userSelect: 'none' }}>
          {displayValue(room.width, unit)} × {displayValue(room.height, unit)}
          {room.polygon && ' (間取り図モード)'}
        </div>
      </div>
    </div>
  );
});

RoomCanvas.displayName = 'RoomCanvas';
