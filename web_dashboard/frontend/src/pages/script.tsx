import { useEffect, useState } from 'react';

const ScriptsPage = () => {
  const [scripts, setScripts] = useState<string[]>([]);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/bots/')
      .then(res => res.json())
      .then(data => setScripts(data.scripts));
  }, []);

  const runScript = (script: string) => {
    setRunning(script);
    setOutput('');
    fetch('/api/bots/run', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ script })
    })
      .then(res => res.json())
      .then(data => {
        setOutput(data.output);
        setRunning(null);
      });
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Available Scripts</h1>
      <ul className="space-y-2">
        {scripts.map(script => (
          <li key={script} className="flex items-center justify-between border p-2 rounded">
            <span>{script}</span>
            <button
              className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
              onClick={() => runScript(script)}
              disabled={running !== null}
            >
              {running === script ? 'Running...' : 'Run'}
            </button>
          </li>
        ))}
      </ul>
      {output && (
        <pre className="mt-4 p-2 bg-gray-100 rounded text-sm whitespace-pre-wrap">{output}</pre>
      )}
    </div>
  );
};

export default ScriptsPage;
