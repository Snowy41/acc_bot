import { Link } from "react-router-dom";

export default function BalanceBadge({ balance }: { balance: number | null }) {
  if (balance === null) return null;

  return (
    <Link
      to="/shop/deposit"
      className="px-3 py-1 rounded-full bg-cyan-900/60 border border-cyan-400/30 hover:bg-cyan-800/80 hover:border-cyan-300 text-cyan-200 text-sm font-mono shadow transition"
      title="View your wallet / deposit"
    >
      💰 {balance}
    </Link>
  );
}
