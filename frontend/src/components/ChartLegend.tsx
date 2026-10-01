import "./ChartLegend.css";

interface ItemLegenda {
  label: string;
  cor: string;
  tracejado?: boolean;
}

export function ChartLegend({ itens }: { itens: ItemLegenda[] }) {
  return (
    <div className="chart-legend">
      {itens.map((item) => (
        <span key={item.label} className="chart-legend__item">
          {item.tracejado ? (
            <svg width="14" height="8" aria-hidden="true">
              <line x1="0" y1="4" x2="14" y2="4" stroke={item.cor} strokeWidth="2" strokeDasharray="3 2" />
            </svg>
          ) : (
            <span className="chart-legend__ponto" style={{ background: item.cor }} />
          )}
          {item.label}
        </span>
      ))}
    </div>
  );
}
