import { useState } from "react";

export default function CommandExecutor() {
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Send the command to the backend
    const response = await fetch("/api/execute_command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command })
    });

    const data = await response.json();

    if (data.error) {
      setError(data.error);
      setOutput("");
    } else {
      setError("");
      setOutput(data.output);
    }
  };

  return (
    <div className="w-full max-w-3xl bg-[#141b2c] border border-sidebar rounded-xl p-6 shadow-2xl">
      <h2 className="text-2xl text-aqua font-bold mb-4">Execute iPhone Command</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter iPhone command"
          className="bg-midnight text-aqua border border-cyan-800 rounded px-4 py-2 w-full mb-4"
        />

        <button type="submit" className="bg-aqua text-midnight px-6 py-2 rounded w-full">
          Execute Command
        </button>
      </form>

      {error && <div className="text-red-500 mt-4">{error}</div>}
      {output && (
        <div className="mt-4">
          <h3 className="text-aqua">Output:</h3>
          <pre className="text-green-400 bg-black p-3 rounded">{output}</pre>
        </div>
      )}
    </div>
  );
}
