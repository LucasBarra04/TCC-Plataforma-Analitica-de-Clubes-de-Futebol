export function formatarMoeda(valor: number | null, unidade: string): string {
  if (valor === null) return "N/D";
  if (unidade === "ratio") return valor.toFixed(2);
  if (unidade === "percentual") return `${(valor * 100).toFixed(1)}%`;
  if (unidade === "multiplo") return `${valor.toFixed(2)}x`;
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(valor);
}

export function formatarMilhoes(valor: number | null): string {
  if (valor === null) return "N/D";
  return `€ ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(valor)} mi`;
}
