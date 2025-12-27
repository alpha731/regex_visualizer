import React from 'react';

interface RegexInputProps {
  regex: string;
  setRegex: (regex: string) => void;
}

export const RegexInput: React.FC<RegexInputProps> = ({ regex, setRegex }) => {
  return (
    <div className="w-full mb-6">
      <label htmlFor="regex" className="block text-sm font-medium text-gray-700 mb-2">
        Regular Expression
      </label>
      <input
        type="text"
        id="regex"
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-lg"
        placeholder="Enter your regex here (e.g. ^[a-z]+$)"
        value={regex}
        onChange={(e) => setRegex(e.target.value)}
      />
    </div>
  );
};

