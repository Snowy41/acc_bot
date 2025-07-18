import { Link, useParams } from "react-router-dom";
import { shopData } from "./shopData";

export default function ShopCategory() {
  const { category } = useParams();
  const cat = shopData.find((c) => c.key === category);

  if (!cat) return <div className="text-center text-white">Category not found.</div>;

  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-4 bg-gradient-to-br from-[#172a3a] to-[#0d1722]">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-[#19212a]/80 border border-cyan-900/40 rounded-2xl shadow-2xl p-10 opacity-80 backdrop-blur-2xl">
          <h1 className="text-3xl font-extrabold text-aqua mb-2">{cat.name}</h1>
          <p className="text-cyan-200 text-lg mb-8">{cat.description}</p>
          <div className="grid sm:grid-cols-2 gap-6 mt-6">
            {cat.items.map((item) => (
              <Link
                to={`/shop/${cat.key}/${item.key}`}
                key={item.key}
                className={`rounded-xl shadow-lg p-6 bg-gradient-to-tr ${item.gradient} bg-opacity-10 border border-cyan-900/30 flex flex-col items-center hover:scale-[1.025] transition-transform`}
              >
                <h2 className={`text-lg font-bold mb-1 ${item.highlight} drop-shadow`}>{item.name}</h2>
                <p className="text-cyan-900/80 text-sm mb-3 text-center">{item.description}</p>
                <span className="text-md font-semibold text-cyan-900/90 bg-white/30 px-3 py-1 rounded-full drop-shadow">{item.price}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
