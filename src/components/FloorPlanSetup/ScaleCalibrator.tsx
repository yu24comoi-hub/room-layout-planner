import { useState, useRef, useCallback } from 'react';
import { parseValueToCm } from '../../utils/scale';

interface PixelPoint {
  x: number;
  y: number;
}

interface Props {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  unit: 'cm' | 'm';
  onCalibrated: (imageScale: number) => void; // px/cm
  onBack: () => void;
}

const MAX_DISPLAY = 600;

export const ScaleCalibrator = ({ imageUrl, imageWidth, imageHeight, unit, onCalibrated, onBack }: Props) => {
  const [points, setPoints] = useState<PixelPoint[]>([]);
  const [distance, setDistance] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const displayScale = Math.min(MAX_DISPLAY / imageWidth, MAX_DISPLAY / imageHeight);
  const dispW = imageWidth * displayScale;
  const dispH = imageHeight * displayScale;

  const handleClick = useCallback((e: React.MouseEvent<SVGElement>) => {
    if (points.length >= 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / displayScale;
    const y = (e.clientY - rect.top) / displayScale;
    setPoints((prev) => [...prev, { x, y }]);
  }, [points, displayScale]);

  const pixelDist = points.length === 2
    ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
    : 0;

  const handleConfirm = () => {
    const realCm = parseValueToCm(distance, unit);
    if (realCm <= 0 || pixelDist <= 0) return;
    const imageScale = pixelDist / realCm; // px/cm in original image
    onCalibrated(imageScale);
  };

  return (
    <div className="flex flex-col h-full p-6 gap-4 overflow-auto">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">スケールを設定</h3>
        <p className="text-sm text-gray-500 mt-1">
          画像上の2点をクリックして、その間の実際の距離を入力してください。
        </p>
      </div>

      <div ref={containerRef} className="flex justify-center overflow-auto">
        <svg
          width={dispW}
          height={dispH}
          onClick={handleClick}
          className={`border border-gray-200 rounded-lg ${points.length < 2 ? 'cursor-crosshair' : 'cursor-default'}`}
          style={{ flexShrink: 0 }}
        >
          <image href={imageUrl} x={0} y={0} width={dispW} height={dispH} />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x * displayScale}
              cy={p.y * displayScale}
              r={6}
              fill={i === 0 ? '#3b82f6' : '#ef4444'}
              stroke="white"
              strokeWidth={2}
            />
          ))}
          {points.length === 2 && (
            <line
              x1={points[0].x * displayScale}
              y1={points[0].y * displayScale}
              x2={points[1].x * displayScale}
              y2={points[1].y * displayScale}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="4 2"
            />
          )}
        </svg>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-600">{points.length >= 1 ? '1点目: 選択済み' : '1点目をクリック'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-gray-600">{points.length >= 2 ? '2点目: 選択済み' : '2点目をクリック'}</span>
        </div>
        {points.length === 2 && (
          <button onClick={() => setPoints([])} className="text-xs text-gray-400 hover:text-gray-600 underline">
            やり直す
          </button>
        )}
      </div>

      {points.length === 2 && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700 whitespace-nowrap">2点間の実際の距離:</label>
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder={unit === 'cm' ? '例: 360' : '例: 3.6'}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm w-32 focus:outline-none focus:border-blue-400"
            min={0}
            step={unit === 'cm' ? 1 : 0.01}
            autoFocus
          />
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onBack} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          ← 戻る
        </button>
        <button
          onClick={handleConfirm}
          disabled={points.length < 2 || !distance}
          className="bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          次へ：輪郭を描く →
        </button>
      </div>
    </div>
  );
};
