import React, { useState, useEffect } from 'react';
import { CheckItem } from '../types';
import { useCheckStore } from '../store/checkStore';
import { useAuthStore } from '../store/authStore';

interface CheckItemCardProps {
  item: CheckItem;
  index: number;
  total: number;
}

export const CheckItemCard: React.FC<CheckItemCardProps> = ({ item, index, total }) => {
  const { currentUser } = useAuthStore();
  const { vehicleInfo, addFaultRecord } = useCheckStore();
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // 切换到新检查项时重置状态
    setFeedback('');
    setStatus('pending');
    setSubmitted(false);
  }, [item.id]);

  const handleSubmit = (result: 'completed' | 'failed') => {
    if (submitted) return;
    setStatus(result);
    setSubmitted(true);

    if (result === 'failed' || feedback.trim().length > 0) {
      const today = new Date().toISOString().split('T')[0];
      addFaultRecord({
        username: currentUser?.username || '未知用户',
        vehicleType: vehicleInfo.vehicleType || '未指定',
        powerType: vehicleInfo.powerType || '未指定',
        configuration: vehicleInfo.configuration || '未指定',
        date: today,
        checkItemId: item.id,
        checkItemSerial: item.serialNumber,
        system: item.system,
        category: item.category,
        description: item.description,
        faultDescription: feedback.trim() || '未填写故障描述，仅标记检查失败',
        testSteps: item.testSteps,
        expectedResult: item.expectedResult
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-blue-600 font-medium">{item.serialNumber}</span>
        <span className="text-sm text-gray-500">
          {index + 1} / {total}
        </span>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
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
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            故障反馈 <span className="text-xs text-gray-500">（如有故障请描述，检查失败会记录为故障）</span>
          </h4>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={submitted}
            placeholder="如有故障，请在此描述..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none disabled:bg-gray-100 disabled:text-gray-500"
            rows={3}
          />
        </div>

        {submitted && (
          <div className={`p-3 rounded-lg text-sm ${
            status === 'completed'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status === 'completed'
              ? '✓ 检查通过，已记录'
              : '⚠ 已记录为故障，管理员端可见'}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => handleSubmit('completed')}
          disabled={submitted}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            status === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          检查通过
        </button>
        <button
          onClick={() => handleSubmit('failed')}
          disabled={submitted}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
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
