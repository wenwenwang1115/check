import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCheckStore } from '../store/checkStore';
import { VehicleSelector } from '../components/VehicleSelector';
import { CheckView } from '../components/CheckView';
import { SystemList } from '../components/SystemList';
import { CheckItem } from '../types';

interface UserHomeProps {
  onNavigate: (page: string) => void;
}

type ViewMode = 'select' | 'daily' | 'all';

export const UserHome: React.FC<UserHomeProps> = ({ onNavigate }) => {
  const { currentUser, logout } = useAuthStore();
  const {
    vehicleInfo,
    setVehicleInfo,
    getDailyCheckItems,
    getCheckItemsBySystem,
    getSystems,
    getAllCheckItems,
    setSelectedSystem,
    selectedSystem
  } = useCheckStore();
  
  const [mode, setMode] = useState<ViewMode>('select');
  const [showVehicleSelector, setShowVehicleSelector] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'all'>('daily');

  const handleStartCheck = () => {
    setShowVehicleSelector(false);
    setMode(activeTab);
  };

  const handleComplete = () => {
    setShowVehicleSelector(true);
    setMode('select');
  };

  const handleSystemSelect = (system: string) => {
    setSelectedSystem(system);
  };

  const getCurrentItems = (): CheckItem[] => {
    if (mode === 'daily') {
      return getDailyCheckItems();
    }
    if (mode === 'all' && selectedSystem) {
      return getCheckItemsBySystem(selectedSystem);
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-md flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🚗</div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">功能打卡系统</h1>
              <p className="text-sm text-gray-500">用户端</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">欢迎, {currentUser?.username}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 overflow-auto">
        {mode === 'select' ? (
          <div className="bg-white rounded-xl shadow-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex gap-4 mb-6 sticky top-0 bg-white py-2 -mt-2">
              <button
                onClick={() => setActiveTab('daily')}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'daily'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                每日任务
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部检查项
              </button>
            </div>

            {activeTab === 'daily' ? (
              showVehicleSelector ? (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    每日任务
                  </h2>
                  <p className="text-gray-500 mb-6">请先选择车辆信息</p>
                  <VehicleSelector
                    vehicleInfo={vehicleInfo}
                    onChange={setVehicleInfo}
                    onStart={handleStartCheck}
                  />
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600">
                      车辆：{vehicleInfo.vehicleType} / {vehicleInfo.powerType} / {vehicleInfo.configuration}
                    </span>
                    <button
                      onClick={() => setShowVehicleSelector(true)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                    >
                      返回
                    </button>
                  </div>
                  <CheckView items={getDailyCheckItems()} onComplete={handleComplete} />
                </div>
              )
            ) : (
              !selectedSystem ? (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    选择故障系统
                  </h2>
                  <p className="text-gray-500 mb-6">
                    请选择要检查的系统
                  </p>
                  <SystemList
                    systems={getSystems()}
                    selectedSystem={selectedSystem}
                    onSelect={handleSystemSelect}
                  />
                </div>
              ) : showVehicleSelector ? (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    {selectedSystem} - 检查项
                  </h2>
                  <p className="text-gray-500 mb-6">
                    已选择系统：{selectedSystem}，共 {getCheckItemsBySystem(selectedSystem).length} 个检查项
                  </p>
                  <p className="text-gray-500 mb-4">请先选择车辆信息</p>
                  <VehicleSelector
                    vehicleInfo={vehicleInfo}
                    onChange={setVehicleInfo}
                    onStart={handleStartCheck}
                  />
                  <button
                    onClick={() => setSelectedSystem(null)}
                    className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    返回选择系统
                  </button>
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">
                        车辆：{vehicleInfo.vehicleType} / {vehicleInfo.powerType} / {vehicleInfo.configuration}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {selectedSystem}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSystem(null);
                        setShowVehicleSelector(true);
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                    >
                      返回
                    </button>
                  </div>
                  <CheckView items={getCurrentItems()} onComplete={handleComplete} />
                </div>
              )
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  车辆：{vehicleInfo.vehicleType} / {vehicleInfo.powerType} / {vehicleInfo.configuration}
                </span>
                {selectedSystem && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {selectedSystem}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  if (activeTab === 'all') {
                    setSelectedSystem(null);
                  }
                  setShowVehicleSelector(true);
                  setMode('select');
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              >
                返回
              </button>
            </div>
            <CheckView items={getCurrentItems()} onComplete={handleComplete} />
          </div>
        )}
      </main>
    </div>
  );
};