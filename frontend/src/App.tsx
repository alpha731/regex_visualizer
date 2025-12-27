import { useState } from 'react';
import { RegexInput } from './components/RegexInput';
import { Visualizer } from './components/Visualizer';
import { Chat } from './components/Chat';
import { MatchTester } from './components/MatchTester';

function App() {
  const [regex, setRegex] = useState('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Regex Visualizer & Assistant
          </h1>
          <p className="mt-2 text-gray-600">
            Visualize regular expressions and chat with AI to understand them.
          </p>
        </header>

        <section className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pattern</h2>
            <RegexInput regex={regex} setRegex={setRegex} />
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Visualization
              </h3>
              <Visualizer regex={regex} />
            </div>
          </div>
        </section>

        <section>
          <MatchTester regex={regex} />
        </section>

        <section>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Chat Assistant</h2>
             <Chat regex={regex} />
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;

