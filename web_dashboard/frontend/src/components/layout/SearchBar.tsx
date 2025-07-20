import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 2) return setResults([]);
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => setResults(data.results || []))
      .finally(() => setLoading(false));
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      const item = results[activeIndex];
      if (item) {
        if (item.type === "user") navigate(`/profile/${item.usertag}`);
        else if (item.type === "post") navigate(`/forum/${item.category}/${item.id}`);
        setQuery("");
        setResults([]);
      }
    } else if (e.key === "Escape") {
      setResults([]);
    }
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-xl">
      <input
        type="text"
        className="w-full px-4 py-2 rounded-full bg-[#1b2435] border border-cyan-700 text-white placeholder-cyan-300"
        placeholder="Search users, tags, or forum posts..."
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setActiveIndex(0);
        }}
        onKeyDown={handleKeyDown}
        ref={inputRef}
      />
      {results.length > 0 && (
        <div className="bg-[#1b2435] text-white mt-2 rounded-xl shadow-lg border border-cyan-800 divide-y max-h-80 overflow-y-auto">
          {results.map((r, i) => (
            <div
              key={i}
              className={`px-4 py-2 cursor-pointer ${
                i === activeIndex ? "bg-cyan-900" : "hover:bg-cyan-800"
              }`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => {
                if (r.type === "user") navigate(`/profile/${r.usertag}`);
                else if (r.type === "post") navigate(`/forum/${r.category}/${r.id}`);
                setQuery("");
                setResults([]);
              }}
            >
              <div className="font-bold text-sm">{r.label}</div>
              <div className="text-cyan-300 text-xs">{r.description}</div>
              {r.meta && (
                <div className="text-cyan-500 text-xs italic mt-1">{r.meta}</div>
              )}
            </div>
          ))}
        </div>
      )}
      {loading && <div className="text-cyan-400 mt-2">Searching...</div>}
    </div>
  );
}
