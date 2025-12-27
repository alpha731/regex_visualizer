import React, { useEffect, useRef, useState } from 'react';
import railroad from 'railroad-diagrams';
import regjsparser from 'regjsparser';
import { cleanRegex, parseOptions } from '../utils/regexHelpers';

// Styles for railroad diagrams are imported in index.css

interface VisualizerProps {
  regex: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({ regex }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous diagram
    containerRef.current.innerHTML = '';
    setError(null);

    if (!regex) return;

    try {
      // Clean up Python raw strings etc.
      const cleanedRegex = cleanRegex(regex);
      
      // Parse the regex string into an AST
      // Pass 'u' flag to enable unicode features in the parser
      const ast = regjsparser.parse(cleanedRegex, 'u', parseOptions);
      
      // Convert AST to Railroad Diagram components
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const diagram = (railroad.Diagram as any)(...convertNode(ast));
      
      // Render to SVG and append to container
      diagram.addTo(containerRef.current);
      
    } catch (err) {
      // console.error(err);
      setError((err as Error).message || 'Invalid Regular Expression');
    }
  }, [regex]);

  // Recursive function to convert regjsparser AST nodes to railroad-diagrams components
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convertNode = (node: any): any[] => {
    switch (node.type) {
      case 'disjunction':
        // A | B -> Choice(0, A, B)
        return [(railroad.Choice as any)(0, ...node.body.flatMap(convertNode))];
      
      case 'alternative':
        // AB -> Sequence(A, B)
        return [(railroad.Sequence as any)(...node.body.flatMap(convertNode))];
      
      case 'characterClass':
        // [abc] -> valid visual representation
        // We can treat it as a terminal with the text representation for simplicity,
        // or break it down. For now, let's use a specialized node if possible, 
        // or just a NonTerminal/Terminal with the raw text.
        // Reconstructing the raw text from body can be complex.
        // Let's try to list characters if short, or summarize.
        
        // Simple approximation:
        if (node.negative) {
            return [(railroad.NonTerminal as any)(`[^${node.body.map(formatClassBody).join('')}]`)];
        }
        return [(railroad.NonTerminal as any)(`[${node.body.map(formatClassBody).join('')}]`)];

      case 'quantifier': {
        const { min, max, body } = node;
        const inner = convertNode(body[0]);
        
        if (min === 0 && max === 1) {
          // ? -> Optional
          return [(railroad.Optional as any)(...inner)];
        } else if (min === 0 && max === undefined) {
          // * -> ZeroOrMore
          return [(railroad.ZeroOrMore as any)(...inner)];
        } else if (min === 1 && max === undefined) {
          // + -> OneOrMore
          return [(railroad.OneOrMore as any)(...inner)];
        } else {
            // {n,m} -> OneOrMore with comment or custom structure
            // railroad-diagrams allows OneOrMore(item, repeat-separator)
            // or just comment.
            // Let's use comment or just standard OneOrMore with label
            const label = max === undefined ? `${min}+` : (min === max ? `${min}` : `${min}..${max}`);
            return [(railroad.OneOrMore as any)(...inner, (railroad.Comment as any)(label))];
        }
      }
      
      case 'group':
        // ( ... )
        // behavior depends on capturing or not, but visually it's a sequence/box
        // railroad-diagrams does NOT have a Group component in the version we are using.
        // We can simulate a labeled group by putting a Comment above or simply using Sequence.
        // If it's a named group or capturing group, we might want to show that.
        // Since we can't easily wrap it in a box with label in this library version without custom SVG,
        // we will just treat it as a sequence but maybe add a comment if it has a name.
        
        const content = node.body.flatMap(convertNode);
        const label = node.behavior === 'ignore' ? null : (node.name ? `(?<${node.name}>...)` : 'group');
        
        if (label) {
             // If we want to label it, we can use a Sequence with a Comment at the start or end?
             // Or just return the sequence.
             // Actually, standard railroad diagrams often just show the flow. 
             // Let's just return the sequence of content for now to fix the crash.
             // If we really want a label, we could try to push a Comment node into the sequence, 
             // but that puts it inline.
             return [(railroad.Sequence as any)((railroad.Comment as any)(label), ...content)];
        }
        return [(railroad.Sequence as any)(...content)];

      case 'value':
        // Literal characters
        return [(railroad.Terminal as any)(String.fromCharCode(node.codePoint))];
        
      case 'dot':
        return [(railroad.NonTerminal as any)('any character')];

      case 'anchor':
        if (node.kind === 'start') return [(railroad.Terminal as any)('^')];
        if (node.kind === 'end') return [(railroad.Terminal as any)('$')];
        return [(railroad.Terminal as any)(node.raw)];

      case 'characterClassRange':
         return [`${String.fromCharCode(node.min.codePoint)}-${String.fromCharCode(node.max.codePoint)}`];

      case 'unicodePropertyEscape':
         return [(railroad.NonTerminal as any)(`\\p{${node.value}}`)];

      default:
        // Fallback for unknown nodes
        return [(railroad.NonTerminal as any)(node.type)];
    }
  };

  // Helper to format character class body parts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatClassBody = (node: any): string => {
      if (node.type === 'value') return String.fromCharCode(node.codePoint);
      if (node.type === 'characterClassRange') return `${String.fromCharCode(node.min.codePoint)}-${String.fromCharCode(node.max.codePoint)}`;
      return '';
  };

  return (
    <div className="w-full overflow-x-auto bg-white p-4 rounded-lg border border-gray-200 min-h-[150px] flex items-center justify-center">
        {error ? (
            <div className="text-red-500 font-medium">
                Error: {error}
            </div>
        ) : (
            <div ref={containerRef} className="railroad-diagram-container" />
        )}
    </div>
  );
};

