import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { FurnitureDefinition } from '../types';
import { SWATCH_COLORS } from '../data';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; defaultWidth: number; defaultHeight: number; color: string }) => void;
  initialDefinition?: FurnitureDefinition | null;
  initialColor?: string;
}

export const FurnitureModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialDefinition, initialColor }) => {
  const [name, setName] = useState('');
  const [width, setWidth] = useState(80);
  const [height, setHeight] = useState(80);
  const [color, setColor] = useState(SWATCH_COLORS[0]);

  useEffect(() => {
    if (initialDefinition) {
      setName(initialDefinition.name);
      setWidth(initialDefinition.defaultWidth);
      setHeight(initialDefinition.defaultHeight);
      setColor(initialColor || SWATCH_COLORS[0]);
    } else {
      setName('');
      setWidth(80);
      setHeight(80);
      setColor(SWATCH_COLORS[Math.floor(Math.random() * SWATCH_COLORS.length)]);
    }
  }, [initialDefinition, initialColor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      defaultWidth: Math.max(10, Number(width) || 80),
      defaultHeight: Math.max(10, Number(height) || 80),
      color,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md p-6 rounded-2xl shadow-xl"
        style={{ background: '#1F1E1B', border: '1px solid #35342F' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#7A7468] hover:text-[#E0D9CA] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <h3 style={{ fontFamily: "'Cormorant Garamond', 'Noto Serif JP', Georgia, serif", color: '#E0D9CA', fontSize: 18, fontWeight: 500, marginBottom: 20, marginTop: 0 }}>
          {initialDefinition ? '家具を編集' : '家具を追加する'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-[#7A7468] mb-1.5">家具名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: カウンターチェア"
              className="w-full px-3 py-2 rounded text-sm text-[#E0D9CA] outline-none"
              style={{ background: '#272520', border: '1px solid #35342F' }}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#7A7468] mb-1.5">幅 (cm)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min={10}
                max={2000}
                className="w-full px-3 py-2 rounded text-sm text-[#E0D9CA] outline-none"
                style={{ background: '#272520', border: '1px solid #35342F' }}
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#7A7468] mb-1.5">奥行き (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                min={10}
                max={2000}
                className="w-full px-3 py-2 rounded text-sm text-[#E0D9CA] outline-none"
                style={{ background: '#272520', border: '1px solid #35342F' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-[#7A7468] mb-2">カラー</label>
            <div className="flex flex-wrap gap-2">
              {SWATCH_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform cursor-pointer"
                  style={{
                    background: c,
                    transform: color === c ? 'scale(1.2)' : 'scale(1)',
                    outline: color === c ? '2px solid #C8A458' : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              style={{ background: 'transparent', border: '1px solid #35342F', color: '#7A7468' }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              style={{ background: '#C8A458', color: '#1B1A17' }}
            >
              {initialDefinition ? '更新する' : '追加する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
