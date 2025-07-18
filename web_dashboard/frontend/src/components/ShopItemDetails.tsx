import { useParams, Link } from "react-router-dom";
import { shopData } from "./shopData";
import { ArrowLeftIcon, CurrencyEuroIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";

export default function ShopItemDetail() {
  const { category, item } = useParams();
  const cat = shopData.find(c => c.key === category);
  const shopItem = cat?.items.find(i => i.key === item);

  if (!shopItem)
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-aqua text-2xl">
        Item not found.
      </div>
    );

  return (
    <div className="flex justify-center items-start w-full min-h-[90vh] pt-12 px-4">
        <div
          className="relative border border-cyan-900/60 shadow-[0_8px_40px_0_rgba(0,255,255,0.07)] rounded-3xl max-w-3xl w-full backdrop-blur-xl mx-auto flex flex-col items-center p-0 sm:p-10"
          style={{
            background: "linear-gradient(135deg, rgba(23,39,54,0.80) 0%, rgba(21,28,40,0.80) 100%)",
          }}
        >
        {/* Neon Glow Edge */}
        <div className="absolute -top-1 -left-1 right-0 h-1 w-[calc(100%+8px)] rounded-t-3xl pointer-events-none z-10 blur-[2px]" style={{
          background: "linear-gradient(90deg, #17ffe7cc, #097ea6cc 70%)",
          opacity: 0.15,
        }} />

        {/* Header */}
        <div className="flex items-center gap-2 pt-8 pb-4 w-full">
          <Link to={`/shop/${cat.key}`} className="p-2 rounded-full hover:bg-cyan-900/40 transition">
            <ArrowLeftIcon className="h-6 w-6 text-aqua" />
          </Link>
          <span className="flex-1"></span>
          <ShoppingBagIcon className="h-8 w-8 text-aqua drop-shadow" />
        </div>

        <div className="flex flex-col items-center w-full">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-aqua to-cyan-400 text-transparent bg-clip-text mb-2 drop-shadow-xl tracking-tight">
            {shopItem.name}
          </h1>
          <span className="text-base font-semibold text-cyan-200/90 mb-6">
            {cat.name}
          </span>
          <div className="w-full bg-cyan-900/30 rounded-xl p-6 shadow-inner mb-4">
            <p className="text-lg text-cyan-100 opacity-90 text-center">{shopItem.description}</p>
          </div>
          <div className="flex flex-col items-center gap-4 mt-4 w-full">
            <span className="text-2xl font-bold text-cyan-900/90 bg-white/30 px-6 py-2 rounded-full drop-shadow">{shopItem.price}</span>
            <button
              className="bg-aqua text-midnight font-bold px-7 py-3 rounded-full shadow hover:bg-cyan-400 transition border-2 border-aqua/60 text-lg mt-1"
              // onClick={} // Your buy/add to cart logic here
            >
              Buy now
            </button>
            <Link
              to={`/shop/${cat.key}`}
              className="mt-2 text-cyan-300 text-sm text-center underline hover:text-aqua transition"
            >
              &larr; Back to {cat.name}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
