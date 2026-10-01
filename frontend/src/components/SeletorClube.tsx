import { ChevronDown } from "lucide-react";
import { CLUBES, type Clube } from "../lib/types";
import "./SeletorClube.css";

interface SeletorClubeProps {
  value: Clube;
  onChange: (clube: Clube) => void;
}

export function SeletorClube({ value, onChange }: SeletorClubeProps) {
  return (
    <label className="seletor-clube">
      <span className="seletor-clube__rotulo">Clube</span>
      <span className="seletor-clube__campo">
        <select value={value} onChange={(e) => onChange(e.target.value as Clube)} aria-label="Selecionar clube">
          {CLUBES.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </span>
    </label>
  );
}
