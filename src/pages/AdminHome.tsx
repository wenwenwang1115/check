import React, { useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  systemStats,
  vehicleStats,
  userStats,
  checkItems,
  dailyTasks,
  weeklyTasks,
  users,
  vehicleTypes,
  getTodayInviteCode,
  weeklyFaultData,
  dailyFaultBySystem,
  userSystemCompletion,
  checkRecords,
  taskDispatchRecords
} from '../data/mockData';
import { CheckItem, Task, User } from '../types';

interface AdminHomeProps {
  onNavigate: (page: string) => void;
}

type TabType = 'dashboard' | 'tasks' | 'users' | 'checkitems' | 'vehicles' | 'settings';

export const AdminHome: React.FC<AdminHomeProps> = ({ onNavigate }) => {
  const { currentUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddCheckItemModal, setShowAddCheckItemModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
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

  const [localVehicleTypes, setLocalVehicleTypes] = useState<string[]>(vehicleTypes);
  const [localUsers, setLocalUsers] = useState<User[]>(users);
  const [localCheckItems, setLocalCheckItems] = useState<CheckItem[]>(checkItems);
  const [localCheckRecords, setLocalCheckRecords] = useState(checkRecords);
  const [localTaskDispatchRecords, setLocalTaskDispatchRecords] = useState(taskDispatchRecords);
  const [localDailyTasks, setLocalDailyTasks] = useState(dailyTasks);
  const [localWeeklyTasks, setLocalWeeklyTasks] = useState(weeklyTasks);

  const allTasks = [...localDailyTasks, ...localWeeklyTasks];
  const allUsers = localUsers.filter(u => u.role === 'user');
  const todayInviteCode = getTodayInviteCode();
  const systems = [...new Set(localCheckItems.map(item => item.system))];

  // 自动选择未检查的检查项
  const getUncheckedItems = (system: string, count: number): CheckItem[] => {
    let availableItems = localCheckItems;
    if (system !== '全部') {
      availableItems = localCheckItems.filter(item => item.system === system);
    }
    // 按最近检查时间排序，优先选择未检查的
    const today = new Date().toISOString().split('T')[0];
    const recentlyCheckedIds = localCheckRecords
      .filter(r => r.date === today)
      .flatMap(r => {
        // 根据系统获取对应的检查项ID
        return localCheckItems
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
    setLocalUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, isActive: u.isActive === false ? true : false } : u
    ));
  };

  const handlePromoteToAdmin = (userId: string) => {
    setLocalUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, role: 'admin' as const } : u
    ));
  };

  const handleAddVehicle = () => {
    if (newVehicle && !localVehicleTypes.includes(newVehicle)) {
      setLocalVehicleTypes(prev => [...prev, newVehicle]);
      setNewVehicle('');
      setShowVehicleModal(false);
    }
  };

  const handleDeleteVehicle = (vehicle: string) => {
    setLocalVehicleTypes(prev => prev.filter(v => v !== vehicle));
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

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert('Excel文件已上传，将按照格式自动导入检查项');
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
                    <p className="text-3xl font-bold text-gray-800">910</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">平均完成率</p>
                    <p className="text-3xl font-bold text-green-600">92.6%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">故障总数</p>
                    <p className="text-3xl font-bold text-red-600">51</p>
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
                  <h4 className="text-md font-medium text-gray-700 mb-3">每日任务</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-4 font-medium text-gray-600">用户名</th>
                          <th className="text-center py-2 px-4 font-medium text-gray-600">总任务</th>
                          <th className="text-center py-2 px-4 font-medium text-gray-600">已完成</th>
                          <th className="text-center py-2 px-4 font-medium text-gray-600">完成率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userStats.map(stat => (
                          <tr key={stat.userId} className="border-b border-gray-100">
                            <td className="py-2 px-4">{stat.username}</td>
                            <td className="text-center py-2 px-4">{stat.totalTasks}</td>
                            <td className="text-center py-2 px-4">{stat.completedTasks}</td>
                            <td className="text-center py-2 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                stat.completionRate >= 90 ? 'bg-green-100 text-green-700' :
                                stat.completionRate >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {stat.completionRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">每周任务</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-4 font-medium text-gray-600">用户名</th>
                          <th className="text-center py-2 px-4 font-medium text-gray-600">总任务</th>
                          <th className="text-center py-2 px-4 font-medium text-gray-600">已完成</th>
                          <th className="text-center py-2 px-4 font-medium text-gray-600">完成率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userStats.map(stat => (
                          <tr key={stat.userId} className="border-b border-gray-100">
                            <td className="py-2 px-4">{stat.username}</td>
                            <td className="text-center py-2 px-4">5</td>
                            <td className="text-center py-2 px-4">4</td>
                            <td className="text-center py-2 px-4">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">80%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">全部检查项 - 各系统完成情况</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-4 font-medium text-gray-600">用户名</th>
                          <th className="text-center py-2 px-4 font-medium text-gray-600">智能驾驶</th>
                          <th className="text-center py-2 px-4 font-medium text-gray-600">内饰</th>
                          <th className="text-center py-2 px-4 font-medium text-gray-600">底盘</th>
                          <th className="text-center py-2 px-4 font-medium text-gray-600">电气</th>
                          <th className="text-center py-2 px-4 font-medium text-gray-600">车身</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userSystemCompletion.map(stat => (
                          <tr key={stat.userId} className="border-b border-gray-100">
                            <td className="py-2 px-4">{stat.username}</td>
                            <td className="text-center py-2 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                stat.智能驾驶 >= 90 ? 'bg-green-100 text-green-700' :
                                stat.智能驾驶 >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>{stat.智能驾驶}%</span>
                            </td>
                            <td className="text-center py-2 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                stat.内饰 >= 90 ? 'bg-green-100 text-green-700' :
                                stat.内饰 >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>{stat.内饰}%</span>
                            </td>
                            <td className="text-center py-2 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                stat.底盘 >= 90 ? 'bg-green-100 text-green-700' :
                                stat.底盘 >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>{stat.底盘}%</span>
                            </td>
                            <td className="text-center py-2 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                stat.电气 >= 90 ? 'bg-green-100 text-green-700' :
                                stat.电气 >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>{stat.电气}%</span>
                            </td>
                            <td className="text-center py-2 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                stat.车身 >= 90 ? 'bg-green-100 text-green-700' :
                                stat.车身 >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>{stat.车身}%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                      max={newTask.system === '全部' ? localCheckItems.length : localCheckItems.filter(i => i.system === newTask.system).length}
                      value={newTask.itemCount}
                      onChange={(e) => setNewTask(prev => ({ ...prev, itemCount: parseInt(e.target.value) || 1 }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      可选数量: {newTask.system === '全部' ? localCheckItems.length : localCheckItems.filter(i => i.system === newTask.system).length} 项
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
                      <th className="text-center py-3 px-4 font-medium text-gray-600">故障系统</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">检查项数</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">完成数</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">完成率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localCheckRecords.map(record => (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{record.date}</td>
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

            {/* 检查项管理 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">检查项列表</h3>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                  >
                    📥 Excel导入
                  </button>
                  <button
                    onClick={() => {
                      setEditingCheckItem(null);
                      setShowAddCheckItemModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  >
                    添加检查项
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {localCheckItems.map(item => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-blue-600 font-medium">{item.serialNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.type === 'dynamic' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.type === 'dynamic' ? '动态' : '静态'}
                        </span>
                        <span className="text-sm text-gray-500">{item.system} / {item.category}</span>
                        {item.isDaily && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            每日
                          </span>
                        )}
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
                        <button className="px-3 py-1 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded transition-all">
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