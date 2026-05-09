import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Room, FurnitureDefinition, PlacedFurniture, Unit, Point } from '../types';
import { isValidPlacement } from '../utils/geometry';
import { snapToGrid } from '../utils/scale';

const PRESET_COLORS = [
  '#93c5fd', '#86efac', '#fcd34d', '#f9a8d4',
  '#a5b4fc', '#6ee7b7', '#fda4af', '#bfdbfe',
  '#d9f99d', '#fed7aa',
];

const PRESETS: FurnitureDefinition[] = [
  { id: 'preset-single-bed', name: 'シングルベッド', width: 100, height: 200, color: '#93c5fd', isPreset: true },
  { id: 'preset-double-bed', name: 'ダブルベッド', width: 140, height: 200, color: '#bfdbfe', isPreset: true },
  { id: 'preset-sofa', name: 'ソファ（2人掛け）', width: 150, height: 80, color: '#86efac', isPreset: true },
  { id: 'preset-dining-table', name: 'ダイニングテーブル', width: 120, height: 80, color: '#fcd34d', isPreset: true },
  { id: 'preset-chair', name: '椅子', width: 45, height: 45, color: '#f9a8d4', isPreset: true },
  { id: 'preset-desk', name: 'デスク', width: 120, height: 60, color: '#a5b4fc', isPreset: true },
  { id: 'preset-wardrobe', name: 'ワードローブ', width: 90, height: 180, color: '#6ee7b7', isPreset: true },
  { id: 'preset-tv-stand', name: 'テレビ台', width: 120, height: 45, color: '#fda4af', isPreset: true },
  { id: 'preset-fridge', name: '冷蔵庫', width: 65, height: 65, color: '#d9f99d', isPreset: true },
  { id: 'preset-washer', name: '洗濯機', width: 60, height: 60, color: '#fed7aa', isPreset: true },
];

interface AppState {
  unit: Unit;
  room: Room;
  furnitureDefinitions: FurnitureDefinition[];
  placedFurniture: PlacedFurniture[];

  toggleUnit: () => void;
  setRoom: (room: Partial<Room>) => void;
  setFloorPlan: (imageUrl: string, polygon: Point[], roomWidth: number, roomHeight: number, cropX: number, cropY: number, cropW: number, cropH: number) => void;
  clearFloorPlan: () => void;

  addFurnitureDefinition: (def: Omit<FurnitureDefinition, 'id'>) => void;
  removeFurnitureDefinition: (id: string) => void;

  placeFurniture: (defId: string, x: number, y: number) => boolean;
  moveFurniture: (id: string, x: number, y: number) => boolean;
  rotateFurniture: (id: string) => void;
  removePlacedFurniture: (id: string) => void;
  clearPlacedFurniture: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      unit: 'cm',
      room: { width: 450, height: 360 },
      furnitureDefinitions: PRESETS,
      placedFurniture: [],

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
        }));
      },

      clearFloorPlan: () =>
        set((s) => ({
          room: {
            width: s.room.width,
            height: s.room.height,
          },
          placedFurniture: [],
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

      removeFurnitureDefinition: (id) =>
        set((s) => ({
          furnitureDefinitions: s.furnitureDefinitions.filter((d) => d.id !== id),
          placedFurniture: s.placedFurniture.filter((p) => p.definitionId !== id),
        })),

      placeFurniture: (defId, x, y) => {
        const { room, furnitureDefinitions, placedFurniture } = get();
        const def = furnitureDefinitions.find((d) => d.id === defId);
        if (!def) return false;
        const snapped = { x: snapToGrid(x), y: snapToGrid(y) };
        const candidate: PlacedFurniture = {
          id: uuidv4(),
          definitionId: defId,
          x: snapped.x,
          y: snapped.y,
          rotated: false,
        };
        if (!isValidPlacement(candidate, def, room.width, room.height, room.polygon, placedFurniture, furnitureDefinitions)) {
          return false;
        }
        set((s) => ({ placedFurniture: [...s.placedFurniture, candidate] }));
        return true;
      },

      moveFurniture: (id, x, y) => {
        const { room, furnitureDefinitions, placedFurniture } = get();
        const placed = placedFurniture.find((p) => p.id === id);
        if (!placed) return false;
        const def = furnitureDefinitions.find((d) => d.id === placed.definitionId);
        if (!def) return false;
        const snapped = { x: snapToGrid(x), y: snapToGrid(y) };
        const candidate: PlacedFurniture = { ...placed, x: snapped.x, y: snapped.y };
        if (!isValidPlacement(candidate, def, room.width, room.height, room.polygon, placedFurniture, furnitureDefinitions)) {
          return false;
        }
        set((s) => ({
          placedFurniture: s.placedFurniture.map((p) =>
            p.id === id ? { ...p, x: snapped.x, y: snapped.y } : p,
          ),
        }));
        return true;
      },

      rotateFurniture: (id) => {
        const { room, furnitureDefinitions, placedFurniture } = get();
        const placed = placedFurniture.find((p) => p.id === id);
        if (!placed) return;
        const def = furnitureDefinitions.find((d) => d.id === placed.definitionId);
        if (!def) return;
        const candidate: PlacedFurniture = { ...placed, rotated: !placed.rotated };
        if (!isValidPlacement(candidate, def, room.width, room.height, room.polygon, placedFurniture, furnitureDefinitions)) {
          return;
        }
        set((s) => ({
          placedFurniture: s.placedFurniture.map((p) =>
            p.id === id ? { ...p, rotated: !p.rotated } : p,
          ),
        }));
      },

      removePlacedFurniture: (id) =>
        set((s) => ({
          placedFurniture: s.placedFurniture.filter((p) => p.id !== id),
        })),

      clearPlacedFurniture: () => set({ placedFurniture: [] }),
    }),
    {
      name: 'room-layout-planner',
      partialize: (state) => ({
        unit: state.unit,
        room: state.room,
        furnitureDefinitions: state.furnitureDefinitions,
        placedFurniture: state.placedFurniture,
      }),
    },
  ),
);

export const getColorForNewFurniture = (count: number) =>
  PRESET_COLORS[count % PRESET_COLORS.length];
