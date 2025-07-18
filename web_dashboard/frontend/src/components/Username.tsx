import React from "react";

export default function Username({
  children,
  animated = false,
  colors,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  animated?: boolean;
  colors?: string[];           // <-- NEW
  className?: string;
  style?: React.CSSProperties;
}) {
  const gradient = colors && colors.length > 1
    ? `linear-gradient(90deg, ${colors.join(",")})`
    : "linear-gradient(90deg, #18f0ff, #60f77a, #d275fa, #18f0ff)";

  return (
    <span
      className={
        (animated ? "animated-gradient-text " : "") +
        "font-bold drop-shadow " +
        className
      }
      style={animated ? { ...style, background: gradient } : style}
    >
      {children}
    </span>
  );
}
