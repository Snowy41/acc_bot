import { Link } from "react-router-dom";
import { shopData } from "./shopData";
import { SparklesIcon, TagIcon, UserGroupIcon } from "@heroicons/react/24/solid";

const iconMap = {
  roles: <UserGroupIcon className="h-10 w-10 text-aqua drop-shadow-lg" />,
  tags: <TagIcon className="h-10 w-10 text-aqua drop-shadow-lg" />,
  cosmetics: <SparklesIcon className="h-10 w-10 text-aqua drop-shadow-lg" />,
};

export default function Shop() {
  return (
    <div className="flex justify-center items-start w-full min-h-[90vh] pt-12 px-4">
      <div className="
        relative bg-gradient-to-br from-[#172736]/70 to-[#151c28]/90
        border border-cyan-900/60
        shadow-[0_8px_40px_0_rgba(0,255,255,0.07)]
        rounded-3xl
        max-w-3xl w-full
        backdrop-blur-xl
        mx-auto
        flex flex-col items-center
        p-0 sm:p-10
        ">

        {/* Neon Glow Edge */}
        <div className="absolute -top-1 -left-1 right-0 h-1 w-[calc(100%+8px)] rounded-t-3xl pointer-events-none z-10 blur-[2px]" style={{
          background: "linear-gradient(90deg, #17ffe7cc, #097ea6cc 70%)",
          opacity: 0.15,
        }} />

        {/* Header */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <SparklesIcon className="h-10 w-10 text-aqua drop-shadow" />
            <h1 className="text-4xl font-black bg-gradient-to-r from-aqua to-cyan-400 text-transparent bg-clip-text drop-shadow-xl tracking-tight">
              Shop
            </h1>
          </div>
          <p className="text-cyan-100 text-base sm:text-lg opacity-90 text-center max-w-lg">
            Enhance your account! Pick a category to explore custom roles, tags & cosmetics.
          </p>
        </div>

        {/* Category Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-8 pb-12 px-2">
          {shopData.map(cat => (
            <Link
              key={cat.key}
              to={`/shop/${cat.key}`}
              className={`
                group bg-gradient-to-br from-[#19e3ff11] via-[#13202b]/40 to-[#0ed0c533]
                border border-cyan-900/30 rounded-2xl p-7 flex flex-col items-center text-center
                transition-all shadow-xl
                hover:scale-105 hover:shadow-[0_0_18px_3px_#22f0ff44]
                hover:border-aqua/80
                focus:outline-none
                relative
                `}
              style={{
                minHeight: 220,
                boxShadow: "0 6px 32px #19e3f511, 0 1.5px 0px 1px #18f0ff14",
              }}
            >
              {/* Icon */}
              <div className="mb-4">
                {iconMap[cat.key] || <SparklesIcon className="h-10 w-10 text-aqua" />}
              </div>
              {/* Name */}
              <h2 className="text-xl font-bold bg-gradient-to-r from-aqua to-cyan-400 text-transparent bg-clip-text mb-2 drop-shadow">
                {cat.name}
              </h2>
              {/* Description */}
              <p className="text-cyan-200/80 text-[1.05rem]">
                {cat.description}
              </p>
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition
                bg-gradient-to-br from-[#18f0ff22] to-transparent blur-sm" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
