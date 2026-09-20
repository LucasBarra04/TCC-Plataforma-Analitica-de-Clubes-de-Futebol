import type { StatusIndicador } from "../lib/types";
import "./Shared.css";

export function CarregandoState({ label = "Carregando dados…" }: { label?: string }) {
  return (
    <div className="estado estado--carregando" role="status">
      {label}
    </div>
  );
}

export function ErroState({ mensagem }: { mensagem: string }) {
  return (
    <div className="estado estado--erro" role="alert">
      <strong>Não foi possível carregar os dados.</strong>
      <span>{mensagem}</span>
    </div>
  );
}

const LABEL_STATUS: Record<StatusIndicador, string> = {
  saudavel: "Saudável",
  atencao: "Atenção",
  critico: "Crítico",
  indisponivel: "Indisponível",
};

export function StatusBadge({ status }: { status: StatusIndicador }) {
  return <span className={`status-badge status-badge--${status}`}>{LABEL_STATUS[status]}</span>;
}
