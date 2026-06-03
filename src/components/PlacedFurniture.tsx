import { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { PlacedFurniture as PlacedFurnitureType, FurnitureDefinition } from '../types';
import { useStore } from '../store/useStore';
import { ICON_RENDERERS } from './FurnitureIcon';

interface Props {
  placed: PlacedFurnitureType;
  def: FurnitureDefinition;
  pxPerCm: number;
  selected: boolean;
  onClick: () => void;
  invalid: boolean;
}

export const PlacedFurniture = ({ placed, def, pxPerCm, selected, onClick, invalid }: Props) => {
  const { setFurnitureRotation, setFurnitureSize, removePlacedFurniture } = useStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: placed.id,
    data: { type: 'placed' },
  });

  const rotation = placed.rotation ?? 0;
  const effectiveW = placed.widthOverride ?? def.width;
  const effectiveH = placed.heightOverride ?? def.height;
  // Flip control bar below the furniture when it's near the top of the canvas
  const showControlsBelow = placed.y * pxPerCm < 64;
  const pxW = effectiveW * pxPerCm;
  const pxH = effectiveH * pxPerCm;
  const iconFn = ICON_RENDERERS[def.id];

  // Local input state for size fields (commit on blur/Enter)
  const [wInput, setWInput] = useState(String(effectiveW));
  const [hInput, setHInput] = useState(String(effectiveH));

  useEffect(() => {
    setWInput(String(placed.widthOverride ?? def.width));
    setHInput(String(placed.heightOverride ?? def.height));
  }, [placed.widthOverride, placed.heightOverride, def.width, def.height]);

  const commitSize = () => {
    const w = parseFloat(wInput);
    const h = parseFloat(hInput);
    if (w > 0 && h > 0) {
      setFurnitureSize(placed.id, w, h);
    } else {
      setWInput(String(effectiveW));
      setHInput(String(effectiveH));
    }
  };

  const dragTranslate = transform
    ? `translate3d(${transform.x}px,${transform.y}px,0) `
    : '';

  const inputStyle: React.CSSProperties = {
    width: 44,
    background: '#1F1E1B',
    border: '1px solid #3A3832',
    borderRadius: 4,
    padding: '1px 4px',
    fontSize: 11,
    color: '#E0D9CA',
    outline: 'none',
    textAlign: 'center',
  };

  return (
    // Outer: sets position based on unrotated bounding box; controls anchor here
    <div
      style={{
        position: 'absolute',
        left: placed.x * pxPerCm,
        top: placed.y * pxPerCm,
        width: pxW,
        height: pxH,
        zIndex: isDragging ? 20 : selected ? 10 : 2,
      }}
    >
      {/* Controls — anchored above the unrotated bounding box, always upright */}
      {selected && !isDragging && (
        <div
          style={{
            position: 'absolute',
            ...(showControlsBelow
              ? { top: '100%', marginTop: 6 }
              : { bottom: '100%', marginBottom: 6 }),
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#272520',
            border: '1px solid #35342F',
            borderRadius: 8,
            padding: '4px 10px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
            zIndex: 200,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Size inputs */}
          <span style={{ fontSize: 10, color: '#7A7468' }}>W</span>
          <input
            type="number"
            min={1}
            value={wInput}
            onChange={(e) => setWInput(e.target.value)}
            onBlur={commitSize}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            style={inputStyle}
          />
          <span style={{ fontSize: 10, color: '#7A7468' }}>H</span>
          <input
            type="number"
            min={1}
            value={hInput}
            onChange={(e) => setHInput(e.target.value)}
            onBlur={commitSize}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            style={inputStyle}
          />
          <span style={{ fontSize: 10, color: '#4A4840' }}>cm</span>

          <div style={{ width: 1, height: 12, background: '#35342F', margin: '0 2px' }} />

          {/* Rotation controls */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFurnitureRotation(placed.id, (rotation - 45 + 360) % 360);
            }}
            style={{ background: 'none', border: 'none', color: '#9A8760', cursor: 'pointer', fontSize: 11, padding: '0 2px' }}
          >
            −45°
          </button>
          <input
            type="range"
            min={0}
            max={359}
            value={rotation}
            onChange={(e) => setFurnitureRotation(placed.id, Number(e.target.value))}
            style={{ width: 80, accentColor: '#C8A458', verticalAlign: 'middle' }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFurnitureRotation(placed.id, (rotation + 45) % 360);
            }}
            style={{ background: 'none', border: 'none', color: '#9A8760', cursor: 'pointer', fontSize: 11, padding: '0 2px' }}
          >
            +45°
          </button>
          <span style={{ fontSize: 10, color: '#7A7468', minWidth: 26, textAlign: 'right' }}>
            {rotation}°
          </span>

          <div style={{ width: 1, height: 12, background: '#35342F', margin: '0 2px' }} />

          <button
            onClick={(e) => {
              e.stopPropagation();
              removePlacedFurniture(placed.id);
            }}
            style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', fontSize: 11, padding: '0 2px' }}
          >
            ✕ 削除
          </button>
        </div>
      )}

      {/* Inner: rotated + draggable */}
      <div
        ref={setNodeRef}
        style={{
          position: 'absolute',
          inset: 0,
          transform: `${dragTranslate}rotate(${rotation}deg)`,
          transformOrigin: 'center center',
          borderRadius: 4,
          border: invalid
            ? '2px solid #ef4444'
            : selected
            ? '2px solid #C8A458'
            : '1.5px solid rgba(0,0,0,0.2)',
          boxShadow: selected && !isDragging
            ? '0 0 0 3px rgba(200,164,88,0.25)'
            : '0 2px 6px rgba(0,0,0,0.3)',
          userSelect: 'none',
          touchAction: 'none',
          overflow: 'hidden',
          opacity: isDragging ? 0.75 : 1,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        {...listeners}
        {...attributes}
      >
        {/* Icon — proportionally rendered at actual furniture pixel dimensions */}
        <svg
          width={pxW}
          height={pxH}
          viewBox={`0 0 ${pxW} ${pxH}`}
          fill="none"
          style={{ position: 'absolute', inset: 0 }}
        >
          {iconFn ? (
            iconFn(def.color, pxW, pxH)
          ) : (
            <rect x="0" y="0" width={pxW} height={pxH} rx="4" fill={def.color} opacity="0.75" />
          )}
        </svg>

        {/* Name label — only when large enough */}
        {pxW > 50 && pxH > 30 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            pointerEvents: 'none',
          }}>
            <span style={{
              fontSize: Math.max(8, Math.min(11, pxW / 9)),
              fontWeight: 600,
              color: 'rgba(0,0,0,0.5)',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}>
              {def.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
