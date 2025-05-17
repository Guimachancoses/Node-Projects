import React, { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";

interface GradientProps {
  children?: ReactNode;
  colors?: [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}
export default function Gradient({
  children,
  colors = ["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.7)"], // valor padrão
  start = { x: 0, y: 0 }, // padrão: topo
  end = { x: 0, y: 1 }, // padrão: base
}: GradientProps) {
  return (
    <LinearGradient
      start={start}
      end={end}
      colors={colors}
      style={{
        flex: 1,
        justifyContent: "flex-end",
        padding: 16,
      }}
    >
      {children}
    </LinearGradient>
  );
}
