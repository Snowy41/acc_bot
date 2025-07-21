import { Link } from "react-router-dom";

export default function BalanceBadge({ balance }: { balance: number | null }) {
  if (balance === null) return null;

  return (
    <div className="relative group">
      <Link
        to="/shop/deposit"
        className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-400/30 hover:bg-yellow-400/20 text-yellow-300 text-sm font-bold font-mono shadow transition"
        title="Buy tokens"
      >
        <span className="text-lg">🪙</span>
        {balance}
      </Link>

      <div className="absolute -top-8 right-0 bg-cyan-700 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
        Buy tokens
      </div>
    </div>
  );
}
