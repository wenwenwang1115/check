import { create } from 'zustand';
import { CheckItem, VehicleInfo, CheckRecord } from '../types';
import { checkItems } from '../data/mockData';

interface CheckState {
  vehicleInfo: VehicleInfo;
  currentCheckIndex: number;
  checkRecords: CheckRecord[];
  selectedSystem: string | null;
  setVehicleInfo: (info: VehicleInfo) => void;
  setCurrentCheckIndex: (index: number) => void;
  addCheckRecord: (record: Omit<CheckRecord, 'id' | 'checkedAt'>) => void;
  setSelectedSystem: (system: string | null) => void;
  getDailyCheckItems: () => CheckItem[];
  getAllCheckItems: () => CheckItem[];
  getCheckItemsBySystem: (system: string) => CheckItem[];
  getSystems: () => string[];
}

export const useCheckStore = create<CheckState>((set, get) => ({
  vehicleInfo: {
    vehicleType: '',
    powerType: '',
    configuration: ''
  },
  currentCheckIndex: 0,
  checkRecords: [],
  selectedSystem: null,
  setVehicleInfo: (info) => set({ vehicleInfo: info }),
  setCurrentCheckIndex: (index) => set({ currentCheckIndex: index }),
  addCheckRecord: (record) =>
    set((state) => ({
      checkRecords: [
        ...state.checkRecords,
        {
          ...record,
          id: `record-${Date.now()}`,
          checkedAt: new Date()
        }
      ]
    })),
  setSelectedSystem: (system) => set({ selectedSystem: system }),
  getDailyCheckItems: () => checkItems.filter((item) => item.isDaily),
  getAllCheckItems: () => checkItems,
  getCheckItemsBySystem: (system) =>
    checkItems.filter((item) => item.system === system),
  getSystems: () => [...new Set(checkItems.map((item) => item.system))]
}));