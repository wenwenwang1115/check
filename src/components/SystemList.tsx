import React from 'react';

interface SystemListProps {
  systems: string[];
  selectedSystem: string | null;
  onSelect: (system: string) => void;
}

export const SystemList: React.FC<SystemListProps> = ({
  systems,
  selectedSystem,
  onSelect
}) => {
  const systemIcons: Record<string, string> = {
    '智能驾驶': '🚗',
    '内饰': '🚙',
    '底盘': '🔧',
    '电气': '⚡',
    '车身': '🚘'
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {systems.map((system) => (
        <button
          key={system}
          onClick={() => onSelect(system)}
          className={`p-4 rounded-xl transition-all duration-200 text-center ${
            selectedSystem === system
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-blue-50 hover:shadow-md'
          }`}
        >
          <div className="text-3xl mb-2">{systemIcons[system] || '📋'}</div>
          <div className="font-medium">{system}</div>
        </button>
      ))}
    </div>
  );
};