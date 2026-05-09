import { useState, useCallback } from 'react';
import type { Point } from '../../types';

interface PixelPoint { x: number; y: number; }

interface Props {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  imageScale: number; // px/cm in original image
  onConfirm: (polygon: Point[], offsetX: number, offsetY: number) => void; // cm coordinates
  onBack: () => void;
}

const MAX_DISPLAY = 600;

export const PolygonEditor = ({ imageUrl, imageWidth, imageHeight, imageScale, onConfirm, onBack }: Props) => {
  const [vertices, setVertices] = useState<PixelPoint[]>([]);

  const displayScale = Math.min(MAX_DISPLAY / imageWidth, MAX_DISPLAY / imageHeight);
  const dispW = imageWidth * displayScale;
  const dispH = imageHeight * displayScale;

  const handleClick = useCallback((e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / displayScale; // original image px
    const y = (e.clientY - rect.top) / displayScale;
    setVertices((prev) => [...prev, { x, y }]);
  }, [displayScale]);

  const handleUndo = () => setVertices((prev) => prev.slice(0, -1));

  const handleConfirm = () => {
    if (vertices.length < 3) return;
    // Convert px to cm
    const cmPolygon: Point[] = vertices.map((v) => ({
      x: v.x / imageScale,
      y: v.y / imageScale,
    }));
    onConfirm(cmPolygon, 0, 0);
  };

  const displayVertices = vertices.map((v) => ({
    x: v.x * displayScale,
    y: v.y * displayScale,
  }));

  const polygonPoints = displayVertices.map((v) => `${v.x},${v.y}`).join(' ');

  return (
    <div className="flex flex-col h-full p-6 gap-4 overflow-auto">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">部屋の輪郭を描く</h3>
        <p className="text-sm text-gray-500 mt-1">
          部屋の角をクリックして輪郭を描いてください（最低3点）。クローゼットなどの凹みも角ごとにクリックして輪郭に含めてください。
        </p>
      </div>

      <div className="flex justify-center overflow-auto">
        <svg
          width={dispW}
          height={dispH}
          onClick={handleClick}
          className="border border-gray-200 rounded-lg cursor-crosshair"
          style={{ flexShrink: 0 }}
        >
          <image href={imageUrl} x={0} y={0} width={dispW} height={dispH} opacity={0.6} />
          {vertices.length >= 3 && (
            <polygon
              points={polygonPoints}
              fill="rgba(59,130,246,0.15)"
              stroke="#3b82f6"
              strokeWidth={2}
            />
          )}
          {vertices.length === 2 && (
            <line
              x1={displayVertices[0].x} y1={displayVertices[0].y}
              x2={displayVertices[1].x} y2={displayVertices[1].y}
              stroke="#3b82f6" strokeWidth={2}
            />
          )}
          {displayVertices.map((v, i) => (
            <g key={i}>
              <circle cx={v.x} cy={v.y} r={6} fill="#3b82f6" stroke="white" strokeWidth={2} />
              <text x={v.x + 8} y={v.y - 8} fontSize={10} fill="#1d4ed8" fontWeight="bold">{i + 1}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>頂点数: <strong>{vertices.length}</strong></span>
        {vertices.length >= 3 && <span className="text-green-600">✓ 輪郭を確定できます</span>}
        {vertices.length < 3 && <span className="text-gray-400">あと{3 - vertices.length}点必要</span>}
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          ← 戻る
        </button>
        <button
          onClick={handleUndo}
          disabled={vertices.length === 0}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          ↩ 1点削除
        </button>
        <button
          onClick={() => setVertices([])}
          disabled={vertices.length === 0}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          全消去
        </button>
        <button
          onClick={handleConfirm}
          disabled={vertices.length < 3}
          className="ml-auto bg-blue-500 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          輪郭を確定 ✓
        </button>
      </div>
    </div>
  );
};
