import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Undo2, Redo2, Download, Layers, Sparkles,
  Menu, X, Edit2, Trash2, Info,
} from 'lucide-react';
import { usePlannerStore } from './store/usePlannerStore';
import { FurnitureIcon } from './components/FurnitureIcon';
import { FurnitureModal } from './components/FurnitureModal';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { FloorplanWizard } from './components/FloorplanWizard';
import { NEUTRAL_FURNITURE_COLORS } from './data';
import type { PlacedFurniture, FurnitureDefinition, Point } from './types';
import {
  calculateDistanceIndicators,
  isFurnitureWithinBounds,
  areFurnitureColliding,
} from './utils/math';

export default function App() {
  const {
    state, canUndo, canRedo,
    setUnit, setRoomDimensions, setPlacedFurniture,
    addPlacedFurniture, updatePlacedFurnitureInstance, deletePlacedFurniture,
    addFurnitureDefinition, updateFurnitureDefinition, removeFurnitureDefinition,
    setFloorplan, undo, redo,
  } = usePlannerStore();

  const { unit, room, furnitureDefinitions, placedFurniture, floorplan } = state;

  // UI state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modal state
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [editingDef, setEditingDef] = useState<FurnitureDefinition | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FurnitureDefinition | null>(null);
  const [isFloorplanOpen, setIsFloorplanOpen] = useState(false);

  // Drag state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragStartPointer, setDragStartPointer] = useState<Point | null>(null);
  const [dragStartCenter, setDragStartCenter] = useState<Point | null>(null);
  const [dragVisualPos, setDragVisualPos] = useState<Point | null>(null);
  const [dragIsValid, setDragIsValid] = useState(true);
  const [dragPixelsMoved, setDragPixelsMoved] = useState(0);

  // Canvas scaling
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [viewportW, setViewportW] = useState(600);
  const [viewportH, setViewportH] = useState(450);

  useEffect(() => {
    const compute = () => {
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pad = window.innerWidth < 768 ? 24 : 64;
      const availW = Math.max(200, rect.width - pad);
      const availH = Math.max(200, rect.height - pad);
      const scale = Math.min(availW / room.width, availH / room.height);
      setCanvasScale(scale);
      setViewportW(room.width * scale);
      setViewportH(room.height * scale);
    };
    compute();
    const obs = new ResizeObserver(compute);
    if (canvasRef.current) obs.observe(canvasRef.current);
    window.addEventListener('resize', compute);
    return () => { obs.disconnect(); window.removeEventListener('resize', compute); };
  }, [room.width, room.height]);

  const formatDist = (cm: number) =>
    unit === 'm' ? `${(cm / 100).toFixed(2)}m` : `${Math.round(cm)}cm`;

  const selectedFurniture = useMemo(
    () => placedFurniture.find((f) => f.id === selectedId) ?? null,
    [placedFurniture, selectedId],
  );

  const indicators = useMemo(() => {
    if (!selectedFurniture || activeDragId) return [];
    return calculateDistanceIndicators(
      selectedFurniture, placedFurniture,
      room.width, room.height,
      floorplan.polygon, floorplan.polygonEnabled,
    );
  }, [selectedFurniture, placedFurniture, room, floorplan, activeDragId]);

  // Control bar position (flipped if furniture near top)
  const controlBarPos = useMemo(() => {
    if (!selectedFurniture || activeDragId) return null;
    const fxPx = selectedFurniture.x * canvasScale;
    const fyPx = selectedFurniture.y * canvasScale;
    const fHalfH = (selectedFurniture.height / 2) * canvasScale;
    const topPx = fyPx - fHalfH;
    const isFlipped = topPx < 64;
    return {
      left: `${fxPx}px`,
      top: isFlipped ? `${fyPx + fHalfH + 12}px` : `${fyPx - fHalfH - 52}px`,
    };
  }, [selectedFurniture, canvasScale, activeDragId]);

  // --- Pointer interactions ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const itemEl = target.closest('[data-placed-id]');
    if (!itemEl) { setSelectedId(null); return; }

    const fid = itemEl.getAttribute('data-placed-id')!;
    const fObj = placedFurniture.find((f) => f.id === fid);
    if (!fObj) return;

    setSelectedId(fid);
    setActiveDragId(fid);
    setDragStartPointer({ x: e.clientX, y: e.clientY });
    setDragStartCenter({ x: fObj.x, y: fObj.y });
    setDragVisualPos({ x: fObj.x, y: fObj.y });
    setDragIsValid(true);
    setDragPixelsMoved(0);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDragId || !dragStartPointer || !dragStartCenter) return;
    const dx = e.clientX - dragStartPointer.x;
    const dy = e.clientY - dragStartPointer.y;
    const moved = Math.hypot(dx, dy);
    setDragPixelsMoved(moved);
    if (moved < 5) return;

    const snappedX = Math.round((dragStartCenter.x + dx / canvasScale) / 10) * 10;
    const snappedY = Math.round((dragStartCenter.y + dy / canvasScale) / 10) * 10;

    const moving = placedFurniture.find((f) => f.id === activeDragId);
    if (!moving) return;

    const candidate: PlacedFurniture = { ...moving, x: snappedX, y: snappedY };
    const inBounds = isFurnitureWithinBounds(candidate, room.width, room.height, floorplan.polygon, floorplan.polygonEnabled);
    const colliding = placedFurniture.filter((o) => o.id !== activeDragId).some((o) => areFurnitureColliding(candidate, o));

    setDragVisualPos({ x: snappedX, y: snappedY });
    setDragIsValid(inBounds && !colliding);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDragId) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}

    if (dragPixelsMoved >= 5 && dragVisualPos && dragIsValid) {
      updatePlacedFurnitureInstance(activeDragId, { x: dragVisualPos.x, y: dragVisualPos.y });
    }

    setActiveDragId(null);
    setDragStartPointer(null);
    setDragStartCenter(null);
    setDragPixelsMoved(0);
  };

  // --- Furniture library actions ---
  const handleInstantiate = useCallback((def: FurnitureDefinition) => {
    const cx = Math.round(room.width / 2 / 10) * 10;
    const cy = Math.round(room.height / 2 / 10) * 10;
    const color = NEUTRAL_FURNITURE_COLORS[placedFurniture.length % NEUTRAL_FURNITURE_COLORS.length];

    const item: PlacedFurniture = {
      id: `placed-${Date.now()}`,
      defId: def.id,
      name: def.name,
      width: def.defaultWidth,
      height: def.defaultHeight,
      x: cx,
      y: cy,
      rotation: 0,
      color: (def as any)._color || color,
    };

    const valid = isFurnitureWithinBounds(item, room.width, room.height, floorplan.polygon, floorplan.polygonEnabled);
    if (!valid && floorplan.polygonEnabled && floorplan.polygon.length > 0) {
      const pt = floorplan.polygon[0];
      item.x = Math.round(pt.x / 10) * 10;
      item.y = Math.round(pt.y / 10) * 10;
    }

    addPlacedFurniture(item);
    setSelectedId(item.id);
    setIsMobileDrawerOpen(false);
  }, [room, floorplan, placedFurniture.length, addPlacedFurniture]);

  const handleSaveDefinition = (data: { name: string; defaultWidth: number; defaultHeight: number; color: string }) => {
    if (editingDef) {
      updateFurnitureDefinition(editingDef.id, {
        name: data.name,
        defaultWidth: data.defaultWidth,
        defaultHeight: data.defaultHeight,
      } as any);
      // Update placed furniture names
      setPlacedFurniture(
        placedFurniture.map((f) => f.defId === editingDef.id ? { ...f, name: data.name } : f),
      );
    } else {
      const newDef: FurnitureDefinition & { _color?: string } = {
        id: `custom-${Date.now()}`,
        name: data.name,
        defaultWidth: data.defaultWidth,
        defaultHeight: data.defaultHeight,
        iconType: 'custom',
        isCustom: true,
        _color: data.color,
      };
      addFurnitureDefinition(newDef);
    }
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    removeFurnitureDefinition(itemToDelete.id);
    if (selectedFurniture?.defId === itemToDelete.id) setSelectedId(null);
  };

  const handleFloorplanComplete = (data: { image: string; pxPerCm: number; roomWidth: number; roomHeight: number; polygon: Point[] }) => {
    setRoomDimensions(data.roomWidth, data.roomHeight);
    setFloorplan({
      image: data.image,
      pxPerCm: data.pxPerCm,
      polygon: data.polygon,
      polygonEnabled: data.polygon.length >= 3,
    });
  };

  // PNG export
  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ratio = 2;
    const w = room.width * ratio;
    const h = room.height * ratio;
    canvas.width = w;
    canvas.height = h;

    ctx.fillStyle = '#272520';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#35342F';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(200,164,88,0.07)';
    ctx.lineWidth = 1;
    for (let gx = 10; gx < room.width; gx += 10) {
      ctx.beginPath(); ctx.moveTo(gx * ratio, 0); ctx.lineTo(gx * ratio, h); ctx.stroke();
    }
    for (let gy = 10; gy < room.height; gy += 10) {
      ctx.beginPath(); ctx.moveTo(0, gy * ratio); ctx.lineTo(w, gy * ratio); ctx.stroke();
    }

    placedFurniture.forEach((f) => {
      ctx.save();
      ctx.translate(f.x * ratio, f.y * ratio);
      ctx.rotate((f.rotation * Math.PI) / 180);
      const fw = f.width * ratio;
      const fh = f.height * ratio;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-fw / 2, -fh / 2, fw, fh, 8);
      else ctx.rect(-fw / 2, -fh / 2, fw, fh);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#1B1A17';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.name, 0, -6);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(27,26,23,0.75)';
      ctx.fillText(`${f.width} × ${f.height} cm`, 0, 10);
      ctx.restore();
    });

    const link = document.createElement('a');
    link.download = `Interior_Planner_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#1B1A17] text-[#E0D9CA] flex flex-col font-sans select-none overflow-hidden" style={{ height: '100dvh' }}>

      {/* HEADER */}
      <header className="h-[52px] px-4 bg-[#1F1E1B] border-b border-[#35342F] flex items-center justify-between z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="p-1.5 text-[#7A7468] hover:text-[#E0D9CA] transition-colors rounded-lg bg-[#272520] border border-[#35342F] md:hidden cursor-pointer"
          >
            {isMobileDrawerOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="h-6 w-[2px] rounded-sm shrink-0" style={{ background: 'linear-gradient(180deg,#C8A458 0%,#A8843A 100%)' }} />
            <h1 style={{ fontFamily: "'Cormorant Garamond','Noto Serif JP',Georgia,serif", fontSize: 17, fontWeight: 500, letterSpacing: '0.06em', color: '#E0D9CA', margin: 0, whiteSpace: 'nowrap' }}>
              Interior Planner
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Unit toggle */}
          <div className="flex items-center bg-[#252420] rounded-lg p-0.5">
            {(['cm', 'm'] as const).map((u) => (
              <button key={u} onClick={() => setUnit(u)}
                className="px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer"
                style={{ color: unit === u ? '#1B1A17' : '#7A7468', background: unit === u ? '#C8A458' : 'transparent' }}>
                {u}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-[#35342F]" />

          <button onClick={undo} disabled={!canUndo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#272520] border border-[#35342F] rounded-lg text-xs font-semibold text-[#E0D9CA] hover:bg-[#35342F] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="元に戻す">
            <Undo2 size={13} color="#C8A458" />
            <span className="hidden md:inline">Undo</span>
          </button>

          <button onClick={redo} disabled={!canRedo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#272520] border border-[#35342F] rounded-lg text-xs font-semibold text-[#E0D9CA] hover:bg-[#35342F] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="やり直す">
            <Redo2 size={13} color="#C8A458" />
            <span className="hidden md:inline">Redo</span>
          </button>

          <button onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
            style={{ background: '#C8A458', color: '#1B1A17' }}
            title="ダウンロード">
            <Download size={13} />
            <span className="hidden md:inline">Download</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex relative overflow-hidden">

        {/* Mobile backdrop */}
        {isMobileDrawerOpen && (
          <div onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" />
        )}

        {/* SIDEBAR */}
        <aside className={`
          fixed md:sticky top-0 bottom-0 left-0 h-full bg-[#1F1E1B] border-r border-[#35342F]
          flex flex-col z-50 transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] shrink-0
          w-[280px] md:w-[260px]
          ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {/* Mobile drawer header */}
          <div className="p-4 border-b border-[#35342F] flex items-center justify-between md:hidden">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A7468]">Controls</span>
            <button onClick={() => setIsMobileDrawerOpen(false)} className="p-1 text-[#7A7468] hover:text-[#E0D9CA] rounded cursor-pointer"><X size={16} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">

            {/* Room Dimensions */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#7A7468]">Room Dimensions</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-[#7A7468]">幅 (cm)</label>
                  <input type="number" value={room.width} min={50} max={2000}
                    onChange={(e) => setRoomDimensions(Math.max(50, Number(e.target.value) || 100), room.height)}
                    className="w-full text-[#E0D9CA] text-[13px] outline-none px-3 py-2 rounded font-mono"
                    style={{ background: '#272520', border: '1px solid #35342F' }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-[#7A7468]">奥行き (cm)</label>
                  <input type="number" value={room.height} min={50} max={2000}
                    onChange={(e) => setRoomDimensions(room.width, Math.max(50, Number(e.target.value) || 100))}
                    className="w-full text-[#E0D9CA] text-[13px] outline-none px-3 py-2 rounded font-mono"
                    style={{ background: '#272520', border: '1px solid #35342F' }} />
                </div>
              </div>
            </section>

            {/* Furniture Library */}
            <section className="space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#7A7468]">Furniture Library</h3>
                {floorplan.image && (
                  <button onClick={() => setFloorplan({ image: null, polygon: [], polygonEnabled: false, pxPerCm: null, scaleCm: null, scalePoints: [] })}
                    className="text-[9.5px] text-red-400 hover:text-red-300 transition-colors uppercase font-bold tracking-wider cursor-pointer">
                    間取り図解除
                  </button>
                )}
              </div>

              {/* Floorplan upload button */}
              {!floorplan.image ? (
                <button onClick={() => setIsFloorplanOpen(true)}
                  className="w-full border border-dashed border-[#3A3832] py-4 rounded-xl text-[#7A7468] hover:text-[#E0D9CA] hover:border-[#9A8760] transition-colors text-[12px] bg-transparent flex items-center justify-center gap-2 cursor-pointer">
                  <Layers size={13} />
                  <span>間取り図をアップロード</span>
                </button>
              ) : (
                <div className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: '#252420', border: '1px solid rgba(200,164,88,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[#C8A458] text-xs" style={{ background: 'rgba(200,164,88,0.1)' }}>✓</div>
                    <span className="text-[11px] text-[#E0D9CA] font-medium truncate max-w-[130px]">間取り図連動中</span>
                  </div>
                  <button onClick={() => setIsFloorplanOpen(true)} className="text-[10px] text-[#7A7468] hover:text-[#E0D9CA] underline cursor-pointer">再設定</button>
                </div>
              )}

              {/* Furniture list */}
              <div className="space-y-1.5 max-h-[45vh] overflow-y-auto">
                {furnitureDefinitions.map((def) => {
                  const color = (def as any)._color || NEUTRAL_FURNITURE_COLORS[0];
                  return (
                    <div key={def.id} onClick={() => handleInstantiate(def)}
                      className="group p-3 rounded-xl flex items-center justify-between transition-all cursor-pointer select-none"
                      style={{ background: '#252420', border: '1px solid #35342F' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(200,164,88,0.4)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#35342F')}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded flex-shrink-0 overflow-hidden" style={{ background: 'rgba(200,184,154,0.15)' }}>
                          <FurnitureIcon iconType={def.iconType} color={color} width={def.defaultWidth} height={def.defaultHeight} name={def.name} />
                        </div>
                        <div className="text-left overflow-hidden">
                          <p className="text-[13px] font-medium text-[#E0D9CA] truncate leading-tight group-hover:text-[#C8A458] transition-colors">{def.name}</p>
                          <p className="text-[11px] text-[#7A7468] mt-0.5 leading-none">{def.defaultWidth} × {def.defaultHeight} cm</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setEditingDef(def); setIsLibraryModalOpen(true); }}
                          className="p-1 text-[#7A7468] hover:text-[#E0D9CA] rounded transition-colors cursor-pointer" title="編集">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setItemToDelete(def); setIsDeleteOpen(true); }}
                          className="p-1 text-[#7A7468] hover:text-red-400 rounded transition-colors cursor-pointer" title="削除">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={() => { setEditingDef(null); setIsLibraryModalOpen(true); }}
                className="mt-4 text-[#C8A458] hover:text-[#D4B068] text-[12px] font-bold flex items-center justify-center gap-2 py-2 transition-colors cursor-pointer">
                ＋ 家具を追加する
              </button>
            </section>
          </div>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-[#35342F] text-center shrink-0">
            <p className="text-[10px] text-[#7A7468] font-medium tracking-wide uppercase flex items-center justify-center gap-1">
              <Sparkles size={10} color="#C8A458" />
              Offline Auto Save
            </p>
          </div>
        </aside>

        {/* CANVAS AREA */}
        <main ref={canvasRef} className="flex-1 min-w-0 bg-[#1B1A17] relative flex items-center justify-center overflow-hidden p-3 sm:p-6 md:p-8">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ width: `${viewportW}px`, height: `${viewportH}px`, position: 'relative', overflow: 'visible' }}
            className="shadow-2xl border-2 border-[#3A3832] select-none touch-none"
          >
            {/* Canvas background (grid) */}
            <div style={{ position: 'absolute', inset: 0, background: '#272520', overflow: 'hidden' }}>
              {/* Floorplan image */}
              {floorplan.image && (
                <img src={floorplan.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', opacity: 0.42, pointerEvents: 'none', zIndex: 0 }} />
              )}

              {/* Polygon boundary */}
              {floorplan.polygonEnabled && floorplan.polygon.length >= 3 && (
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
                  <polygon
                    points={floorplan.polygon.map((pt) => `${pt.x * canvasScale},${pt.y * canvasScale}`).join(' ')}
                    fill="transparent" stroke="#C8A458" strokeWidth={2} strokeDasharray="4 2"
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
              )}

              {/* Grid lines */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, opacity: 0.14 }}>
                {Array.from({ length: Math.floor(room.width / 10) }).map((_, i) => {
                  const cx = (i + 1) * 10;
                  return (
                    <line key={`v-${cx}`}
                      x1={cx * canvasScale} y1={0} x2={cx * canvasScale} y2={room.height * canvasScale}
                      stroke={cx % 100 === 0 ? '#C8A458' : cx % 50 === 0 ? '#E0D9CA' : '#7A7468'}
                      strokeWidth={cx % 50 === 0 ? 0.8 : 0.4} />
                  );
                })}
                {Array.from({ length: Math.floor(room.height / 10) }).map((_, i) => {
                  const cy = (i + 1) * 10;
                  return (
                    <line key={`h-${cy}`}
                      x1={0} y1={cy * canvasScale} x2={room.width * canvasScale} y2={cy * canvasScale}
                      stroke={cy % 100 === 0 ? '#C8A458' : cy % 50 === 0 ? '#E0D9CA' : '#7A7468'}
                      strokeWidth={cy % 50 === 0 ? 0.8 : 0.4} />
                  );
                })}
              </svg>
            </div>

            {/* Placed furniture */}
            {placedFurniture.map((f) => {
              const isDragging = f.id === activeDragId;
              const isSelected = f.id === selectedId;
              const cx = isDragging && dragVisualPos ? dragVisualPos.x : f.x;
              const cy = isDragging && dragVisualPos ? dragVisualPos.y : f.y;
              const pxW = f.width * canvasScale;
              const pxH = f.height * canvasScale;

              // Get iconType from definition
              const def = furnitureDefinitions.find((d) => d.id === f.defId);
              const iconType = def?.iconType ?? 'custom';

              const borderColor = isDragging && !dragIsValid ? '#ef4444' : isSelected ? '#C8A458' : 'rgba(0,0,0,0.2)';
              const boxShadow = isSelected ? (isDragging && !dragIsValid ? '0 0 0 3px rgba(239,68,68,0.25)' : '0 0 0 3px rgba(200,164,88,0.25)') : '0 2px 6px rgba(0,0,0,0.3)';

              return (
                <div key={f.id} data-placed-id={f.id}
                  style={{
                    position: 'absolute',
                    left: `${cx * canvasScale}px`,
                    top: `${cy * canvasScale}px`,
                    width: `${pxW}px`,
                    height: `${pxH}px`,
                    transform: `translate(-50%,-50%) rotate(${f.rotation}deg)`,
                    zIndex: isDragging ? 30 : isSelected ? 20 : 10,
                    borderRadius: 4,
                    border: `${isSelected ? 2 : 1.5}px solid ${borderColor}`,
                    boxShadow,
                    opacity: isDragging ? 0.8 : 1,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    overflow: 'hidden',
                    userSelect: 'none',
                  }}>
                  <FurnitureIcon iconType={iconType} name={f.name} color={f.color} width={f.width} height={f.height} />

                  {isDragging && !dragIsValid && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.1)', borderRadius: 4, pointerEvents: 'none' }} />
                  )}

                  {pxW > 40 && pxH > 24 && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px', pointerEvents: 'none', transform: `rotate(${-f.rotation}deg)`,
                    }}>
                      <span style={{ fontSize: Math.max(8, Math.min(10.5, pxW / 9)), fontWeight: 700, color: 'rgba(0,0,0,0.55)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', lineHeight: 1, letterSpacing: '-0.01em' }}>
                        {f.name}
                      </span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(0,0,0,0.45)', lineHeight: 1, marginTop: 2 }}>
                        {Math.round(f.width)} × {Math.round(f.height)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Dimension indicators */}
            {indicators.length > 0 && (
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 15, overflow: 'visible' }}>
                {indicators.map((ind, idx) => {
                  const sx = ind.start.x * canvasScale;
                  const sy = ind.start.y * canvasScale;
                  const ex = ind.end.x * canvasScale;
                  const ey = ind.end.y * canvasScale;
                  const pxLen = Math.hypot(ex - sx, ey - sy);
                  if (pxLen < 1) return null;

                  const isVert = ind.direction === 'up' || ind.direction === 'down';
                  const mx = (sx + ex) / 2;
                  const my = (sy + ey) / 2;
                  const textX = isVert ? mx + 16 : mx;
                  const textY = my;

                  return (
                    <g key={idx}>
                      <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#C8A458" strokeOpacity={0.8} strokeWidth={1} strokeDasharray="3 2" />
                      <line x1={isVert ? sx-5 : sx} y1={isVert ? sy : sy-5} x2={isVert ? sx+5 : sx} y2={isVert ? sy : sy+5} stroke="#C8A458" strokeWidth={1.5} />
                      <line x1={isVert ? ex-5 : ex} y1={isVert ? ey : ey-5} x2={isVert ? ex+5 : ex} y2={isVert ? ey : ey+5} stroke="#C8A458" strokeWidth={1.5} />
                      {pxLen >= 26 && (
                        <g>
                          <rect x={textX - 22} y={textY - 7} width={44} height={14} rx={3} fill="#1B1A17" fillOpacity={0.93} stroke="#3A3832" strokeWidth={0.5} />
                          <text x={textX} y={textY} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 9.5, fontWeight: 700, fill: '#C8A458' }}>
                            {formatDist(ind.distance)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Control bar */}
            {selectedFurniture && controlBarPos && (
              <div style={{
                position: 'absolute',
                left: controlBarPos.left,
                top: controlBarPos.top,
                transform: 'translateX(-50%)',
                zIndex: 50,
                background: '#272520',
                border: '1px solid #35342F',
                borderRadius: 8,
                padding: '6px 14px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                pointerEvents: 'auto',
              }}
                onPointerDown={(e) => e.stopPropagation()}>
                {/* Width */}
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7A7468' }}>W</span>
                <input type="number" value={Math.round(selectedFurniture.width)} min={10}
                  onChange={(e) => {
                    const v = Math.max(10, Number(e.target.value) || 10);
                    const candidate = { ...selectedFurniture, width: v };
                    if (isFurnitureWithinBounds(candidate, room.width, room.height, floorplan.polygon, floorplan.polygonEnabled)) {
                      updatePlacedFurnitureInstance(selectedFurniture.id, { width: v });
                    }
                  }}
                  style={{ width: 44, background: '#1E1C18', border: '1px solid #3A3832', borderRadius: 4, padding: '1px 4px', fontSize: 11, color: '#E0D9CA', outline: 'none', textAlign: 'center' }} />
                {/* Height */}
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7A7468' }}>H</span>
                <input type="number" value={Math.round(selectedFurniture.height)} min={10}
                  onChange={(e) => {
                    const v = Math.max(10, Number(e.target.value) || 10);
                    const candidate = { ...selectedFurniture, height: v };
                    if (isFurnitureWithinBounds(candidate, room.width, room.height, floorplan.polygon, floorplan.polygonEnabled)) {
                      updatePlacedFurnitureInstance(selectedFurniture.id, { height: v });
                    }
                  }}
                  style={{ width: 44, background: '#1E1C18', border: '1px solid #3A3832', borderRadius: 4, padding: '1px 4px', fontSize: 11, color: '#E0D9CA', outline: 'none', textAlign: 'center' }} />
                <span style={{ fontSize: 10, color: '#4A4840' }}>cm</span>

                <div style={{ width: 1, height: 12, background: '#35342F' }} />

                {/* Rotation */}
                <button onClick={() => updatePlacedFurnitureInstance(selectedFurniture.id, { rotation: (selectedFurniture.rotation - 45 + 360) % 360 })}
                  style={{ background: 'none', border: 'none', color: '#9A8760', cursor: 'pointer', fontSize: 11, padding: '0 2px' }}>
                  −45°
                </button>
                <input type="range" min={0} max={359} value={selectedFurniture.rotation}
                  onChange={(e) => updatePlacedFurnitureInstance(selectedFurniture.id, { rotation: Number(e.target.value) })}
                  style={{ width: 72, accentColor: '#C8A458', verticalAlign: 'middle' }} />
                <button onClick={() => updatePlacedFurnitureInstance(selectedFurniture.id, { rotation: (selectedFurniture.rotation + 45) % 360 })}
                  style={{ background: 'none', border: 'none', color: '#9A8760', cursor: 'pointer', fontSize: 11, padding: '0 2px' }}>
                  +45°
                </button>
                <span style={{ fontSize: 10, color: '#7A7468', minWidth: 26, textAlign: 'right' }}>{selectedFurniture.rotation}°</span>

                <div style={{ width: 1, height: 12, background: '#35342F' }} />

                <button onClick={() => { deletePlacedFurniture(selectedFurniture.id); setSelectedId(null); }}
                  style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', fontSize: 11, padding: '0 2px' }}>
                  ✕ 削除
                </button>
              </div>
            )}

            {/* Room size label */}
            <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(31,30,27,0.9)', border: '1px solid #35342F', borderRadius: 4, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#7A7468', zIndex: 10, userSelect: 'none' }}>
              {formatDist(room.width)} × {formatDist(room.height)}
            </div>

            {/* Help hint */}
            {!selectedFurniture && (
              <div className="hidden sm:flex" style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(31,30,27,0.75)', border: '1px solid #35342F', borderRadius: 4, padding: '4px 10px', fontSize: 10.5, fontWeight: 600, color: '#7A7468', zIndex: 10, userSelect: 'none', alignItems: 'center', gap: 6 }}>
                <Info size={11} color="#C8A458" />
                ライブラリから家具をクリックして配置、ドラッグで移動
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <FurnitureModal
        isOpen={isLibraryModalOpen}
        onClose={() => { setIsLibraryModalOpen(false); setEditingDef(null); }}
        onSave={handleSaveDefinition}
        initialDefinition={editingDef}
        initialColor={(editingDef as any)?._color}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setItemToDelete(null); }}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete?.name ?? ''}
      />

      <FloorplanWizard
        isOpen={isFloorplanOpen}
        onClose={() => setIsFloorplanOpen(false)}
        onComplete={handleFloorplanComplete}
      />
    </div>
  );
}
