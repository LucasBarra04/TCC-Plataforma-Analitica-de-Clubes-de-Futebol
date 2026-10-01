import type { ReactNode } from "react";
import "./PageTransition.css";

export function PageTransition({ transitionKey, children }: { transitionKey: string | number; children: ReactNode }) {
  return (
    <div key={transitionKey} className="page-transition">
      {children}
    </div>
  );
}
