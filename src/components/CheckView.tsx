import React, { useRef, useEffect } from 'react';
import { CheckItem } from '../types';
import { CheckItemCard } from './CheckItemCard';

interface CheckViewProps {
  items: CheckItem[];
  onComplete: () => void;
}

export const CheckView: React.FC<CheckViewProps> = ({ items, onComplete }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaX > 0 && currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (e.deltaX < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    };

    const element = scrollRef.current;
    if (element) {
      element.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (element) {
        element.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, items.length]);

  const handleTouchStart = useRef(0);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = handleTouchStart.current - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          ← 上一个
        </button>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === currentIndex
                  ? 'w-8 bg-blue-600'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrentIndex(Math.min(items.length - 1, currentIndex + 1))}
          disabled={currentIndex === items.length - 1}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          下一个 →
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-hidden"
        onTouchStart={(e) => (handleTouchStart.current = e.touches[0].clientX)}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, index) => (
            <div key={item.id} className="w-full flex-shrink-0 px-1">
              <CheckItemCard item={item} index={index} total={items.length} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:scale-98 transition-all"
        >
          完成检查
        </button>
      </div>
    </div>
  );
};