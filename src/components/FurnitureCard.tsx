import { useDraggable } from '@dnd-kit/core';
import type { FurnitureDefinition } from '../types';
import { useStore } from '../store/useStore';
import { displayValue } from '../utils/scale';
import { FurnitureIcon } from './FurnitureIcon';

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
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 8,
        border: '1px solid #35342F',
        background: '#272520',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.4 : 1,
        transition: 'background 0.12s',
        userSelect: 'none',
        position: 'relative',
      }}
      onMouseEnter={(e) => !isDragging && ((e.currentTarget as HTMLElement).style.background = '#2E2C28')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#272520')}
      className="group"
    >
      <FurnitureIcon defId={def.id} name={def.name} color={def.color} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#E0D9CA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {def.name}
        </div>
        <div style={{ fontSize: 11, color: '#7A7468', marginTop: 1 }}>
          {displayValue(def.width, unit)} × {displayValue(def.height, unit)}
        </div>
      </div>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'transparent', border: 'none',
          color: '#4A4840', fontSize: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', opacity: 0, transition: 'opacity 0.12s, color 0.12s',
          flexShrink: 0,
        }}
        className="delete-btn"
        title="削除"
      >
        ✕
      </button>
      <style>{`.group:hover .delete-btn { opacity: 1 !important; } .delete-btn:hover { color: #EF4444 !important; }`}</style>
    </div>
  );
};
