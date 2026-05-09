import { useState, useCallback, useRef } from 'react';
import type { Point, Unit } from '../../types';
import { parseValueToCm } from '../../utils/scale';

interface PixelPoint { x: number; y: number; }

interface Props {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  unit: Unit;
  onConfirm: (polygon: Point[], roomWidth: number, roomHeight: number, cropX: number, cropY: number, cropW: number, cropH: number) => void;
  onBack: () => void;
}

const MAX_DISPLAY = 600;
const SNAP_THRESHOLD_PX = 15; // display pixels threshold for orthogonal snap

export const PolygonEditor = ({ imageUrl, imageWidth, imageHeight, unit, onConfirm, onBack }: Props) => {
  const [vertices, setVertices] = useState<PixelPoint[]>([]);
  const [phase, setPhase] = useState<'draw' | 'measure'>('draw');
  const [mouse, setMouse] = useState<PixelPoint | null>(null); // snapped, in original image px
  const [widthInput, setWidthInput] = useState('');
  const [depthInput, setDepthInput] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  const displayScale = Math.min(MAX_DISPLAY / imageWidth, MAX_DISPLAY / imageHeight);
  const dispW = imageWidth * displayScale;
  const dispH = imageHeight * displayScale;

  const applySnap = useCallback((rawPx: PixelPoint, verts: PixelPoint[]): PixelPoint => {
    if (verts.length === 0) return rawPx;
    const prev = verts[verts.length - 1];
    const dxDisp = Math.abs(rawPx.x - prev.x) * displayScale;
    const dyDisp = Math.abs(rawPx.y - prev.y) * displayScale;
    if (dyDisp < SNAP_THRESHOLD_PX) return { x: rawPx.x, y: prev.y };
    if (dxDisp < SNAP_THRESHOLD_PX) return { x: prev.x, y: rawPx.y };
    return rawPx;
  }, [displayScale]);

  const toRawPx = (e: React.MouseEvent<SVGElement>): PixelPoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / displayScale,
      y: (e.clientY - rect.top) / displayScale,
    };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGElement>) => {
    const raw = toRawPx(e);
    setVertices((verts) => {
      const snapped = applySnap(raw, verts);
      setMouse(snapped);
      return verts; // no change, just read
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayScale, applySnap]);

  const handleMouseLeave = () => setMouse(null);

  const handleClick = useCallback((e: React.MouseEvent<SVGElement>) => {
    const raw = toRawPx(e);
    setVertices((prev) => {
      const snapped = applySnap(raw, prev);
      return [...prev, snapped];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayScale, applySnap]);

  const handleUndo = () => setVertices((prev) => prev.slice(0, -1));

  const getBBox = (verts: PixelPoint[]) => {
    const xs = verts.map((v) => v.x);
    const ys = verts.map((v) => v.y);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    };
  };

  const handleConfirmMeasure = () => {
    const roomWidth = parseValueToCm(widthInput || '0', unit);
    const roomHeight = parseValueToCm(depthInput || '0', unit);
    if (roomWidth <= 0 || roomHeight <= 0) return;
    const bbox = getBBox(vertices);
    if (bbox.w === 0 || bbox.h === 0) return;
    // x scales by width, y scales by depth independently
    const polygon: Point[] = vertices.map((v) => ({
      x: (v.x - bbox.minX) * roomWidth / bbox.w,
      y: (v.y - bbox.minY) * roomHeight / bbox.h,
    }));
    onConfirm(polygon, roomWidth, roomHeight, bbox.minX, bbox.minY, bbox.w, bbox.h);
  };

  const displayVertices = vertices.map((v) => ({ x: v.x * displayScale, y: v.y * displayScale }));
  const polygonPoints = displayVertices.map((v) => `${v.x},${v.y}`).join(' ');
  const lastDisp = displayVertices.length > 0 ? displayVertices[displayVertices.length - 1] : null;
  const mouseDisp = mouse ? { x: mouse.x * displayScale, y: mouse.y * displayScale } : null;

  if (phase === 'measure') {
    const roomWidthCm = parseValueToCm(widthInput || '0', unit);
    const roomDepthCm = parseValueToCm(depthInput || '0', unit);
    const canConfirm = roomWidthCm > 0 && roomDepthCm > 0;
    return (
      <div className="flex flex-col h-full p-6 gap-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">部屋のサイズを入力</h3>
          <p className="text-sm text-gray-500 mt-1">
            実際の部屋の横幅と奥行きを入力してください。
          </p>
        </div>

        <div className="flex justify-center">
          <svg width={dispW} height={dispH} className="border border-gray-200 rounded-lg" style={{ flexShrink: 0 }}>
            <image href={imageUrl} x={0} y={0} width={dispW} height={dispH} opacity={0.5} />
            <polygon points={polygonPoints} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth={2} />
            {displayVertices.map((v, i) => (
              <circle key={i} cx={v.x} cy={v.y} r={4} fill="#3b82f6" stroke="white" strokeWidth={1.5} />
            ))}
          </svg>
        </div>

        <div className="flex flex-col gap-3 max-w-xs">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-24 flex-shrink-0">横幅 ({unit})</label>
            <input
              type="number"
              value={widthInput}
              onChange={(e) => setWidthInput(e.target.value)}
              placeholder={unit === 'cm' ? '例: 360' : '例: 3.6'}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-300"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-24 flex-shrink-0">奥行き ({unit})</label>
            <input
              type="number"
              value={depthInput}
              onChange={(e) => setDepthInput(e.target.value)}
              placeholder={unit === 'cm' ? '例: 300' : '例: 3.0'}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <button onClick={() => setPhase('draw')} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            ← 戻る
          </button>
          <button
            onClick={handleConfirmMeasure}
            disabled={!canConfirm}
            className="ml-auto bg-blue-500 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            配置へ進む →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4 overflow-auto">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">部屋の輪郭を描く</h3>
        <p className="text-sm text-gray-500 mt-1">
          部屋の角をクリックして輪郭を描いてください（最低3点）。水平・垂直に近い線は自動でスナップします。
        </p>
      </div>

      <div className="flex justify-center overflow-auto">
        <svg
          ref={svgRef}
          width={dispW}
          height={dispH}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="border border-gray-200 rounded-lg cursor-crosshair"
          style={{ flexShrink: 0 }}
        >
          <image href={imageUrl} x={0} y={0} width={dispW} height={dispH} opacity={0.6} />
          {vertices.length >= 3 && (
            <polygon points={polygonPoints} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth={2} />
          )}
          {vertices.length === 2 && (
            <line
              x1={displayVertices[0].x} y1={displayVertices[0].y}
              x2={displayVertices[1].x} y2={displayVertices[1].y}
              stroke="#3b82f6" strokeWidth={2}
            />
          )}
          {/* Preview line from last vertex to snapped mouse */}
          {lastDisp && mouseDisp && (
            <line
              x1={lastDisp.x} y1={lastDisp.y}
              x2={mouseDisp.x} y2={mouseDisp.y}
              stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7}
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
          onClick={() => setPhase('measure')}
          disabled={vertices.length < 3}
          className="ml-auto bg-blue-500 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          輪郭を確定 →
        </button>
      </div>
    </div>
  );
};
