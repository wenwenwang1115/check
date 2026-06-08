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
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {systems.map((system) => (
        <button
          key={system}
          onClick={() => onSelect(system)}
          className={`py-4 px-6 rounded-xl transition-all duration-200 text-center font-medium text-base ${
            selectedSystem === system
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-blue-50 hover:shadow-md border border-gray-200'
          }`}
        >
          {system}
        </button>
      ))}
    </div>
  );
};
