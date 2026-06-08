import React, { useState } from 'react';
import { CheckItem } from '../types';

interface CheckItemCardProps {
  item: CheckItem;
  index: number;
  total: number;
}

export const CheckItemCard: React.FC<CheckItemCardProps> = ({ item, index, total }) => {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<'pending' | 'completed' | 'failed'>('pending');

  const handleSubmit = (result: 'completed' | 'failed') => {
    setStatus(result);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-blue-600 font-medium">{item.serialNumber}</span>
        <span className="text-sm text-gray-500">
          {index + 1} / {total}
        </span>
      </div>

      <div className="space-y-4 flex-1">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.type === 'dynamic' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {item.type === 'dynamic' ? '动态' : '静态'}
            </span>
            <span className="text-sm text-gray-600">{item.system}</span>
            <span className="text-sm text-gray-500">{item.category}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{item.description}</h3>
        </div>

        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">前置条件</h4>
          <p className="text-sm text-gray-600">{item.precondition}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">测试步骤</h4>
          <ol className="list-decimal list-inside space-y-1">
            {item.testSteps.map((step, i) => (
              <li key={i} className="text-sm text-gray-600">{step}</li>
            ))}
          </ol>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-700 mb-2">期待结果</h4>
          <p className="text-sm text-green-800">{item.expectedResult}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">故障反馈</h4>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="如有故障，请在此描述..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => handleSubmit('completed')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
            status === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          检查通过
        </button>
        <button
          onClick={() => handleSubmit('failed')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
            status === 'failed'
              ? 'bg-red-600 text-white'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          检查失败
        </button>
      </div>
    </div>
  );
};