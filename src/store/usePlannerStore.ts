import { useState, useEffect, useCallback } from 'react';
import type { AppState, Unit, PlacedFurniture, FurnitureDefinition, FloorplanSettings, HistoryState } from '../types';
import { PRESET_FURNITURE_DEFINITIONS, NEUTRAL_FURNITURE_COLORS } from '../data';

const STORAGE_KEY = 'interior-planner-state-v2';
const CURRENT_VERSION = 2;

const DEFAULT_FLOORPLAN: FloorplanSettings = {
  image: null,
  scalePoints: [],
  scaleCm: null,
  pxPerCm: null,
  polygon: [],
  polygonEnabled: false,
};

const DEFAULT_STATE: AppState = {
  unit: 'cm',
  room: { width: 450, height: 360 },
  furnitureDefinitions: PRESET_FURNITURE_DEFINITIONS,
  placedFurniture: [
    {
      id: 'init-bed',
      defId: 'double_bed',
      name: 'ダブルベッド',
      width: 140,
      height: 200,
      x: 100,
      y: 130,
      rotation: 0,
      color: '#C8B89A',
    },
    {
      id: 'init-sofa',
      defId: 'sofa',
      name: 'ソファ',
      width: 180,
      height: 90,
      x: 320,
      y: 280,
      rotation: 180,
      color: '#8E9DB5',
    },
    {
      id: 'init-tv',
      defId: 'tv_stand',
      name: 'テレビ台',
      width: 150,
      height: 45,
      x: 320,
      y: 40,
      rotation: 180,
      color: '#7A8FA8',
    },
  ],
  floorplan: DEFAULT_FLOORPLAN,
};

function migrateSavedState(raw: any): AppState {
  if (!raw) return DEFAULT_STATE;
  try {
    const version = raw.version ?? 0;
    let data = raw.state ? { ...raw.state } : { ...raw };

    if (version < 1) {
      if (Array.isArray(data.placedFurniture)) {
        data.placedFurniture = data.placedFurniture.map((f: any) => {
          const rotation = f.rotated ? 90 : (f.rotation ?? 0);
          const { rotated, ...clean } = f;
          return { ...clean, rotation };
        });
      }
    }

    if (version < 2) {
      if (Array.isArray(data.placedFurniture)) {
        data.placedFurniture = data.placedFurniture.map((f: any, idx: number) => ({
          ...f,
          color: f.color || NEUTRAL_FURNITURE_COLORS[idx % NEUTRAL_FURNITURE_COLORS.length],
        }));
      }
    }

    return {
      unit: data.unit ?? DEFAULT_STATE.unit,
      room: {
        width: Number(data.room?.width ?? DEFAULT_STATE.room.width),
        height: Number(data.room?.height ?? DEFAULT_STATE.room.height),
      },
      furnitureDefinitions: data.furnitureDefinitions ?? DEFAULT_STATE.furnitureDefinitions,
      placedFurniture: data.placedFurniture ?? DEFAULT_STATE.placedFurniture,
      floorplan: {
        image: data.floorplan?.image ?? DEFAULT_FLOORPLAN.image,
        scalePoints: data.floorplan?.scalePoints ?? DEFAULT_FLOORPLAN.scalePoints,
        scaleCm: data.floorplan?.scaleCm ?? DEFAULT_FLOORPLAN.scaleCm,
        pxPerCm: data.floorplan?.pxPerCm ?? DEFAULT_FLOORPLAN.pxPerCm,
        polygon: data.floorplan?.polygon ?? DEFAULT_FLOORPLAN.polygon,
        polygonEnabled: data.floorplan?.polygonEnabled ?? DEFAULT_FLOORPLAN.polygonEnabled,
      },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function getInitialState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_STATE;
  try {
    return migrateSavedState(JSON.parse(raw));
  } catch {
    return DEFAULT_STATE;
  }
}

const listeners = new Set<() => void>();
let globalState = getInitialState();
let undoStack: HistoryState[] = [];
let redoStack: HistoryState[] = [];

function saveToStorage(state: AppState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CURRENT_VERSION, state }));
}

function updateGlobalState(
  nextState: Partial<AppState> | ((prev: AppState) => AppState),
  skipHistory = false,
) {
  const prevState = globalState;
  const next = typeof nextState === 'function' ? nextState(prevState) : { ...prevState, ...nextState };

  if (!skipHistory) {
    const layoutChanged =
      JSON.stringify(prevState.room) !== JSON.stringify(next.room) ||
      JSON.stringify(prevState.placedFurniture) !== JSON.stringify(next.placedFurniture) ||
      prevState.unit !== next.unit ||
      JSON.stringify(prevState.floorplan) !== JSON.stringify(next.floorplan);

    if (layoutChanged) {
      undoStack.push({
        unit: prevState.unit,
        room: { ...prevState.room },
        placedFurniture: JSON.parse(JSON.stringify(prevState.placedFurniture)),
        floorplan: JSON.parse(JSON.stringify(prevState.floorplan)),
      });
      if (undoStack.length > 50) undoStack.shift();
      redoStack = [];
    }
  }

  globalState = next;
  saveToStorage(globalState);
  listeners.forEach((l) => l());
}

export function usePlannerStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handle = () => setTick((t) => t + 1);
    listeners.add(handle);
    return () => { listeners.delete(handle); };
  }, []);

  const setUnit = useCallback((unit: Unit) => updateGlobalState({ unit }), []);

  const setRoomDimensions = useCallback((width: number, height: number) =>
    updateGlobalState((prev) => ({ ...prev, room: { width, height } })), []);

  const setPlacedFurniture = useCallback((placedFurniture: PlacedFurniture[]) =>
    updateGlobalState({ placedFurniture }), []);

  const addPlacedFurniture = useCallback((item: PlacedFurniture) =>
    updateGlobalState((prev) => ({ ...prev, placedFurniture: [...prev.placedFurniture, item] })), []);

  const updatePlacedFurnitureInstance = useCallback((id: string, updates: Partial<PlacedFurniture>) =>
    updateGlobalState((prev) => ({
      ...prev,
      placedFurniture: prev.placedFurniture.map((f) => f.id === id ? { ...f, ...updates } : f),
    })), []);

  const deletePlacedFurniture = useCallback((id: string) =>
    updateGlobalState((prev) => ({
      ...prev,
      placedFurniture: prev.placedFurniture.filter((f) => f.id !== id),
    })), []);

  const addFurnitureDefinition = useCallback((def: FurnitureDefinition) =>
    updateGlobalState((prev) => ({
      ...prev,
      furnitureDefinitions: [...prev.furnitureDefinitions, def],
    })), []);

  const updateFurnitureDefinition = useCallback((id: string, updates: Partial<FurnitureDefinition>) =>
    updateGlobalState((prev) => ({
      ...prev,
      furnitureDefinitions: prev.furnitureDefinitions.map((d) => d.id === id ? { ...d, ...updates } : d),
    })), []);

  const removeFurnitureDefinition = useCallback((id: string) => {
    updateGlobalState((prev) => ({
      ...prev,
      furnitureDefinitions: prev.furnitureDefinitions.filter((d) => d.id !== id),
      placedFurniture: prev.placedFurniture.filter((f) => f.defId !== id),
    }));
  }, []);

  const setFloorplan = useCallback((updates: Partial<FloorplanSettings>) =>
    updateGlobalState((prev) => ({
      ...prev,
      floorplan: { ...prev.floorplan, ...updates },
    })), []);

  const resetAll = useCallback(() =>
    updateGlobalState({
      placedFurniture: [],
      floorplan: DEFAULT_FLOORPLAN,
    }), []);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack.pop()!;
    redoStack.push({
      unit: globalState.unit,
      room: { ...globalState.room },
      placedFurniture: JSON.parse(JSON.stringify(globalState.placedFurniture)),
      floorplan: JSON.parse(JSON.stringify(globalState.floorplan)),
    });
    updateGlobalState({ unit: prev.unit, room: prev.room, placedFurniture: prev.placedFurniture, floorplan: prev.floorplan }, true);
  }, []);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack.pop()!;
    undoStack.push({
      unit: globalState.unit,
      room: { ...globalState.room },
      placedFurniture: JSON.parse(JSON.stringify(globalState.placedFurniture)),
      floorplan: JSON.parse(JSON.stringify(globalState.floorplan)),
    });
    updateGlobalState({ unit: next.unit, room: next.room, placedFurniture: next.placedFurniture, floorplan: next.floorplan }, true);
  }, []);

  return {
    state: globalState,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    setUnit,
    setRoomDimensions,
    setPlacedFurniture,
    addPlacedFurniture,
    updatePlacedFurnitureInstance,
    deletePlacedFurniture,
    addFurnitureDefinition,
    updateFurnitureDefinition,
    removeFurnitureDefinition,
    setFloorplan,
    resetAll,
    undo,
    redo,
  };
}
