import { useDraggable } from '@dnd-kit/core';
import type { PlacedFurniture as PlacedFurnitureType, FurnitureDefinition } from '../types';
import { useStore } from '../store/useStore';
import { displayValue } from '../utils/scale';

interface Props {
  placed: PlacedFurnitureType;
  def: FurnitureDefinition;
  pxPerCm: number;
  selected: boolean;
  onClick: () => void;
  invalid: boolean;
}

export const PlacedFurniture = ({ placed, def, pxPerCm, selected, onClick, invalid }: Props) => {
  const { unit, rotateFurniture, removePlacedFurniture } = useStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: placed.id,
    data: { type: 'placed' },
  });

  const displayW = placed.rotated ? def.height : def.width;
  const displayH = placed.rotated ? def.width : def.height;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: placed.x * pxPerCm,
    top: placed.y * pxPerCm,
    width: displayW * pxPerCm,
    height: displayH * pxPerCm,
    backgroundColor: def.color,
    transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
    zIndex: isDragging ? 20 : selected ? 10 : 2,
    opacity: isDragging ? 0.75 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    borderRadius: 4,
    border: invalid
      ? '2px solid #ef4444'
      : selected
      ? '2px solid #C8A458'
      : '1.5px solid rgba(0,0,0,0.25)',
    boxShadow: selected && !isDragging ? '0 0 0 3px rgba(200,164,88,0.25)' : '0 2px 6px rgba(0,0,0,0.3)',
    userSelect: 'none',
    touchAction: 'none',
  };

  const fontSize = Math.max(8, Math.min(12, displayW * pxPerCm / 6));

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      {...listeners}
      {...attributes}
    >
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', padding: 2,
      }}>
        <span style={{
          fontSize, fontWeight: 600, color: 'rgba(0,0,0,0.65)',
          textAlign: 'center', lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}>
          {def.name}
        </span>
        {displayW * pxPerCm > 60 && displayH * pxPerCm > 40 && (
          <span style={{
            fontSize: Math.max(7, Math.min(10, displayW * pxPerCm / 8)),
            color: 'rgba(0,0,0,0.45)',
            textAlign: 'center',
          }}>
            {displayValue(displayW, unit)}×{displayValue(displayH, unit)}
          </span>
        )}
      </div>

      {selected && !isDragging && (
        <div
          style={{
            position: 'absolute', top: -32, left: 0,
            display: 'flex', gap: 4,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); rotateFurniture(placed.id); }}
            style={{
              background: '#272520', border: '1px solid #35342F',
              borderRadius: 6, padding: '3px 8px', fontSize: 11,
              color: '#E0D9CA', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            ↻ 回転
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removePlacedFurniture(placed.id); }}
            style={{
              background: '#3A1A1A', border: '1px solid #5A2A2A',
              borderRadius: 6, padding: '3px 8px', fontSize: 11,
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
