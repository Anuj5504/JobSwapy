import { useState } from 'react';
import { useDrag } from '../../hooks/useDrag';

export const AutofillButton = ({ onAutofill }) => {
  const [isDragging, dragRef] = useDrag();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      ref={dragRef}
      className={`fixed cursor-move transition-all duration-300 ${
        isDragging ? 'scale-95' : ''
      }`}
      style={{ top: '50%', right: '20px', transform: 'translateY(-50%)' }}
    >
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onAutofill}
        className="relative group flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all"
      >
        <span className="text-xl">⚡</span>
        <span className={`${
          isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'
        } overflow-hidden whitespace-nowrap transition-all duration-300`}>
          AI Apply
        </span>
      </button>
    </div>
  );
}; 