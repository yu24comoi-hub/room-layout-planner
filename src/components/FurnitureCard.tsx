import { useDraggable } from '@dnd-kit/core';
import type { FurnitureDefinition } from '../types';
import { FurnitureIcon } from './FurnitureIcon';

interface Props {
  def: FurnitureDefinition;
  onEdit: () => void;
  onDelete: () => void;
}

export const FurnitureCard = ({ def, onEdit, onDelete }: Props) => {
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
      </div>

      {/* Action buttons — visible on hover */}
      <div
        style={{ display: 'flex', gap: 3, opacity: 0, transition: 'opacity 0.12s' }}
        className="action-btns"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          style={{
            width: 22, height: 22, borderRadius: 5,
            background: '#35342F', border: 'none',
            color: '#A0978A', fontSize: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="編集"
        >
          ✎
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            width: 22, height: 22, borderRadius: 5,
            background: '#35342F', border: 'none',
            color: '#A0978A', fontSize: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="削除"
        >
          ✕
        </button>
      </div>
      <style>{`.group:hover .action-btns { opacity: 1 !important; }`}</style>
    </div>
  );
};
