import { useRef, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useStore } from './store/useStore';
import { Header } from './components/Header';
import { RoomConfig } from './components/RoomConfig';
import { FurniturePalette } from './components/FurniturePalette';
import { RoomCanvas } from './components/RoomCanvas';
import type { RoomCanvasHandle } from './components/RoomCanvas';
import { FloorPlanSetupModal } from './components/FloorPlanSetup/FloorPlanSetupModal';
import { snapToGrid } from './utils/scale';
import type { FurnitureDefinition } from './types';

interface ActiveDrag {
  type: 'palette' | 'placed';
  def: FurnitureDefinition;
  rotation?: number;
}

export default function App() {
  const { furnitureDefinitions, placedFurniture, placeFurniture, moveFurniture, undo, _pfHistory } = useStore();
  const canvasRef = useRef<RoomCanvasHandle>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (!data) return;
    if (data.type === 'palette') {
      const def = furnitureDefinitions.find((d) => d.id === data.defId);
      if (def) setActiveDrag({ type: 'palette', def });
    } else if (data.type === 'placed') {
      const placed = placedFurniture.find((p) => p.id === event.active.id);
      if (placed) {
        const def = furnitureDefinitions.find((d) => d.id === placed.definitionId);
        if (def) setActiveDrag({ type: 'placed', def, rotation: placed.rotation ?? 0 });
      }
    }
  }, [furnitureDefinitions, placedFurniture]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over, delta } = event;
    const data = active.data.current;
    if (!data) return;

    const handle = canvasRef.current;
    if (!handle) return;
    const pxPerCm = handle.getPxPerCm();

    if (data.type === 'placed') {
      const placed = placedFurniture.find((p) => p.id === active.id);
      if (!placed) return;
      const newX = snapToGrid(placed.x + delta.x / pxPerCm);
      const newY = snapToGrid(placed.y + delta.y / pxPerCm);
      moveFurniture(placed.id as string, newX, newY);
      return;
    }

    if (data.type === 'palette' && over?.id === 'room-canvas') {
      const def = furnitureDefinitions.find((d) => d.id === data.defId);
      if (!def) return;
      const canvasRect = handle.getCanvasRect();
      if (!canvasRect) return;
      const translatedRect = active.rect.current.translated;
      if (!translatedRect) return;
      const centerX = translatedRect.left + translatedRect.width / 2 - canvasRect.left;
      const centerY = translatedRect.top + translatedRect.height / 2 - canvasRect.top;
      const x = snapToGrid(centerX / pxPerCm - def.width / 2);
      const y = snapToGrid(centerY / pxPerCm - def.height / 2);
      placeFurniture(data.defId, x, y);
    }
  }, [furnitureDefinitions, placedFurniture, placeFurniture, moveFurniture]);

  const pxPerCmNow = canvasRef.current?.getPxPerCm() ?? 2;
  const overlayW = activeDrag ? activeDrag.def.width * pxPerCmNow : 0;
  const overlayH = activeDrag ? activeDrag.def.height * pxPerCmNow : 0;
  const overlayRotation = activeDrag?.rotation ?? 0;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        <Header
          onUndo={undo}
          onDownload={() => canvasRef.current?.exportPng()}
          canUndo={_pfHistory.length > 0}
        />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left sidebar */}
          <aside style={{
            width: 260, flexShrink: 0,
            background: '#1F1E1B',
            borderRight: '1px solid #35342F',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <RoomConfig />
            <FurniturePalette onOpenFloorPlan={() => setShowFloorPlan(true)} />
          </aside>

          {/* Main canvas */}
          <main style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
            <RoomCanvas ref={canvasRef} />
          </main>
        </div>
      </div>

      {/* Drag ghost */}
      <DragOverlay dropAnimation={null}>
        {activeDrag && (
          <div style={{
            width: Math.max(overlayW, 40),
            height: Math.max(overlayH, 30),
            backgroundColor: activeDrag.def.color,
            borderRadius: 4,
            border: '1.5px solid rgba(0,0,0,0.2)',
            opacity: 0.85,
            transform: overlayRotation ? `rotate(${overlayRotation}deg)` : undefined,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.55)',
            pointerEvents: 'none',
          }}>
            {activeDrag.def.name}
          </div>
        )}
      </DragOverlay>

      {showFloorPlan && (
        <FloorPlanSetupModal onClose={() => setShowFloorPlan(false)} />
      )}
    </DndContext>
  );
}
