import React from 'react';
import { VehicleInfo } from '../types';
import { vehicleTypes, powerTypes, configurations } from '../data/mockData';

interface VehicleSelectorProps {
  vehicleInfo: VehicleInfo;
  onChange: (info: VehicleInfo) => void;
  onStart: () => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  vehicleInfo,
  onChange,
  onStart
}) => {
  const isComplete =
    vehicleInfo.vehicleType && vehicleInfo.powerType && vehicleInfo.configuration;

  const selectCls =
    'w-full px-6 py-5 text-xl border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 bg-white';

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-xl font-semibold text-gray-800 mb-3">
          车辆类型
        </label>
        <select
          value={vehicleInfo.vehicleType}
          onChange={(e) => onChange({ ...vehicleInfo, vehicleType: e.target.value })}
          className={selectCls}
        >
          <option value="">请选择车辆类型</option>
          {vehicleTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xl font-semibold text-gray-800 mb-3">
          动力形式
        </label>
        <select
          value={vehicleInfo.powerType}
          onChange={(e) => onChange({ ...vehicleInfo, powerType: e.target.value })}
          className={selectCls}
        >
          <option value="">请选择动力形式</option>
          {powerTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xl font-semibold text-gray-800 mb-3">
          车辆配置
        </label>
        <select
          value={vehicleInfo.configuration}
          onChange={(e) =>
            onChange({ ...vehicleInfo, configuration: e.target.value })
          }
          className={selectCls}
        >
          <option value="">请选择车辆配置</option>
          {configurations.map((config) => (
            <option key={config} value={config}>
              {config}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={onStart}
        disabled={!isComplete}
        className={`w-full py-6 px-6 text-xl font-semibold rounded-2xl transition-all duration-200 ${
          isComplete
            ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-98 shadow-lg'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        开始检查
      </button>
    </div>
  );
};
