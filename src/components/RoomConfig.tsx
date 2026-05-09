import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { formatValue, parseValueToCm } from '../utils/scale';

export const RoomConfig = () => {
  const { room, unit, setRoom } = useStore();
  const [w, setW] = useState(formatValue(room.width, unit));
  const [h, setH] = useState(formatValue(room.height, unit));

  useEffect(() => {
    setW(formatValue(room.width, unit));
    setH(formatValue(room.height, unit));
  }, [unit, room.width, room.height]);

  const handleApply = () => {
    const newW = parseValueToCm(w, unit);
    const newH = parseValueToCm(h, unit);
    if (newW > 0 && newH > 0) {
      setRoom({ width: newW, height: newH });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleApply();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#252420',
    border: '1px solid #3A3832',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 13,
    color: '#E0D9CA',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#7A7468',
    marginBottom: 4,
    display: 'block',
  };

  return (
    <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid #35342F' }}>
      <h2 style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
        color: '#9A8760', textTransform: 'uppercase', margin: '0 0 12px',
      }}>
        Room Dimensions
      </h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Width ({unit})</label>
          <input
            type="number"
            value={w}
            onChange={(e) => setW(e.target.value)}
            onBlur={handleApply}
            onKeyDown={handleKeyDown}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#C8A458')}
            onBlurCapture={(e) => (e.target.style.borderColor = '#3A3832')}
            min={0}
            step={unit === 'cm' ? 10 : 0.1}
          />
        </div>
        <span style={{ color: '#4A4840', fontSize: 13, paddingBottom: 8 }}>×</span>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Depth ({unit})</label>
          <input
            type="number"
            value={h}
            onChange={(e) => setH(e.target.value)}
            onBlur={handleApply}
            onKeyDown={handleKeyDown}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#C8A458')}
            onBlurCapture={(e) => (e.target.style.borderColor = '#3A3832')}
            min={0}
            step={unit === 'cm' ? 10 : 0.1}
          />
        </div>
        <span style={{ color: '#7A7468', fontSize: 12, paddingBottom: 8 }}>{unit}</span>
      </div>
    </div>
  );
};
