import { useParams, Link } from "react-router-dom";
import { ArrowLeftIcon, CurrencyEuroIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function ShopItemDetail() {
  const { category, item } = useParams();
  const [shopItem, setShopItem] = useState(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/shop/item/${category}/${item}`)
      .then(res => res.json())
      .then(data => setShopItem(data.item));
    fetch("/api/wallet/balance", { credentials: "include" })
      .then(res => res.json())
      .then(data => setBalance(data.balance));
  }, [category, item]);

  const handleBuy = async () => {
    setBuying(true);
    const res = await fetch("/api/shop/buy", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, key: item }),
    });
    const data = await res.json();
    if (data.success) {
      setSuccess(true);
      setBalance(data.balance);
    } else {
      alert("❌ " + (data.error || "Purchase failed"));
    }
    setBuying(false);
  };

  if (!shopItem) {
    return (
      <div className="flex justify-center items-center min-h-screen text-cyan-300 text-xl">
        Loading item...
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start w-full min-h-[90vh] pt-12 px-4">
      <div className="relative bg-gradient-to-br from-[#172736]/70 to-[#151c28]/90 border border-cyan-900/60 shadow-[0_8px_40px_0_rgba(0,255,255,0.07)] rounded-3xl max-w-2xl w-full backdrop-blur-xl mx-auto flex flex-col items-center p-0 sm:p-10">
        <div className="absolute -top-1 -left-1 right-0 h-1 w-[calc(100%+8px)] rounded-t-3xl pointer-events-none z-10 blur-[2px]"
          style={{
            background: "linear-gradient(90deg, #17ffe7cc, #097ea6cc 70%)",
            opacity: 0.15,
          }}
        />
        <div className="flex items-center gap-2 pt-8 pb-3 w-full">
          <Link to={`/shop/${category}`} className="p-2 rounded-full hover:bg-cyan-900/40 transition">
            <ArrowLeftIcon className="h-6 w-6 text-aqua" />
          </Link>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-aqua to-cyan-400 text-transparent bg-clip-text ml-2 drop-shadow-xl tracking-tight">
            {shopItem.name}
          </h1>
        </div>
        <div className="flex flex-col items-center w-full">
          <div
            className="w-full flex flex-col items-center bg-gradient-to-br from-[#19e3ff11] via-[#13202b]/40 to-[#0ed0c533] border border-cyan-900/30 rounded-2xl p-7 shadow-xl"
            style={{
              minHeight: 180,
              boxShadow: "0 6px 24px #19e3f511, 0 1.5px 0px 1px #18f0ff14",
            }}
          >
            <CurrencyEuroIcon className="h-8 w-8 text-aqua mb-2 drop-shadow" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-aqua to-cyan-400 text-transparent bg-clip-text mb-2 drop-shadow">
              {shopItem.name}
            </h2>
            <p className="text-cyan-200/80 text-[1.05rem] mb-4 text-center">
              {shopItem.description}
            </p>
            <span className="mt-auto text-base font-bold text-cyan-900/90 bg-white/30 px-4 py-1 rounded-full drop-shadow mb-4">
              ${shopItem.price}
            </span>
            {balance !== null && (
              <div className="text-sm text-cyan-300 mb-3">
                Your balance: <span className="font-bold text-white">{balance}</span>
              </div>
            )}
            <button
              onClick={handleBuy}
              disabled={buying || success || (balance !== null && shopItem.price > balance)}
              className="bg-aqua text-midnight font-bold px-7 py-2 rounded-full shadow hover:bg-cyan-400 transition border-2 border-aqua/60 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {success ? "🎉 Purchased!" : buying ? "Processing..." : `Buy for ${shopItem.price}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
