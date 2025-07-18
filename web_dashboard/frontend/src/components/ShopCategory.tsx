import { Link, useParams } from "react-router-dom";
import { shopData } from "./shopData";
import { ArrowLeftIcon, CurrencyEuroIcon } from "@heroicons/react/24/outline";

export default function ShopCategory() {
  const { category } = useParams();
  const cat = shopData.find(c => c.key === category);

  if (!cat)
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-aqua text-2xl">
        Category not found.
      </div>
    );

  return (
    <div className="flex justify-center items-start w-full min-h-[90vh] pt-12 px-4">
      <div className="relative bg-gradient-to-br from-[#172736]/70 to-[#151c28]/90
        border border-cyan-900/60 shadow-[0_8px_40px_0_rgba(0,255,255,0.07)]
        rounded-3xl max-w-2xl w-full backdrop-blur-xl mx-auto flex flex-col items-center p-0 sm:p-10">

        <div className="absolute -top-1 -left-1 right-0 h-1 w-[calc(100%+8px)] rounded-t-3xl pointer-events-none z-10 blur-[2px]" style={{
          background: "linear-gradient(90deg, #17ffe7cc, #097ea6cc 70%)",
          opacity: 0.15,
        }} />

        {/* Header */}
        <div className="flex flex-col items-center pt-8 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Link to="/shop" className="p-2 rounded-full hover:bg-cyan-900/40 transition">
              <ArrowLeftIcon className="h-6 w-6 text-aqua" />
            </Link>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-aqua to-cyan-400 text-transparent bg-clip-text drop-shadow-xl tracking-tight">
              {cat.name}
            </h1>
          </div>
          <p className="text-cyan-100 text-base opacity-90 text-center">{cat.description}</p>
        </div>

        {/* Item Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-8 pb-8 pt-4 px-2">
          {cat.items.map(item => (
            <Link
              to={`/shop/${cat.key}/${item.key}`}
              key={item.key}
              className={`
                group bg-gradient-to-br from-[#19e3ff11] via-[#13202b]/40 to-[#0ed0c533]
                border border-cyan-900/30 rounded-2xl p-6 flex flex-col items-center text-center
                transition-all shadow-xl
                hover:scale-105 hover:shadow-[0_0_18px_3px_#22f0ff44]
                hover:border-aqua/80
                focus:outline-none
                relative
                `}
              style={{
                minHeight: 180,
                boxShadow: "0 6px 24px #19e3f511, 0 1.5px 0px 1px #18f0ff14",
              }}
            >
              <div className="flex flex-col gap-2 items-center mb-2">
                <CurrencyEuroIcon className="h-8 w-8 text-aqua drop-shadow" />
                <h2 className={`text-lg font-bold bg-gradient-to-r from-aqua to-cyan-400 text-transparent bg-clip-text mb-1`}>
                  {item.name}
                </h2>
              </div>
              <p className="text-cyan-200/80 text-[1.04rem]">{item.description}</p>
              <span className="mt-4 text-base font-bold text-cyan-900/90 bg-white/30 px-4 py-1 rounded-full drop-shadow">
                {item.price}
              </span>
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition
                bg-gradient-to-br from-[#18f0ff22] to-transparent blur-sm" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
