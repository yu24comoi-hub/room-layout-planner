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

  return (
    <div className="p-3 border-b border-gray-100">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">部屋のサイズ</h2>
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">幅</label>
          <input
            type="number"
            value={w}
            onChange={(e) => setW(e.target.value)}
            onBlur={handleApply}
            onKeyDown={handleKeyDown}
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            min={0}
            step={unit === 'cm' ? 10 : 0.1}
          />
        </div>
        <span className="text-gray-400 mt-4">×</span>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">奥行</label>
          <input
            type="number"
            value={h}
            onChange={(e) => setH(e.target.value)}
            onBlur={handleApply}
            onKeyDown={handleKeyDown}
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            min={0}
            step={unit === 'cm' ? 10 : 0.1}
          />
        </div>
        <div className="mt-4">
          <span className="text-xs text-gray-500">{unit}</span>
        </div>
      </div>
    </div>
  );
};
