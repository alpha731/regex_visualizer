import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ThinkCollapseProps {
  children: React.ReactNode;
}

export const ThinkCollapse: React.FC<ThinkCollapseProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-md my-2 overflow-hidden bg-gray-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none"
      >
        {isOpen ? (
          <ChevronDown className="w-3 h-3 mr-1" />
        ) : (
          <ChevronRight className="w-3 h-3 mr-1" />
        )}
        Thought Process
      </button>
      {isOpen && (
        <div className="p-3 text-gray-600 text-sm border-t border-gray-200 bg-white italic">
          {children}
        </div>
      )}
    </div>
  );
};

