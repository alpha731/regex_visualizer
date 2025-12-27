import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ThinkCollapseProps {
  children: React.ReactNode;
  generating?: string;
}

export const ThinkCollapse: React.FC<ThinkCollapseProps> = ({ children, generating }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isStreaming = generating === "true";

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
        {isStreaming && (
           <span className="ml-2 flex items-center">
             <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mr-1"></span>
             <span className="text-[10px] text-blue-500 font-normal">Thinking...</span>
           </span>
        )}
      </button>
      {isOpen && (
        <div className="p-3 text-gray-600 text-sm border-t border-gray-200 bg-white italic">
          {children}
          {isStreaming && (
             <span className="inline-block w-1.5 h-3 ml-1 bg-gray-400 animate-pulse align-middle"></span>
          )}
        </div>
      )}
    </div>
  );
};

