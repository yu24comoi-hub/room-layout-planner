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

export const RoomCanvas = forwardRef<RoomCanvasHandle>((_, ref) => {
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

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= room.width; x += GRID_CM) {
      ctx.beginPath(); ctx.moveTo(x * px, 0); ctx.lineTo(x * px, h); ctx.stroke();
    }
    for (let y = 0; y <= room.height; y += GRID_CM) {
      ctx.beginPath(); ctx.moveTo(0, y * px); ctx.lineTo(w, y * px); ctx.stroke();
    }

    // Room polygon / outside shading
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

      // Polygon outline
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

    // Furniture
    placedFurniture.forEach((placed) => {
      const def = furnitureDefinitions.find((d) => d.id === placed.definitionId);
      if (!def) return;
      const fw = (placed.rotated ? def.height : def.width) * px;
      const fh = (placed.rotated ? def.width : def.height) * px;
      ctx.fillStyle = def.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(placed.x * px, placed.y * px, fw, fh, 3);
      ctx.fill();
      ctx.stroke();

      // Label
      const fontSize = Math.max(8, Math.min(13, fw / 6));
      ctx.fillStyle = '#374151';
      ctx.font = `500 ${fontSize}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.name, placed.x * px + fw / 2, placed.y * px + fh / 2, fw - 8);
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

  // Grid lines
  const gridLines: React.ReactNode[] = [];
  for (let x = 0; x <= room.width; x += GRID_CM) {
    gridLines.push(
      <line key={`v${x}`} x1={x * pxPerCm} y1={0} x2={x * pxPerCm} y2={canvasH} stroke="#2A2924" strokeWidth={0.75} />
    );
  }
  for (let y = 0; y <= room.height; y += GRID_CM) {
    gridLines.push(
      <line key={`h${y}`} x1={0} y1={y * pxPerCm} x2={canvasW} y2={y * pxPerCm} stroke="#2A2924" strokeWidth={0.75} />
    );
  }

  const polygonPts = room.polygon
    ? room.polygon.map((p) => `${p.x * pxPerCm},${p.y * pxPerCm}`).join(' ')
    : '';

  const getImgStyle = (): React.CSSProperties => {
    if (!room.floorPlanImage || !room.imageCropW) return { display: 'none' };
    const scale = (room.width * pxPerCm) / room.imageCropW;
    const imgX = -(room.imageCropX ?? 0) * scale;
    const imgY = -(room.imageCropY ?? 0) * scale;
    return {
      position: 'absolute', top: 0, left: 0,
      transformOrigin: '0 0',
      transform: `translate(${imgX}px,${imgY}px) scale(${scale})`,
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
        overflow: 'auto', background: '#1B1A17', padding: 32,
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
            background: '#1E1D1A',
            boxShadow: isOver
              ? '0 0 0 2px #C8A458, 0 0 40px rgba(200,164,88,0.15)'
              : '0 0 0 1px #35342F, 0 8px 40px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {/* Floor plan background image */}
          {room.floorPlanImage && (
            <img src={room.floorPlanImage} alt="" style={getImgStyle()} draggable={false} />
          )}

          {/* SVG layer: outside shading + grid */}
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
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

        {/* Label */}
        <div style={{ marginTop: 10, fontSize: 11, color: '#4A4840', userSelect: 'none' }}>
          {displayValue(room.width, unit)} × {displayValue(room.height, unit)}
          {room.polygon && ' (間取り図モード)'}
        </div>
      </div>
    </div>
  );
});

RoomCanvas.displayName = 'RoomCanvas';
