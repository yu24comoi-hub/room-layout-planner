import { useState } from 'react';
import { useStore } from '../store/useStore';
import { FurnitureCard } from './FurnitureCard';
import { AddFurnitureModal } from './AddFurnitureModal';
import type { FurnitureDefinition } from '../types';

interface Props {
  onOpenFloorPlan: () => void;
}

export const FurniturePalette = ({ onOpenFloorPlan }: Props) => {
  const { furnitureDefinitions, removeFurnitureDefinition, room } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<FurnitureDefinition | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      removeFurnitureDefinition(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const defToDelete = furnitureDefinitions.find((d) => d.id === deleteConfirm);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Section header */}
      <div style={{ padding: '14px 16px 0' }}>
        <h2 style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.14em',
          fontFamily: "'Jost', system-ui, sans-serif",
          color: '#9A8760', textTransform: 'uppercase', margin: '0 0 10px',
        }}>
          Furniture Library
        </h2>

        {/* Floor plan button */}
        <button
          onClick={onOpenFloorPlan}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 8,
            background: room.polygon ? '#1E2820' : '#252420',
            border: `1px dashed ${room.polygon ? '#3A6050' : '#3A3832'}`,
            borderRadius: 8, padding: '7px 10px',
            fontSize: 11, color: room.polygon ? '#6BA87A' : '#7A7468',
            cursor: 'pointer', marginBottom: 10,
            transition: 'background 0.12s',
          }}
        >
          <span style={{ fontSize: 14 }}>📐</span>
          <span>{room.polygon ? '✓ 間取り図が設定済み — 変更する' : '間取り図をアップロード'}</span>
        </button>
      </div>

      {/* Furniture list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {furnitureDefinitions.length === 0 && (
            <p style={{ fontSize: 11, color: '#4A4840', textAlign: 'center', padding: '16px 0' }}>
              家具がありません
            </p>
          )}
          {furnitureDefinitions.map((def) => (
            <FurnitureCard
              key={def.id}
              def={def}
              onEdit={() => setEditTarget(def)}
              onDelete={() => setDeleteConfirm(def.id)}
            />
          ))}
        </div>
      </div>

      {/* Add button */}
      <div style={{ padding: '10px 10px 12px', borderTop: '1px solid #35342F' }}>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'transparent', border: '1px solid #35342F',
            borderRadius: 8, padding: '8px',
            fontSize: 12, fontWeight: 500, color: '#9A8760',
            cursor: 'pointer', transition: 'background 0.12s, color 0.12s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#272520'; (e.currentTarget as HTMLButtonElement).style.color = '#C8A458'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#9A8760'; }}
        >
          <span style={{ fontSize: 14 }}>+</span>
          家具を追加する
        </button>
      </div>

      {/* Add modal */}
      {showAdd && <AddFurnitureModal onClose={() => setShowAdd(false)} />}

      {/* Edit modal */}
      {editTarget && (
        <AddFurnitureModal
          onClose={() => setEditTarget(null)}
          editTarget={editTarget}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && defToDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{
            background: '#272520', border: '1px solid #35342F',
            borderRadius: 12, padding: 24, width: 280,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#E0D9CA', margin: '0 0 8px' }}>家具を削除</h3>
            <p style={{ fontSize: 12, color: '#7A7468', margin: '0 0 20px', lineHeight: 1.6 }}>
              「{defToDelete.name}」を削除しますか？配置済みの家具も削除されます。
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, border: '1px solid #35342F', borderRadius: 8,
                  padding: '8px', fontSize: 12, color: '#7A7468',
                  background: 'transparent', cursor: 'pointer',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  flex: 1, border: 'none', borderRadius: 8,
                  padding: '8px', fontSize: 12, fontWeight: 600,
                  background: '#8B2020', color: '#FFD4D4', cursor: 'pointer',
                }}
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
