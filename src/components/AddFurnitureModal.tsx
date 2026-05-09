import { useState } from 'react';
import { useStore } from '../store/useStore';
import { parseValueToCm } from '../utils/scale';

interface Props {
  onClose: () => void;
}

const COLORS = [
  '#93c5fd', '#86efac', '#fcd34d', '#f9a8d4',
  '#a5b4fc', '#6ee7b7', '#fda4af', '#bfdbfe',
  '#d9f99d', '#fed7aa', '#c4b5fd', '#f0abfc',
];

export const AddFurnitureModal = ({ onClose }: Props) => {
  const { unit, addFurnitureDefinition } = useStore();
  const [name, setName] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseValueToCm(width, unit);
    const h = parseValueToCm(height, unit);
    if (!name.trim() || w <= 0 || h <= 0) return;
    addFurnitureDefinition({ name: name.trim(), width: w, height: h, color, isPreset: false });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-80">
        <h3 className="font-semibold text-gray-800 mb-4">家具を追加</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ローテーブル"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">幅 ({unit})</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder={unit === 'cm' ? '80' : '0.8'}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                min={0}
                step={unit === 'cm' ? 1 : 0.01}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">奥行 ({unit})</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder={unit === 'cm' ? '80' : '0.8'}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                min={0}
                step={unit === 'cm' ? 1 : 0.01}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">カラー</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-gray-600 scale-110' : 'border-transparent'}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
              キャンセル
            </button>
            <button type="submit" className="flex-1 bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600">
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
