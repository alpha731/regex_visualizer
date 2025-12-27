import React, { useState, useMemo } from 'react';
import { cleanRegex } from '../utils/regexHelpers';

interface MatchTesterProps {
  regex: string;
}

export const MatchTester: React.FC<MatchTesterProps> = ({ regex }) => {
  const [testString, setTestString] = useState('Type here to test your regex...');

  const highlightedText = useMemo(() => {
    if (!regex || !testString) return testString;

    try {
      const cleanedRegex = cleanRegex(regex);
      // Use 'u' flag to support Unicode Property Escapes (\p{L})
      // Use 'g' flag for global matching
      const re = new RegExp(cleanedRegex, 'gu');
      
      let lastIndex = 0;
      const parts = [];
      let match;
      let matchCount = 0;

      // Reset lastIndex just in case
      re.lastIndex = 0;

      // Helper to calculate advancement index safely for UTF-16 surrogate pairs
      const advanceIndex = (text: string, index: number) => {
           if (index >= text.length) return 1;
           const code = text.charCodeAt(index);
           if (code >= 0xD800 && code <= 0xDBFF && text.length > index + 1) {
               const next = text.charCodeAt(index + 1);
               if (next >= 0xDC00 && next <= 0xDFFF) {
                   return 2;
               }
           }
           return 1;
      };

      while ((match = re.exec(testString)) !== null) {
        // Push text before match
        if (match.index > lastIndex) {
          parts.push(
            <span key={`text-${lastIndex}`}>
              {testString.substring(lastIndex, match.index)}
            </span>
          );
        }

        // Determine style based on alternating match index to distinguish adjacent matches
        const isEven = matchCount % 2 === 0;
        const colorClass = isEven 
            ? "bg-yellow-200 text-yellow-900 border-yellow-400" 
            : "bg-blue-200 text-blue-900 border-blue-400";
        
        const content = match[0].length === 0 ? (
            <span className="inline-block w-1 h-4 align-middle bg-red-500 mx-0.5" title="Zero-width match" />
        ) : match[0];

        // Push matched text
        parts.push(
          <span
            key={`match-${match.index}-${matchCount}`}
            className={`${colorClass} rounded px-0.5 border-b-2 mx-0.5`}
            title={`Match ${matchCount + 1}: ${match[0]}`}
          >
            {content}
          </span>
        );

        lastIndex = match.index + match[0].length;
        matchCount++;

        // Prevent infinite loops with zero-width matches
        if (match[0].length === 0) {
            re.lastIndex = match.index + advanceIndex(testString, match.index);
        }
      }

      // Push remaining text
      if (lastIndex < testString.length) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {testString.substring(lastIndex)}
          </span>
        );
      }
      
      return parts.length > 0 ? parts : testString;

    } catch (err) {
      // If regex is invalid, just return text
      return testString;
    }
  }, [regex, testString]);

  return (
    <div className="w-full mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Test String</h2>
        <textarea
            className="w-full h-32 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-lg mb-4"
            placeholder="Type text here to test matches..."
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
        />
        
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md min-h-[3rem] font-mono text-lg whitespace-pre-wrap break-words">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 select-none">
                Highlighted Matches
            </h4>
            <div className="text-gray-800 leading-relaxed">
                {highlightedText}
            </div>
        </div>
    </div>
  );
};
