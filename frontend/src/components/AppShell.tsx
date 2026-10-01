import type { ReactNode } from "react";
import { NavLink, useParams } from "react-router-dom";
import { CLUBES } from "../lib/types";
import { ClubeBadge } from "./ClubeBadge";
import "./AppShell.css";

const ANO_INICIO = 2018;
const ANO_FIM = 2025;

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { clube } = useParams<{ clube?: string }>();

  return (
    <div className="app-shell">
      <header className="app-shell__topbar">
        <div className="app-shell__brand">
          <span className="app-shell__brand-eyebrow">Plataforma Analítica</span>
          <h1 className="app-shell__brand-title">Clubes de Futebol</h1>
        </div>

        <nav className="app-shell__clubes" aria-label="Selecionar clube">
          {CLUBES.map((c) => (
            <ClubeBadge key={c.valor} clube={c.valor} sigla={c.sigla} label={c.label} />
          ))}
        </nav>
      </header>
      <div className="app-shell__ledger-rule" role="presentation">
        <span className="app-shell__ledger-year">{ANO_INICIO}</span>
        <span className="app-shell__ledger-line" />
        <span className="app-shell__ledger-year">{ANO_FIM}</span>
      </div>

      <nav className="app-shell__tabs" aria-label="Seções">
        <NavLink
          to={`/dashboard/${clube ?? "flamengo"}`}
          className={({ isActive }) => `app-shell__tab${isActive ? " active" : ""}`}
        >
          Visão Geral
        </NavLink>
        <NavLink to="/comparativo" className={({ isActive }) => `app-shell__tab${isActive ? " active" : ""}`}>
          Comparativo
        </NavLink>
        <NavLink to="/hipoteses" className={({ isActive }) => `app-shell__tab${isActive ? " active" : ""}`}>
          Hipóteses (H1/H2/H3)
        </NavLink>
      </nav>

      <main className="app-shell__content">{children}</main>

      <footer className="app-shell__footer">
        TCC de Sistemas de Informação Uniacademia, Recorte {ANO_INICIO}–{ANO_FIM}
      </footer>
    </div>
  );
}
