export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: Date;
  isActive?: boolean;
}

export interface VehicleInfo {
  vehicleType: string;
  powerType: string;
  configuration: string;
}

export interface CheckItem {
  id: string;
  serialNumber: string;
  system: string;
  category: string;
  type: 'dynamic' | 'static';
  description: string;
  precondition: string;
  testSteps: string[];
  expectedResult: string;
  isDaily: boolean;
}

export interface CheckRecord {
  id: string;
  date: string;
  username: string;
  system: string;
  itemCount: number;
  completedCount: number;
  completionRate: number;
}

export interface CheckHistoryRecord {
  id: string;
  userId: string;
  checkItemId: string;
  vehicleInfo: VehicleInfo;
  status: 'completed' | 'pending' | 'failed';
  feedback?: string;
  checkedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  checkItemIds: string[];
  createdAt: Date;
  startDate: Date;
  endDate?: Date;
}

export interface SystemStats {
  system: string;
  totalChecks: number;
  failedChecks: number;
  failureRate: number;
}

export interface VehicleStats {
  vehicleType: string;
  totalChecks: number;
  completedChecks: number;
  completionRate: number;
}

export interface UserStats {
  userId: string;
  username: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface VehicleType {
  id: string;
  name: string;
  createdAt: Date;
}

export interface FaultRecord {
  id: string;
  username: string;
  vehicleType: string;
  powerType: string;
  configuration: string;
  date: string;
  checkItemId: string;
  checkItemSerial: string;
  system: string;
  category: string;
  description: string;
  faultDescription: string;
  testSteps: string[];
  expectedResult: string;
}