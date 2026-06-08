import { create } from 'zustand';
import { CheckItem, VehicleInfo, CheckRecord, FaultRecord } from '../types';
import { checkItems } from '../data/mockData';

interface CheckState {
  vehicleInfo: VehicleInfo;
  currentCheckIndex: number;
  checkRecords: CheckRecord[];
  faultRecords: FaultRecord[];
  selectedSystem: string | null;
  setVehicleInfo: (info: VehicleInfo) => void;
  setCurrentCheckIndex: (index: number) => void;
  addCheckRecord: (record: Omit<CheckRecord, 'id'>) => void;
  addFaultRecord: (record: Omit<FaultRecord, 'id'>) => void;
  setSelectedSystem: (system: string | null) => void;
  getDailyCheckItems: () => CheckItem[];
  getAllCheckItems: () => CheckItem[];
  getCheckItemsBySystem: (system: string) => CheckItem[];
  getSystems: () => string[];
  getTotalChecks: () => number;
  getAverageCompletionRate: () => number;
  getTotalFaults: () => number;
  getUserStats: () => { username: string; totalChecks: number; completedChecks: number; completionRate: number }[];
  getSystemStats: () => { system: string; totalChecks: number; failedChecks: number; failureRate: number }[];
}

export const useCheckStore = create<CheckState>((set, get) => ({
  vehicleInfo: {
    vehicleType: '',
    powerType: '',
    configuration: ''
  },
  currentCheckIndex: 0,
  checkRecords: [],
  faultRecords: [],
  selectedSystem: null,
  setVehicleInfo: (info) => set({ vehicleInfo: info }),
  setCurrentCheckIndex: (index) => set({ currentCheckIndex: index }),
  addCheckRecord: (record) =>
    set((state) => ({
      checkRecords: [
        ...state.checkRecords,
        {
          ...record,
          id: `record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      ]
    })),
  addFaultRecord: (record) =>
    set((state) => ({
      faultRecords: [
        ...state.faultRecords,
        {
          ...record,
          id: `fault-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      ]
    })),
  setSelectedSystem: (system) => set({ selectedSystem: system }),
  getDailyCheckItems: () => checkItems.filter((item) => item.isDaily),
  getAllCheckItems: () => checkItems,
  getCheckItemsBySystem: (system) =>
    checkItems.filter((item) => item.system === system),
  getSystems: () => [...new Set(checkItems.map((item) => item.system))],
  getTotalChecks: () => {
    const { checkRecords } = get();
    return checkRecords.reduce((sum, r) => sum + r.itemCount, 0);
  },
  getAverageCompletionRate: () => {
    const { checkRecords } = get();
    if (checkRecords.length === 0) return 0;
    const total = checkRecords.reduce((sum, r) => sum + r.completionRate, 0);
    return Math.round((total / checkRecords.length) * 10) / 10;
  },
  getTotalFaults: () => {
    const { faultRecords } = get();
    return faultRecords.length;
  },
  getUserStats: () => {
    const { checkRecords } = get();
    const userMap = new Map<string, { total: number; completed: number }>();
    checkRecords.forEach((record) => {
      const username = record.username || '未知用户';
      const existing = userMap.get(username);
      if (existing) {
        existing.total += record.itemCount;
        existing.completed += record.completedCount;
      } else {
        userMap.set(username, { total: record.itemCount, completed: record.completedCount });
      }
    });
    return Array.from(userMap.entries()).map(([username, data]) => ({
      username,
      totalChecks: data.total,
      completedChecks: data.completed,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 1000) / 10 : 0
    }));
  },
  getSystemStats: () => {
    const { checkRecords, faultRecords } = get();
    const systems = get().getSystems();
    return systems.map((system) => {
      const systemChecks = checkRecords.filter((r) => r.system === system);
      const systemFaults = faultRecords.filter((f) => f.system === system);
      const totalChecks = systemChecks.reduce((sum, r) => sum + r.itemCount, 0);
      const failedChecks = systemFaults.length;
      return {
        system,
        totalChecks,
        failedChecks,
        failureRate: totalChecks > 0 ? Math.round((failedChecks / totalChecks) * 1000) / 10 : 0
      };
    });
  }
}));
