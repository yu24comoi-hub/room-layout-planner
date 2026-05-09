import { useDraggable } from '@dnd-kit/core';
import type { FurnitureDefinition } from '../types';
import { useStore } from '../store/useStore';
import { displayValue } from '../utils/scale';

interface Props {
  def: FurnitureDefinition;
  onDelete: () => void;
}

export const FurnitureCard = ({ def, onDelete }: Props) => {
  const { unit } = useStore();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${def.id}`,
    data: { type: 'palette', defId: def.id },
  });

  return (
    <div
      className={`group relative flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:border-gray-200 bg-white hover:shadow-sm transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
    >
      <div
        className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-600"
        style={{ backgroundColor: def.color }}
      >
        {def.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700 truncate">{def.name}</div>
        <div className="text-xs text-gray-400">
          {displayValue(def.width, unit)} × {displayValue(def.height, unit)}
        </div>
      </div>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 text-xs flex-shrink-0 transition-all"
        title="削除"
      >
        ✕
      </button>
    </div>
  );
};
