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
  const { rotateFurniture, removePlacedFurniture } = useStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: placed.id,
    data: { type: 'placed' },
  });

  const displayW = placed.rotated ? def.height : def.width;
  const displayH = placed.rotated ? def.width : def.height;
  const pxW = displayW * pxPerCm;
  const pxH = displayH * pxPerCm;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: placed.x * pxPerCm,
    top: placed.y * pxPerCm,
    width: pxW,
    height: pxH,
    transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
    zIndex: isDragging ? 20 : selected ? 10 : 2,
    opacity: isDragging ? 0.75 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    borderRadius: 4,
    border: invalid
      ? '2px solid #ef4444'
      : selected
      ? '2px solid #C8A458'
      : '1.5px solid rgba(0,0,0,0.2)',
    boxShadow: selected && !isDragging ? '0 0 0 3px rgba(200,164,88,0.25)' : '0 2px 6px rgba(0,0,0,0.3)',
    userSelect: 'none',
    touchAction: 'none',
    overflow: 'hidden',
  };

  const iconFn = ICON_RENDERERS[def.id];

  // Rotate icon 90° when furniture is rotated so orientation stays meaningful
  const iconTransform = placed.rotated
    ? `rotate(90, 20, 20)`
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      {...listeners}
      {...attributes}
    >
      {/* Icon stretched to furniture dimensions */}
      <svg
        width={pxW}
        height={pxH}
        viewBox="0 0 40 40"
        preserveAspectRatio="none"
        fill="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        <g transform={iconTransform}>
          {iconFn ? (
            iconFn(def.color)
          ) : (
            <>
              <rect x="0" y="0" width="40" height="40" fill={def.color} opacity="0.75" />
              <text x="20" y="23" textAnchor="middle" fontSize="12" fontWeight="600" fill="rgba(0,0,0,0.55)">
                {def.name[0]}
              </text>
            </>
          )}
        </g>
      </svg>

      {/* Name label — only when large enough */}
      {pxW > 50 && pxH > 30 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: '0 4px 4px',
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

      {/* Controls when selected */}
      {selected && !isDragging && (
        <div
          style={{ position: 'absolute', top: -34, left: 0, display: 'flex', gap: 4 }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); rotateFurniture(placed.id); }}
            style={{
              background: '#272520', border: '1px solid #35342F',
              borderRadius: 6, padding: '3px 9px', fontSize: 11,
              color: '#E0D9CA', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            ↻ 回転
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removePlacedFurniture(placed.id); }}
            style={{
              background: '#3A1A1A', border: '1px solid #5A2A2A',
              borderRadius: 6, padding: '3px 9px', fontSize: 11,
              color: '#FCA5A5', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
