import { useState } from 'react';
import { useStore } from '../store/useStore';
import { parseValueToCm, formatValue } from '../utils/scale';
import type { FurnitureDefinition } from '../types';

interface Props {
  onClose: () => void;
  editTarget?: FurnitureDefinition; // set when editing an existing definition
}

const COLORS = [
  '#C8B89A', '#BCA98A', '#8E9DB5', '#7A8FA8',
  '#A8896C', '#C2A87A', '#9A8878', '#9A8570',
  '#5A5A5E', '#B8BEC4', '#A8ADB8', '#8A8E96',
];

export const AddFurnitureModal = ({ onClose, editTarget }: Props) => {
  const { unit, addFurnitureDefinition, updateFurnitureDefinition } = useStore();
  const isEdit = !!editTarget;

  const [name, setName] = useState(editTarget?.name ?? '');
  const [width, setWidth] = useState(editTarget ? formatValue(editTarget.width, unit) : '');
  const [height, setHeight] = useState(editTarget ? formatValue(editTarget.height, unit) : '');
  const [color, setColor] = useState(editTarget?.color ?? COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseValueToCm(width, unit);
    const h = parseValueToCm(height, unit);
    if (!name.trim() || w <= 0 || h <= 0) return;
    if (isEdit && editTarget) {
      updateFurnitureDefinition(editTarget.id, { name: name.trim(), width: w, height: h, color });
    } else {
      addFurnitureDefinition({ name: name.trim(), width: w, height: h, color, isPreset: false });
    }
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#1F1E1B',
    border: '1px solid #3A3832', borderRadius: 6,
    padding: '8px 10px', fontSize: 13, color: '#E0D9CA', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: '#7A7468', marginBottom: 4, display: 'block',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#272520', border: '1px solid #35342F',
        borderRadius: 14, padding: 24, width: 320,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#E0D9CA', margin: '0 0 18px' }}>
          {isEdit ? '家具を編集' : '家具を追加'}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>名前</label>
            <input
              type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ローテーブル"
              style={inputStyle} autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>幅 ({unit})</label>
              <input
                type="number" value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder={unit === 'cm' ? '80' : '0.8'}
                style={inputStyle} min={0} step={unit === 'cm' ? 1 : 0.01}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>奥行 ({unit})</label>
              <input
                type="number" value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder={unit === 'cm' ? '80' : '0.8'}
                style={inputStyle} min={0} step={unit === 'cm' ? 1 : 0.01}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>カラー</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {COLORS.map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 24, height: 24, borderRadius: '50%',
                    backgroundColor: c, border: color === c ? '2px solid #E0D9CA' : '2px solid transparent',
                    cursor: 'pointer', transition: 'transform 0.1s',
                    transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              type="button" onClick={onClose}
              style={{
                flex: 1, border: '1px solid #35342F', borderRadius: 8,
                padding: '9px', fontSize: 12, color: '#7A7468',
                background: 'transparent', cursor: 'pointer',
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              style={{
                flex: 1, border: 'none', borderRadius: 8,
                padding: '9px', fontSize: 12, fontWeight: 600,
                background: '#C8A458', color: '#1B1A17', cursor: 'pointer',
              }}
            >
              {isEdit ? '保存' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
