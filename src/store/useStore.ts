import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Room, FurnitureDefinition, PlacedFurniture, Unit, Point } from '../types';
import { isValidPlacement } from '../utils/geometry';
import { snapToGrid } from '../utils/scale';

const PRESET_COLORS = [
  '#C8B89A', '#8E9DB5', '#A8896C', '#9A8878',
  '#C2A87A', '#9A8570', '#5A5A5E', '#B8BEC4',
  '#A8ADB8', '#BCA98A',
];

const PRESETS: FurnitureDefinition[] = [
  { id: 'preset-single-bed', name: 'シングルベッド', width: 100, height: 200, color: '#C8B89A', isPreset: true },
  { id: 'preset-double-bed', name: 'ダブルベッド', width: 140, height: 200, color: '#BCA98A', isPreset: true },
  { id: 'preset-sofa', name: 'ソファ（2人掛け）', width: 150, height: 80, color: '#8E9DB5', isPreset: true },
  { id: 'preset-dining-table', name: 'ダイニングテーブル', width: 120, height: 80, color: '#A8896C', isPreset: true },
  { id: 'preset-chair', name: '椅子', width: 45, height: 45, color: '#9A8878', isPreset: true },
  { id: 'preset-desk', name: 'デスク', width: 120, height: 60, color: '#C2A87A', isPreset: true },
  { id: 'preset-wardrobe', name: 'ワードローブ', width: 90, height: 180, color: '#9A8570', isPreset: true },
  { id: 'preset-tv-stand', name: 'テレビ台', width: 120, height: 45, color: '#5A5A5E', isPreset: true },
  { id: 'preset-fridge', name: '冷蔵庫', width: 65, height: 65, color: '#B8BEC4', isPreset: true },
  { id: 'preset-washer', name: '洗濯機', width: 60, height: 60, color: '#A8ADB8', isPreset: true },
];

interface AppState {
  unit: Unit;
  room: Room;
  furnitureDefinitions: FurnitureDefinition[];
  placedFurniture: PlacedFurniture[];
  _pfHistory: PlacedFurniture[][];

  toggleUnit: () => void;
  setRoom: (room: Partial<Room>) => void;
  setFloorPlan: (imageUrl: string, polygon: Point[], roomWidth: number, roomHeight: number, cropX: number, cropY: number, cropW: number, cropH: number) => void;
  clearFloorPlan: () => void;

  addFurnitureDefinition: (def: Omit<FurnitureDefinition, 'id'>) => void;
  updateFurnitureDefinition: (id: string, updates: Partial<Pick<FurnitureDefinition, 'name' | 'width' | 'height' | 'color'>>) => void;
  removeFurnitureDefinition: (id: string) => void;

  placeFurniture: (defId: string, x: number, y: number) => boolean;
  moveFurniture: (id: string, x: number, y: number) => boolean;
  setFurnitureRotation: (id: string, degrees: number) => void;
  setFurnitureSize: (id: string, w: number, h: number) => void;
  removePlacedFurniture: (id: string) => void;
  clearPlacedFurniture: () => void;
  undo: () => void;
}

const pushHistory = (current: PlacedFurniture[], history: PlacedFurniture[][]): PlacedFurniture[][] => {
  const next = [...history, current];
  return next.length > 50 ? next.slice(next.length - 50) : next;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      unit: 'cm',
      room: { width: 450, height: 360 },
      furnitureDefinitions: PRESETS,
      placedFurniture: [],
      _pfHistory: [],

      toggleUnit: () =>
        set((s) => ({ unit: s.unit === 'cm' ? 'm' : 'cm' })),

      setRoom: (partial) =>
        set((s) => ({ room: { ...s.room, ...partial } })),

      setFloorPlan: (imageUrl, polygon, roomWidth, roomHeight, cropX, cropY, cropW, cropH) => {
        set((s) => ({
          room: {
            ...s.room,
            width: Math.round(roomWidth),
            height: Math.round(roomHeight),
            polygon,
            floorPlanImage: imageUrl,
            imageCropX: cropX,
            imageCropY: cropY,
            imageCropW: cropW,
            imageCropH: cropH,
          },
          placedFurniture: [],
          _pfHistory: [],
        }));
      },

      clearFloorPlan: () =>
        set((s) => ({
          room: { width: s.room.width, height: s.room.height },
          placedFurniture: [],
          _pfHistory: [],
        })),

      addFurnitureDefinition: (def) =>
        set((s) => {
          const colorIdx = s.furnitureDefinitions.length % PRESET_COLORS.length;
          return {
            furnitureDefinitions: [
              ...s.furnitureDefinitions,
              { ...def, id: uuidv4(), color: def.color || PRESET_COLORS[colorIdx] },
            ],
          };
        }),

      updateFurnitureDefinition: (id, updates) =>
        set((s) => ({
          furnitureDefinitions: s.furnitureDefinitions.map((d) =>
            d.id === id ? { ...d, ...updates } : d,
          ),
        })),

      removeFurnitureDefinition: (id) =>
        set((s) => ({
          furnitureDefinitions: s.furnitureDefinitions.filter((d) => d.id !== id),
          placedFurniture: s.placedFurniture.filter((p) => p.definitionId !== id),
        })),

      placeFurniture: (defId, x, y) => {
        const { room, furnitureDefinitions, placedFurniture, _pfHistory } = get();
        const def = furnitureDefinitions.find((d) => d.id === defId);
        if (!def) return false;
        const snapped = { x: snapToGrid(x), y: snapToGrid(y) };
        const candidate: PlacedFurniture = { id: uuidv4(), definitionId: defId, x: snapped.x, y: snapped.y, rotation: 0 };
        if (!isValidPlacement(candidate, def, room.width, room.height, room.polygon, placedFurniture, furnitureDefinitions)) {
          return false;
        }
        set(() => ({
          placedFurniture: [...placedFurniture, candidate],
          _pfHistory: pushHistory(placedFurniture, _pfHistory),
        }));
        return true;
      },

      moveFurniture: (id, x, y) => {
        const { room, furnitureDefinitions, placedFurniture, _pfHistory } = get();
        const placed = placedFurniture.find((p) => p.id === id);
        if (!placed) return false;
        const def = furnitureDefinitions.find((d) => d.id === placed.definitionId);
        if (!def) return false;
        const effectiveDef = {
          ...def,
          width: placed.widthOverride ?? def.width,
          height: placed.heightOverride ?? def.height,
        };
        const snapped = { x: snapToGrid(x), y: snapToGrid(y) };
        const candidate: PlacedFurniture = { ...placed, x: snapped.x, y: snapped.y };
        if (!isValidPlacement(candidate, effectiveDef, room.width, room.height, room.polygon, placedFurniture, furnitureDefinitions)) {
          return false;
        }
        set(() => ({
          placedFurniture: placedFurniture.map((p) => p.id === id ? { ...p, x: snapped.x, y: snapped.y } : p),
          _pfHistory: pushHistory(placedFurniture, _pfHistory),
        }));
        return true;
      },

      setFurnitureRotation: (id, degrees) => {
        const { placedFurniture, _pfHistory } = get();
        set(() => ({
          placedFurniture: placedFurniture.map((p) =>
            p.id === id ? { ...p, rotation: ((degrees % 360) + 360) % 360 } : p,
          ),
          _pfHistory: pushHistory(placedFurniture, _pfHistory),
        }));
      },

      setFurnitureSize: (id, w, h) => {
        const { placedFurniture, _pfHistory } = get();
        set(() => ({
          placedFurniture: placedFurniture.map((p) =>
            p.id === id ? { ...p, widthOverride: w, heightOverride: h } : p,
          ),
          _pfHistory: pushHistory(placedFurniture, _pfHistory),
        }));
      },

      removePlacedFurniture: (id) =>
        set((s) => ({
          placedFurniture: s.placedFurniture.filter((p) => p.id !== id),
          _pfHistory: pushHistory(s.placedFurniture, s._pfHistory),
        })),

      clearPlacedFurniture: () =>
        set((s) => ({
          placedFurniture: [],
          _pfHistory: pushHistory(s.placedFurniture, s._pfHistory),
        })),

      undo: () =>
        set((s) => {
          if (s._pfHistory.length === 0) return s;
          const prev = s._pfHistory[s._pfHistory.length - 1];
          return {
            placedFurniture: prev,
            _pfHistory: s._pfHistory.slice(0, -1),
          };
        }),
    }),
    {
      name: 'room-layout-planner',
      version: 2,
      migrate: (raw: unknown, fromVersion: number) => {
        let s = raw as Record<string, unknown>;
        if (fromVersion === 0) {
          s = {
            ...s,
            placedFurniture: ((s.placedFurniture as Array<Record<string, unknown>>) ?? []).map((p) => ({
              ...p,
              rotation: p.rotated ? 90 : 0,
              rotated: undefined,
            })),
          };
        }
        if (fromVersion <= 1) {
          // Update preset furniture colors to new natural palette
          const colorMap: Record<string, string> = {
            'preset-single-bed': '#C8B89A', 'preset-double-bed': '#BCA98A',
            'preset-sofa': '#8E9DB5', 'preset-dining-table': '#A8896C',
            'preset-chair': '#9A8878', 'preset-desk': '#C2A87A',
            'preset-wardrobe': '#9A8570', 'preset-tv-stand': '#5A5A5E',
            'preset-fridge': '#B8BEC4', 'preset-washer': '#A8ADB8',
          };
          s = {
            ...s,
            furnitureDefinitions: ((s.furnitureDefinitions as Array<Record<string, unknown>>) ?? []).map((d) =>
              d.isPreset && colorMap[d.id as string]
                ? { ...d, color: colorMap[d.id as string] }
                : d,
            ),
          };
        }
        return s;
      },
      partialize: (state) => ({
        unit: state.unit,
        room: state.room,
        furnitureDefinitions: state.furnitureDefinitions,
        placedFurniture: state.placedFurniture,
        // _pfHistory is intentionally excluded from persistence
      }),
    },
  ),
);

export const getColorForNewFurniture = (count: number) =>
  PRESET_COLORS[count % PRESET_COLORS.length];
