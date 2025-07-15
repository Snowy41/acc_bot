import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface PlatformScripts {
  [platform: string]: string[];
}

export default function BotSelection() {
  const [platformScripts, setPlatformScripts] = useState<PlatformScripts>({});
  const [openPlatform, setOpenPlatform] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/bots")
      .then((response) => response.json())
      .then((data) => {
        const allBots: string[] = data.bots || [];
        const grouped: PlatformScripts = {};
        allBots.forEach((name) => {
          const [platform] = name.split("_");
          if (!platform) return;
          if (!grouped[platform]) grouped[platform] = [];
          grouped[platform].push(name);
        });
        setPlatformScripts(grouped);
      });
  }, []);

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#111925] to-[#19283a]">
      <div className="w-full max-w-5xl mx-auto my-16 bg-white/10 border border-cyan-700/40 shadow-2xl backdrop-blur-xl rounded-3xl p-10">
        <h2 className="text-3xl text-aqua font-bold mb-10 tracking-wide text-center">Choose Platform</h2>
        <div className="space-y-10">
          {Object.keys(platformScripts).length === 0 ? (
            <div className="text-cyan-400 text-center">No platforms available</div>
          ) : (
            Object.entries(platformScripts).map(([platform, scripts]) => (
              <button
                key={platform}
                className="w-full text-left bg-[#19212a]/90 p-6 rounded-2xl border border-cyan-900/30 shadow-2xl mb-5 transition hover:bg-cyan-900/20 focus:outline-none relative"
                onClick={() => navigate(`/monitor/${platform}`)}
                tabIndex={0}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-aqua group-hover:text-white transition">{capitalize(platform)}</span>
                  <button
                    className="ml-4 px-4 py-2 bg-cyan-900 text-aqua rounded-lg font-semibold shadow hover:bg-aqua hover:text-midnight transition"
                    onClick={e => {
                      e.stopPropagation();
                      setOpenPlatform(openPlatform === platform ? null : platform);
                    }}
                    type="button"
                    tabIndex={0}
                  >
                    {openPlatform === platform ? "Hide Scripts" : "Show Scripts"}
                  </button>
                </div>
                {openPlatform === platform && (
                  <div className="mt-4">
                    <ul className="flex flex-col gap-2">
                      {scripts.map((script) => (
                        <li
                          key={script}
                          className="bg-[#232e43]/80 border border-cyan-900/30 rounded-xl shadow py-2 px-4 font-mono text-cyan-200 select-text"
                        >
                          {script}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
