import React from "react";

interface UsernameStyle extends React.CSSProperties {
  "--color1"?: string;
  "--color2"?: string;
}

export default function Username({
  children,
  animated = false,
  colors,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  animated?: boolean;
  colors?: string[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const color1 = (colors && colors[0]) || "#18f0ff";
  const color2 = (colors && colors[1]) || "#d275fa";

  const gradientStyle: UsernameStyle = animated
    ? {
        ...style,
        "--color1": color1,
        "--color2": color2,
      }
    : style;

  return (
    <span
      className={
        (animated ? "animated-gradient-text " : "") +
        "font-bold drop-shadow " +
        className
      }
      style={gradientStyle}
    >
      {children}
    </span>
  );
}
