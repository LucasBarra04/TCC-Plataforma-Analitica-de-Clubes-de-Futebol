import "./Skeleton.css";

function Bloco({ width, height, style }: { width?: string | number; height?: string | number; style?: React.CSSProperties }) {
  return <div className="skeleton-bloco" style={{ width, height, ...style }} />;
}

export function SkeletonCards({ n = 4 }: { n?: number }) {
  return (
    <div className="skeleton-cards">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="skeleton-cards__item">
          <Bloco width="55%" height={9} />
          <Bloco width="40%" height={26} style={{ marginTop: 16 }} />
          <Bloco width="92%" height={8} style={{ marginTop: 16 }} />
          <Bloco width="70%" height={8} style={{ marginTop: 6 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ linhas = 6, colunas = 5 }: { linhas?: number; colunas?: number }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="skeleton-table__linha">
          {Array.from({ length: colunas }).map((_, j) => (
            <Bloco key={j} height={9} width={j === 0 ? "65%" : "45%"} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ altura = 280 }: { altura?: number }) {
  return <Bloco height={altura} width="100%" />;
}
