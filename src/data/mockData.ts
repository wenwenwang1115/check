import { CheckItem, Task, User, SystemStats, VehicleStats, UserStats } from '../types';

export const checkItems: CheckItem[] = [
  {
    id: '1',
    serialNumber: 'ADAS-001',
    system: '智能驾驶',
    category: 'ADAS',
    type: 'dynamic',
    description: '自适应巡航控制系统测试',
    precondition: '车辆在封闭道路行驶，车速≥30km/h',
    testSteps: ['开启ACC功能', '设置巡航速度为60km/h', '观察车辆是否自动保持跟车距离', '测试减速和加速响应'],
    expectedResult: '车辆能够自动保持设定速度并与前车保持安全距离',
    isDaily: true
  },
  {
    id: '2',
    serialNumber: 'ADAS-002',
    system: '智能驾驶',
    category: 'ADAS',
    type: 'dynamic',
    description: '车道保持辅助系统测试',
    precondition: '车辆在有清晰车道线的道路行驶',
    testSteps: ['开启LKA功能', '保持车速在50-120km/h', '轻微偏离车道', '观察方向盘是否自动修正'],
    expectedResult: '车辆能够识别车道线并自动保持在车道中央',
    isDaily: true
  },
  {
    id: '3',
    serialNumber: 'ADAS-003',
    system: '智能驾驶',
    category: 'ADAS',
    type: 'static',
    description: '自动泊车功能测试',
    precondition: '车辆周围有可用停车位',
    testSteps: ['激活自动泊车功能', '选择目标车位', '观察车辆自动泊车过程', '检查泊车完成精度'],
    expectedResult: '车辆能够自动完成泊车入位',
    isDaily: false
  },
  {
    id: '4',
    serialNumber: 'INT-001',
    system: '内饰',
    category: '中控系统',
    type: 'static',
    description: '中控大屏触控测试',
    precondition: '车辆通电，中控屏幕开启',
    testSteps: ['点击主菜单', '滑动屏幕切换页面', '测试各功能按钮响应', '检查屏幕显示效果'],
    expectedResult: '触控响应灵敏，显示清晰无卡顿',
    isDaily: true
  },
  {
    id: '5',
    serialNumber: 'INT-002',
    system: '内饰',
    category: '空调系统',
    type: 'static',
    description: '空调系统功能测试',
    precondition: '车辆通电，空调处于关闭状态',
    testSteps: ['开启空调', '调节温度和风量', '测试制冷和制热效果', '检查出风口风向控制'],
    expectedResult: '空调运行正常，温度调节准确',
    isDaily: true
  },
  {
    id: '6',
    serialNumber: 'INT-003',
    system: '内饰',
    category: '座椅系统',
    type: 'static',
    description: '电动座椅调节测试',
    precondition: '车辆通电',
    testSteps: ['测试座椅前后调节', '测试座椅靠背角度调节', '测试座椅高度调节', '测试座椅记忆功能'],
    expectedResult: '座椅各方向调节顺畅，记忆功能正常',
    isDaily: false
  },
  {
    id: '7',
    serialNumber: 'CHS-001',
    system: '底盘',
    category: '悬挂系统',
    type: 'dynamic',
    description: '悬挂系统舒适性测试',
    precondition: '车辆在颠簸路面行驶',
    testSteps: ['以30km/h速度通过减速带', '以40km/h速度通过不平路面', '感受悬挂过滤效果', '检查是否有异常噪音'],
    expectedResult: '悬挂能够有效过滤颠簸，无异常噪音',
    isDaily: false
  },
  {
    id: '8',
    serialNumber: 'CHS-002',
    system: '底盘',
    category: '制动系统',
    type: 'dynamic',
    description: '制动系统性能测试',
    precondition: '车辆在空旷场地',
    testSteps: ['以60km/h速度紧急制动', '检查制动距离', '感受ABS工作状态', '检查手刹功能'],
    expectedResult: '制动距离符合标准，ABS正常介入',
    isDaily: true
  },
  {
    id: '9',
    serialNumber: 'ELC-001',
    system: '电气',
    category: '电池系统',
    type: 'static',
    description: '动力电池状态检查',
    precondition: '车辆充电至满电状态',
    testSteps: ['查看电池电量显示', '检查电池温度', '测试快充功能', '检查电池管理系统状态'],
    expectedResult: '电池状态正常，快充功能正常',
    isDaily: true
  },
  {
    id: '10',
    serialNumber: 'ELC-002',
    system: '电气',
    category: '充电系统',
    type: 'static',
    description: '充电接口功能测试',
    precondition: '车辆未充电状态',
    testSteps: ['连接交流充电枪', '检查充电连接状态', '测试充电启动和停止', '检查充电功率'],
    expectedResult: '充电接口连接正常，充电功率符合预期',
    isDaily: true
  },
  {
    id: '11',
    serialNumber: 'ELC-003',
    system: '电气',
    category: '灯光系统',
    type: 'static',
    description: '灯光系统功能测试',
    precondition: '车辆通电，处于黑暗环境',
    testSteps: ['开启近光灯', '开启远光灯', '测试转向灯', '测试刹车灯和倒车灯'],
    expectedResult: '所有灯光工作正常',
    isDaily: false
  },
  {
    id: '12',
    serialNumber: 'BDY-001',
    system: '车身',
    category: '外观',
    type: 'static',
    description: '车身外观检查',
    precondition: '车辆停放在光线充足处',
    testSteps: ['检查车身漆面', '检查车窗玻璃', '检查车门密封性', '检查轮胎状态'],
    expectedResult: '车身无损伤，轮胎状态良好',
    isDaily: false
  }
];

export const dailyTasks: Task[] = [
  {
    id: 'daily-1',
    title: '每日功能检查',
    description: '日常车辆功能点检任务',
    type: 'daily',
    checkItemIds: ['1', '2', '4', '5', '8', '9', '10'],
    createdAt: new Date(),
    startDate: new Date()
  }
];

export const weeklyTasks: Task[] = [
  {
    id: 'weekly-1',
    title: '周度全面检查',
    description: '每周一次的全面车辆检查',
    type: 'weekly',
    checkItemIds: ['3', '6', '7', '11', '12'],
    createdAt: new Date(),
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
];

export const users: User[] = [
  {
    id: 'admin',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date(),
    isActive: true
  }
];

export const systemStats: SystemStats[] = [
  { system: '智能驾驶', totalChecks: 0, failedChecks: 0, failureRate: 0 },
  { system: '内饰', totalChecks: 0, failedChecks: 0, failureRate: 0 },
  { system: '底盘', totalChecks: 0, failedChecks: 0, failureRate: 0 },
  { system: '电气', totalChecks: 0, failedChecks: 0, failureRate: 0 },
  { system: '车身', totalChecks: 0, failedChecks: 0, failureRate: 0 }
];

export const vehicleStats: VehicleStats[] = [
  { vehicleType: 'Model A', totalChecks: 0, completedChecks: 0, completionRate: 0 },
  { vehicleType: 'Model B', totalChecks: 0, completedChecks: 0, completionRate: 0 },
  { vehicleType: 'Model C', totalChecks: 0, completedChecks: 0, completionRate: 0 },
  { vehicleType: 'Model D', totalChecks: 0, completedChecks: 0, completionRate: 0 }
];

export const userStats: UserStats[] = [];

export const vehicleTypes = ['Model A', 'Model B', 'Model C', 'Model D'];

export const powerTypes = ['BEV', 'PHEV', 'REEV', 'ICE', 'HEV', '其他'];

export const configurations = ['标准版', '舒适版', '豪华版', '尊贵型'];

export const generateInviteCode = (): string => {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const code = `CHK${dateStr}`;
  return code;
};

export const getTodayInviteCode = (): string => {
  return generateInviteCode();
};

export const weeklyFaultData = [
  { week: '第1周', faults: 0 },
  { week: '第2周', faults: 0 },
  { week: '第3周', faults: 0 },
  { week: '第4周', faults: 0 },
  { week: '第5周', faults: 0 },
  { week: '第6周', faults: 0 },
  { week: '第7周', faults: 0 }
];

export const dailyFaultBySystem = [
  { date: '周一', 智能驾驶: 0, 内饰: 0, 底盘: 0, 电气: 0, 车身: 0 },
  { date: '周二', 智能驾驶: 0, 内饰: 0, 底盘: 0, 电气: 0, 车身: 0 },
  { date: '周三', 智能驾驶: 0, 内饰: 0, 底盘: 0, 电气: 0, 车身: 0 },
  { date: '周四', 智能驾驶: 0, 内饰: 0, 底盘: 0, 电气: 0, 车身: 0 },
  { date: '周五', 智能驾驶: 0, 内饰: 0, 底盘: 0, 电气: 0, 车身: 0 },
  { date: '周六', 智能驾驶: 0, 内饰: 0, 底盘: 0, 电气: 0, 车身: 0 },
  { date: '周日', 智能驾驶: 0, 内饰: 0, 底盘: 0, 电气: 0, 车身: 0 }
];

export const userSystemCompletion = [];

export interface CheckRecord {
  id: string;
  date: string;
  system: string;
  itemCount: number;
  completedCount: number;
  completionRate: number;
}

export const checkRecords: CheckRecord[] = [];

export interface TaskDispatchRecord {
  id: string;
  date: string;
  taskType: 'daily' | 'weekly';
  system: string;
  itemCount: number;
  dispatchedTo: string[];
}

export const taskDispatchRecords: TaskDispatchRecord[] = [];
