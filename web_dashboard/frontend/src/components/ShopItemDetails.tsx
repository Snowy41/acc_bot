import { useParams, Link } from "react-router-dom";
import { shopData } from "./shopData";

export default function ShopItemDetail() {
  const { category, item } = useParams();
  const cat = shopData.find((c) => c.key === category);
  const shopItem = cat?.items.find((i) => i.key === item);

  if (!shopItem)
    return <div className="text-center text-white">Item not found.</div>;

  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-4 bg-gradient-to-br from-[#172a3a] to-[#0d1722]">
      <div className="w-full max-w-lg mx-auto">
        <div className={`bg-[#19212a]/80 border border-cyan-900/40 rounded-2xl shadow-2xl p-10 opacity-80 backdrop-blur-2xl`}>
          <h1 className={`text-3xl font-extrabold mb-4 ${shopItem.highlight}`}>{shopItem.name}</h1>
          <p className="text-cyan-100 text-lg mb-4">{shopItem.description}</p>
          <div className="flex flex-col gap-4 mt-8">
            <span className="text-2xl font-bold text-cyan-900/90 bg-white/30 px-5 py-2 rounded-full drop-shadow self-center">{shopItem.price}</span>
            <button className="bg-aqua text-midnight font-bold px-6 py-3 rounded-full shadow hover:bg-cyan-400 transition border-2 border-aqua/60 self-center">
              Buy
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
