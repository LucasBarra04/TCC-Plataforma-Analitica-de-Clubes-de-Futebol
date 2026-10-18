import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowLeftRight,
  Columns3,
  FlaskConical,
  Landmark,
  LayoutDashboard,
  Menu,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useClubeAtivo } from "../lib/clubeContext";
import "./Sidebar.css";

const ITENS_NAV = [
  { to: (c: string) => `/dashboard/${c}`, icon: LayoutDashboard, label: "Visão Geral" },
  { to: (c: string) => `/financeiro/${c}`, icon: Landmark, label: "Financeiro" },
  { to: (c: string) => `/pontuacao/${c}`, icon: Trophy, label: "Pontuação Esportiva" },
  { to: (c: string) => `/transferencias/${c}`, icon: ArrowLeftRight, label: "Transferências" },
  { to: (c: string) => `/projecoes/${c}`, icon: TrendingUp, label: "Projeções" },
  { to: () => "/comparativo", icon: Columns3, label: "Comparativo" },
  { to: () => "/hipoteses", icon: FlaskConical, label: "Hipóteses" },
];

export function Sidebar() {
  const [expandido, setExpandido] = useState(true);
  const { clubeAtivo } = useClubeAtivo();

  return (
    <aside className={`sidebar${expandido ? "" : " sidebar--recolhida"}`}>
      <div className="sidebar__topo">
        <button
          type="button"
          className="sidebar__toggle"
          onClick={() => setExpandido((v) => !v)}
          aria-label={expandido ? "Recolher menu" : "Expandir menu"}
        >
          <Menu size={18} aria-hidden="true" />
        </button>
      </div>

      <nav className="sidebar__nav" aria-label="Navegação principal">
        {ITENS_NAV.map((item) => (
          <NavLink
            key={item.label}
            to={item.to(clubeAtivo)}
            className={({ isActive }) => `sidebar__item${isActive ? " sidebar__item--ativo" : ""}`}
            title={!expandido ? item.label : undefined}
          >
            <span className="sidebar__item-icone">
              <item.icon size={19} aria-hidden="true" />
            </span>
            {expandido && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
