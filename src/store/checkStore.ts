import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CheckItem, VehicleInfo, CheckRecord, FaultRecord } from '../types';
import { checkItems } from '../data/mockData';

interface CheckState {
  vehicleInfo: VehicleInfo;
  currentCheckIndex: number;
  checkRecords: CheckRecord[];
  faultRecords: FaultRecord[];
  selectedSystem: string | null;
  checkItems: CheckItem[];
  dailyTaskIds: string[];
  systems: string[];
  setVehicleInfo: (info: VehicleInfo) => void;
  setCurrentCheckIndex: (index: number) => void;
  addCheckRecord: (record: Omit<CheckRecord, 'id'>) => void;
  addFaultRecord: (record: Omit<FaultRecord, 'id'>) => void;
  setSelectedSystem: (system: string | null) => void;
  setCheckItems: (items: CheckItem[]) => void;
  addCheckItem: (item: CheckItem) => void;
  updateCheckItem: (id: string, updates: Partial<CheckItem>) => void;
  deleteCheckItem: (id: string) => void;
  setDailyTaskIds: (ids: string[]) => void;
  addDailyTaskIds: (ids: string[]) => void;
  addSystem: (system: string) => void;
  updateSystem: (oldName: string, newName: string) => void;
  deleteSystem: (system: string) => void;
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

const STORAGE_KEY = 'check-system-check';

const defaultSystems = ['智能驾驶', '内饰', '底盘', '电气', '车身'];

const validateAndFixData = (data: unknown): Record<string, unknown> => {
  if (typeof data !== 'object' || data === null) {
    return {};
  }
  
  const obj = data as Record<string, unknown>;
  
  if (!Array.isArray(obj.checkItems)) {
    obj.checkItems = checkItems;
  }
  
  if (!Array.isArray(obj.dailyTaskIds)) {
    obj.dailyTaskIds = checkItems.filter(item => item.isDaily).map(item => item.id);
  }
  
  if (!Array.isArray(obj.checkRecords)) {
    obj.checkRecords = [];
  }
  
  if (!Array.isArray(obj.faultRecords)) {
    obj.faultRecords = [];
  }
  
  if (!Array.isArray(obj.systems)) {
    obj.systems = defaultSystems;
  }
  
  return obj;
};

export const useCheckStore = create<CheckState>()(
  persist(
    (set, get) => ({
      vehicleInfo: {
        vehicleType: '',
        powerType: '',
        configuration: ''
      },
      currentCheckIndex: 0,
      checkRecords: [],
      faultRecords: [],
      selectedSystem: null,
      checkItems: checkItems,
      dailyTaskIds: checkItems.filter(item => item.isDaily).map(item => item.id),
      systems: defaultSystems,
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
      setCheckItems: (items) => set({ checkItems: Array.isArray(items) ? items : [] }),
      addCheckItem: (item) => set(state => ({ checkItems: [...(Array.isArray(state.checkItems) ? state.checkItems : []), item] })),
      updateCheckItem: (id, updates) => 
        set(state => ({ 
          checkItems: Array.isArray(state.checkItems) 
            ? state.checkItems.map(item => item.id === id ? { ...item, ...updates } : item)
            : []
        })),
      deleteCheckItem: (id) => 
        set(state => ({ 
          checkItems: Array.isArray(state.checkItems) ? state.checkItems.filter(item => item.id !== id) : [],
          dailyTaskIds: Array.isArray(state.dailyTaskIds) ? state.dailyTaskIds.filter(taskId => taskId !== id) : []
        })),
      setDailyTaskIds: (ids) => set({ dailyTaskIds: Array.isArray(ids) ? ids : [] }),
      addDailyTaskIds: (ids) => 
        set(state => ({ 
          dailyTaskIds: [...new Set([...(Array.isArray(state.dailyTaskIds) ? state.dailyTaskIds : []), ...(Array.isArray(ids) ? ids : [])])]
        })),
      addSystem: (system) => 
        set(state => ({ 
          systems: Array.isArray(state.systems) && state.systems.includes(system) 
            ? state.systems 
            : [...(Array.isArray(state.systems) ? state.systems : []), system] 
        })),
      updateSystem: (oldName, newName) => 
        set(state => ({ 
          systems: Array.isArray(state.systems) ? state.systems.map(s => s === oldName ? newName : s) : [],
          checkItems: Array.isArray(state.checkItems) 
            ? state.checkItems.map(item => item.system === oldName ? { ...item, system: newName } : item)
            : []
        })),
      deleteSystem: (system) => 
        set(state => ({ 
          systems: Array.isArray(state.systems) ? state.systems.filter(s => s !== system) : [],
          checkItems: Array.isArray(state.checkItems) ? state.checkItems.filter(item => item.system !== system) : []
        })),
      getDailyCheckItems: () => {
        const { checkItems, dailyTaskIds } = get();
        return Array.isArray(checkItems) && Array.isArray(dailyTaskIds)
          ? checkItems.filter(item => dailyTaskIds.includes(item.id))
          : [];
      },
      getAllCheckItems: () => {
        const items = get().checkItems;
        return Array.isArray(items) ? items : [];
      },
      getCheckItemsBySystem: (system) => {
        const items = get().checkItems;
        return Array.isArray(items) ? items.filter((item) => item.system === system) : [];
      },
      getSystems: () => {
        const sys = get().systems;
        return Array.isArray(sys) ? sys : defaultSystems;
      },
      getTotalChecks: () => {
        const { checkRecords } = get();
        return Array.isArray(checkRecords) 
          ? checkRecords.reduce((sum, r) => sum + (r.itemCount || 0), 0)
          : 0;
      },
      getAverageCompletionRate: () => {
        const { checkRecords } = get();
        if (!Array.isArray(checkRecords) || checkRecords.length === 0) return 0;
        const total = checkRecords.reduce((sum, r) => sum + (r.completionRate || 0), 0);
        return Math.round((total / checkRecords.length) * 10) / 10;
      },
      getTotalFaults: () => {
        const { faultRecords } = get();
        return Array.isArray(faultRecords) ? faultRecords.length : 0;
      },
      getUserStats: () => {
        const { checkRecords } = get();
        if (!Array.isArray(checkRecords)) return [];
        
        const userMap = new Map<string, { total: number; completed: number }>();
        checkRecords.forEach((record) => {
          const username = record.username || '未知用户';
          const existing = userMap.get(username);
          if (existing) {
            existing.total += record.itemCount || 0;
            existing.completed += record.completedCount || 0;
          } else {
            userMap.set(username, { total: record.itemCount || 0, completed: record.completedCount || 0 });
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
        
        if (!Array.isArray(checkRecords) || !Array.isArray(faultRecords)) {
          return systems.map(system => ({
            system,
            totalChecks: 0,
            failedChecks: 0,
            failureRate: 0
          }));
        }
        
        return systems.map((system) => {
          const systemChecks = checkRecords.filter((r) => r.system === system);
          const systemFaults = faultRecords.filter((f) => f.system === system);
          const totalChecks = systemChecks.reduce((sum, r) => sum + (r.itemCount || 0), 0);
          const failedChecks = systemFaults.length;
          return {
            system,
            totalChecks,
            failedChecks,
            failureRate: totalChecks > 0 ? Math.round((failedChecks / totalChecks) * 1000) / 10 : 0
          };
        });
      }
    }),
    {
      name: STORAGE_KEY,
      getStorage: () => localStorage,
      partialize: (state) => ({
        checkItems: state.checkItems,
        dailyTaskIds: state.dailyTaskIds,
        checkRecords: state.checkRecords,
        faultRecords: state.faultRecords,
        systems: state.systems
      }),
      version: 3,
      migrate: (persistedState, version) => {
        if (version < 3) {
          return validateAndFixData(persistedState);
        }
        return persistedState;
      },
      merge: (persistedState, currentState) => {
        const fixed = validateAndFixData(persistedState);
        return { ...currentState, ...fixed };
      }
    }
  )
);
