import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale } from "chart.js";
Chart.register(BarElement, CategoryScale, LinearScale);

export default function AdminStatsPanel({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<{
    totalUsers: number;
    onlineUsers: number;
    chatThreads: number;
    totalMessages: number;
  }>({
    totalUsers: 0,
    onlineUsers: 0,
    chatThreads: 0,
    totalMessages: 0
  });

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setStats(data);
      });
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1b2435] border border-cyan-800 p-6 rounded-2xl text-white w-96 relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-red-300 hover:text-red-500 text-xl font-bold">×</button>
        <h2 className="text-2xl font-bold text-aqua mb-4">Platform Stats</h2>
        <ul className="space-y-3 text-sm">
          <li className="flex justify-between">
            <span>Total Users</span>
            <span className="font-bold text-cyan-300">{stats.totalUsers}</span>
          </li>
          <li className="flex justify-between">
            <span>Online Users</span>
            <span className="font-bold text-green-400">{stats.onlineUsers}</span>
          </li>
          <li className="flex justify-between">
            <span>Chat Threads</span>
            <span className="font-bold text-aqua">{stats.chatThreads}</span>
          </li>
          <li className="flex justify-between">
            <span>Total Messages</span>
            <span className="font-bold text-cyan-200">{stats.totalMessages}</span>
          </li>
        </ul>
        <h3 className="text-cyan-300 font-semibold mt-6 mb-2">Visual Overview</h3>
        <Bar
          data={{
            labels: ["Users", "Online", "Threads", "Messages"],
            datasets: [
              {
                label: "Counts",
                data: [
                  stats.totalUsers,
                  stats.onlineUsers,
                  stats.chatThreads,
                  stats.totalMessages
                ],
                backgroundColor: ["#0ff", "#0f0", "#09f", "#6cf"]
              }
            ]
          }}
          options={{
            plugins: { legend: { display: false } },
            scales: {
              y: {
                ticks: { color: "#fff" },
                grid: { color: "#333" }
              },
              x: {
                ticks: { color: "#fff" },
                grid: { color: "#333" }
              }
            }
          }}
        />
      </div>
    </div>
  );
}
