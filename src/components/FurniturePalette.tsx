import { useState } from 'react';
import { useStore } from '../store/useStore';
import { FurnitureCard } from './FurnitureCard';
import { AddFurnitureModal } from './AddFurnitureModal';

interface Props {
  onOpenFloorPlan: () => void;
}

export const FurniturePalette = ({ onOpenFloorPlan }: Props) => {
  const { furnitureDefinitions, removeFurnitureDefinition, room } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteRequest = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      removeFurnitureDefinition(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const defToDelete = furnitureDefinitions.find((d) => d.id === deleteConfirm);

  return (
    <div className="flex flex-col h-full">
      {/* Floor plan button */}
      <div className="p-3 border-b border-gray-100">
        <button
          onClick={onOpenFloorPlan}
          className="w-full flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 border border-dashed border-gray-200 hover:border-blue-300 rounded-lg p-2.5 transition-colors"
        >
          <span className="text-base">📐</span>
          <span>
            {room.polygon ? '間取り図を変更' : '間取り図をアップロード'}
          </span>
        </button>
        {room.polygon && (
          <p className="text-xs text-blue-600 mt-1.5 text-center">✓ 間取り図が設定されています</p>
        )}
      </div>

      {/* Furniture list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {furnitureDefinitions.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">家具がありません</p>
        )}
        {furnitureDefinitions.map((def) => (
          <FurnitureCard
            key={def.id}
            def={def}
            onDelete={() => handleDeleteRequest(def.id)}
          />
        ))}
      </div>

      {/* Add button */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg py-2 text-sm font-medium transition-colors"
        >
          <span>+</span>
          <span>家具を追加</span>
        </button>
      </div>

      {showAdd && <AddFurnitureModal onClose={() => setShowAdd(false)} />}

      {/* Delete confirmation */}
      {deleteConfirm && defToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-72">
            <h3 className="font-semibold text-gray-800 mb-2">家具を削除</h3>
            <p className="text-sm text-gray-600 mb-4">
              「{defToDelete.name}」を削除しますか？配置済みの家具も削除されます。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600"
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
