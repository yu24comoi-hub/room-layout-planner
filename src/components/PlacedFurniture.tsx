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
    zIndex: isDragging ? 20 : selected ? 10 : 1,
    opacity: isDragging ? 0.7 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    borderRadius: 4,
    border: invalid
      ? '2px solid #ef4444'
      : selected
      ? '2px solid #3b82f6'
      : '1.5px solid rgba(0,0,0,0.1)',
    boxShadow: selected && !isDragging ? '0 0 0 2px rgba(59,130,246,0.3)' : undefined,
    userSelect: 'none',
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      {...listeners}
      {...attributes}
    >
      {/* Furniture label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-1">
        <span className="text-xs font-medium text-gray-700 text-center leading-tight truncate w-full text-center" style={{ fontSize: Math.max(8, Math.min(12, displayW * pxPerCm / 6)) }}>
          {def.name}
        </span>
        {displayW * pxPerCm > 60 && displayH * pxPerCm > 40 && (
          <span className="text-gray-500 text-center" style={{ fontSize: Math.max(7, Math.min(10, displayW * pxPerCm / 8)) }}>
            {displayValue(displayW, unit)}×{displayValue(displayH, unit)}
          </span>
        )}
      </div>

      {/* Controls shown when selected */}
      {selected && !isDragging && (
        <div
          className="absolute -top-8 left-0 flex gap-1 items-center"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); rotateFurniture(placed.id); }}
            className="bg-white border border-gray-200 rounded px-2 py-0.5 text-xs shadow hover:bg-gray-50 flex items-center gap-1"
            title="回転"
          >
            ↻ 回転
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removePlacedFurniture(placed.id); }}
            className="bg-white border border-red-200 rounded px-2 py-0.5 text-xs shadow hover:bg-red-50 text-red-500 flex items-center gap-1"
            title="削除"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
