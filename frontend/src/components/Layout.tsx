import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import "./Layout.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="layout__conteudo">{children}</main>
    </div>
  );
}
