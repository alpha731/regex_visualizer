import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkDirective from 'remark-directive';
import { ThinkCollapse } from './ThinkCollapse';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { visit } from 'unist-util-visit';

// Plugin to transform custom directives to hast
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function remarkThinkPlugin() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
    visit(tree, (node) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        if (node.name === 'think') {
          const data = node.data || (node.data = {});
          data.hName = 'think';
          data.hProperties = node.attributes;
        }
      }
    });
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  regex: string;
}

export const Chat: React.FC<ChatProps> = ({ regex }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Initialize an empty assistant message to stream into
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      // In production, use the actual backend URL or configured proxy
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pattern: regex,
          message: userMessage,
          history: messages, // Send history for context
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      if (!response.body) {
        throw new Error('ReadableStream not yet supported in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        
        setMessages((prev) => {
           const newMessages = [...prev];
           // Create a new object for the last message to ensure immutability
           const lastMessageIndex = newMessages.length - 1;
           const lastMessage = { ...newMessages[lastMessageIndex] };
           
           if (lastMessage.role === 'assistant') {
               lastMessage.content += chunkValue;
               newMessages[lastMessageIndex] = lastMessage;
           }
           return newMessages;
        });
      }

    } catch (error) {
      console.error('Error chatting with AI:', error);
      setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = 'Sorry, I encountered an error. Please try again.';
          }
          return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Bot className="w-5 h-5 mr-2" />
          AI Assistant
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <Bot className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Ask me anything about your regex!</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-start">
                {msg.role === 'assistant' && (
                  <Bot className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                )}
                <div className="prose prose-sm max-w-none">
                  {msg.role === 'assistant' ? (
                     <Markdown
                        remarkPlugins={[remarkDirective, remarkThinkPlugin]}
                        components={{
                            // @ts-expect-error - Custom component for 'think' directive
                            think: ThinkCollapse
                        }}
                     >
                        {/* Convert <think>...</think> to :::think ... ::: directive for processing */}
                        {msg.content
                            .replace(/<think>([\s\S]*?)<\/think>/g, '\n:::think\n$1\n:::\n')
                            // Handle unclosed think tag (e.g. during streaming)
                            .replace(/<think>([\s\S]*?)$/g, '\n:::think\n$1\n:::\n')
                        } 
                     </Markdown>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <User className="w-4 h-4 ml-2 mt-1 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
