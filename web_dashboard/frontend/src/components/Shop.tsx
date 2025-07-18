import { Link } from "react-router-dom";
import { shopData } from "./shopData";

export default function Shop() {
  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-4 bg-gradient-to-br from-[#172a3a] to-[#0d1722]">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-[#19212a]/80 border border-cyan-900/40 rounded-2xl shadow-2xl p-10 opacity-80 backdrop-blur-2xl">
          <h1 className="text-4xl font-extrabold text-aqua mb-2 text-center">Shop</h1>
          <p className="text-cyan-200 text-lg mb-8 text-center opacity-90">
            Choose a category to explore items!
          </p>
          <div className="grid sm:grid-cols-3 gap-6 mt-6">
            {shopData.map((cat) => (
              <Link
                key={cat.key}
                to={`/shop/${cat.key}`}
                className="rounded-xl shadow-lg p-6 bg-cyan-900/40 border border-cyan-900/30 flex flex-col items-center justify-center hover:bg-cyan-800/30 transition"
              >
                <h2 className="text-xl font-bold text-aqua drop-shadow mb-1">{cat.name}</h2>
                <p className="text-cyan-200 text-sm text-center">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
