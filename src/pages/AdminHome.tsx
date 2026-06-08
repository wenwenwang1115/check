import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../store/authStore';
import { useCheckStore } from '../store/checkStore';
import { CheckItem, Task, User } from '../types';
import {
  checkItems,
  dailyTasks,
  weeklyTasks,
  users,
  vehicleTypes,
  getTodayInviteCode,
  weeklyFaultData,
  dailyFaultBySystem,
  userSystemCompletion,
  systemStats,
  vehicleStats,
  taskDispatchRecords
} from '../data/mockData';

interface AdminHomeProps {
  onNavigate: (page: string) => void;
}

type TabType = 'dashboard' | 'tasks' | 'users' | 'checkitems' | 'vehicles' | 'settings' | 'faults';

export const AdminHome: React.FC<AdminHomeProps> = ({ onNavigate }) => {
  const { currentUser, logout, registeredUsers, updateUser } = useAuthStore();
  const { 
    checkRecords: storeCheckRecords, 
    faultRecords: storeFaultRecords,
    checkItems: storeCheckItems,
    setCheckItems,
    deleteCheckItem,
    setDailyTaskIds,
    getSystems,
    systems,
    addSystem,
    updateSystem,
    deleteSystem,
    addCheckItem
  } = useCheckStore();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddCheckItemModal, setShowAddCheckItemModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showUserStatsModal, setShowUserStatsModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingCheckItem, setEditingCheckItem] = useState<CheckItem | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 新任务表单 - 改为按数量选择
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'daily' as 'daily' | 'weekly',
    system: '全部' as string,
    itemCount: 1
  });

  const [newCheckItem, setNewCheckItem] = useState({
    serialNumber: '',
    system: '',
    category: '',
    type: 'static' as 'static' | 'dynamic',
    description: '',
    precondition: '',
    testSteps: [''],
    expectedResult: '',
    isDaily: false
  });

  const [newVehicle, setNewVehicle] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [selectedCheckSystem, setSelectedCheckSystem] = useState<string>('');
  const [showAddSystemModal, setShowAddSystemModal] = useState(false);
  const [editingSystem, setEditingSystem] = useState<string | null>(null);
  const [newSystemName, setNewSystemName] = useState('');

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [localVehicleTypes, setLocalVehicleTypes] = useState<string[]>(() => {
    const saved = localStorage.getItem('check-system-vehicles');
    return saved ? JSON.parse(saved) : vehicleTypes;
  });
  const [localCheckItems, setLocalCheckItems] = useState<CheckItem[]>(checkItems);
  const [localTaskDispatchRecords, setLocalTaskDispatchRecords] = useState(taskDispatchRecords);
  const [localDailyTasks, setLocalDailyTasks] = useState(dailyTasks);
  const [localWeeklyTasks, setLocalWeeklyTasks] = useState(weeklyTasks);

  // 数据看板使用 store 动态数据 + 本地 mock 数据
  const allTasks = [...localDailyTasks, ...localWeeklyTasks];
  const allUsers = registeredUsers.filter(u => u.role === 'user');
  const todayInviteCode = getTodayInviteCode();

  // 动态计算：总检查次数 = 所有记录 itemCount 之和
  const totalChecks = storeCheckRecords.reduce((sum, r) => sum + r.itemCount, 0);
  // 平均完成率 = 所有记录 completionRate 加权平均
  const averageRate = storeCheckRecords.length > 0
    ? Math.round(
        storeCheckRecords.reduce((sum, r) => sum + r.completionRate * r.itemCount, 0) /
        Math.max(1, storeCheckRecords.reduce((sum, r) => sum + r.itemCount, 0)) * 10
      ) / 10
    : 0;
  // 故障总数 = 故障记录条数
  const totalFaults = storeFaultRecords.length;

  // 按用户聚合：每位用户完成了多少项
  const aggregateUserStats = () => {
    const map = new Map<string, { username: string; total: number; completed: number; faults: number }>();
    storeCheckRecords.forEach(record => {
      const existing = map.get(record.username);
      if (existing) {
        existing.total += record.itemCount;
        existing.completed += record.completedCount;
      } else {
        map.set(record.username, {
          username: record.username,
          total: record.itemCount,
          completed: record.completedCount,
          faults: 0
        });
      }
    });
    // 再统计每个用户故障数
    storeFaultRecords.forEach(fault => {
      const existing = map.get(fault.username);
      if (existing) {
        existing.faults += 1;
      } else {
        map.set(fault.username, {
          username: fault.username,
          total: 0,
          completed: 0,
          faults: 1
        });
      }
    });
    return Array.from(map.values()).map(u => ({
      username: u.username,
      total: u.total,
      completed: u.completed,
      faults: u.faults,
      rate: u.total > 0 ? Math.round((u.completed / u.total) * 1000) / 10 : 0
    }));
  };

  // 自动选择未检查的检查项
  const getUncheckedItems = (system: string, count: number): CheckItem[] => {
    let availableItems = storeCheckItems;
    if (system !== '全部') {
      availableItems = storeCheckItems.filter(item => item.system === system);
    }
    // 按最近检查时间排序，优先选择未检查的
    const today = new Date().toISOString().split('T')[0];
    const recentlyCheckedIds = storeCheckRecords
      .filter(r => r.date === today)
      .flatMap(r => {
        // 根据系统获取对应的检查项ID
        return storeCheckItems
          .filter(item => system === '全部' || item.system === system)
          .slice(0, r.itemCount)
          .map(item => item.id);
      });
    
    // 优先返回未检查的
    const uncheckedItems = availableItems.filter(item => !recentlyCheckedIds.includes(item.id));
    if (uncheckedItems.length >= count) {
      return uncheckedItems.slice(0, count);
    }
    return availableItems.slice(0, count);
  };

  // 创建任务并下发
  const handleCreateTask = () => {
    const selectedItems = getUncheckedItems(newTask.system, newTask.itemCount);
    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title || `${newTask.type === 'daily' ? '每日' : '每周'}任务 - ${newTask.system}`,
      description: newTask.description || `自动选择 ${newTask.itemCount} 个检查项`,
      type: newTask.type,
      checkItemIds: selectedItems.map(item => item.id),
      createdAt: new Date(),
      startDate: new Date()
    };

    if (newTask.type === 'daily') {
      setLocalDailyTasks(prev => [...prev, task]);
      setDailyTaskIds(selectedItems.map(item => item.id));
    } else {
      setLocalWeeklyTasks(prev => [...prev, task]);
    }

    // 记录任务下发
    const dispatchRecord = {
      id: `dispatch-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      taskType: newTask.type,
      system: newTask.system,
      itemCount: newTask.itemCount,
      dispatchedTo: allUsers.map(u => u.username)
    };
    setLocalTaskDispatchRecords(prev => [dispatchRecord, ...prev]);

    setShowAddTaskModal(false);
    setNewTask({
      title: '',
      description: '',
      type: 'daily',
      system: '全部',
      itemCount: 1
    });
  };

  const handleSaveCheckItem = () => {
    setShowAddCheckItemModal(false);
    setEditingCheckItem(null);
    setNewCheckItem({
      serialNumber: '',
      system: '',
      category: '',
      type: 'static',
      description: '',
      precondition: '',
      testSteps: [''],
      expectedResult: '',
      isDaily: false
    });
  };

  const addTestStep = () => {
    setNewCheckItem(prev => ({
      ...prev,
      testSteps: [...prev.testSteps, '']
    }));
  };

  const updateTestStep = (index: number, value: string) => {
    setNewCheckItem(prev => ({
      ...prev,
      testSteps: prev.testSteps.map((step, i) => i === index ? value : step)
    }));
  };

  const removeTestStep = (index: number) => {
    setNewCheckItem(prev => ({
      ...prev,
      testSteps: prev.testSteps.filter((_, i) => i !== index)
    }));
  };

  const handleToggleUserStatus = (userId: string) => {
    const user = registeredUsers.find(u => u.id === userId);
    if (user) {
      updateUser(userId, { isActive: user.isActive === false ? true : false });
    }
  };

  const handlePromoteToAdmin = (userId: string) => {
    updateUser(userId, { role: 'admin' });
  };

  const handleAddVehicle = () => {
    if (newVehicle && !localVehicleTypes.includes(newVehicle)) {
      const updated = [...localVehicleTypes, newVehicle];
      setLocalVehicleTypes(updated);
      localStorage.setItem('check-system-vehicles', JSON.stringify(updated));
      setNewVehicle('');
      setShowVehicleModal(false);
    }
  };

  const handleDeleteVehicle = (vehicle: string) => {
    const updated = localVehicleTypes.filter(v => v !== vehicle);
    setLocalVehicleTypes(updated);
    localStorage.setItem('check-system-vehicles', JSON.stringify(updated));
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('密码长度至少为6位');
      return;
    }
    alert('密码修改成功');
    setShowPasswordModal(false);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);

  const VALID_SYSTEMS = ['智能驾驶', '内饰', '底盘', '电气', '车身'];
  const VALID_TYPES = ['动态', '静态', 'dynamic', 'static'];

  const handleDeleteCheckItem = (itemId: string) => {
    if (confirm('确定要删除这个检查项吗？')) {
      deleteCheckItem(itemId);
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleBatchDelete = () => {
    if (selectedItems.length === 0) {
      alert('请先选择要删除的检查项');
      return;
    }
    if (confirm(`确定要删除选中的 ${selectedItems.length} 个检查项吗？`)) {
      selectedItems.forEach(id => deleteCheckItem(id));
      setSelectedItems([]);
    }
  };

  const handleSelectAll = () => {
    const filteredItems = selectedCheckSystem 
      ? storeCheckItems.filter(item => item.system === selectedCheckSystem)
      : storeCheckItems;
    
    if (selectedItems.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>, defaultSystem?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');
    setUploadSuccess('');

    try {
      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || 
                      file.name.toLowerCase().endsWith('.xls') ||
                      file.name.toLowerCase().endsWith('.csv');
      if (!isExcel) {
        throw new Error('文件格式不正确，请上传Excel文件(.xlsx/.xls/.csv)');
      }

      if (file.size > 20 * 1024 * 1024) {
        throw new Error('文件大小超过限制(最大20MB)');
      }

      setUploadProgress(10);
      const arrayBuffer = await file.arrayBuffer();
      setUploadProgress(25);

      let workbook: XLSX.WorkBook;
      try {
        workbook = XLSX.read(arrayBuffer, { type: 'array' });
      } catch (e) {
        throw new Error('Excel文件解析失败，请检查文件是否损坏');
      }
      setUploadProgress(40);

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) {
        throw new Error('Excel文件中没有有效的工作表');
      }

      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: '' });
      setUploadProgress(55);

      if (rows.length === 0) {
        throw new Error('Excel文件为空，请至少填写一行数据');
      }

      const importedItems: CheckItem[] = [];
      const errors: string[] = [];
      const BATCH_SIZE = 100;
      const totalRows = rows.length;

      for (let i = 0; i < totalRows; i++) {
        const row = rows[i];
        const rowNum = i + 2; // 行号（加上表头）

        const serialNumber = String(row['检查序号'] || row['序号'] || row['serialNumber'] || row['编号'] || '').trim();
        const system = String(row['故障系统'] || row['系统'] || row['system'] || '').trim();
        const category = String(row['功能分类'] || row['分类'] || row['category'] || '').trim();
        const typeInput = String(row['动态/静态'] || row['类型'] || row['type'] || '').trim();
        const description = String(row['检查描述'] || row['描述'] || row['description'] || '').trim();
        const precondition = String(row['前置条件'] || row['precondition'] || '').trim();
        const testStepsStr = String(row['测试步骤'] || row['步骤'] || row['testSteps'] || '').trim();
        const expectedResult = String(row['期望结果'] || row['预期结果'] || row['expectedResult'] || '').trim();
        const isDailyStr = String(row['每日检查'] || row['isDaily'] || row['每日'] || '').trim();

        if (!serialNumber) {
          errors.push(`第${rowNum}行：检查序号不能为空`);
          continue;
        }
        const finalSystem = system || defaultSystem;
        if (!finalSystem) {
          errors.push(`第${rowNum}行：故障系统不能为空，请先选择故障系统或在Excel中填写`);
          continue;
        }
        if (!description) {
          errors.push(`第${rowNum}行：检查描述不能为空`);
          continue;
        }

        const normalizedType: 'dynamic' | 'static' = 
          (typeInput === '动态' || typeInput.toLowerCase() === 'dynamic') ? 'dynamic' : 'static';

        const testSteps = testStepsStr
          .split(/[;；\n\/|]/)
          .map(s => s.trim())
          .filter(s => s.length > 0);

        if (testSteps.length === 0) {
          testSteps.push('执行检查');
        }

        const isDaily = isDailyStr === '是' || 
                       isDailyStr.toLowerCase() === 'true' || 
                       isDailyStr === '1' ||
                       isDailyStr === '每日';

        importedItems.push({
          id: `imported_${Date.now()}_${i}`,
          serialNumber,
          system: finalSystem,
          category: category || '通用测试',
          type: normalizedType,
          description,
          precondition: precondition || '车辆通电',
          testSteps,
          expectedResult: expectedResult || '检查通过',
          isDaily
        });

        if ((i + 1) % BATCH_SIZE === 0) {
          setUploadProgress(55 + Math.floor(((i + 1) / totalRows) * 40));
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      setUploadProgress(95);

      if (importedItems.length === 0) {
        throw new Error(errors.length > 0 
          ? `导入失败：${errors[0]}（共${errors.length}个错误）` 
          : '没有找到有效的检查项数据');
      }

      const existingSerials = new Set(storeCheckItems.map(i => i.serialNumber));
      const newItems = importedItems.filter(item => !existingSerials.has(item.serialNumber));
      const duplicates = importedItems.length - newItems.length;

      setCheckItems(prev => [...prev, ...newItems]);
      setUploadProgress(100);

      const msg = duplicates > 0
        ? `成功导入 ${newItems.length} 条检查项（跳过 ${duplicates} 条重复序号）`
        : `成功导入 ${newItems.length} 条检查项`;
      setUploadSuccess(msg + (errors.length > 0 ? `，忽略 ${errors.length} 条错误行` : ''));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '导入失败，请重试');
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = '';
      }
      setTimeout(() => {
        setUploadProgress(0);
        setUploadError('');
        setUploadSuccess('');
      }, 8000);
    }
  };

  // 简单的折线图组件
  const LineChart: React.FC<{ data: { week: string; faults: number }[] }> = ({ data }) => {
    const maxFaults = Math.max(...data.map(d => d.faults));
    return (
      <div className="h-64 flex items-end gap-2 px-4">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-blue-500 rounded-t transition-all duration-300"
              style={{ height: `${(item.faults / maxFaults) * 200}px` }}
            />
            <span className="text-xs text-gray-500 mt-2">{item.week}</span>
            <span className="text-xs font-medium text-gray-700">{item.faults}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🚀</div>
            <div>
              <h1 className="text-xl font-bold">功能打卡系统</h1>
              <p className="text-sm text-blue-100">管理后台</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-blue-100">欢迎, {currentUser?.username}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: 'dashboard', label: '数据看板' },
              { key: 'faults', label: '故障记录' },
              { key: 'tasks', label: '任务管理' },
              { key: 'users', label: '用户管理' },
              { key: 'checkitems', label: '检查项管理' },
              { key: 'vehicles', label: '车型管理' },
              { key: 'settings', label: '系统设置' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`px-6 py-3 font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 overflow-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">总检查次数</p>
                    <p className="text-3xl font-bold text-gray-800">{totalChecks}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowUserStatsModal(true)}
                className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">平均完成率 <span className="text-blue-500 text-xs">点击查看详情 →</span></p>
                    <p className="text-3xl font-bold text-green-600">{averageRate}%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </button>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">故障总数</p>
                    <p className="text-3xl font-bold text-red-600">{totalFaults}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">活跃用户</p>
                    <p className="text-3xl font-bold text-purple-600">{allUsers.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">每周故障数量趋势</h3>
              <LineChart data={weeklyFaultData} />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">各系统每日故障统计</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">日期</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">智能驾驶</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">内饰</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">底盘</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">电气</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">车身</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyFaultBySystem.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{row.date}</td>
                        <td className="text-center py-3 px-4 text-red-600">{row.智能驾驶}</td>
                        <td className="text-center py-3 px-4 text-orange-600">{row.内饰}</td>
                        <td className="text-center py-3 px-4 text-yellow-600">{row.底盘}</td>
                        <td className="text-center py-3 px-4 text-blue-600">{row.电气}</td>
                        <td className="text-center py-3 px-4 text-green-600">{row.车身}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">各系统故障率</h3>
                <div className="space-y-4">
                  {systemStats.map(stat => (
                    <div key={stat.system}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700">{stat.system}</span>
                        <span className={`font-medium ${stat.failureRate > 6 ? 'text-red-600' : 'text-green-600'}`}>
                          {stat.failureRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${stat.failureRate > 6 ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${stat.failureRate * 2}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">各车型完成率</h3>
                <div className="space-y-4">
                  {vehicleStats.map(stat => (
                    <div key={stat.vehicleType}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700">{stat.vehicleType}</span>
                        <span className="font-medium text-blue-600">{stat.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${stat.completionRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">用户完成情况</h3>
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    用户完成情况汇总 <span className="text-xs text-gray-400">（点击上方平均完成率卡片可查看相同数据）</span>
                  </h4>
                  <div className="overflow-x-auto">
                    {(() => {
                      const stats = aggregateUserStats();
                      if (stats.length === 0) {
                        return (
                          <div className="py-8 text-center text-gray-400 text-sm">
                            暂无用户完成记录
                          </div>
                        );
                      }
                      return (
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-4 font-medium text-gray-600">用户名</th>
                              <th className="text-center py-2 px-4 font-medium text-gray-600">总检查项</th>
                              <th className="text-center py-2 px-4 font-medium text-gray-600">已完成</th>
                              <th className="text-center py-2 px-4 font-medium text-gray-600">故障数</th>
                              <th className="text-center py-2 px-4 font-medium text-gray-600">完成率</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.map(stat => (
                              <tr key={stat.username} className="border-b border-gray-100">
                                <td className="py-2 px-4 font-medium text-gray-800">{stat.username}</td>
                                <td className="text-center py-2 px-4 text-gray-700">{stat.total}</td>
                                <td className="text-center py-2 px-4 text-green-700">{stat.completed}</td>
                                <td className="text-center py-2 px-4 text-red-700">{stat.faults}</td>
                                <td className="text-center py-2 px-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    stat.rate >= 90 ? 'bg-green-100 text-green-700' :
                                    stat.rate >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>{stat.rate}%</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">各系统完成情况</h4>
                  <div className="overflow-x-auto">
                    {(() => {
                      const systemTotals = new Map<string, { total: number; faults: number }>();
                      storeCheckRecords.forEach(r => {
                        const existing = systemTotals.get(r.system) || { total: 0, faults: 0 };
                        existing.total += r.itemCount;
                        systemTotals.set(r.system, existing);
                      });
                      storeFaultRecords.forEach(f => {
                        const existing = systemTotals.get(f.system) || { total: 0, faults: 0 };
                        existing.faults += 1;
                        systemTotals.set(f.system, existing);
                      });
                      const systems = Array.from(systemTotals.entries());
                      if (systems.length === 0) {
                        return (
                          <div className="py-8 text-center text-gray-400 text-sm">
                            暂无系统完成数据
                          </div>
                        );
                      }
                      return (
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-4 font-medium text-gray-600">故障系统</th>
                              <th className="text-center py-2 px-4 font-medium text-gray-600">总检查项</th>
                              <th className="text-center py-2 px-4 font-medium text-gray-600">故障数</th>
                              <th className="text-center py-2 px-4 font-medium text-gray-600">完成率</th>
                            </tr>
                          </thead>
                          <tbody>
                            {systems.map(([sys, data]) => {
                              const completed = Math.max(0, data.total - data.faults);
                              const rate = data.total > 0 ? Math.round((completed / data.total) * 1000) / 10 : 0;
                              return (
                                <tr key={sys} className="border-b border-gray-100">
                                  <td className="py-2 px-4 font-medium text-gray-800">{sys}</td>
                                  <td className="text-center py-2 px-4 text-gray-700">{data.total}</td>
                                  <td className="text-center py-2 px-4 text-red-700">{data.faults}</td>
                                  <td className="text-center py-2 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      rate >= 90 ? 'bg-green-100 text-green-700' :
                                      rate >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>{rate}%</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">各用户×各系统完成情况</h4>
                  <div className="overflow-x-auto">
                    {(() => {
                      // 按 (username, system) 聚合
                      const rows = new Map<string, string>();
                      const userSet = new Set<string>();
                      const systemSet = new Set<string>();
                      const combined = new Map<string, { total: number; faults: number }>();
                      storeCheckRecords.forEach(r => {
                        userSet.add(r.username);
                        systemSet.add(r.system);
                        const key = `${r.username}__${r.system}`;
                        const existing = combined.get(key) || { total: 0, faults: 0 };
                        existing.total += r.itemCount;
                        combined.set(key, existing);
                      });
                      storeFaultRecords.forEach(f => {
                        userSet.add(f.username);
                        systemSet.add(f.system);
                        const key = `${f.username}__${f.system}`;
                        const existing = combined.get(key) || { total: 0, faults: 0 };
                        existing.faults += 1;
                        combined.set(key, existing);
                      });
                      const usersArr = Array.from(userSet);
                      const systemsArr = Array.from(systemSet);
                      if (usersArr.length === 0) {
                        return (
                          <div className="py-8 text-center text-gray-400 text-sm">
                            暂无检查数据
                          </div>
                        );
                      }
                      return (
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 font-medium text-gray-600">用户名</th>
                              {systemsArr.map(sys => (
                                <th key={sys} className="text-center py-2 px-3 font-medium text-gray-600">{sys}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {usersArr.map(username => (
                              <tr key={username} className="border-b border-gray-100">
                                <td className="py-2 px-3 font-medium text-gray-800 text-sm">{username}</td>
                                {systemsArr.map(sys => {
                                  const key = `${username}__${sys}`;
                                  const data = combined.get(key);
                                  if (!data || data.total === 0) {
                                    return <td key={sys} className="text-center py-2 px-3 text-gray-300 text-sm">-</td>;
                                  }
                                  const completed = Math.max(0, data.total - data.faults);
                                  const rate = Math.round((completed / data.total) * 1000) / 10;
                                  return (
                                    <td key={sys} className="text-center py-2 px-3 text-sm">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        rate >= 90 ? 'bg-green-100 text-green-700' :
                                        rate >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>{rate}%</span>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">下发新任务</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">任务类型</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="daily"
                          checked={newTask.type === 'daily'}
                          onChange={(e) => setNewTask(prev => ({ ...prev, type: e.target.value as 'daily' | 'weekly' }))}
                          className="text-blue-600"
                        />
                        每日任务
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="weekly"
                          checked={newTask.type === 'weekly'}
                          onChange={(e) => setNewTask(prev => ({ ...prev, type: e.target.value as 'daily' | 'weekly' }))}
                          className="text-blue-600"
                        />
                        每周任务
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">故障系统</label>
                    <select
                      value={newTask.system}
                      onChange={(e) => setNewTask(prev => ({ ...prev, system: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="全部">全部系统</option>
                      {systems.map(sys => (
                        <option key={sys} value={sys}>{sys}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">检查项数量</label>
                    <input
                      type="number"
                      min="1"
                      max={newTask.system === '全部' ? storeCheckItems.length : storeCheckItems.filter(i => i.system === newTask.system).length}
                      value={newTask.itemCount}
                      onChange={(e) => setNewTask(prev => ({ ...prev, itemCount: parseInt(e.target.value) || 1 }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      可选数量: {newTask.system === '全部' ? storeCheckItems.length : storeCheckItems.filter(i => i.system === newTask.system).length} 项
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">任务名称（可选）</label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="不填写将自动生成"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleCreateTask}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                  >
                    下发任务给所有用户
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">预览将选择的检查项</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getUncheckedItems(newTask.system, newTask.itemCount).map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                        <span className="text-xs text-gray-500">{index + 1}</span>
                        <span className="text-sm text-blue-600 font-medium">{item.serialNumber}</span>
                        <span className="text-sm text-gray-600">{item.system}</span>
                        <span className="text-xs text-gray-400 truncate">{item.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 任务下发记录 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">任务下发记录</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">日期</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">类型</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">系统</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">检查项数</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">下发对象</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localTaskDispatchRecords.map(record => (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{record.date}</td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.taskType === 'daily' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {record.taskType === 'daily' ? '每日' : '每周'}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">{record.system}</td>
                        <td className="text-center py-3 px-4">{record.itemCount} 项</td>
                        <td className="py-3 px-4">{record.dispatchedTo.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 现有任务列表 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">现有任务</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allTasks.map(task => (
                  <div
                    key={task.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">{task.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.type === 'daily' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {task.type === 'daily' ? '每日任务' : '每周任务'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{task.description}</p>
                    <p className="text-sm text-gray-400">
                      包含 {task.checkItemIds.length} 个检查项
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded transition-all">
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg p-6 max-h-[75vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 sticky top-0 bg-white py-2 -mt-2">用户管理</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">用户名</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">角色</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">状态</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">注册时间</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(user => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{user.username}</td>
                      <td className="text-center py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role === 'admin' ? '管理员' : '用户'}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          user.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.isActive !== false ? '正常' : '已停用'}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex justify-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={`px-3 py-1 text-sm rounded transition-all ${
                              user.isActive !== false
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                          >
                            {user.isActive !== false ? '停用' : '启用'}
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handlePromoteToAdmin(user.id)}
                              className="px-3 py-1 text-sm bg-purple-100 text-purple-600 hover:bg-purple-200 rounded transition-all"
                            >
                              设为管理员
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'faults' && (
          <div className="bg-white rounded-xl shadow-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white py-2 -mt-2 z-10">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">故障记录</h3>
                <p className="text-sm text-gray-500 mt-1">
                  共 {storeFaultRecords.length} 条故障记录
                </p>
              </div>
              <div className="text-sm text-gray-500">
                数据来源：用户在检查时提交的故障反馈
              </div>
            </div>

            {storeFaultRecords.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <div className="text-5xl mb-3">📋</div>
                <p>暂无故障记录</p>
                <p className="text-xs mt-2">用户在检查过程中提交的故障会显示在这里</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-3 font-medium text-gray-600">日期</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600">人员</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600">车型/配置</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600">故障系统</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600">检查项</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600">故障描述</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeFaultRecords.map((fault, idx) => (
                      <tr key={fault.id || idx} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                        <td className="py-3 px-3 text-sm text-gray-600 whitespace-nowrap">{fault.date}</td>
                        <td className="py-3 px-3 text-sm">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                            {fault.username}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-700">
                          <div>{fault.vehicleType}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {fault.powerType} · {fault.configuration}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-sm">
                          <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">
                            {fault.system}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-700">
                          <div className="font-medium text-xs text-gray-500">{fault.checkItemSerial}</div>
                          <div className="mt-0.5">{fault.description}</div>
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-800">
                          <div className="bg-red-50 p-2 rounded text-red-900 text-xs">
                            {fault.faultDescription}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'checkitems' && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            {/* 检查项检查记录 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">检查项检查记录</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">日期</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">人员</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">故障系统</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">检查项数</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">完成数</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">完成率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeCheckRecords.map((record, idx) => (
                      <tr key={record.id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{record.date}</td>
                        <td className="py-3 px-4 text-sm">{record.username}</td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {record.system}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">{record.itemCount} 项</td>
                        <td className="text-center py-3 px-4">{record.completedCount} 项</td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                            record.completionRate >= 90 ? 'bg-green-100 text-green-700' :
                            record.completionRate >= 70 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {record.completionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 故障系统管理 */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">故障系统管理</h3>
                <button
                  onClick={() => {
                    setEditingSystem(null);
                    setNewSystemName('');
                    setShowAddSystemModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  + 添加故障系统
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {systems.map((system) => (
                  <div
                    key={system}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <button
                      onClick={() => setSelectedCheckSystem(selectedCheckSystem === system ? '' : system)}
                      className={`text-left flex-1 font-medium ${
                        selectedCheckSystem === system ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {system}
                      <span className="text-xs text-gray-400 ml-2">
                        ({storeCheckItems.filter(i => i.system === system).length}项)
                      </span>
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingSystem(system);
                          setNewSystemName(system);
                          setShowAddSystemModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确定要删除故障系统 "${system}" 吗？这将同时删除该系统下的所有检查项。`)) {
                            deleteSystem(system);
                            if (selectedCheckSystem === system) {
                              setSelectedCheckSystem('');
                            }
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 检查项管理 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {selectedCheckSystem ? `${selectedCheckSystem} - 检查项` : '检查项列表'}
                  </h3>
                  <select
                    value={selectedCheckSystem}
                    onChange={(e) => setSelectedCheckSystem(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全部系统</option>
                    {systems.map((system) => (
                      <option key={system} value={system}>{system}</option>
                    ))}
                  </select>
                  {selectedCheckSystem && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">全选</span>
                    </label>
                  )}
                  {selectedItems.length > 0 && (
                    <button
                      onClick={handleBatchDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                    >
                      🗑️ 批量删除 ({selectedItems.length})
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleExcelUpload(e, selectedCheckSystem)}
                    className="hidden"
                  />
                  <button
                    onClick={() => setShowFormatModal(true)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                  >
                    📋 格式说明
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? '⏳ 导入中...' : '📥 Excel导入'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCheckItem(null);
                      setNewCheckItem(prev => ({ ...prev, system: selectedCheckSystem || systems[0] || '' }));
                      setShowAddCheckItemModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  >
                    + 添加检查项
                  </button>
                </div>
              </div>

              {isUploading && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">导入进度</span>
                    <span className="text-sm font-medium text-blue-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  ❌ {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div className="mb-6 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
                  ✅ {uploadSuccess}
                </div>
              )}

              <div className="space-y-4">
                {storeCheckItems
                  .filter(item => !selectedCheckSystem || item.system === selectedCheckSystem)
                  .map(item => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, item.id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-blue-600 font-medium">{item.serialNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.type === 'dynamic' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.type === 'dynamic' ? '动态' : '静态'}
                        </span>
                        <span className="text-sm text-gray-500">{item.system} / {item.category}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingCheckItem(item);
                            setNewCheckItem({
                              serialNumber: item.serialNumber,
                              system: item.system,
                              category: item.category,
                              type: item.type,
                              description: item.description,
                              precondition: item.precondition,
                              testSteps: [...item.testSteps],
                              expectedResult: item.expectedResult,
                              isDaily: item.isDaily
                            });
                            setShowAddCheckItemModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-all"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteCheckItem(item.id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded transition-all"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">车型管理</h3>
              <button
                onClick={() => {
                  setEditingVehicle(null);
                  setNewVehicle('');
                  setShowVehicleModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                添加车型
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {localVehicleTypes.map((vehicle, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800">{vehicle}</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingVehicle(vehicle);
                          setNewVehicle(vehicle);
                          setShowVehicleModal(true);
                        }}
                        className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-all"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle)}
                        className="px-2 py-1 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded transition-all"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">系统设置</h3>
            
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-4">管理员密码</h4>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  修改密码
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">今日邀请码</h4>
                <p className="text-gray-500 mb-4">用户注册时需要输入此邀请码</p>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-mono font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                    {todayInviteCode}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(todayInviteCode)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    复制
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 添加检查项弹窗 */}
      {showAddCheckItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingCheckItem ? '编辑检查项' : '添加检查项'}
              </h3>
              <button
                onClick={() => {
                  setShowAddCheckItemModal(false);
                  setEditingCheckItem(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">点检序号</label>
                  <input
                    type="text"
                    value={newCheckItem.serialNumber}
                    onChange={(e) => setNewCheckItem(prev => ({ ...prev, serialNumber: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">检查系统</label>
                  <select
                    value={newCheckItem.system}
                    onChange={(e) => setNewCheckItem(prev => ({ ...prev, system: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择系统</option>
                    {systems.map(sys => (
                      <option key={sys} value={sys}>{sys}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">功能分类</label>
                  <input
                    type="text"
                    value={newCheckItem.category}
                    onChange={(e) => setNewCheckItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">动态/静态</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="static"
                        checked={newCheckItem.type === 'static'}
                        onChange={(e) => setNewCheckItem(prev => ({ ...prev, type: e.target.value as 'static' | 'dynamic' }))}
                        className="text-blue-600"
                      />
                      静态
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="dynamic"
                        checked={newCheckItem.type === 'dynamic'}
                        onChange={(e) => setNewCheckItem(prev => ({ ...prev, type: e.target.value as 'static' | 'dynamic' }))}
                        className="text-blue-600"
                      />
                      动态
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">功能描述</label>
                <input
                  type="text"
                  value={newCheckItem.description}
                  onChange={(e) => setNewCheckItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">前置条件</label>
                <textarea
                  value={newCheckItem.precondition}
                  onChange={(e) => setNewCheckItem(prev => ({ ...prev, precondition: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">测试步骤</label>
                <div className="space-y-2">
                  {newCheckItem.testSteps.map((step, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => updateTestStep(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={`步骤 ${index + 1}`}
                      />
                      {newCheckItem.testSteps.length > 1 && (
                        <button
                          onClick={() => removeTestStep(index)}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addTestStep}
                    className="px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-500 transition-all"
                  >
                    + 添加步骤
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">期待结果</label>
                <textarea
                  value={newCheckItem.expectedResult}
                  onChange={(e) => setNewCheckItem(prev => ({ ...prev, expectedResult: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newCheckItem.isDaily}
                  onChange={(e) => setNewCheckItem(prev => ({ ...prev, isDaily: e.target.checked }))}
                  className="text-blue-600"
                />
                <label className="text-sm font-medium text-gray-700">设为每日任务</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddCheckItemModal(false);
                    setEditingCheckItem(null);
                  }}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveCheckItem}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">修改密码</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">原密码</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">新密码</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">密码长度至少6位，必须包含字母和数字</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">确认新密码</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  确认修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 用户完成情况弹窗（点击平均完成率打开） */}
      {showUserStatsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800">每位用户完成情况</h3>
              <button
                onClick={() => setShowUserStatsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              {(() => {
                const userStats = aggregateUserStats();
                if (userStats.length === 0) {
                  return (
                    <div className="py-16 text-center text-gray-400">
                      <div className="text-5xl mb-3">📊</div>
                      <p>暂无用户完成记录</p>
                      <p className="text-xs mt-2">用户完成检查后，数据会显示在这里</p>
                    </div>
                  );
                }
                return (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-3 font-medium text-gray-600">用户名</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-600">已检查项</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-600">完成项</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-600">故障数</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-600">完成率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userStats.map(u => (
                        <tr key={u.username} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-3 font-medium text-gray-800">{u.username}</td>
                          <td className="text-center py-3 px-3 text-gray-700">{u.total}</td>
                          <td className="text-center py-3 px-3 text-green-700">{u.completed}</td>
                          <td className="text-center py-3 px-3">
                            <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">
                              {u.faults}
                            </span>
                          </td>
                          <td className="text-center py-3 px-3">
                            <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                              u.rate >= 90 ? 'bg-green-100 text-green-700' :
                              u.rate >= 70 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {u.rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            <div className="pt-4 border-t flex-shrink-0">
              <button
                onClick={() => setShowUserStatsModal(false)}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel格式说明弹窗 */}
      {showFormatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <h3 className="text-xl font-semibold text-gray-800">📋 Excel导入格式说明</h3>
              <button
                onClick={() => setShowFormatModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">📌 基本要求</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 文件格式：.xlsx / .xls / .csv（推荐使用 .xlsx）</li>
                    <li>• 文件大小：不超过 20MB</li>
                    <li>• 第一行为表头，之后每一行为一条检查项</li>
                    <li>• 表头名称支持中文或英文（见下表），但必须在第一行</li>
                    <li>• 检查序号不能与系统中已有检查项重复（重复会自动跳过）</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">📑 表头字段说明</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">中文表头</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">支持的别名</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">必填</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">填写说明 / 示例</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-blue-600">检查序号</td>
                          <td className="py-3 px-4 text-gray-600">序号 / 编号 / serialNumber</td>
                          <td className="py-3 px-4"><span className="text-red-600 font-medium">必须</span></td>
                          <td className="py-3 px-4 text-gray-600">如 ADAS-001、INT-003，用于唯一标识检查项</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-blue-600">故障系统</td>
                          <td className="py-3 px-4 text-gray-600">系统 / system</td>
                          <td className="py-3 px-4"><span className="text-red-600 font-medium">必须</span></td>
                          <td className="py-3 px-4 text-gray-600">智能驾驶 / 内饰 / 底盘 / 电气 / 车身</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-blue-600">功能分类</td>
                          <td className="py-3 px-4 text-gray-600">分类 / category</td>
                          <td className="py-3 px-4"><span className="text-gray-400">可选</span></td>
                          <td className="py-3 px-4 text-gray-600">如 ADAS、中控系统、空调系统，未填默认为"通用测试"</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-blue-600">动态/静态</td>
                          <td className="py-3 px-4 text-gray-600">类型 / type</td>
                          <td className="py-3 px-4"><span className="text-gray-400">可选</span></td>
                          <td className="py-3 px-4 text-gray-600">动态 / static（默认静态，填写"动态"为动态检查）</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-blue-600">检查描述</td>
                          <td className="py-3 px-4 text-gray-600">描述 / description</td>
                          <td className="py-3 px-4"><span className="text-red-600 font-medium">必须</span></td>
                          <td className="py-3 px-4 text-gray-600">简要描述检查内容，如"自适应巡航控制系统测试"</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-blue-600">前置条件</td>
                          <td className="py-3 px-4 text-gray-600">precondition</td>
                          <td className="py-3 px-4"><span className="text-gray-400">可选</span></td>
                          <td className="py-3 px-4 text-gray-600">执行检查前应满足的条件，未填默认为"车辆通电"</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-blue-600">测试步骤</td>
                          <td className="py-3 px-4 text-gray-600">步骤 / testSteps</td>
                          <td className="py-3 px-4"><span className="text-gray-400">可选</span></td>
                          <td className="py-3 px-4 text-gray-600">多个步骤用 <span className="font-mono bg-gray-100 px-1 rounded">分号;</span> 或 <span className="font-mono bg-gray-100 px-1 rounded">换行</span> 分隔</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-blue-600">期望结果</td>
                          <td className="py-3 px-4 text-gray-600">预期结果 / expectedResult</td>
                          <td className="py-3 px-4"><span className="text-gray-400">可选</span></td>
                          <td className="py-3 px-4 text-gray-600">预期的检查结果，未填默认为"检查通过"</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-blue-600">每日检查</td>
                          <td className="py-3 px-4 text-gray-600">每日 / isDaily</td>
                          <td className="py-3 px-4"><span className="text-gray-400">可选</span></td>
                          <td className="py-3 px-4 text-gray-600">是 / 每日 / true / 1（填写后该检查项会进入每日任务池）</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">📄 示例文件内容（复制到Excel即可使用）</h4>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600 font-mono">
                      第1行（表头）：检查序号 | 故障系统 | 功能分类 | 动态/静态 | 检查描述 | 前置条件 | 测试步骤 | 期望结果 | 每日检查
                    </div>
                    <div className="p-4 space-y-2 text-sm font-mono">
                      <div className="flex gap-3 items-start">
                        <span className="text-gray-400 min-w-[3rem]">行2</span>
                        <span className="text-gray-700">ADAS-001 | 智能驾驶 | ADAS | 动态 | 自适应巡航控制系统测试 | 车辆在封闭道路行驶，车速≥30km/h | 开启ACC功能;设置巡航速度为60km/h;观察车辆是否自动保持跟车距离 | 车辆能够自动保持设定速度并与前车保持安全距离 | 是</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="text-gray-400 min-w-[3rem]">行3</span>
                        <span className="text-gray-700">INT-001 | 内饰 | 中控系统 | 静态 | 中控大屏触控测试 | 车辆通电，中控屏幕开启 | 点击主菜单;滑动屏幕切换页面;测试各功能按钮响应 | 触控响应灵敏，显示清晰无卡顿 | 是</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="text-gray-400 min-w-[3rem]">行4</span>
                        <span className="text-gray-700">CHS-001 | 底盘 | 悬挂系统 | 静态 | 悬挂系统检查 | 车辆静止停放在平坦地面 | 检查悬挂系统外观;检查减震器是否有漏油 | 悬挂部件无损伤，减震器无漏油 | </span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="text-gray-400 min-w-[3rem]">行5</span>
                        <span className="text-gray-700">ELE-001 | 电气 | 照明系统 | 动态 | 大灯功能测试 | 车辆在夜间或昏暗环境行驶 | 开启近光灯;开启远光灯;测试自动大灯功能 | 灯光照明正常，远近光切换流畅 | 是</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-2">⚠️ 注意事项</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>1. 测试步骤中的分号请使用中文分号"；"或英文分号";"</li>
                    <li>2. 单元格内换行请使用 Alt+Enter（Excel），系统会按换行和分号拆分为多个步骤</li>
                    <li>3. 数据量较大时（超过1000行），导入可能需要1-5秒，请耐心等待</li>
                    <li>4. 系统会自动跳过检查序号已存在的行，并在完成后提示跳过数量</li>
                    <li>5. 建议先用少量数据测试格式，确认无误后再批量导入</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t p-4 flex-shrink-0 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowFormatModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                >
                  我知道了
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加/编辑故障系统弹窗 */}
      {showAddSystemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingSystem ? '编辑故障系统' : '添加故障系统'}
              </h3>
              <button
                onClick={() => setShowAddSystemModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  故障系统名称
                </label>
                <input
                  type="text"
                  value={newSystemName}
                  onChange={(e) => setNewSystemName(e.target.value)}
                  placeholder="请输入故障系统名称"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddSystemModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (!newSystemName.trim()) {
                      alert('请输入故障系统名称');
                      return;
                    }
                    if (editingSystem) {
                      updateSystem(editingSystem, newSystemName.trim());
                    } else {
                      addSystem(newSystemName.trim());
                    }
                    setShowAddSystemModal(false);
                    setNewSystemName('');
                    setEditingSystem(null);
                  }}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  {editingSystem ? '保存修改' : '添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加/编辑车型弹窗 */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingVehicle ? '编辑车型' : '添加车型'}
              </h3>
              <button
                onClick={() => {
                  setShowVehicleModal(false);
                  setEditingVehicle(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">车型名称</label>
                <input
                  type="text"
                  value={newVehicle}
                  onChange={(e) => setNewVehicle(e.target.value)}
                  placeholder="请输入车型名称"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowVehicleModal(false);
                    setEditingVehicle(null);
                  }}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleAddVehicle}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};