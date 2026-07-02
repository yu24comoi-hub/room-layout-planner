import React, { useState, useRef, useEffect } from 'react';
import { Upload, ChevronRight, CornerDownLeft, RefreshCw, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Point } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
    image: string;
    pxPerCm: number;
    roomWidth: number;
    roomHeight: number;
    polygon: Point[];
  }) => void;
}

export const FloorplanWizard: React.FC<Props> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [clickedPoints, setClickedPoints] = useState<Point[]>([]);
  const [realCm, setRealCm] = useState(300);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setImageSrc(null);
      setImageNaturalSize(null);
      setClickedPoints([]);
      setPolygonPoints([]);
      setRealCm(300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
        setStep(2);
      };
    };
    reader.readAsDataURL(file);
  };

  const toImageSpace = (clientX: number, clientY: number): Point | null => {
    const el = imageRef.current;
    if (!el || !imageNaturalSize) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: Math.round((clientX - rect.left) * (imageNaturalSize.w / rect.width)),
      y: Math.round((clientY - rect.top) * (imageNaturalSize.h / rect.height)),
    };
  };

  const toDisplayCoords = (pt: Point): { x: string; y: string } | null => {
    const el = imageRef.current;
    if (!el || !imageNaturalSize) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: `${pt.x * (rect.width / imageNaturalSize.w)}px`,
      y: `${pt.y * (rect.height / imageNaturalSize.h)}px`,
    };
  };

  const handleConfirm = () => {
    if (!imageSrc || !imageNaturalSize || clickedPoints.length < 2) return;
    const [p1, p2] = clickedPoints;
    const pixDist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    const pxPerCm = pixDist / realCm;
    const roomWidth = Math.round(imageNaturalSize.w / pxPerCm);
    const roomHeight = Math.round(imageNaturalSize.h / pxPerCm);
    const polygonCm = polygonPoints.map((pt) => ({
      x: Math.round((pt.x / pxPerCm) * 10) / 10,
      y: Math.round((pt.y / pxPerCm) * 10) / 10,
    }));
    onComplete({ image: imageSrc, pxPerCm, roomWidth, roomHeight, polygon: polygonCm });
    onClose();
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
  };
  const panel: React.CSSProperties = {
    width: '100%', maxWidth: 896, maxHeight: '90vh',
    background: '#1F1E1B', border: '1px solid #35342F',
    borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden',
  };

  return (
    <div style={overlay}>
      <div style={panel}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #35342F', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} color="#C8A458" />
            <h3 style={{ margin: 0, color: '#E0D9CA', fontSize: 16, fontWeight: 500, fontFamily: "'Cormorant Garamond','Noto Serif JP',Georgia,serif" }}>
              間取り図アップロード
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600 }}>
            {(['UPLOADER', 'CALIBRATION', 'BOUNDS'] as const).map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 && <ChevronRight size={10} color="#4A4840" />}
                <span style={{ color: step === i + 1 ? '#C8A458' : '#7A7468' }}>{label}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>

          {/* Step 1: Upload */}
          {step === 1 && (
            <div style={{ width: '100%', maxWidth: 480 }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) loadFile(f); }}
            >
              <div
                onClick={() => document.getElementById('fp-file-input')?.click()}
                style={{ padding: '64px 24px', background: '#252420', border: '2px dashed #3A3832', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, cursor: 'pointer' }}
              >
                <Upload size={32} color="#7A7468" />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#E0D9CA', fontSize: 14, fontWeight: 600 }}>クリックまたはドロップして画像をアップロード</p>
                  <p style={{ margin: '6px 0 0', color: '#7A7468', fontSize: 12 }}>JPG, PNG, WebP 形式をサポート</p>
                </div>
                <input id="fp-file-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
              </div>
            </div>
          )}

          {/* Step 2: Calibration */}
          {step === 2 && imageSrc && (
            <div style={{ width: '100%', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative', border: '1px solid #35342F', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1B1A17' }}>
                <img ref={imageRef} src={imageSrc} alt="" onClick={(e) => {
                  const pt = toImageSpace(e.clientX, e.clientY);
                  if (!pt) return;
                  setClickedPoints((prev) => prev.length < 2 ? [...prev, pt] : [pt]);
                }} style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', cursor: 'crosshair', userSelect: 'none' }} />
                {clickedPoints.map((pt, i) => {
                  const d = toDisplayCoords(pt);
                  if (!d) return null;
                  return <div key={i} style={{ position: 'absolute', left: d.x, top: d.y, transform: 'translate(-50%,-50%)', width: 16, height: 16, borderRadius: '50%', background: '#C8A458', border: '2px solid #1B1A17', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 'bold', color: '#000' }}>{i + 1}</div>;
                })}
                {clickedPoints.length === 2 && (() => {
                  const p1 = toDisplayCoords(clickedPoints[0]);
                  const p2 = toDisplayCoords(clickedPoints[1]);
                  if (!p1 || !p2) return null;
                  return (
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#C8A458" strokeWidth={2} strokeDasharray="4 3" />
                    </svg>
                  );
                })()}
              </div>
              <div style={{ width: 280, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ background: '#252420', border: '1px solid #35342F', borderRadius: 12, padding: 16 }}>
                  <h4 style={{ margin: '0 0 8px', color: '#9A8760', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={13} /> スケール校正のやり方
                  </h4>
                  <p style={{ margin: 0, color: '#E0D9CA', fontSize: 12, lineHeight: 1.6 }}>
                    画像上の<span style={{ color: '#C8A458', fontWeight: 'bold' }}>長さが分かっている2点</span>をクリックしてください。
                  </p>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: step === 2 ? (clickedPoints.length === 2 ? '#C8A458' : '#f59e0b') : '#7A7468', fontWeight: 600 }}>
                  {clickedPoints.length === 0 && '1点目を選択してください'}
                  {clickedPoints.length === 1 && '2点目を選択してください'}
                  {clickedPoints.length === 2 && '登録完了 ✓'}
                </p>
                {clickedPoints.length === 2 && (
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#9A8760', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em' }}>2点間の実寸 (cm)</label>
                    <input type="number" value={realCm} onChange={(e) => setRealCm(Math.max(10, Number(e.target.value)))}
                      style={{ width: '100%', background: '#252420', color: '#E0D9CA', border: '1px solid #3A3832', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setClickedPoints([]); setStep(1); }} style={{ flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600, color: '#7A7468', background: 'transparent', border: '1px solid #35342F', borderRadius: 8, cursor: 'pointer' }}>戻る</button>
                  <button onClick={() => setStep(3)} disabled={clickedPoints.length < 2} style={{ flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 700, color: '#1B1A17', background: clickedPoints.length < 2 ? '#4A4840' : '#C8A458', border: 'none', borderRadius: 8, cursor: clickedPoints.length < 2 ? 'not-allowed' : 'pointer' }}>
                    次へ <ChevronRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Polygon */}
          {step === 3 && imageSrc && (
            <div style={{ width: '100%', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative', border: '1px solid #35342F', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1B1A17' }}>
                <img ref={imageRef} src={imageSrc} alt="" onClick={(e) => {
                  const pt = toImageSpace(e.clientX, e.clientY);
                  if (pt) setPolygonPoints((prev) => [...prev, pt]);
                }} style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', cursor: 'crosshair', userSelect: 'none' }} />
                {polygonPoints.map((pt, i) => {
                  const d = toDisplayCoords(pt);
                  if (!d) return null;
                  return <div key={i} style={{ position: 'absolute', left: d.x, top: d.y, transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: '#C8A458', border: '1px solid #1B1A17', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 'bold', color: '#000' }}>{i + 1}</div>;
                })}
                {polygonPoints.length > 0 && (() => {
                  const pts = polygonPoints.map(toDisplayCoords).filter(Boolean);
                  if (!pts.length) return null;
                  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p!.x} ${p!.y}`).join(' ') + (pts.length > 2 ? ' Z' : '');
                  return (
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                      <path d={d} fill="rgba(200,164,88,0.12)" stroke="#C8A458" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  );
                })()}
              </div>
              <div style={{ width: 280, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ background: '#252420', border: '1px solid #35342F', borderRadius: 12, padding: 16 }}>
                  <h4 style={{ margin: '0 0 8px', color: '#9A8760', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={13} /> 部屋の輪郭を追加
                  </h4>
                  <p style={{ margin: 0, color: '#E0D9CA', fontSize: 12, lineHeight: 1.6 }}>
                    壁の隅に沿ってクリックして<span style={{ color: '#C8A458', fontWeight: 'bold' }}>輪郭</span>を描いてください。不要な場合はそのまま確定。
                  </p>
                </div>
                <div style={{ background: '#252420', border: '1px solid #35342F', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#E0D9CA' }}>登録済みの頂点</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#7A7468' }}>{polygonPoints.length} 頂点</p>
                  </div>
                  {polygonPoints.length > 0 && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setPolygonPoints((p) => p.slice(0, -1))} style={{ padding: 6, background: '#272520', border: '1px solid #35342F', borderRadius: 6, cursor: 'pointer', color: '#7A7468' }}><CornerDownLeft size={14} /></button>
                      <button onClick={() => setPolygonPoints([])} style={{ padding: 6, background: '#272520', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#f87171' }}><RefreshCw size={14} /></button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setStep(2)} style={{ flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600, color: '#7A7468', background: 'transparent', border: '1px solid #35342F', borderRadius: 8, cursor: 'pointer' }}>戻る</button>
                  <button onClick={handleConfirm} style={{ flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 700, color: '#1B1A17', background: '#C8A458', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <CheckCircle2 size={13} /> 確定
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
