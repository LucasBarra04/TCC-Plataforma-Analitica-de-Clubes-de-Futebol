import type { ReactNode } from "react";
import "./Insight.css";

export function Insight({ children }: { children: ReactNode }) {
  return <p className="insight-texto">{children}</p>;
}

export function Destaque({ children }: { children: ReactNode }) {
  return <strong className="insight-destaque">{children}</strong>;
}
