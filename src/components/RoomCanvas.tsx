import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useStore } from '../store/useStore';
import { PlacedFurniture as PlacedFurnitureComp } from './PlacedFurniture';
import { calcPxPerCm, displayValue } from '../utils/scale';

const GRID_CM = 10;

export interface RoomCanvasHandle {
  getCanvasRect: () => DOMRect | null;
  getPxPerCm: () => number;
}

export const RoomCanvas = forwardRef<RoomCanvasHandle>((_, ref) => {
  const { room, furnitureDefinitions, placedFurniture, unit } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLDivElement>(null);
  const [pxPerCm, setPxPerCm] = useState(2);
  const [selected, setSelected] = useState<string | null>(null);
  const pxPerCmRef = useRef(pxPerCm);

  const { setNodeRef, isOver } = useDroppable({ id: 'room-canvas' });

  // Merge droppable ref + local canvas ref
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

  useImperativeHandle(ref, () => ({
    getCanvasRect: () => canvasElRef.current?.getBoundingClientRect() ?? null,
    getPxPerCm: () => pxPerCmRef.current,
  }));

  const canvasW = room.width * pxPerCm;
  const canvasH = room.height * pxPerCm;

  // Grid lines
  const gridLines: React.ReactNode[] = [];
  for (let x = 0; x <= room.width; x += GRID_CM) {
    gridLines.push(
      <line key={`v${x}`} x1={x * pxPerCm} y1={0} x2={x * pxPerCm} y2={canvasH} stroke="#e5e7eb" strokeWidth={0.5} />
    );
  }
  for (let y = 0; y <= room.height; y += GRID_CM) {
    gridLines.push(
      <line key={`h${y}`} x1={0} y1={y * pxPerCm} x2={canvasW} y2={y * pxPerCm} stroke="#e5e7eb" strokeWidth={0.5} />
    );
  }

  const polygonPts = room.polygon
    ? room.polygon.map((p) => `${p.x * pxPerCm},${p.y * pxPerCm}`).join(' ')
    : '';

  // Floor plan image transform: shift & scale original image so that
  // the polygon bounding box aligns with the canvas area
  const getImgStyle = (): React.CSSProperties => {
    if (!room.floorPlanImage || !room.imageCropW) return { display: 'none' };
    // Scale original image so that the crop width matches the canvas width in pixels
    const scale = (room.width * pxPerCm) / room.imageCropW;
    const imgX = -(room.imageCropX ?? 0) * scale;
    const imgY = -(room.imageCropY ?? 0) * scale;
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      transformOrigin: '0 0',
      transform: `translate(${imgX}px,${imgY}px) scale(${scale})`,
      opacity: 0.5,
      pointerEvents: 'none',
      userSelect: 'none',
    };
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-auto bg-gray-100 p-4"
      onClick={() => setSelected(null)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Room canvas */}
        <div
          ref={setCanvasRef}
          style={{
            width: canvasW,
            height: canvasH,
            position: 'relative',
            backgroundColor: 'white',
            boxShadow: isOver
              ? '0 0 0 3px #3b82f6, 0 4px 20px rgba(0,0,0,0.15)'
              : '0 2px 16px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {/* Floor plan background image */}
          {room.floorPlanImage && (
            <img
              src={room.floorPlanImage}
              alt="floor plan"
              style={getImgStyle()}
              draggable={false}
            />
          )}

          {/* Bottom SVG layer: outside shading + grid */}
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
            width={canvasW}
            height={canvasH}
          >
            {room.polygon && (
              <defs>
                <clipPath id="room-poly-clip">
                  <polygon points={polygonPts} />
                </clipPath>
                {/* Inverse clip for shading outside polygon */}
                <mask id="outside-mask">
                  <rect x={0} y={0} width={canvasW} height={canvasH} fill="white" />
                  <polygon points={polygonPts} fill="black" />
                </mask>
              </defs>
            )}
            {/* Outside shading */}
            {room.polygon && (
              <rect
                x={0} y={0} width={canvasW} height={canvasH}
                fill="rgba(0,0,0,0.12)"
                mask="url(#outside-mask)"
              />
            )}
            {/* Grid lines (clipped to polygon if exists) */}
            <g clipPath={room.polygon ? 'url(#room-poly-clip)' : undefined}>
              {gridLines}
            </g>
          </svg>

          {/* Placed furniture (z=2+) */}
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

          {/* Top SVG layer: polygon outline only */}
          {room.polygon && (
            <svg
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}
              width={canvasW}
              height={canvasH}
            >
              <polygon
                points={polygonPts}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="6 3"
              />
            </svg>
          )}
        </div>

        {/* Room size label */}
        <div className="mt-2 text-xs text-gray-400 select-none">
          {displayValue(room.width, unit)} × {displayValue(room.height, unit)}
          {room.polygon && ' (間取り図モード)'}
        </div>
      </div>
    </div>
  );
});

RoomCanvas.displayName = 'RoomCanvas';
